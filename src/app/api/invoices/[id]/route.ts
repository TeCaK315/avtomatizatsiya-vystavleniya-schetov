import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import { calculateSubtotal, calculateTax, calculateTotal, calculateDiscount } from '@/lib/calculations';
import {
  UpdateInvoiceRequest,
  UpdateInvoiceResponse,
  GetInvoiceResponse,
  DeleteInvoiceResponse,
  Invoice,
  InvoiceItem,
} from '@/types';

const storage = new StorageService();

function calculateItemTotal(quantity: number, unitPrice: number, taxRate: number): number {
  return quantity * unitPrice * (1 + taxRate / 100);
}

export async function GET(_request : NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetInvoiceResponse>> {
  try {
    const { id } = params;

    const invoice = storage.getInvoice(id);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoice',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UpdateInvoiceResponse>> {
  try {
    const { id } = params;
    const body: UpdateInvoiceRequest = await request.json();

    const existingInvoice = storage.getInvoice(id);

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // If clientId is being updated, validate the new client exists
    let client = existingInvoice.client;
    if (body.clientId && body.clientId !== existingInvoice.clientId) {
      const newClient = storage.getClient(body.clientId);
      if (!newClient) {
        return NextResponse.json(
          {
            success: false,
            error: 'Client not found',
          },
          { status: 404 }
        );
      }
      client = newClient;
    }

    // Calculate new items if provided
    let items = existingInvoice.items;
    let subtotal = existingInvoice.subtotal;
    let taxAmount = existingInvoice.taxAmount;
    let discountAmount = existingInvoice.discountAmount;
    let discountPercent = existingInvoice.discountPercent;
    let total = existingInvoice.total;

    if (body.items) {
      items = body.items.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        total: calculateItemTotal(item.quantity, item.unitPrice, item.taxRate),
      }));

      subtotal = calculateSubtotal(items);
      taxAmount = calculateTax(items);
    }

    // Recalculate discount if changed
    if (body.discountPercent !== undefined) {
      discountPercent = body.discountPercent;
      discountAmount = calculateDiscount(subtotal, discountPercent);
    } else if (body.discountAmount !== undefined) {
      discountAmount = body.discountAmount;
      discountPercent = 0;
    }

    // Recalculate total
    total = calculateTotal(subtotal, taxAmount, discountAmount);

    // Update invoice
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      clientId: body.clientId || existingInvoice.clientId,
      client,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      discountPercent,
      total,
      issueDate: body.issueDate || existingInvoice.issueDate,
      dueDate: body.dueDate || existingInvoice.dueDate,
      notes: body.notes !== undefined ? body.notes : existingInvoice.notes,
      status: body.status || existingInvoice.status,
      updatedAt: new Date().toISOString(),
    };

    // Handle status changes
    if (body.status === 'paid' && !existingInvoice.paidAt) {
      updatedInvoice.paidAt = new Date().toISOString();
    }

    storage.updateInvoice(id, updatedInvoice);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request : NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteInvoiceResponse>> {
  try {
    const { id } = params;

    const existingInvoice = storage.getInvoice(id);

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    storage.deleteInvoice(id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete invoice',
      },
      { status: 500 }
    );
  }
}