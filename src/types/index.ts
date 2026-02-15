// src/types/index.ts - Complete TypeScript definitions for the entire project

// ============================================================================
// CORE DATA MODELS
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
  rawText: string; // Full extracted text for debugging
  confidence: number; // OCR confidence score 0-1
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Invoice CRUD
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
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
  status?: InvoiceStatus;
}

export interface UpdateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface InvoiceListResponse {
  success: boolean;
  invoices: Invoice[];
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

// PDF Extraction
export interface ExtractPDFRequest {
  file: File;
}

export interface ExtractPDFResponse {
  success: boolean;
  data?: ExtractedData;
  error?: string;
}

// Email Sending
export interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail?: string; // Override invoice clientEmail if provided
  subject?: string;
  message?: string;
}

export interface SendInvoiceResponse {
  success: boolean;
  sentAt?: string; // ISO date string
  error?: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface InvoiceUploadProps {
  onUploadComplete: (extractedData: ExtractedData) => void;
  onError: (error: string) => void;
}

export interface InvoiceFormProps {
  initialData?: Partial<Invoice>;
  onSubmit: (data: CreateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onSend: (invoiceId: string) => void;
  isLoading?: boolean;
}

export interface InvoicePreviewProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSend?: () => void;
  onDownload?: () => void;
}

export interface ExtractedDataReviewProps {
  data: ExtractedData;
  onConfirm: (confirmedData: CreateInvoiceRequest) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export interface BadgeProps {
  status: InvoiceStatus;
  size?: 'sm' | 'md';
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

// ============================================================================
// UTILITY FUNCTION TYPES
// ============================================================================

// Storage Service
export interface StorageService {
  getInvoices: () => Invoice[];
  getInvoice: (id: string) => Invoice | null;
  createInvoice: (data: CreateInvoiceRequest) => Invoice;
  updateInvoice: (id: string, data: UpdateInvoiceRequest) => Invoice | null;
  deleteInvoice: (id: string) => boolean;
  generateInvoiceNumber: () => string;
}

// Calculations
export interface InvoiceCalculations {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export type CalculateInvoiceTotals = (
  items: Array<{ quantity: number; unitPrice: number }>,
  taxRate: number
) => InvoiceCalculations;

export type CalculateLineTotal = (quantity: number, unitPrice: number) => number;

// PDF Parser
export type ExtractTextFromPDF = (file: File) => Promise<string>;

export type ParseInvoiceData = (text: string) => Partial<ExtractedData>;

// OCR
export type PerformOCR = (file: File) => Promise<{
  text: string;
  confidence: number;
}>;

// Email
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
}

export type SendInvoiceEmail = (
  invoice: Invoice,
  options?: Partial<EmailOptions>
) => Promise<{ success: boolean; error?: string }>;

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseInvoicesReturn {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  createInvoice: (data: CreateInvoiceRequest) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: UpdateInvoiceRequest) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<boolean>;
  sendInvoice: (id: string, options?: Partial<SendInvoiceRequest>) => Promise<boolean>;
  refreshInvoices: () => Promise<void>;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<ExtractedData | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

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
    quantity: string; // String for form input
    unitPrice: string; // String for form input
  }>;
  taxRate: string; // String for form input
  notes: string;
}

export interface InvoiceFormErrors {
  invoiceNumber?: string;
  clientName?: string;
  clientEmail?: string;
  issueDate?: string;
  dueDate?: string;
  items?: Array<{
    description?: string;
    quantity?: string;
    unitPrice?: string;
  }>;
  taxRate?: string;
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
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'gray',
};