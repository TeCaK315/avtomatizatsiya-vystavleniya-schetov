import Tesseract from 'tesseract.js';
import type { ExtractedData, InvoiceItem, Contact } from '@/types';

/**
 * Extract text from image buffer using Tesseract.js OCR
 */
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: () => {}, // Suppress logs in production
    });
    return result.data.text;
  } catch (error) {
    console.error('OCR text extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Parse invoice number from text
 */
function parseInvoiceNumber(text: string): string | undefined {
  const patterns = [
    /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /inv\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /number\s*:?\s*([A-Z0-9-]+)/i,
    /#\s*([A-Z0-9-]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Parse dates from text (issue date and due date)
 */
function parseDates(text: string): { issueDate?: string; dueDate?: string } {
  const result: { issueDate?: string; dueDate?: string } = {};

  // Date patterns: MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD, Month DD, YYYY
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi;

  // Issue date patterns
  const issueDatePatterns = [
    /(?:invoice\s+)?date\s*:?\s*([^\n]+)/i,
    /issue\s+date\s*:?\s*([^\n]+)/i,
    /dated?\s*:?\s*([^\n]+)/i,
  ];

  for (const pattern of issueDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dateMatch = match[1].match(datePattern);
      if (dateMatch) {
        result.issueDate = normalizeDate(dateMatch[0]);
        break;
      }
    }
  }

  // Due date patterns
  const dueDatePatterns = [
    /due\s+date\s*:?\s*([^\n]+)/i,
    /payment\s+due\s*:?\s*([^\n]+)/i,
    /due\s*:?\s*([^\n]+)/i,
  ];

  for (const pattern of dueDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const dateMatch = match[1].match(datePattern);
      if (dateMatch) {
        result.dueDate = normalizeDate(dateMatch[0]);
        break;
      }
    }
  }

  return result;
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (error) {
    console.error('Date normalization failed:', error);
  }
  return dateStr;
}

/**
 * Parse contact information (name, email, address)
 */
function parseContact(text: string, section: string): Partial<Contact> {
  const contact: Partial<Contact> = {};

  // Extract email
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const emailMatch = section.match(emailPattern);
  if (emailMatch) {
    contact.email = emailMatch[1];
  }

  // Extract phone
  const phonePattern = /(?:phone|tel|mobile)\s*:?\s*([\d\s\-\+\(\)]+)/i;
  const phoneMatch = section.match(phonePattern);
  if (phoneMatch) {
    contact.phone = phoneMatch[1].trim();
  }

  // Extract name (first non-empty line that's not an address or email)
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (const line of lines) {
    if (!line.match(emailPattern) && !line.match(phonePattern) && line.length < 100) {
      contact.name = line;
      break;
    }
  }

  return contact;
}

/**
 * Parse line items from text
 */
function parseLineItems(text: string): Partial<InvoiceItem>[] {
  const items: Partial<InvoiceItem>[] = [];

  // Look for table-like structures with description, quantity, price
  const lines = text.split('\n');
  const itemPattern = /(.+?)\s+(\d+(?:\.\d+)?)\s+(?:\$|€|£)?\s*(\d+(?:\.\d+)?)\s+(?:\$|€|£)?\s*(\d+(?:\.\d+)?)/;

  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match) {
      const [, description, quantity, unitPrice, total] = match;
      items.push({
        description: description.trim(),
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        total: parseFloat(total),
      });
    }
  }

  return items;
}

/**
 * Parse monetary amounts (subtotal, tax, total)
 */
function parseAmounts(text: string): {
  subtotal?: number;
  taxAmount?: number;
  total?: number;
} {
  const result: { subtotal?: number; taxAmount?: number; total?: number } = {};

  // Amount pattern: $1,234.56 or 1234.56
  const amountPattern = /(?:\$|€|£)?\s*([\d,]+\.?\d*)/;

  // Subtotal
  const subtotalMatch = text.match(/subtotal\s*:?\s*(?:\$|€|£)?\s*([\d,]+\.?\d*)/i);
  if (subtotalMatch) {
    result.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
  }

  // Tax
  const taxMatch = text.match(/(?:tax|vat|gst)\s*:?\s*(?:\$|€|£)?\s*([\d,]+\.?\d*)/i);
  if (taxMatch) {
    result.taxAmount = parseFloat(taxMatch[1].replace(/,/g, ''));
  }

  // Total
  const totalMatch = text.match(/total\s*(?:amount|due)?\s*:?\s*(?:\$|€|£)?\s*([\d,]+\.?\d*)/i);
  if (totalMatch) {
    result.total = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  return result;
}

/**
 * Calculate confidence score based on extracted data completeness
 */
function calculateConfidence(data: ExtractedData): number {
  let score = 0;
  let maxScore = 0;

  // Invoice number (20 points)
  maxScore += 20;
  if (data.invoiceNumber) score += 20;

  // Dates (20 points)
  maxScore += 20;
  if (data.issueDate) score += 10;
  if (data.dueDate) score += 10;

  // Contact info (20 points)
  maxScore += 20;
  if (data.from?.name || data.from?.email) score += 10;
  if (data.to?.name || data.to?.email) score += 10;

  // Amounts (20 points)
  maxScore += 20;
  if (data.total) score += 10;
  if (data.subtotal) score += 5;
  if (data.taxAmount) score += 5;

  // Line items (20 points)
  maxScore += 20;
  if (data.items && data.items.length > 0) score += 20;

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Parse invoice data from extracted text
 */
function parseInvoiceData(text: string): ExtractedData {
  const data: ExtractedData = {
    rawText: text,
    confidence: 0,
  };

  // Parse invoice number
  data.invoiceNumber = parseInvoiceNumber(text);

  // Parse dates
  const dates = parseDates(text);
  data.issueDate = dates.issueDate;
  data.dueDate = dates.dueDate;

  // Try to split text into "from" and "to" sections
  const billToMatch = text.match(/bill\s+to\s*:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i);
  const billFromMatch = text.match(/(?:from|bill\s+from)\s*:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i);

  if (billFromMatch) {
    data.from = parseContact(text, billFromMatch[1]);
  }

  if (billToMatch) {
    data.to = parseContact(text, billToMatch[1]);
  }

  // Parse line items
  data.items = parseLineItems(text);

  // Parse amounts
  const amounts = parseAmounts(text);
  data.subtotal = amounts.subtotal;
  data.taxAmount = amounts.taxAmount;
  data.total = amounts.total;

  // Calculate confidence
  data.confidence = calculateConfidence(data);

  return data;
}

/**
 * Extract invoice data from PDF buffer
 * Converts PDF pages to images and runs OCR on each page
 */
export async function extractDataFromPDF(pdfBuffer: Buffer): Promise<ExtractedData> {
  try {
    // For prototype, we'll treat the buffer as a single image
    // In production, you'd use pdf-parse or pdf2pic to convert PDF to images first
    
    // Extract text from the image
    const text = await extractTextFromImage(pdfBuffer);

    if (!text || text.trim().length === 0) {
      return {
        rawText: '',
        confidence: 0,
      };
    }

    // Parse the extracted text into structured invoice data
    const invoiceData = parseInvoiceData(text);

    return invoiceData;
  } catch (error) {
    console.error('PDF data extraction failed:', error);
    return {
      rawText: '',
      confidence: 0,
    };
  }
}