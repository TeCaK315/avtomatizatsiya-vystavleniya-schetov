import type { ExtractTextFromPDF, ParseInvoiceData, ExtractedData } from '@/types';
import pdf from 'pdf-parse';

/**
 * Extract text content from a PDF file
 * @param file - PDF file to extract text from
 * @returns Extracted text content
 */
export const extractTextFromPDF: ExtractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF and extract text
    const data = await pdf(buffer);
    
    return data.text || '';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

/**
 * Parse invoice data from extracted text using pattern matching
 * @param text - Extracted text from PDF
 * @returns Parsed invoice data
 */
export const parseInvoiceData: ParseInvoiceData = (text: string): Partial<ExtractedData> => {
  if (!text || text.trim().length === 0) {
    return {
      items: [],
      rawText: text,
      confidence: 0,
    };
  }

  const result: Partial<ExtractedData> = {
    items: [],
    rawText: text,
    confidence: 0.5, // Base confidence for text-based parsing
  };

  // Normalize text for better pattern matching
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract invoice number
  const invoiceNumberPatterns = [
    /invoice\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
    /invoice\s+number\s*:?\s*([A-Z0-9\-]+)/i,
    /inv\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
    /#\s*([A-Z0-9\-]+)/,
  ];

  for (const pattern of invoiceNumberPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.invoiceNumber = match[1].trim();
      break;
    }
  }

  // Extract dates (ISO format or common formats)
  const datePatterns = [
    /date\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /issue\s+date\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /issue\s+date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.issueDate = normalizeDate(match[1]);
      break;
    }
  }

  // Extract due date
  const dueDatePatterns = [
    /due\s+date\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /due\s+date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /payment\s+due\s*:?\s*(\d{4}-\d{2}-\d{2})/i,
    /payment\s+due\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  ];

  for (const pattern of dueDatePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.dueDate = normalizeDate(match[1]);
      break;
    }
  }

  // Extract client name (usually after "Bill To" or "Client")
  const clientPatterns = [
    /bill\s+to\s*:?\s*\n\s*([^\n]+)/i,
    /client\s*:?\s*\n\s*([^\n]+)/i,
    /customer\s*:?\s*\n\s*([^\n]+)/i,
    /bill\s+to\s*:?\s*([^\n]+)/i,
  ];

  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.clientName = match[1].trim();
      break;
    }
  }

  // Extract email
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = text.match(emailPattern);
  if (emailMatch && emailMatch[1]) {
    result.clientEmail = emailMatch[1].trim();
  }

  // Extract address (lines after client name, before items)
  if (result.clientName) {
    const clientIndex = lines.findIndex(line => 
      line.toLowerCase().includes('bill to') || 
      line.toLowerCase().includes('client')
    );
    
    if (clientIndex !== -1 && clientIndex + 2 < lines.length) {
      const addressLines: string[] = [];
      for (let i = clientIndex + 2; i < Math.min(clientIndex + 5, lines.length); i++) {
        const line = lines[i];
        // Stop if we hit item headers or amounts
        if (line.match(/description|quantity|price|amount|total/i) || line.match(/^\$?\d+\.?\d*$/)) {
          break;
        }
        if (line.length > 0 && !line.match(emailPattern)) {
          addressLines.push(line);
        }
      }
      if (addressLines.length > 0) {
        result.clientAddress = addressLines.join(', ');
      }
    }
  }

  // Extract line items
  const items: Array<{ description: string; quantity: number; unitPrice: number }> = [];
  
  // Look for table-like structures with description, quantity, price
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern: description followed by numbers (quantity and price)
    const itemPattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s+\$?(\d+(?:\.\d{2})?)(?:\s+\$?(\d+(?:\.\d{2})?))?/;
    const match = line.match(itemPattern);
    
    if (match) {
      const description = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unitPrice = parseFloat(match[3]);
      
      // Validate that this looks like a real item (not a header or total)
      if (
        description.length > 2 &&
        !description.toLowerCase().includes('total') &&
        !description.toLowerCase().includes('subtotal') &&
        !description.toLowerCase().includes('tax') &&
        quantity > 0 &&
        unitPrice > 0
      ) {
        items.push({
          description,
          quantity,
          unitPrice,
        });
      }
    }
  }

  result.items = items;

  // Extract totals
  const subtotalPattern = /subtotal\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
  const subtotalMatch = text.match(subtotalPattern);
  if (subtotalMatch && subtotalMatch[1]) {
    result.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
  }

  const taxPattern = /tax\s*(?:\((\d+(?:\.\d+)?)%\))?\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
  const taxMatch = text.match(taxPattern);
  if (taxMatch) {
    if (taxMatch[1]) {
      result.taxRate = parseFloat(taxMatch[1]);
    }
  }

  const totalPattern = /total\s*:?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
  const totalMatch = text.match(totalPattern);
  if (totalMatch && totalMatch[1]) {
    result.total = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  // Adjust confidence based on what we found
  let foundFields = 0;
  if (result.invoiceNumber) foundFields++;
  if (result.clientName) foundFields++;
  if (result.clientEmail) foundFields++;
  if (result.issueDate) foundFields++;
  if (result.items && result.items.length > 0) foundFields += 2;
  if (result.total) foundFields++;

  result.confidence = Math.min(0.9, 0.3 + (foundFields * 0.1));

  return result;
};

/**
 * Normalize date string to ISO format
 * @param dateStr - Date string in various formats
 * @returns ISO date string
 */
function normalizeDate(dateStr: string): string {
  try {
    // Try parsing as-is first (handles ISO format)
    let date = new Date(dateStr);
    
    // If invalid, try parsing common formats
    if (isNaN(date.getTime())) {
      // Handle DD/MM/YYYY or MM/DD/YYYY
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        // Assume MM/DD/YYYY for US format
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Handle 2-digit years
        const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
        
        date = new Date(fullYear, month - 1, day);
      }
    }
    
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (error) {
    console.error('Error normalizing date:', error);
  }
  
  // Fallback to current date if parsing fails
  return new Date().toISOString();
}