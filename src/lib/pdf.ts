import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { PDFUtils } from '@/types';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Convert PDF file to array of base64 image strings
 * Each page becomes a separate image for OCR processing
 */
export async function convertPDFToImages(pdfUrl: string): Promise<string[]> {
  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf: PDFDocumentProxy = await loadingTask.promise;
    
    const images: string[] = [];
    const numPages = pdf.numPages;

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page: PDFPageProxy = await pdf.getPage(pageNum);
      
      // Set scale for good OCR quality (2x resolution)
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to base64 image
      const imageData = canvas.toDataURL('image/png');
      images.push(imageData);

      // Cleanup
      page.cleanup();
    }

    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract metadata from PDF file
 * Returns page count and document properties
 */
export async function extractPDFMetadata(pdfUrl: string): Promise<{
  pageCount: number;
  author?: string;
  createdAt?: string;
}> {
  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf: PDFDocumentProxy = await loadingTask.promise;

    // Get metadata
    const metadata = await pdf.getMetadata();
    const info = metadata.info as any;

    // Extract creation date
    let createdAt: string | undefined;
    if (info.CreationDate) {
      // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
      const dateStr = info.CreationDate.toString();
      const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
      if (match) {
        const [, year, month, day, hour, minute, second] = match;
        createdAt = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        ).toISOString();
      }
    }

    return {
      pageCount: pdf.numPages,
      author: info.Author || undefined,
      createdAt,
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    throw new Error(`Failed to extract PDF metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate if file is a valid PDF
 */
export async function validatePDF(fileUrl: string): Promise<boolean> {
  try {
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    const pdf = await loadingTask.promise;
    return pdf.numPages > 0;
  } catch (error) {
    console.error('PDF validation failed:', error);
    return false;
  }
}

/**
 * Get PDF page as image data URL
 * Useful for preview purposes
 */
export async function getPDFPageImage(
  pdfUrl: string,
  pageNumber: number,
  scale: number = 1.5
): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf: PDFDocumentProxy = await loadingTask.promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`);
    }

    const page: PDFPageProxy = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    const imageData = canvas.toDataURL('image/png');
    page.cleanup();

    return imageData;
  } catch (error) {
    console.error('Error getting PDF page image:', error);
    throw new Error(`Failed to get PDF page image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert image file to base64 data URL
 * For JPEG/PNG files that don't need PDF processing
 */
export async function convertImageToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('FileReader error'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Optimize image for OCR processing
 * Converts to grayscale and adjusts contrast
 */
export function optimizeImageForOCR(imageDataURL: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // Increase contrast
        const contrast = 1.2;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const newValue = factor * (avg - 128) + 128;
        
        data[i] = newValue;     // R
        data[i + 1] = newValue; // G
        data[i + 2] = newValue; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageDataURL;
  });
}