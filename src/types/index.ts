// src/types/index.ts - Complete TypeScript definitions for entire project

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum InvoiceStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  EXTRACTED = 'extracted',
  VERIFIED = 'verified',
  SENT = 'sent',
  FAILED = 'failed'
}

export enum IntegrationProvider {
  QUICKBOOKS = 'quickbooks',
  XERO = 'xero',
  FRESHBOOKS = 'freshbooks'
}

export enum FileType {
  PDF = 'application/pdf',
  JPEG = 'image/jpeg',
  PNG = 'image/png'
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

export interface ExtractedData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendorName: string;
  vendorAddress: string;
  vendorEmail?: string;
  vendorPhone?: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  confidence: number; // OCR confidence score 0-100
}

export interface Invoice {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  status: InvoiceStatus;
  extractedData: ExtractedData | null;
  uploadedAt: string;
  processedAt?: string;
  sentAt?: string;
  sentTo?: string[];
  errorMessage?: string;
  syncedToIntegrations: IntegrationProvider[];
}

export interface OCRResult {
  success: boolean;
  data: ExtractedData | null;
  confidence: number;
  processingTime: number; // milliseconds
  error?: string;
}

export interface IntegrationConfig {
  id: string;
  provider: IntegrationProvider;
  isConnected: boolean;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    companyId?: string;
  };
  lastSyncAt?: string;
  autoSync: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

// Invoices API
export interface CreateInvoiceRequest {
  fileName: string;
  fileUrl: string;
  fileType: FileType;
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoice: Invoice;
  message?: string;
}

export interface UploadInvoiceRequest {
  file: File;
}

export interface UploadInvoiceResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileType: FileType;
  message?: string;
}

export interface ExtractInvoiceRequest {
  invoiceId: string;
  fileUrl: string;
  fileType: FileType;
}

export interface ExtractInvoiceResponse {
  success: boolean;
  invoiceId: string;
  extractedData: ExtractedData | null;
  ocrResult: OCRResult;
  message?: string;
}

export interface UpdateInvoiceRequest {
  extractedData?: Partial<ExtractedData>;
  status?: InvoiceStatus;
}

export interface UpdateInvoiceResponse {
  success: boolean;
  invoice: Invoice;
  message?: string;
}

export interface SendInvoiceRequest {
  invoiceId: string;
  recipients: string[];
  subject?: string;
  message?: string;
  attachPDF: boolean;
}

export interface SendInvoiceResponse {
  success: boolean;
  sentTo: string[];
  sentAt: string;
  message?: string;
}

export interface InvoiceListResponse {
  success: boolean;
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DeleteInvoiceResponse {
  success: boolean;
  message?: string;
}

// Integrations API
export interface CreateIntegrationRequest {
  provider: IntegrationProvider;
  credentials: IntegrationConfig['credentials'];
  autoSync: boolean;
}

export interface CreateIntegrationResponse {
  success: boolean;
  integration: IntegrationConfig;
  message?: string;
}

export interface UpdateIntegrationRequest {
  credentials?: IntegrationConfig['credentials'];
  autoSync?: boolean;
}

export interface UpdateIntegrationResponse {
  success: boolean;
  integration: IntegrationConfig;
  message?: string;
}

export interface SyncInvoiceRequest {
  invoiceId: string;
  provider: IntegrationProvider;
}

export interface SyncInvoiceResponse {
  success: boolean;
  provider: IntegrationProvider;
  externalId?: string;
  syncedAt: string;
  message?: string;
}

export interface IntegrationListResponse {
  success: boolean;
  integrations: IntegrationConfig[];
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface InvoiceCardProps {
  invoice: Invoice;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onSync?: (id: string, provider: IntegrationProvider) => void;
}

export interface InvoiceListProps {
  invoices: Invoice[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onSync?: (id: string, provider: IntegrationProvider) => void;
  isLoading?: boolean;
}

export interface InvoiceFormProps {
  invoice: Invoice;
  onSave: (data: ExtractedData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  acceptedTypes: FileType[];
  maxSizeMB: number;
  isUploading?: boolean;
}

export interface ExtractionStatusProps {
  status: InvoiceStatus;
  confidence?: number;
  processingTime?: number;
  errorMessage?: string;
}

export interface SendInvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipients: string[], subject: string, message: string) => Promise<void>;
  isSending?: boolean;
}

export interface IntegrationCardProps {
  integration: IntegrationConfig;
  onConnect: (provider: IntegrationProvider) => void;
  onDisconnect: (provider: IntegrationProvider) => void;
  onToggleAutoSync: (provider: IntegrationProvider, enabled: boolean) => void;
}

// ============================================================================
// UTILITY FUNCTION TYPES
// ============================================================================

export interface StorageService {
  saveInvoice: (invoice: Invoice) => void;
  getInvoice: (id: string) => Invoice | null;
  getAllInvoices: () => Invoice[];
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  saveIntegration: (integration: IntegrationConfig) => void;
  getIntegration: (provider: IntegrationProvider) => IntegrationConfig | null;
  getAllIntegrations: () => IntegrationConfig[];
  updateIntegration: (provider: IntegrationProvider, updates: Partial<IntegrationConfig>) => void;
  deleteIntegration: (provider: IntegrationProvider) => void;
}

export interface OCRService {
  extractFromFile: (fileUrl: string, fileType: FileType) => Promise<OCRResult>;
  extractFromImage: (imageData: string) => Promise<OCRResult>;
}

export interface EmailService {
  sendInvoice: (invoice: Invoice, recipients: string[], subject: string, message: string) => Promise<boolean>;
  validateEmail: (email: string) => boolean;
}

export interface IntegrationService {
  connect: (provider: IntegrationProvider, credentials: IntegrationConfig['credentials']) => Promise<boolean>;
  disconnect: (provider: IntegrationProvider) => Promise<boolean>;
  syncInvoice: (provider: IntegrationProvider, invoice: Invoice) => Promise<{ success: boolean; externalId?: string }>;
  testConnection: (provider: IntegrationProvider) => Promise<boolean>;
}

export interface PDFUtils {
  convertPDFToImages: (pdfUrl: string) => Promise<string[]>;
  extractPDFMetadata: (pdfUrl: string) => Promise<{ pageCount: number; author?: string; createdAt?: string }>;
}

export interface ValidationUtils {
  validateInvoiceData: (data: Partial<ExtractedData>) => { valid: boolean; errors: string[] };
  validateEmail: (email: string) => boolean;
  validateFileType: (file: File, allowedTypes: FileType[]) => boolean;
  validateFileSize: (file: File, maxSizeMB: number) => boolean;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  vendorName?: string;
  searchQuery?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: keyof Invoice | keyof ExtractedData;
  direction: 'asc' | 'desc';
}