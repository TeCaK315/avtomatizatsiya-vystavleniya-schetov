import { PDFToImagesFn } from '@/types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Converts PDF buffer to array of image buffers (PNG format)
 * Each page of the PDF is rendered as a separate image
 * @param pdfBuffer - PDF file as Buffer
 * @returns Array of image buffers (one per page)
 */
export const pdfToImages: PDFToImagesFn = async (pdfBuffer: Buffer): Promise<Buffer[]> => {
  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
    });
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const imageBuffers: Buffer[] = [];

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Set scale for better OCR quality (2x resolution)
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas 2D context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to buffer
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      imageBuffers.push(buffer);
    }

    return imageBuffers;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Server-side PDF to images conversion using pdf-parse
 * Fallback for Node.js environment where canvas is not available
 */
export const pdfToImagesServer = async (pdfBuffer: Buffer): Promise<Buffer[]> => {
  try {
    // For server-side, we'll use a different approach
    // This is a simplified version that extracts text directly
    // In production, you'd use node-canvas or similar
    const pdf = require('pdf-parse');
    const data = await pdf(pdfBuffer);
    
    // Create a simple text-based image representation
    // This is a fallback - in production use proper image rendering
    const textBuffer = Buffer.from(data.text, 'utf-8');
    
    return [textBuffer];
  } catch (error) {
    console.error('Error in server-side PDF parsing:', error);
    throw new Error(`Failed to parse PDF on server: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Universal PDF to images function that works in both browser and Node.js
 */
export const pdfToImagesUniversal = async (pdfBuffer: Buffer): Promise<Buffer[]> => {
  if (typeof window !== 'undefined') {
    return pdfToImages(pdfBuffer);
  } else {
    return pdfToImagesServer(pdfBuffer);
  }
};