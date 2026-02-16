import type { ParseInvoiceData, ExtractedData } from '@/types';

/**
 * Parses extracted PDF text into structured invoice data using regex patterns
 * @param text - Raw text extracted from PDF
 * @returns Structured invoice data with confidence level
 */
export const parseInvoiceData: ParseInvoiceData = (text: string): ExtractedData => {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let matchCount = 0;

  // Extract invoice number
  const invoiceNumber = extractInvoiceNumber(normalizedText);
  if (invoiceNumber) matchCount++;

  // Extract client information
  const clientName = extractClientName(normalizedText);
  if (clientName) matchCount++;

  const clientEmail = extractEmail(normalizedText);
  if (clientEmail) matchCount++;

  const clientAddress = extractAddress(normalizedText);
  if (clientAddress) matchCount++;

  // Extract dates
  const issueDate = extractIssueDate(normalizedText);
  if (issueDate) matchCount++;

  const dueDate = extractDueDate(normalizedText);
  if (dueDate) matchCount++;

  // Extract line items
  const items = extractLineItems(normalizedText);
  if (items.length > 0) matchCount++;

  // Extract financial data
  const subtotal = extractSubtotal(normalizedText);
  if (subtotal !== undefined) matchCount++;

  const taxRate = extractTaxRate(normalizedText);
  if (taxRate !== undefined) matchCount++;

  const total = extractTotal(normalizedText);
  if (total !== undefined) matchCount++;

  // Determine confidence level based on successful extractions
  if (matchCount >= 7) {
    confidence = 'high';
  } else if (matchCount >= 4) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    invoiceNumber,
    clientName,
    clientEmail,
    clientAddress,
    issueDate,
    dueDate,
    items,
    subtotal,
    taxRate,
    total,
    rawText: text,
    confidence,
  };
};

/**
 * Extract invoice number from text
 */
function extractInvoiceNumber(text: string): string | undefined {
  const patterns = [
    /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /invoice\s+number\s*:?\s*([A-Z0-9-]+)/i,
    /inv\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /#\s*([A-Z0-9-]{3,})/,
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
 * Extract client name from text
 */
function extractClientName(text: string): string | undefined {
  const patterns = [
    /bill\s+to\s*:?\s*\n\s*([A-Za-z\s&.'-]+)/i,
    /client\s*:?\s*\n?\s*([A-Za-z\s&.'-]+)/i,
    /customer\s*:?\s*\n?\s*([A-Za-z\s&.'-]+)/i,
    /to\s*:?\s*\n\s*([A-Za-z\s&.'-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it's not an email or address
      if (name.length > 2 && !name.includes('@') && name.split('\n')[0].length < 50) {
        return name.split('\n')[0].trim();
      }
    }
  }

  return undefined;
}

/**
 * Extract email address from text
 */
function extractEmail(text: string): string | undefined {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailPattern);
  return match ? match[0] : undefined;
}

/**
 * Extract address from text
 */
function extractAddress(text: string): string | undefined {
  const patterns = [
    /address\s*:?\s*\n?\s*([^\n]+(?:\n[^\n]+){0,2})/i,
    /bill\s+to\s*:?\s*\n[^\n]+\n([^\n]+(?:\n[^\n]+){0,2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const address = match[1].trim();
      if (address.length > 5) {
        return address.replace(/\n/g, ', ');
      }
    }
  }

  return undefined;
}

/**
 * Extract issue date from text
 */
function extractIssueDate(text: string): string | undefined {
  const patterns = [
    /issue\s+date\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /date\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /invoice\s+date\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeDate(match[1]);
    }
  }

  return undefined;
}

/**
 * Extract due date from text
 */
function extractDueDate(text: string): string | undefined {
  const patterns = [
    /due\s+date\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /payment\s+due\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /due\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeDate(match[1]);
    }
  }

  return undefined;
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string): string {
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let [month, day, year] = parts;
    
    // Handle 2-digit year
    if (year.length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = String(century + parseInt(year));
    }

    // Pad month and day
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

/**
 * Extract line items from text
 */
function extractLineItems(text: string): Array<{ description: string; quantity: number; unitPrice: number }> {
  const items: Array<{ description: string; quantity: number; unitPrice: number }> = [];
  
  // Look for table-like structures with description, quantity, and price
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Pattern: Description followed by numbers (quantity and price)
    const itemPattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s+\$?\s*(\d+(?:\.\d{2})?)/;
    const match = line.match(itemPattern);
    
    if (match) {
      const description = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unitPrice = parseFloat(match[3]);
      
      if (description.length > 2 && quantity > 0 && unitPrice > 0) {
        items.push({
          description,
          quantity,
          unitPrice,
        });
      }
    }
  }

  // If no items found with strict pattern, try looser pattern
  if (items.length === 0) {
    const loosePattern = /([A-Za-z\s]{5,})\s+(\d+)\s+\$?(\d+(?:\.\d{2})?)/g;
    let match;
    
    while ((match = loosePattern.exec(text)) !== null) {
      const description = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unitPrice = parseFloat(match[3]);
      
      if (quantity > 0 && unitPrice > 0) {
        items.push({
          description,
          quantity,
          unitPrice,
        });
      }
    }
  }

  return items;
}

/**
 * Extract subtotal from text
 */
function extractSubtotal(text: string): number | undefined {
  const patterns = [
    /subtotal\s*:?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /sub\s+total\s*:?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  return undefined;
}

/**
 * Extract tax rate from text
 */
function extractTaxRate(text: string): number | undefined {
  const patterns = [
    /tax\s*\((\d+(?:\.\d+)?)\s*%\)/i,
    /vat\s*\((\d+(?:\.\d+)?)\s*%\)/i,
    /tax\s+rate\s*:?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s+tax/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }

  return undefined;
}

/**
 * Extract total amount from text
 */
function extractTotal(text: string): number | undefined {
  const patterns = [
    /total\s*:?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /amount\s+due\s*:?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /grand\s+total\s*:?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  return undefined;
}