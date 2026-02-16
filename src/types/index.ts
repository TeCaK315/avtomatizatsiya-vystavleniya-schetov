// src/types/index.ts - Complete type definitions for AutoBillPro

// ============================================================================
// DATA MODELS
// ============================================================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // percentage (e.g., 20 for 20%)
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  pdfFileName?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ExtractedData {
  invoiceNumber?: string;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate?: string;
  dueDate?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal?: number;
  taxRate?: number;
  total?: number;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Upload Invoice
export interface UploadInvoiceRequest {
  file: File;
}

export interface UploadInvoiceResponse {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  message?: string;
}

// Extract Data from PDF
export interface ExtractDataRequest {
  fileId: string;
  fileName: string;
}

export interface ExtractDataResponse {
  success: boolean;
  data: ExtractedData;
  message?: string;
  error?: string;
}

// Get All Invoices
export interface GetInvoicesResponse {
  success: boolean;
  invoices: Invoice[];
  count: number;
  error?: string;
}

// Get Single Invoice
export interface GetInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  message?: string;
  error?: string;
}

// Create Invoice
export interface CreateInvoiceRequest {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxRate: number;
  notes?: string;
  pdfFileName?: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  message?: string;
  errors?: Record<string, string>;
  error?: string;
}

// Update Invoice
export interface UpdateInvoiceRequest {
  invoiceNumber?: string;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate?: string;
  dueDate?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxRate?: number;
  status?: InvoiceStatus;
  notes?: string;
}

export interface UpdateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  message?: string;
  errors?: Record<string, string>;
  error?: string;
}

// Delete Invoice
export interface DeleteInvoiceResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Send Invoice
export interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  subject?: string;
  message?: string;
}

export interface SendInvoiceResponse {
  success: boolean;
  sentAt: string;
  message?: string;
  error?: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onSend: (invoice: Invoice) => void;
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => void;
}

export interface InvoiceCardProps {
  invoice: Invoice;
  onEdit: () => void;
  onDelete: () => void;
  onSend: () => void;
  onStatusChange: (status: InvoiceStatus) => void;
}

export interface InvoiceFormProps {
  invoice?: Invoice;
  extractedData?: ExtractedData;
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  taxRate: number;
  notes: string;
}

export interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

export interface ExtractedDataViewerProps {
  extractedData: ExtractedData;
  onConfirm: (data: ExtractedData) => void;
  onCancel: () => void;
  onEdit: (field: keyof ExtractedData, value: any) => void;
}

export interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

// ============================================================================
// UTILITY FUNCTION TYPES
// ============================================================================

export interface StorageService {
  getInvoices: () => Invoice[];
  getInvoice: (id: string) => Invoice | null;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Invoice | null;
  deleteInvoice: (id: string) => boolean;
  clearAll: () => void;
}

export interface InvoiceCalculations {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export type CalculateInvoiceTotals = (
  items: Array<{ quantity: number; unitPrice: number }>,
  taxRate: number
) => InvoiceCalculations;

export type CalculateItemTotal = (quantity: number, unitPrice: number) => number;

export type ValidateInvoiceData = (data: Partial<InvoiceFormData>) => {
  isValid: boolean;
  errors: Record<string, string>;
};

export type ValidateEmail = (email: string) => boolean;

export type ValidatePdfFile = (file: File) => {
  isValid: boolean;
  error?: string;
};

export type ExtractTextFromPdf = (file: File) => Promise<string>;

export type ParseInvoiceData = (text: string) => ExtractedData;

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

export type InvoiceSortField = 'invoiceNumber' | 'clientName' | 'issueDate' | 'dueDate' | 'total' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

export interface InvoiceSortOptions {
  field: InvoiceSortField;
  direction: SortDirection;
}