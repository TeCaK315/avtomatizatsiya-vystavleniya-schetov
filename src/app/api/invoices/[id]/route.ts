import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import {
  UpdateInvoiceRequest,
  UpdateInvoiceResponse,
  GetInvoiceResponse,
  DeleteInvoiceResponse,
  InvoiceItem
} from '@/types';
import { calculateInvoiceTotal } from '@/lib/invoice-calculator';
import { validateInvoiceData } from '@/lib/validators';

const storage = new StorageService();

export async function GET(_request : NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetInvoiceResponse>> {
  try {
    const invoice = storage.getInvoice(params.id);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoice'
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
    const body: UpdateInvoiceRequest = await request.json();

    // Check if invoice exists
    const existingInvoice = storage.getInvoice(params.id);
    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found'
        },
        { status: 404 }
      );
    }

    // Validate invoice data if items or other critical fields are being updated
    if (body.items || body.from || body.to || body.dueDate !== undefined) {
      const validation = validateInvoiceData({
        from: body.from || existingInvoice.from,
        to: body.to || existingInvoice.to,
        items: body.items || existingInvoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        })),
        dueDate: body.dueDate || existingInvoice.dueDate,
        taxRate: body.taxRate !== undefined ? body.taxRate : existingInvoice.taxRate
      });

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    // Prepare updates
    const updates: Partial<typeof existingInvoice> = { ...body };

    // If items are being updated, recalculate totals
    if (body.items) {
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

      const taxRate = body.taxRate !== undefined ? body.taxRate : existingInvoice.taxRate;
      const { subtotal, taxAmount, total } = calculateInvoiceTotal(items, taxRate);

      updates.items = items;
      updates.subtotal = subtotal;
      updates.taxAmount = taxAmount;
      updates.total = total;
    } else if (body.taxRate !== undefined) {
      // If only tax rate changed, recalculate with existing items
      const { subtotal, taxAmount, total } = calculateInvoiceTotal(
        existingInvoice.items,
        body.taxRate
      );
      updates.subtotal = subtotal;
      updates.taxAmount = taxAmount;
      updates.total = total;
    }

    // Update invoice
    const updatedInvoice = storage.updateInvoice(params.id, updates);

    if (!updatedInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update invoice'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request : NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteInvoiceResponse>> {
  try {
    const success = storage.deleteInvoice(params.id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete invoice'
      },
      { status: 500 }
    );
  }
}