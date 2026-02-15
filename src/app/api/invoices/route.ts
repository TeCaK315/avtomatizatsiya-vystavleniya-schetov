import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/storage';
import {
  InvoiceListResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  Invoice,
  InvoiceStatus,
  InvoiceFilters,
  PaginationParams,
  SortParams
} from '@/types';

const storage = new StorageService();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination params
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Parse filters
    const filters: InvoiceFilters = {};
    
    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',') as InvoiceStatus[];
    }
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    
    const minAmount = searchParams.get('minAmount');
    if (minAmount) {
      filters.minAmount = parseFloat(minAmount);
    }
    
    const maxAmount = searchParams.get('maxAmount');
    if (maxAmount) {
      filters.maxAmount = parseFloat(maxAmount);
    }
    
    const vendorName = searchParams.get('vendorName');
    if (vendorName) {
      filters.vendorName = vendorName;
    }
    
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      filters.searchQuery = searchQuery;
    }
    
    // Parse sort params
    const sortField = searchParams.get('sortField');
    const sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
    
    // Get all invoices from storage
    let invoices = storage.getAllInvoices();
    
    // Apply filters
    if (filters.status && filters.status.length > 0) {
      invoices = invoices.filter(inv => filters.status!.includes(inv.status));
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      invoices = invoices.filter(inv => new Date(inv.uploadedAt) >= fromDate);
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      invoices = invoices.filter(inv => new Date(inv.uploadedAt) <= toDate);
    }
    
    if (filters.minAmount !== undefined) {
      invoices = invoices.filter(inv => 
        inv.extractedData && inv.extractedData.totalAmount >= filters.minAmount!
      );
    }
    
    if (filters.maxAmount !== undefined) {
      invoices = invoices.filter(inv => 
        inv.extractedData && inv.extractedData.totalAmount <= filters.maxAmount!
      );
    }
    
    if (filters.vendorName) {
      const vendorLower = filters.vendorName.toLowerCase();
      invoices = invoices.filter(inv => 
        inv.extractedData && 
        inv.extractedData.vendorName.toLowerCase().includes(vendorLower)
      );
    }
    
    if (filters.searchQuery) {
      const queryLower = filters.searchQuery.toLowerCase();
      invoices = invoices.filter(inv => {
        const fileNameMatch = inv.fileName.toLowerCase().includes(queryLower);
        const invoiceNumberMatch = inv.extractedData?.invoiceNumber.toLowerCase().includes(queryLower);
        const vendorMatch = inv.extractedData?.vendorName.toLowerCase().includes(queryLower);
        const customerMatch = inv.extractedData?.customerName.toLowerCase().includes(queryLower);
        
        return fileNameMatch || invoiceNumberMatch || vendorMatch || customerMatch;
      });
    }
    
    // Apply sorting
    if (sortField && sortDirection) {
      invoices.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        if (sortField in a) {
          aValue = a[sortField as keyof Invoice];
          bValue = b[sortField as keyof Invoice];
        } else if (a.extractedData && sortField in a.extractedData) {
          aValue = a.extractedData[sortField as keyof typeof a.extractedData];
          bValue = b.extractedData?.[sortField as keyof typeof b.extractedData];
        }
        
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        return 0;
      });
    } else {
      // Default sort by uploadedAt desc
      invoices.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    }
    
    // Apply pagination
    const total = invoices.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInvoices = invoices.slice(startIndex, endIndex);
    
    const response: InvoiceListResponse = {
      success: true,
      invoices: paginatedInvoices,
      total,
      page,
      pageSize
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    
    const response: InvoiceListResponse = {
      success: false,
      invoices: [],
      total: 0,
      page: 1,
      pageSize: 10
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateInvoiceRequest = await request.json();
    
    if (!body.fileName || !body.fileUrl || !body.fileType) {
      const response: CreateInvoiceResponse = {
        success: false,
        invoice: {} as Invoice,
        message: 'Missing required fields: fileName, fileUrl, fileType'
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      status: InvoiceStatus.UPLOADED,
      extractedData: null,
      uploadedAt: new Date().toISOString(),
      syncedToIntegrations: []
    };
    
    storage.saveInvoice(newInvoice);
    
    const response: CreateInvoiceResponse = {
      success: true,
      invoice: newInvoice,
      message: 'Invoice created successfully'
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    const response: CreateInvoiceResponse = {
      success: false,
      invoice: {} as Invoice,
      message: error instanceof Error ? error.message : 'Failed to create invoice'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}