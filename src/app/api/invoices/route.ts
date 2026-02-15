import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetInvoicesResponse,
  Invoice,
  InvoiceStatus,
  InvoiceItem
} from '@/types';
import { generateInvoiceNumber } from '@/lib/formatters';
import { calculateInvoiceTotal } from '@/lib/invoice-calculator';
import { validateInvoiceData } from '@/lib/validators';

const storage = new StorageService();

export async function GET(request: NextRequest): Promise<NextResponse<GetInvoicesResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let invoices = storage.getInvoices();

    // Apply filters
    if (status) {
      const statusArray = status.split(',') as InvoiceStatus[];
      invoices = invoices.filter(inv => statusArray.includes(inv.status));
    }

    if (search) {
      invoices = storage.searchInvoices(search);
    }

    if (dateFrom || dateTo) {
      invoices = invoices.filter(inv => {
        const invoiceDate = new Date(inv.issueDate);
        if (dateFrom && invoiceDate < new Date(dateFrom)) return false;
        if (dateTo && invoiceDate > new Date(dateTo)) return false;
        return true;
      });
    }

    // Sort by creation date (newest first)
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoices'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateInvoiceResponse>> {
  try {
    const body: CreateInvoiceRequest = await request.json();

    // Validate invoice data
    const validation = validateInvoiceData(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Calculate line item totals and create items with IDs
    const items: InvoiceItem[] = body.items.map((item, index) => {
      const itemTotal = item.quantity * item.unitPrice;
      return {
        id: `item-${Date.now()}-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: itemTotal,
        taxRate: item.taxRate
      };
    });

    // Calculate invoice totals
    const { subtotal, taxAmount, total } = calculateInvoiceTotal(items, body.taxRate);

    // Create invoice object
    const now = new Date().toISOString();
    const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNumber,
      issueDate: now,
      dueDate: body.dueDate,
      status: InvoiceStatus.DRAFT,
      from: body.from,
      to: body.to,
      items,
      subtotal,
      taxRate: body.taxRate,
      taxAmount,
      total,
      notes: body.notes,
      terms: body.terms
    };

    // Save to storage
    const invoice = storage.createInvoice(invoiceData);

    return NextResponse.json(
      {
        success: true,
        invoice
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice'
      },
      { status: 500 }
    );
  }
}