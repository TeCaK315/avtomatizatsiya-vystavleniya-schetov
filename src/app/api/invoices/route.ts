import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';
import { calculateInvoiceTotals } from '@/lib/calculations';
import { validateInvoiceData } from '@/lib/validation';
import type {
  GetInvoicesResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  Invoice,
} from '@/types';

export async function GET(_request : NextRequest) {
  try {
    const invoices = storageService.getInvoices();

    const response: GetInvoicesResponse = {
      success: true,
      invoices,
      count: invoices.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const response: GetInvoicesResponse = {
      success: false,
      invoices: [],
      count: 0,
      error: 'Failed to fetch invoices',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateInvoiceRequest = await request.json();

    // Validate invoice data
    const validation = validateInvoiceData({
      invoiceNumber: body.invoiceNumber,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientAddress: body.clientAddress || '',
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      items: body.items.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      taxRate: body.taxRate,
      notes: body.notes || '',
    });

    if (!validation.isValid) {
      const response: CreateInvoiceResponse = {
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Calculate totals
    const calculations = calculateInvoiceTotals(body.items, body.taxRate);

    // Prepare invoice items with IDs and totals
    const invoiceItems = body.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    // Create invoice object
    const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNumber: body.invoiceNumber,
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      clientAddress: body.clientAddress,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      items: invoiceItems,
      subtotal: calculations.subtotal,
      taxRate: body.taxRate,
      taxAmount: calculations.taxAmount,
      total: calculations.total,
      status: 'draft',
      notes: body.notes,
      pdfFileName: body.pdfFileName,
    };

    // Save to storage
    const createdInvoice = storageService.createInvoice(invoiceData);

    const response: CreateInvoiceResponse = {
      success: true,
      invoice: createdInvoice,
      message: 'Invoice created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    const response: CreateInvoiceResponse = {
      success: false,
      message: 'Failed to create invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}