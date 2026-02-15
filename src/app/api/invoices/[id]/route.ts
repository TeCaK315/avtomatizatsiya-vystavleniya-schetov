import { NextRequest, NextResponse } from 'next/server';
import {
  GetInvoiceResponse,
  UpdateInvoiceRequest,
  UpdateInvoiceResponse,
  DeleteInvoiceResponse,
} from '@/types';
import { storageService } from '@/lib/storage';

export async function GET(_request : NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      const response: GetInvoiceResponse = {
        success: false,
        error: 'Invoice ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const invoice = storageService.getInvoice(id);

    if (!invoice) {
      const response: GetInvoiceResponse = {
        success: false,
        error: 'Invoice not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: GetInvoiceResponse = {
      success: true,
      invoice,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invoice';
    
    const response: GetInvoiceResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      const response: UpdateInvoiceResponse = {
        success: false,
        error: 'Invoice ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const body = await request.json();
    const updateData = body as UpdateInvoiceRequest;

    if (updateData.clientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.clientEmail)) {
        const response: UpdateInvoiceResponse = {
          success: false,
          error: 'Invalid email format',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (updateData.taxRate !== undefined) {
      if (typeof updateData.taxRate !== 'number' || updateData.taxRate < 0 || updateData.taxRate > 100) {
        const response: UpdateInvoiceResponse = {
          success: false,
          error: 'Tax rate must be a number between 0 and 100',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (updateData.items) {
      if (!Array.isArray(updateData.items)) {
        const response: UpdateInvoiceResponse = {
          success: false,
          error: 'Items must be an array',
        };
        return NextResponse.json(response, { status: 400 });
      }

      for (const item of updateData.items) {
        if (!item.description || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
          const response: UpdateInvoiceResponse = {
            success: false,
            error: 'Each item must have description (string), quantity (number), and unitPrice (number)',
          };
          return NextResponse.json(response, { status: 400 });
        }
      }
    }

    if (updateData.status) {
      const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(updateData.status)) {
        const response: UpdateInvoiceResponse = {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const updatedInvoice = storageService.updateInvoice(id, updateData);

    if (!updatedInvoice) {
      const response: UpdateInvoiceResponse = {
        success: false,
        error: 'Invoice not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: UpdateInvoiceResponse = {
      success: true,
      invoice: updatedInvoice,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update invoice';
    
    const response: UpdateInvoiceResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(_request : NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      const response: DeleteInvoiceResponse = {
        success: false,
        error: 'Invoice ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const deleted = storageService.deleteInvoice(id);

    if (!deleted) {
      const response: DeleteInvoiceResponse = {
        success: false,
        error: 'Invoice not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: DeleteInvoiceResponse = {
      success: true,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete invoice';
    
    const response: DeleteInvoiceResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}