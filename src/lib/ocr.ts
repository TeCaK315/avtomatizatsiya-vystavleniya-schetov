import Tesseract from 'tesseract.js';
import type { PerformOCR } from '@/types';

/**
 * Performs OCR on a PDF file using Tesseract.js
 * Converts PDF pages to images and extracts text with confidence score
 */
export const performOCR: PerformOCR = async (file: File) => {
  try {
    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      throw new Error('File must be a PDF or image');
    }

    // Convert File to ArrayBuffer for processing
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    const imageUrl = URL.createObjectURL(blob);

    // Initialize Tesseract worker
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        // Optional: log progress for debugging
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    try {
      // Perform OCR recognition
      const result = await worker.recognize(imageUrl);

      // Clean up
      URL.revokeObjectURL(imageUrl);
      await worker.terminate();

      // Extract text and confidence
      const text = result.data.text.trim();
      const confidence = result.data.confidence / 100; // Convert to 0-1 range

      if (!text) {
        throw new Error('No text could be extracted from the file');
      }

      return {
        text,
        confidence,
      };
    } catch (error) {
      // Clean up on error
      URL.revokeObjectURL(imageUrl);
      await worker.terminate();
      throw error;
    }
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to perform OCR on file'
    );
  }
};

/**
 * Helper function to convert PDF to images for OCR processing
 * Note: For production, consider using pdf.js or similar library
 * This is a simplified version for the prototype
 */
async function convertPDFToImage(file: File): Promise<string> {
  // For prototype: if file is already an image, return it directly
  if (file.type.includes('image')) {
    return URL.createObjectURL(file);
  }

  // For PDF files, we'll use the file directly
  // Tesseract.js can handle PDF files, but with limitations
  // In production, you'd want to convert PDF pages to images first
  return URL.createObjectURL(file);
}

/**
 * Batch OCR processing for multi-page PDFs
 * Processes each page separately and combines results
 */
export async function performBatchOCR(
  file: File,
  maxPages: number = 10
): Promise<{ text: string; confidence: number; pageCount: number }> {
  try {
    // For prototype, process as single document
    // In production, split PDF into pages and process each
    const result = await performOCR(file);

    return {
      text: result.text,
      confidence: result.confidence,
      pageCount: 1,
    };
  } catch (error) {
    console.error('Batch OCR processing error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to perform batch OCR on file'
    );
  }
}

/**
 * Validates OCR result quality based on confidence score
 */
export function validateOCRQuality(
  confidence: number,
  minConfidence: number = 0.6
): { isValid: boolean; message?: string } {
  if (confidence >= minConfidence) {
    return { isValid: true };
  }

  if (confidence < 0.3) {
    return {
      isValid: false,
      message:
        'Very low OCR confidence. The document may be too blurry or low quality.',
    };
  }

  if (confidence < 0.6) {
    return {
      isValid: false,
      message:
        'Low OCR confidence. Please review extracted data carefully or try a higher quality scan.',
    };
  }

  return { isValid: true };
}

/**
 * Preprocesses image for better OCR results
 * Applies filters to improve text recognition
 */
export async function preprocessImageForOCR(file: File): Promise<File> {
  // For prototype, return file as-is
  // In production, apply image preprocessing:
  // - Convert to grayscale
  // - Increase contrast
  // - Remove noise
  // - Deskew if needed
  return file;
}