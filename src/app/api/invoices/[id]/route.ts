import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import {
  Invoice,
  UpdateInvoiceRequest,
  UpdateInvoiceResponse,
  DeleteInvoiceResponse
} from '@/types';

const storage = new StorageService();

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
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Invoice ID is required' },
        { status: 400 }
      );
    }
    
    const invoice = storage.getInvoice(id);
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invoice:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch invoice' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;
    
    if (!id) {
      const response: UpdateInvoiceResponse = {
        success: false,
        invoice: {} as Invoice,
        message: 'Invoice ID is required'
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const invoice = storage.getInvoice(id);
    
    if (!invoice) {
      const response: UpdateInvoiceResponse = {
        success: false,
        invoice: {} as Invoice,
        message: 'Invoice not found'
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    const body: UpdateInvoiceRequest = await request.json();
    
    const updates: Partial<Invoice> = {};
    
    if (body.status !== undefined) {
      updates.status = body.status;
    }
    
    if (body.extractedData !== undefined) {
      updates.extractedData = {
        ...invoice.extractedData,
        ...body.extractedData
      } as Invoice['extractedData'];
    }
    
    storage.updateInvoice(id, updates);
    
    const updatedInvoice = storage.getInvoice(id);
    
    if (!updatedInvoice) {
      const response: UpdateInvoiceResponse = {
        success: false,
        invoice: {} as Invoice,
        message: 'Failed to retrieve updated invoice'
      };
      return NextResponse.json(response, { status: 500 });
    }
    
    const response: UpdateInvoiceResponse = {
      success: true,
      invoice: updatedInvoice,
      message: 'Invoice updated successfully'
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error updating invoice:', error);
    
    const response: UpdateInvoiceResponse = {
      success: false,
      invoice: {} as Invoice,
      message: error instanceof Error ? error.message : 'Failed to update invoice'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

export async function DELETE(_request : NextRequest,
  context: RouteContext
) {
  try {
    const { id } = context.params;
    
    if (!id) {
      const response: DeleteInvoiceResponse = {
        success: false,
        message: 'Invoice ID is required'
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const invoice = storage.getInvoice(id);
    
    if (!invoice) {
      const response: DeleteInvoiceResponse = {
        success: false,
        message: 'Invoice not found'
      };
      return NextResponse.json(response, { status: 404 });
    }
    
    storage.deleteInvoice(id);
    
    const response: DeleteInvoiceResponse = {
      success: true,
      message: 'Invoice deleted successfully'
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    
    const response: DeleteInvoiceResponse = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete invoice'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}