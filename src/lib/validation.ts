import type { ExtractedData, FileType, InvoiceItem } from '@/types';

/**
 * Validate invoice data extracted from OCR
 * Returns validation result with list of errors
 */
export function validateInvoiceData(data: Partial<ExtractedData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields validation
  if (!data.invoiceNumber || data.invoiceNumber.trim() === '') {
    errors.push('Invoice number is required');
  }

  if (!data.invoiceDate) {
    errors.push('Invoice date is required');
  } else if (!isValidDate(data.invoiceDate)) {
    errors.push('Invoice date is invalid');
  }

  if (!data.dueDate) {
    errors.push('Due date is required');
  } else if (!isValidDate(data.dueDate)) {
    errors.push('Due date is invalid');
  }

  // Validate due date is after invoice date
  if (data.invoiceDate && data.dueDate && isValidDate(data.invoiceDate) && isValidDate(data.dueDate)) {
    const invoiceDate = new Date(data.invoiceDate);
    const dueDate = new Date(data.dueDate);
    if (dueDate < invoiceDate) {
      errors.push('Due date must be after invoice date');
    }
  }

  if (!data.vendorName || data.vendorName.trim() === '') {
    errors.push('Vendor name is required');
  }

  if (!data.customerName || data.customerName.trim() === '') {
    errors.push('Customer name is required');
  }

  // Email validation
  if (data.vendorEmail && !validateEmail(data.vendorEmail)) {
    errors.push('Vendor email is invalid');
  }

  if (data.customerEmail && !validateEmail(data.customerEmail)) {
    errors.push('Customer email is invalid');
  }

  // Phone validation
  if (data.vendorPhone && !isValidPhone(data.vendorPhone)) {
    errors.push('Vendor phone number is invalid');
  }

  // Items validation
  if (!data.items || data.items.length === 0) {
    errors.push('At least one invoice item is required');
  } else {
    data.items.forEach((item, index) => {
      const itemErrors = validateInvoiceItem(item);
      itemErrors.forEach(error => {
        errors.push(`Item ${index + 1}: ${error}`);
      });
    });
  }

  // Amount validation
  if (data.subtotal !== undefined && data.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }

  if (data.taxAmount !== undefined && data.taxAmount < 0) {
    errors.push('Tax amount cannot be negative');
  }

  if (data.totalAmount !== undefined && data.totalAmount < 0) {
    errors.push('Total amount cannot be negative');
  }

  // Validate amount calculations
  if (data.items && data.items.length > 0 && data.subtotal !== undefined) {
    const calculatedSubtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    const difference = Math.abs(calculatedSubtotal - data.subtotal);
    if (difference > 0.01) {
      errors.push(`Subtotal mismatch: calculated ${calculatedSubtotal.toFixed(2)}, provided ${data.subtotal.toFixed(2)}`);
    }
  }

  if (data.subtotal !== undefined && data.taxAmount !== undefined && data.totalAmount !== undefined) {
    const calculatedTotal = data.subtotal + data.taxAmount;
    const difference = Math.abs(calculatedTotal - data.totalAmount);
    if (difference > 0.01) {
      errors.push(`Total amount mismatch: calculated ${calculatedTotal.toFixed(2)}, provided ${data.totalAmount.toFixed(2)}`);
    }
  }

  // Currency validation
  if (!data.currency || data.currency.trim() === '') {
    errors.push('Currency is required');
  } else if (!isValidCurrency(data.currency)) {
    errors.push('Currency code is invalid (use ISO 4217 format like USD, EUR, GBP)');
  }

  // Confidence validation
  if (data.confidence !== undefined && (data.confidence < 0 || data.confidence > 100)) {
    errors.push('Confidence score must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate individual invoice item
 */
function validateInvoiceItem(item: InvoiceItem): string[] {
  const errors: string[] = [];

  if (!item.description || item.description.trim() === '') {
    errors.push('Description is required');
  }

  if (item.quantity === undefined || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (item.unitPrice === undefined || item.unitPrice < 0) {
    errors.push('Unit price cannot be negative');
  }

  if (item.total === undefined || item.total < 0) {
    errors.push('Total cannot be negative');
  }

  // Validate total calculation
  if (item.quantity !== undefined && item.unitPrice !== undefined && item.total !== undefined) {
    const calculatedTotal = item.quantity * item.unitPrice;
    const difference = Math.abs(calculatedTotal - item.total);
    if (difference > 0.01) {
      errors.push(`Total mismatch: calculated ${calculatedTotal.toFixed(2)}, provided ${item.total.toFixed(2)}`);
    }
  }

  if (item.taxRate !== undefined && (item.taxRate < 0 || item.taxRate > 100)) {
    errors.push('Tax rate must be between 0 and 100');
  }

  return errors;
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  const [localPart, domain] = email.split('@');
  
  if (localPart.length > 64 || domain.length > 255) {
    return false;
  }

  return true;
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(file: File, allowedTypes: FileType[]): boolean {
  if (!file || !file.type) {
    return false;
  }

  return allowedTypes.includes(file.type as FileType);
}

/**
 * Validate file size against maximum allowed size
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  if (!file || !file.size) {
    return false;
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate date string (ISO 8601 format)
 */
function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate phone number format
 * Accepts various international formats
 */
function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove common separators
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it contains only digits and optional + at start
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate currency code (ISO 4217)
 */
function isValidCurrency(currency: string): boolean {
  if (!currency || typeof currency !== 'string') {
    return false;
  }

  // Common currency codes
  const validCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
    'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR',
    'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP', 'AED',
    'COP', 'SAR', 'MYR', 'RON', 'ARS', 'VND', 'PKR', 'EGP', 'NGN', 'BDT'
  ];

  return validCurrencies.includes(currency.toUpperCase());
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate and sanitize invoice data before saving
 */
export function sanitizeInvoiceData(data: Partial<ExtractedData>): Partial<ExtractedData> {
  const sanitized: Partial<ExtractedData> = {};

  if (data.invoiceNumber) sanitized.invoiceNumber = sanitizeString(data.invoiceNumber);
  if (data.invoiceDate) sanitized.invoiceDate = data.invoiceDate;
  if (data.dueDate) sanitized.dueDate = data.dueDate;
  if (data.vendorName) sanitized.vendorName = sanitizeString(data.vendorName);
  if (data.vendorAddress) sanitized.vendorAddress = sanitizeString(data.vendorAddress);
  if (data.vendorEmail) sanitized.vendorEmail = sanitizeString(data.vendorEmail);
  if (data.vendorPhone) sanitized.vendorPhone = sanitizeString(data.vendorPhone);
  if (data.customerName) sanitized.customerName = sanitizeString(data.customerName);
  if (data.customerAddress) sanitized.customerAddress = sanitizeString(data.customerAddress);
  if (data.customerEmail) sanitized.customerEmail = sanitizeString(data.customerEmail);
  if (data.notes) sanitized.notes = sanitizeString(data.notes);
  if (data.currency) sanitized.currency = sanitizeString(data.currency).toUpperCase();

  if (data.items) {
    sanitized.items = data.items.map(item => ({
      ...item,
      description: sanitizeString(item.description),
    }));
  }

  if (data.subtotal !== undefined) sanitized.subtotal = data.subtotal;
  if (data.taxAmount !== undefined) sanitized.taxAmount = data.taxAmount;
  if (data.totalAmount !== undefined) sanitized.totalAmount = data.totalAmount;
  if (data.confidence !== undefined) sanitized.confidence = data.confidence;

  return sanitized;
}

/**
 * Validate batch of email addresses
 */
export function validateEmailList(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach(email => {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return `${errors.length} validation errors:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
}