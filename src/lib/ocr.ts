import { OCRService as IOCRService, OCRResult, ExtractedData, FileType, InvoiceItem } from '@/types';
import { createWorker, Worker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

class OCRServiceImpl implements IOCRService {
  private worker: Worker | null = null;
  private isInitialized = false;

  private async initializeWorker(): Promise<void> {
    if (this.isInitialized && this.worker) {
      return;
    }

    this.worker = await createWorker('eng');
    this.isInitialized = true;
  }

  private async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  async extractFromFile(fileUrl: string, fileType: FileType): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      let imageData: string;

      if (fileType === FileType.PDF) {
        // Convert PDF to image first
        const images = await this.convertPDFToImages(fileUrl);
        if (images.length === 0) {
          throw new Error('Failed to convert PDF to images');
        }
        // Use first page for OCR
        imageData = images[0];
      } else {
        // Direct image file
        imageData = fileUrl;
      }

      const result = await this.extractFromImage(imageData);
      const processingTime = Date.now() - startTime;

      return {
        ...result,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        data: null,
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown OCR error'
      };
    }
  }

  async extractFromImage(imageData: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      await this.initializeWorker();

      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      const { data: { text, confidence } } = await this.worker.recognize(imageData);

      const extractedData = this.parseInvoiceText(text);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: extractedData,
        confidence: Math.round(confidence),
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        data: null,
        confidence: 0,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown OCR error'
      };
    }
  }

  private parseInvoiceText(text: string): ExtractedData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract invoice number
    const invoiceNumber = this.extractInvoiceNumber(lines);
    
    // Extract dates
    const invoiceDate = this.extractDate(lines, ['invoice date', 'date', 'issued']);
    const dueDate = this.extractDate(lines, ['due date', 'payment due', 'due']);

    // Extract vendor info
    const vendorName = this.extractVendorName(lines);
    const vendorAddress = this.extractAddress(lines, 'vendor');
    const vendorEmail = this.extractEmail(lines);
    const vendorPhone = this.extractPhone(lines);

    // Extract customer info
    const customerName = this.extractCustomerName(lines);
    const customerAddress = this.extractAddress(lines, 'customer');
    const customerEmail = this.extractEmail(lines, true);

    // Extract line items
    const items = this.extractLineItems(lines);

    // Extract totals
    const subtotal = this.extractAmount(lines, ['subtotal', 'sub total', 'sub-total']);
    const taxAmount = this.extractAmount(lines, ['tax', 'vat', 'gst']);
    const totalAmount = this.extractAmount(lines, ['total', 'amount due', 'balance due', 'grand total']);

    // Extract currency
    const currency = this.extractCurrency(text);

    // Extract notes
    const notes = this.extractNotes(lines);

    return {
      invoiceNumber,
      invoiceDate,
      dueDate,
      vendorName,
      vendorAddress,
      vendorEmail,
      vendorPhone,
      customerName,
      customerAddress,
      customerEmail,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      currency,
      notes,
      confidence: 75 // Base confidence, can be adjusted based on field extraction success
    };
  }

  private extractInvoiceNumber(lines: string[]): string {
    const patterns = [
      /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /inv\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      /#\s*([A-Z0-9-]+)/i
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          return match[1];
        }
      }
    }

    return `INV-${Date.now()}`;
  }

  private extractDate(lines: string[], keywords: string[]): string {
    const datePattern = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        const match = line.match(datePattern);
        if (match) {
          return this.normalizeDate(match[1]);
        }
      }
    }

    // Fallback: find any date in the document
    for (const line of lines) {
      const match = line.match(datePattern);
      if (match) {
        return this.normalizeDate(match[1]);
      }
    }

    return new Date().toISOString().split('T')[0];
  }

  private normalizeDate(dateStr: string): string {
    const separators = ['-', '/', '.'];
    let normalized = dateStr;

    for (const sep of separators) {
      if (dateStr.includes(sep)) {
        const parts = dateStr.split(sep);
        if (parts.length === 3) {
          let [first, second, third] = parts;
          
          // Handle 2-digit year
          if (third.length === 2) {
            third = '20' + third;
          }

          // Determine format and convert to YYYY-MM-DD
          if (first.length === 4) {
            // YYYY-MM-DD or YYYY-DD-MM
            normalized = `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
          } else {
            // MM-DD-YYYY or DD-MM-YYYY (assume MM-DD-YYYY)
            normalized = `${third}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
          }
        }
        break;
      }
    }

    return normalized;
  }

  private extractVendorName(lines: string[]): string {
    // Usually vendor name is at the top of the invoice
    if (lines.length > 0) {
      return lines[0];
    }
    return 'Unknown Vendor';
  }

  private extractCustomerName(lines: string[]): string {
    const keywords = ['bill to', 'customer', 'client', 'to:'];
    
    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        if (i + 1 < lines.length) {
          return lines[i + 1];
        }
      }
    }

    return 'Unknown Customer';
  }

  private extractAddress(lines: string[], type: 'vendor' | 'customer'): string {
    const keywords = type === 'vendor' 
      ? ['from:', 'vendor', 'seller']
      : ['bill to', 'customer', 'client', 'to:'];

    let addressLines: string[] = [];
    let capturing = false;

    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        capturing = true;
        continue;
      }

      if (capturing) {
        // Stop capturing if we hit another section
        if (lowerLine.includes('invoice') || lowerLine.includes('date') || lowerLine.includes('item')) {
          break;
        }

        addressLines.push(lines[i]);

        if (addressLines.length >= 3) {
          break;
        }
      }
    }

    return addressLines.join(', ') || 'Address not found';
  }

  private extractEmail(lines: string[], secondary: boolean = false): string | undefined {
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emails: string[] = [];

    for (const line of lines) {
      const match = line.match(emailPattern);
      if (match) {
        emails.push(match[1]);
      }
    }

    if (secondary && emails.length > 1) {
      return emails[1];
    }

    return emails[0];
  }

  private extractPhone(lines: string[]): string | undefined {
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

    for (const line of lines) {
      const match = line.match(phonePattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  private extractLineItems(lines: string[]): InvoiceItem[] {
    const items: InvoiceItem[] = [];
    const itemPattern = /(\d+)\s+(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        const [, qty, desc, unitPrice, , total] = match;
        items.push({
          id: `item-${items.length + 1}`,
          description: desc.trim(),
          quantity: parseFloat(qty),
          unitPrice: parseFloat(unitPrice),
          total: parseFloat(total),
          taxRate: 0
        });
      }
    }

    // If no items found, create a placeholder
    if (items.length === 0) {
      items.push({
        id: 'item-1',
        description: 'Service/Product',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        taxRate: 0
      });
    }

    return items;
  }

  private extractAmount(lines: string[], keywords: string[]): number {
    const amountPattern = /(\d+[,.]?\d*\.?\d{2})/;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        const match = line.match(amountPattern);
        if (match) {
          return parseFloat(match[1].replace(',', ''));
        }
      }
    }

    return 0;
  }

  private extractCurrency(text: string): string {
    const currencySymbols: { [key: string]: string } = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      '₹': 'INR'
    };

    for (const [symbol, code] of Object.entries(currencySymbols)) {
      if (text.includes(symbol)) {
        return code;
      }
    }

    // Check for currency codes
    const currencyPattern = /\b(USD|EUR|GBP|JPY|INR|CAD|AUD)\b/i;
    const match = text.match(currencyPattern);
    if (match) {
      return match[1].toUpperCase();
    }

    return 'USD';
  }

  private extractNotes(lines: string[]): string | undefined {
    const keywords = ['notes', 'comments', 'remarks', 'terms'];
    let notesLines: string[] = [];
    let capturing = false;

    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLowerCase();
      
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        capturing = true;
        continue;
      }

      if (capturing) {
        notesLines.push(lines[i]);
        if (notesLines.length >= 3) {
          break;
        }
      }
    }

    return notesLines.length > 0 ? notesLines.join(' ') : undefined;
  }

  private async convertPDFToImages(pdfUrl: string): Promise<string[]> {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const images: string[] = [];

      // Convert first page only for prototype
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      images.push(canvas.toDataURL('image/png'));

      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      return [];
    }
  }
}

export const OCRService = new OCRServiceImpl();