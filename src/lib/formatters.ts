import type { 
  FormatCurrencyFn, 
  FormatDateFn, 
  GenerateInvoiceNumberFn 
} from '@/types';

/**
 * Formats a number as currency with proper symbol and decimal places
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency: FormatCurrencyFn = (
  amount: number, 
  currency: string = 'USD'
): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$${formatted}`;
  }
};

/**
 * Formats a date string or Date object into human-readable format
 * @param date - ISO date string or Date object
 * @param format - Format type: 'short' (MM/DD/YYYY), 'long' (Month DD, YYYY), 'iso' (YYYY-MM-DD)
 * @returns Formatted date string
 */
export const formatDate: FormatDateFn = (
  date: string | Date, 
  format: string = 'short'
): string => {
  let dateObj: Date;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return 'Invalid Date';
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  switch (format) {
    case 'short':
      // MM/DD/YYYY
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${month}/${day}/${year}`;

    case 'long':
      // Month DD, YYYY
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'iso':
      // YYYY-MM-DD
      return dateObj.toISOString().split('T')[0];

    case 'full':
      // Day, Month DD, YYYY
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    case 'time':
      // HH:MM AM/PM
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

    case 'datetime':
      // MM/DD/YYYY HH:MM AM/PM
      const shortDate = formatDate(dateObj, 'short');
      const time = formatDate(dateObj, 'time');
      return `${shortDate} ${time}`;

    default:
      return formatDate(dateObj, 'short');
  }
};

/**
 * Generates a unique invoice number with format: INV-YYYYMMDD-XXXX
 * @returns Generated invoice number (e.g., "INV-20240115-0001")
 */
export const generateInvoiceNumber: GenerateInvoiceNumberFn = (): string => {
  const now = new Date();
  
  // Date part: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  
  // Random part: 4 digits
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  
  // Timestamp part for additional uniqueness
  const timestamp = now.getTime().toString().slice(-4);
  
  return `INV-${datePart}-${randomPart}${timestamp}`;
};

/**
 * Formats invoice status for display
 * @param status - Invoice status enum value
 * @returns Human-readable status string
 */
export const formatInvoiceStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled'
  };

  return statusMap[status] || status;
};

/**
 * Formats payment method for display
 * @param method - Payment method enum value
 * @returns Human-readable payment method string
 */
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
    paypal: 'PayPal',
    cash: 'Cash'
  };

  return methodMap[method] || method;
};

/**
 * Formats a phone number for display
 * @param phone - Raw phone number string
 * @returns Formatted phone number (e.g., "(555) 123-4567")
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    // US format with country code: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return original if format is unknown
  return phone;
};

/**
 * Truncates text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
};

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Formats a percentage value
 * @param value - Decimal value (e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "15%")
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return `${(value * 100).toFixed(decimals)}%`;
};