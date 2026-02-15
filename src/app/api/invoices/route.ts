import { NextRequest, NextResponse } from 'next/server';
import {
  InvoiceListResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
} from '@/types';
import { storageService } from '@/lib/storage';

export async function GET(_request : NextRequest) {
  try {
    const invoices = storageService.getInvoices();

    const response: InvoiceListResponse = {
      success: true,
      invoices,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invoices';
    
    const response: InvoiceListResponse = {
      success: false,
      invoices: [],
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      issueDate,
      dueDate,
      items,
      taxRate,
      notes,
    } = body as CreateInvoiceRequest;

    if (!invoiceNumber || !clientName || !clientEmail || !issueDate || !dueDate || !items || items.length === 0) {
      const response: CreateInvoiceResponse = {
        success: false,
        error: 'Missing required fields: invoiceNumber, clientName, clientEmail, issueDate, dueDate, items',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!Array.isArray(items)) {
      const response: CreateInvoiceResponse = {
        success: false,
        error: 'Items must be an array',
      };
      return NextResponse.json(response, { status: 400 });
    }

    for (const item of items) {
      if (!item.description || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
        const response: CreateInvoiceResponse = {
          success: false,
          error: 'Each item must have description (string), quantity (number), and unitPrice (number)',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      const response: CreateInvoiceResponse = {
        success: false,
        error: 'Invalid email format',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
      const response: CreateInvoiceResponse = {
        success: false,
        error: 'Tax rate must be a number between 0 and 100',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const invoiceData: CreateInvoiceRequest = {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      issueDate,
      dueDate,
      items,
      taxRate,
      notes,
    };

    const newInvoice = storageService.createInvoice(invoiceData);

    const response: CreateInvoiceResponse = {
      success: true,
      invoice: newInvoice,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create invoice';
    
    const response: CreateInvoiceResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}