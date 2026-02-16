import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import { calculateSubtotal, calculateTax, calculateTotal, calculateDiscount } from '@/lib/calculations';
import {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoicesResponse,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
} from '@/types';

const storage = new StorageService();

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const invoices = storage.getInvoices();
  const yearInvoices = invoices.filter(inv => 
    inv.invoiceNumber.startsWith(`INV-${year}`)
  );
  const nextNumber = yearInvoices.length + 1;
  return `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
}

function calculateItemTotal(quantity: number, unitPrice: number, taxRate: number): number {
  return quantity * unitPrice * (1 + taxRate / 100);
}

export async function GET(request: NextRequest): Promise<NextResponse<GetInvoicesResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as InvoiceStatus | null;
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    let invoices = storage.getInvoices();

    // Apply filters
    if (status) {
      invoices = invoices.filter(inv => inv.status === status);
    }

    if (clientId) {
      invoices = invoices.filter(inv => inv.clientId === clientId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.client.name.toLowerCase().includes(searchLower) ||
        inv.client.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    invoices.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      invoices,
      total: invoices.length,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      {
        success: false,
        invoices: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch invoices',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateInvoiceResponse>> {
  try {
    const body: CreateInvoiceRequest = await request.json();

    // Validate required fields
    if (!body.clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required',
        },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one item is required',
        },
        { status: 400 }
      );
    }

    if (!body.issueDate || !body.dueDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Issue date and due date are required',
        },
        { status: 400 }
      );
    }

    // Get client
    const client = storage.getClient(body.clientId);
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      );
    }

    // Create invoice items with calculated totals
    const items: InvoiceItem[] = body.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      total: calculateItemTotal(item.quantity, item.unitPrice, item.taxRate),
    }));

    // Calculate totals
    const subtotal = calculateSubtotal(items);
    const taxAmount = calculateTax(items);
    const discountAmount = body.discountPercent 
      ? calculateDiscount(subtotal, body.discountPercent)
      : (body.discountAmount || 0);
    const total = calculateTotal(subtotal, taxAmount, discountAmount);

    // Create invoice
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      clientId: body.clientId,
      client,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      discountPercent: body.discountPercent || 0,
      total,
      currency: body.currency || 'USD',
      status: body.status || 'draft',
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      notes: body.notes,
      createdAt: now,
      updatedAt: now,
    };

    // Save invoice
    storage.saveInvoice(invoice);

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      },
      { status: 500 }
    );
  }
}