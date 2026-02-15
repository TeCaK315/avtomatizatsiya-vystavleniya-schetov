// src/types/index.ts - Complete TypeScript definitions for the entire project

// ============================================================================
// ENUMS
// ============================================================================

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  CASH = 'cash'
}

// ============================================================================
// DATA MODELS
// ============================================================================

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Contact {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  taxId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  status: InvoiceStatus;
  
  // Parties
  from: Contact;
  to: Contact;
  
  // Line items
  items: InvoiceItem[];
  
  // Amounts
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  
  // Payment
  paymentMethod?: PaymentMethod;
  paidDate?: string; // ISO date string
  paidAmount?: number;
  
  // Metadata
  notes?: string;
  terms?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  pdfUrl?: string;
}

export interface ExtractedData {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  from?: Partial<Contact>;
  to?: Partial<Contact>;
  items?: Partial<InvoiceItem>[];
  total?: number;
  subtotal?: number;
  taxAmount?: number;
  rawText: string;
  confidence: number; // 0-1
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Invoice CRUD
export interface CreateInvoiceRequest {
  from: Contact;
  to: Contact;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  dueDate: string;
  taxRate: number;
  notes?: string;
  terms?: string;
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface UpdateInvoiceRequest {
  from?: Contact;
  to?: Contact;
  items?: Omit<InvoiceItem, 'id' | 'total'>[];
  dueDate?: string;
  status?: InvoiceStatus;
  taxRate?: number;
  notes?: string;
  terms?: string;
  paymentMethod?: PaymentMethod;
  paidDate?: string;
  paidAmount?: number;
}

export interface UpdateInvoiceResponse {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export interface GetInvoicesResponse {
  success: boolean;
  invoices?: Invoice[];
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

// Send invoice
export interface SendInvoiceRequest {
  recipientEmail: string;
  subject?: string;
  message?: string;
}

export interface SendInvoiceResponse {
  success: boolean;
  sentAt?: string;
  error?: string;
}

// PDF Upload & OCR
export interface UploadPDFResponse {
  success: boolean;
  extractedData?: ExtractedData;
  error?: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface InvoiceListProps {
  invoices: Invoice[];
  onInvoiceClick: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onSendInvoice: (id: string) => void;
}

export interface InvoiceCardProps {
  invoice: Invoice;
  onClick: () => void;
  onDelete: () => void;
  onSend: () => void;
}

export interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface PDFUploaderProps {
  onUploadSuccess: (data: ExtractedData) => void;
  onUploadError: (error: string) => void;
}

export interface InvoiceStatsProps {
  invoices: Invoice[];
}

export interface FilterBarProps {
  onFilterChange: (filters: InvoiceFilters) => void;
  onSearchChange: (search: string) => void;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface StorageService {
  getInvoices(): Invoice[];
  getInvoice(id: string): Invoice | null;
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice;
  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null;
  deleteInvoice(id: string): boolean;
  searchInvoices(query: string): Invoice[];
  filterInvoices(filters: InvoiceFilters): Invoice[];
}

export interface EmailServiceConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailService {
  sendInvoice(invoice: Invoice, recipientEmail: string, subject?: string, message?: string): Promise<boolean>;
}

export interface OCRService {
  extractText(imageData: Buffer): Promise<string>;
  parseInvoiceData(text: string): ExtractedData;
}

// ============================================================================
// UTILITY FUNCTION TYPES
// ============================================================================

export type CalculateInvoiceTotalFn = (items: InvoiceItem[], taxRate: number) => {
  subtotal: number;
  taxAmount: number;
  total: number;
};

export type CalculateLineItemTotalFn = (quantity: number, unitPrice: number, taxRate?: number) => number;

export type CalculateTaxFn = (amount: number, taxRate: number) => number;

export type ValidateEmailFn = (email: string) => boolean;

export type ValidateInvoiceDataFn = (data: CreateInvoiceRequest | UpdateInvoiceRequest) => {
  valid: boolean;
  errors: string[];
};

export type ValidateAmountFn = (amount: number) => boolean;

export type FormatCurrencyFn = (amount: number, currency?: string) => string;

export type FormatDateFn = (date: string | Date, format?: string) => string;

export type GenerateInvoiceNumberFn = () => string;

export type PDFToImagesFn = (pdfBuffer: Buffer) => Promise<Buffer[]>;

export type ExtractDataFromPDFFn = (pdfBuffer: Buffer) => Promise<ExtractedData>;

export type SendInvoiceEmailFn = (invoice: Invoice, recipientEmail: string, subject?: string, message?: string) => Promise<boolean>;