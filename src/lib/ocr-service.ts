import { ExtractedPDFData } from '@/types';

/**
 * Perform OCR on PDF buffer using external OCR API
 * This is a fallback when pdf-parse fails (e.g., scanned PDFs)
 * @param buffer PDF file buffer
 * @returns OCR result with extracted text and confidence
 */
export async function performOCR(buffer: Buffer): Promise<{
  text: string;
  confidence: number;
}> {
  const ocrApiKey = process.env.OCR_API_KEY;
  const ocrApiUrl = process.env.OCR_API_URL;
  
  if (!ocrApiKey || !ocrApiUrl) {
    throw new Error('OCR API credentials not configured. Set OCR_API_KEY and OCR_API_URL environment variables.');
  }
  
  try {
    // Convert buffer to base64 for API transmission
    const base64Data = buffer.toString('base64');
    
    // Call OCR API (example using OCR.space API format)
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('file', blob, 'invoice.pdf');
    formData.append('apikey', ocrApiKey);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Use OCR Engine 2 for better accuracy
    
    const response = await fetch(ocrApiUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`OCR API request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Parse OCR.space API response format
    if (result.IsErroredOnProcessing) {
      throw new Error(`OCR processing error: ${result.ErrorMessage || 'Unknown error'}`);
    }
    
    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error('No text extracted from PDF');
    }
    
    const parsedText = result.ParsedResults[0].ParsedText || '';
    const confidence = result.ParsedResults[0].TextOverlay?.Lines?.reduce(
      (acc: number, line: any) => acc + (line.MaxConfidence || 0),
      0
    ) / (result.ParsedResults[0].TextOverlay?.Lines?.length || 1) / 100;
    
    return {
      text: parsedText,
      confidence: confidence || 0.5, // default to 0.5 if confidence not available
    };
  } catch (error) {
    console.error('OCR API error:', error);
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract structured invoice data from OCR text
 * Uses same normalization logic as PDF parser
 * @param ocrText Raw text from OCR
 * @param confidence OCR confidence score
 * @returns Structured invoice data
 */
export function extractDataFromOCR(ocrText: string, confidence: number): ExtractedPDFData {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
  
  // Extract invoice number
  const invoiceNumber = extractInvoiceNumber(lines);
  
  // Extract client information
  const clientInfo = extractClientInfo(lines);
  
  // Extract dates
  const dates = extractDates(lines);
  
  // Extract line items
  const items = extractLineItems(lines);
  
  // Extract financial totals
  const financials = extractFinancials(lines);
  
  // Extract currency
  const currency = extractCurrency(ocrText);
  
  return {
    invoiceNumber,
    clientName: clientInfo.name,
    clientEmail: clientInfo.email,
    clientAddress: clientInfo.address,
    issueDate: dates.issueDate,
    dueDate: dates.dueDate,
    items,
    subtotal: financials.subtotal,
    taxAmount: financials.taxAmount,
    total: financials.total,
    currency,
    rawText: ocrText,
    confidence,
  };
}

/**
 * Extract invoice number from text lines
 */
function extractInvoiceNumber(lines: string[]): string | undefined {
  const patterns = [
    /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /invoice\s+number\s*:?\s*([A-Z0-9-]+)/i,
    /inv\s*[-#]?\s*([A-Z0-9-]+)/i,
    /^(INV-\d+)$/i,
    /bill\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /no\s*\.?\s*:?\s*([A-Z0-9-]+)/i,
  ];
  
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
  }
  
  return undefined;
}

/**
 * Extract client information
 */
function extractClientInfo(lines: string[]): {
  name?: string;
  email?: string;
  address?: string;
} {
  let name: string | undefined;
  let email: string | undefined;
  let address: string | undefined;
  
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  
  const clientSectionPatterns = [
    /bill\s+to\s*:?/i,
    /client\s*:?/i,
    /customer\s*:?/i,
    /billed\s+to\s*:?/i,
    /to\s*:?/i,
  ];
  
  let inClientSection = false;
  let clientSectionLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inClientSection) {
      for (const pattern of clientSectionPatterns) {
        if (pattern.test(line)) {
          inClientSection = true;
          const afterPattern = line.replace(pattern, '').trim();
          if (afterPattern && afterPattern.length > 2) {
            clientSectionLines.push(afterPattern);
          }
          break;
        }
      }
    } else {
      if (
        line.match(/^[-=_]{3,}$/) ||
        line.match(/^(description|item|quantity|amount|date|total|from|invoice)/i) ||
        clientSectionLines.length >= 5
      ) {
        inClientSection = false;
        break;
      }
      clientSectionLines.push(line);
    }
    
    const emailMatch = line.match(emailPattern);
    if (emailMatch && !email) {
      email = emailMatch[1];
    }
  }
  
  if (clientSectionLines.length > 0) {
    name = clientSectionLines[0];
    const addressLines = clientSectionLines.slice(1).filter(l => !emailPattern.test(l));
    if (addressLines.length > 0) {
      address = addressLines.join(', ');
    }
  }
  
  if (!name && email) {
    const emailLineIndex = lines.findIndex(l => l.includes(email));
    if (emailLineIndex > 0) {
      const potentialName = lines[emailLineIndex - 1];
      if (potentialName && potentialName.length > 2 && !potentialName.match(/^(invoice|bill|date|total|from)/i)) {
        name = potentialName;
      }
    }
  }
  
  return { name, email, address };
}

/**
 * Extract dates
 */
function extractDates(lines: string[]): {
  issueDate?: string;
  dueDate?: string;
} {
  let issueDate: string | undefined;
  let dueDate: string | undefined;
  
  const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i;
  
  const issueDatePatterns = [
    /invoice\s+date\s*:?\s*/i,
    /issue\s+date\s*:?\s*/i,
    /date\s*:?\s*/i,
    /dated\s*:?\s*/i,
    /created\s*:?\s*/i,
  ];
  
  const dueDatePatterns = [
    /due\s+date\s*:?\s*/i,
    /payment\s+due\s*:?\s*/i,
    /due\s*:?\s*/i,
    /pay\s+by\s*:?\s*/i,
  ];
  
  for (const line of lines) {
    if (!issueDate) {
      for (const pattern of issueDatePatterns) {
        if (pattern.test(line)) {
          const dateMatch = line.match(datePattern);
          if (dateMatch) {
            issueDate = normalizeDate(dateMatch[1]);
            break;
          }
        }
      }
    }
    
    if (!dueDate) {
      for (const pattern of dueDatePatterns) {
        if (pattern.test(line)) {
          const dateMatch = line.match(datePattern);
          if (dateMatch) {
            dueDate = normalizeDate(dateMatch[1]);
            break;
          }
        }
      }
    }
    
    if (issueDate && dueDate) break;
  }
  
  return { issueDate, dueDate };
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string): string {
  try {
    // Replace dots with slashes for better parsing
    const normalized = dateStr.replace(/\./g, '/');
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (error) {
    console.error('Date parsing error:', error);
  }
  return dateStr;
}

/**
 * Extract line items
 */
function extractLineItems(lines: string[]): Array<{
  description: string;
  quantity: number;
  unitPrice: number;
}> {
  const items: Array<{ description: string; quantity: number; unitPrice: number }> = [];
  
  const headerPatterns = [
    /description.*quantity.*price/i,
    /item.*qty.*rate/i,
    /description.*amount/i,
    /product.*quantity.*price/i,
    /service.*qty.*rate/i,
  ];
  
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (headerPatterns.some(pattern => pattern.test(line))) {
      tableStartIndex = i + 1;
      break;
    }
  }
  
  if (tableStartIndex === -1) return items;
  
  const totalPatterns = /^(subtotal|sub\s*total|total|tax|vat|discount|amount\s+due|balance)/i;
  
  for (let i = tableStartIndex; i < lines.length; i++) {
    const line = lines[i];
    
    if (totalPatterns.test(line)) break;
    if (line.match(/^[-=_]{3,}$/)) continue;
    if (line.length < 3) continue;
    
    const numberPattern = /(\d+(?:[.,]\d+)?)/g;
    const numbers = Array.from(line.matchAll(numberPattern)).map(m => 
      parseFloat(m[1].replace(/,/g, '.'))
    );
    
    if (numbers.length >= 2) {
      const firstNumberIndex = line.search(/\d/);
      const description = line.substring(0, firstNumberIndex).trim();
      
      if (description && description.length > 1 && !description.match(/^(page|\d+)$/i)) {
        const quantity = numbers[0];
        const unitPrice = numbers[1];
        
        if (quantity > 0 && unitPrice > 0) {
          items.push({
            description,
            quantity,
            unitPrice,
          });
        }
      }
    }
  }
  
  return items;
}

/**
 * Extract financial totals
 */
function extractFinancials(lines: string[]): {
  subtotal?: number;
  taxAmount?: number;
  total?: number;
} {
  let subtotal: number | undefined;
  let taxAmount: number | undefined;
  let total: number | undefined;
  
  const currencyPattern = /[\$€£¥₹]?\s*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (!subtotal && (lowerLine.includes('subtotal') || lowerLine.includes('sub total') || lowerLine.includes('sub-total'))) {
      const match = line.match(currencyPattern);
      if (match) {
        subtotal = parseFloat(match[1].replace(/,/g, ''));
      }
    }
    
    if (!taxAmount && (
      lowerLine.includes('tax') || 
      lowerLine.includes('vat') || 
      lowerLine.includes('gst') ||
      lowerLine.includes('sales tax')
    )) {
      const match = line.match(currencyPattern);
      if (match) {
        taxAmount = parseFloat(match[1].replace(/,/g, ''));
      }
    }
    
    if (!total && (
      lowerLine.match(/^total\s*:?\s*/i) ||
      lowerLine.includes('amount due') ||
      lowerLine.includes('balance due') ||
      lowerLine.includes('total amount') ||
      lowerLine.includes('grand total')
    )) {
      const match = line.match(currencyPattern);
      if (match) {
        total = parseFloat(match[1].replace(/,/g, ''));
      }
    }
  }
  
  return { subtotal, taxAmount, total };
}

/**
 * Extract currency
 */
function extractCurrency(text: string): string {
  const currencySymbols: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    'C$': 'CAD',
    'A$': 'AUD',
  };
  
  for (const [symbol, code] of Object.entries(currencySymbols)) {
    if (text.includes(symbol)) {
      return code;
    }
  }
  
  const currencyCodePattern = /\b(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|SGD|HKD|NZD|SEK|NOK|DKK)\b/i;
  const match = text.match(currencyCodePattern);
  if (match) {
    return match[1].toUpperCase();
  }
  
  return 'USD';
}