import { NextRequest, NextResponse } from 'next/server';
import { UploadPDFResponse } from '@/types';
import { extractDataFromPDF } from '@/lib/ocr';

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadPDFResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extractedData = await extractDataFromPDF(buffer);

    if (!extractedData || extractedData.confidence < 0.3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to extract data from PDF. The document may be too low quality or not contain invoice data.'
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        extractedData
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing PDF upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process PDF file'
      },
      { status: 500 }
    );
  }
}