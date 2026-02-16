import pdf from 'pdf-parse';
import type { ExtractTextFromPdf } from '@/types';

/**
 * Extracts text content from a PDF file using pdf-parse library
 * @param file - PDF file to extract text from
 * @returns Promise resolving to extracted text content
 * @throws Error if PDF parsing fails
 */
export const extractTextFromPdf: ExtractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF using pdf-parse
    const data = await pdf(buffer, {
      // Maximize text extraction
      max: 0, // Parse all pages
    });

    // Return extracted text
    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    return extractedText;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    throw new Error('Failed to extract text from PDF: Unknown error');
  }
};