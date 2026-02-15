import { NextRequest, NextResponse } from 'next/server';
import { ExtractPDFResponse } from '@/types';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import { performOCR } from '@/lib/ocr';
import { parseInvoiceData } from '@/lib/pdf-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      const response: ExtractPDFResponse = {
        success: false,
        error: 'No file provided',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      const response: ExtractPDFResponse = {
        success: false,
        error: 'Invalid file type. Only PDF files are supported.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      const response: ExtractPDFResponse = {
        success: false,
        error: 'File size exceeds 10MB limit',
      };
      return NextResponse.json(response, { status: 400 });
    }

    let extractedText = '';
    let confidence = 0;

    try {
      extractedText = await extractTextFromPDF(file);
      confidence = 0.95;
    } catch (pdfError) {
      console.log('PDF text extraction failed, attempting OCR...', pdfError);
      
      try {
        const ocrResult = await performOCR(file);
        extractedText = ocrResult.text;
        confidence = ocrResult.confidence;
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError);
        const response: ExtractPDFResponse = {
          success: false,
          error: 'Failed to extract text from PDF. The file may be corrupted or unsupported.',
        };
        return NextResponse.json(response, { status: 500 });
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      const response: ExtractPDFResponse = {
        success: false,
        error: 'No text could be extracted from the PDF',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const parsedData = parseInvoiceData(extractedText);

    const response: ExtractPDFResponse = {
      success: true,
      data: {
        ...parsedData,
        rawText: extractedText,
        confidence,
        items: parsedData.items || [],
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in extract route:', error);
    const response: ExtractPDFResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}