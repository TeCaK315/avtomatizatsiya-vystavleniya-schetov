import { NextRequest, NextResponse } from 'next/server';
import { extractPDFData, normalizePDFData } from '@/lib/pdf-parser';
import { performOCR, extractDataFromOCR } from '@/lib/ocr-service';
import { UploadPDFResponse, ExtractedPDFData } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadPDFResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only PDF files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedData: ExtractedPDFData | null = null;
    let pdfParseError: Error | null = null;

    // Try PDF text extraction first
    try {
      const pdfResult = await extractPDFData(buffer);
      extractedData = normalizePDFData(pdfResult);
      
      // If confidence is too low or no items extracted, try OCR
      if (extractedData.confidence < 0.5 || extractedData.items.length === 0) {
        console.log('PDF extraction confidence low, attempting OCR fallback...');
        pdfParseError = new Error('Low confidence PDF extraction');
      }
    } catch (error) {
      console.error('PDF parsing failed:', error);
      pdfParseError = error instanceof Error ? error : new Error('PDF parsing failed');
    }

    // If PDF parsing failed or confidence is low, try OCR
    if (pdfParseError && extractedData && extractedData.confidence < 0.5) {
      try {
        console.log('Attempting OCR extraction...');
        const ocrResult = await performOCR(buffer);
        const ocrExtractedData = extractDataFromOCR(ocrResult);
        
        // Use OCR data if it has higher confidence or more items
        if (
          ocrExtractedData.confidence > extractedData.confidence ||
          ocrExtractedData.items.length > extractedData.items.length
        ) {
          extractedData = ocrExtractedData;
          console.log('OCR extraction successful, using OCR data');
        }
      } catch (ocrError) {
        console.error('OCR extraction failed:', ocrError);
        // Continue with PDF extraction data if available
        if (!extractedData) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to extract data from PDF using both text extraction and OCR',
            },
            { status: 500 }
          );
        }
      }
    }

    if (!extractedData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to extract data from PDF',
        },
        { status: 500 }
      );
    }

    // Validate extracted data has minimum required fields
    if (!extractedData.items || extractedData.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No invoice items found in PDF. Please check the file format.',
        },
        { status: 422 }
      );
    }

    // Clean up and validate extracted data
    const cleanedData: ExtractedPDFData = {
      invoiceNumber: extractedData.invoiceNumber?.trim() || undefined,
      clientName: extractedData.clientName?.trim() || undefined,
      clientEmail: extractedData.clientEmail?.trim() || undefined,
      clientAddress: extractedData.clientAddress?.trim() || undefined,
      issueDate: extractedData.issueDate || undefined,
      dueDate: extractedData.dueDate || undefined,
      items: extractedData.items.map((item) => ({
        description: item.description.trim(),
        quantity: Math.max(0, item.quantity),
        unitPrice: Math.max(0, item.unitPrice),
      })),
      subtotal: extractedData.subtotal && extractedData.subtotal > 0 ? extractedData.subtotal : undefined,
      taxAmount: extractedData.taxAmount && extractedData.taxAmount >= 0 ? extractedData.taxAmount : undefined,
      total: extractedData.total && extractedData.total > 0 ? extractedData.total : undefined,
      currency: extractedData.currency?.toUpperCase() || 'USD',
      rawText: extractedData.rawText,
      confidence: extractedData.confidence,
    };

    return NextResponse.json({
      success: true,
      data: cleanedData,
    });
  } catch (error) {
    console.error('Error processing PDF upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process PDF upload',
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};