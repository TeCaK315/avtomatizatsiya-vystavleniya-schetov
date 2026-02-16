// src/types/index.ts - Complete TypeScript definitions for AutoInvoice Pro

// ============================================================================
// CORE DATA MODELS
// ============================================================================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage (e.g., 20 for 20%)
  total: number; // calculated: quantity * unitPrice * (1 + taxRate/100)
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2024-001"
  clientId: string;
  client: Client; // populated client data
  items: InvoiceItem[];
  subtotal: number; // sum of all items before tax
  taxAmount: number; // total tax
  discountAmount: number; // flat discount
  discountPercent: number; // percentage discount
  total: number; // final amount
  currency: string; // e.g., "USD", "EUR"
  status: InvoiceStatus;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  notes?: string;
  pdfUrl?: string; // URL to generated PDF
  sentAt?: string; // ISO date string when email was sent
  paidAt?: string; // ISO date string when marked as paid
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedPDFData {
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
  taxAmount?: number;
  total?: number;
  currency?: string;
  rawText: string; // full extracted text for debugging
  confidence: number; // 0-1, OCR confidence score
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Invoices API
export interface CreateInvoiceRequest {
  clientId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  discountAmount?: number;
  discountPercent?: number;
  currency?: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  status?: InvoiceStatus;
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface UpdateInvoiceRequest {
  clientId?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  discountAmount?: number;
  discountPercent?: number;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  status?: InvoiceStatus;
}

export interface UpdateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface GetInvoicesResponse {
  success: boolean;
  invoices: Invoice[];
  total: number;
  error?: string;
}

export interface GetInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface DeleteInvoiceResponse {
  success: boolean;
  error?: string;
}

// Clients API
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface CreateClientResponse {
  success: boolean;
  client?: Client;
  error?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface UpdateClientResponse {
  success: boolean;
  client?: Client;
  error?: string;
}

export interface GetClientsResponse {
  success: boolean;
  clients: Client[];
  error?: string;
}

export interface GetClientResponse {
  success: boolean;
  client?: Client;
  error?: string;
}

export interface DeleteClientResponse {
  success: boolean;
  error?: string;
}

// PDF Upload API
export interface UploadPDFRequest {
  file: File;
}

export interface UploadPDFResponse {
  success: boolean;
  data?: ExtractedPDFData;
  error?: string;
}

// Send Invoice API
export interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail?: string; // override client email
  subject?: string;
  message?: string;
}

export interface SendInvoiceResponse {
  success: boolean;
  sentAt?: string;
  error?: string;
}

// Stats API
export interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  recentInvoices: Invoice[];
}

export interface GetStatsResponse {
  success: boolean;
  stats?: DashboardStats;
  error?: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface InvoiceListProps {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  onSend?: (invoiceId: string) => void;
  loading?: boolean;
}

export interface InvoiceFormProps {
  invoice?: Invoice; // for edit mode
  clients: Client[];
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export interface PDFUploaderProps {
  onUploadComplete: (data: ExtractedPDFData) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
}

export interface ClientSelectorProps {
  clients: Client[];
  selectedClientId?: string;
  onSelect: (clientId: string) => void;
  onCreateNew?: () => void;
  loading?: boolean;
}

export interface InvoicePreviewProps {
  invoice: Invoice;
  onEdit?: () => void;
  onSend?: () => void;
  onDownload?: () => void;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export interface StatusBadgeProps {
  status: InvoiceStatus;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface InvoiceCalculations {
  calculateSubtotal: (items: InvoiceItem[]) => number;
  calculateTax: (items: InvoiceItem[]) => number;
  calculateTotal: (subtotal: number, taxAmount: number, discountAmount: number) => number;
  calculateDiscount: (subtotal: number, discountPercent: number) => number;
  calculateItemTotal: (quantity: number, unitPrice: number, taxRate: number) => number;
}

export interface StorageService {
  getInvoices: () => Invoice[];
  getInvoice: (id: string) => Invoice | null;
  saveInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getClients: () => Client[];
  getClient: (id: string) => Client | null;
  saveClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  clear: () => void;
}

export interface PDFParserResult {
  text: string;
  numPages: number;
  metadata?: Record<string, any>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string; // search in invoice number, client name
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'dueDate' | 'total' | 'invoiceNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_TAX_RATE = 20; // 20%
export const INVOICE_NUMBER_PREFIX = 'INV';
export const MAX_PDF_SIZE_MB = 10;