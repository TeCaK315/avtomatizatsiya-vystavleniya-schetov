import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';
import { calculateInvoiceTotals } from '@/lib/calculations';
import { validateInvoiceData } from '@/lib/validation';
import type {
  UpdateInvoiceRequest,
  UpdateInvoiceResponse,
  DeleteInvoiceResponse,
  GetInvoiceResponse,
  Invoice,
} from '@/types';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request : NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    const invoice = storageService.getInvoice(id);

    if (!invoice) {
      const response: GetInvoiceResponse = {
        success: false,
        message: 'Invoice not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: GetInvoiceResponse = {
      success: true,
      invoice,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    const response: GetInvoiceResponse = {
      success: false,
      message: 'Failed to fetch invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;
    const body: UpdateInvoiceRequest = await request.json();

    // Check if invoice exists
    const existingInvoice = storageService.getInvoice(id);
    if (!existingInvoice) {
      const response: UpdateInvoiceResponse = {
        success: false,
        message: 'Invoice not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Prepare update data
    const updateData: Partial<Invoice> = {};

    if (body.invoiceNumber !== undefined) {
      updateData.invoiceNumber = body.invoiceNumber;
    }
    if (body.clientName !== undefined) {
      updateData.clientName = body.clientName;
    }
    if (body.clientEmail !== undefined) {
      updateData.clientEmail = body.clientEmail;
    }
    if (body.clientAddress !== undefined) {
      updateData.clientAddress = body.clientAddress;
    }
    if (body.issueDate !== undefined) {
      updateData.issueDate = body.issueDate;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.taxRate !== undefined) {
      updateData.taxRate = body.taxRate;
    }

    // If items are being updated, recalculate totals
    if (body.items !== undefined) {
      const invoiceItems = body.items.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      const taxRate = body.taxRate !== undefined ? body.taxRate : existingInvoice.taxRate;
      const calculations = calculateInvoiceTotals(body.items, taxRate);

      updateData.items = invoiceItems;
      updateData.subtotal = calculations.subtotal;
      updateData.taxAmount = calculations.taxAmount;
      updateData.total = calculations.total;
    } else if (body.taxRate !== undefined) {
      // Recalculate if only tax rate changed
      const calculations = calculateInvoiceTotals(
        existingInvoice.items.map(item => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        body.taxRate
      );

      updateData.taxAmount = calculations.taxAmount;
      updateData.total = calculations.total;
    }

    // Validate if we have enough data to validate
    if (
      body.invoiceNumber ||
      body.clientName ||
      body.clientEmail ||
      body.items
    ) {
      const dataToValidate = {
        invoiceNumber: body.invoiceNumber || existingInvoice.invoiceNumber,
        clientName: body.clientName || existingInvoice.clientName,
        clientEmail: body.clientEmail || existingInvoice.clientEmail,
        clientAddress: body.clientAddress !== undefined ? body.clientAddress : existingInvoice.clientAddress || '',
        issueDate: body.issueDate || existingInvoice.issueDate,
        dueDate: body.dueDate || existingInvoice.dueDate,
        items: body.items
          ? body.items.map((item, index) => ({
              id: `item-${Date.now()}-${index}`,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            }))
          : existingInvoice.items,
        taxRate: body.taxRate !== undefined ? body.taxRate : existingInvoice.taxRate,
        notes: body.notes !== undefined ? body.notes : existingInvoice.notes || '',
      };

      const validation = validateInvoiceData(dataToValidate);

      if (!validation.isValid) {
        const response: UpdateInvoiceResponse = {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Update invoice
    const updatedInvoice = storageService.updateInvoice(id, updateData);

    if (!updatedInvoice) {
      const response: UpdateInvoiceResponse = {
        success: false,
        message: 'Failed to update invoice',
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: UpdateInvoiceResponse = {
      success: true,
      invoice: updatedInvoice,
      message: 'Invoice updated successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating invoice:', error);
    const response: UpdateInvoiceResponse = {
      success: false,
      message: 'Failed to update invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(_request : NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;

    const deleted = storageService.deleteInvoice(id);

    if (!deleted) {
      const response: DeleteInvoiceResponse = {
        success: false,
        message: 'Invoice not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: DeleteInvoiceResponse = {
      success: true,
      message: 'Invoice deleted successfully',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    const response: DeleteInvoiceResponse = {
      success: false,
      message: 'Failed to delete invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}