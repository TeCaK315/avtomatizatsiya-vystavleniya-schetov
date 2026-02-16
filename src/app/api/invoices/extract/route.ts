import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import type { ExtractDataRequest, ExtractDataResponse } from '@/types';
import { extractTextFromPdf } from '@/lib/pdfExtractor';
import { parseInvoiceData } from '@/lib/dataParser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExtractDataRequest;
    const { fileId, fileName } = body;

    if (!fileId || !fileName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing fileId or fileName',
          data: {
            items: [],
            rawText: '',
            confidence: 'low' as const,
          },
        } as ExtractDataResponse,
        { status: 400 }
      );
    }

    // Construct file path
    const fileExtension = fileName.split('.').pop();
    const savedFileName = `${fileId}.${fileExtension}`;
    const filePath = join(process.cwd(), 'uploads', savedFileName);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
          data: {
            items: [],
            rawText: '',
            confidence: 'low' as const,
          },
        } as ExtractDataResponse,
        { status: 404 }
      );
    }

    // Read file as buffer
    const fileBuffer = await readFile(filePath);
    const file = new File([fileBuffer], fileName, { type: 'application/pdf' });

    // Extract text from PDF
    const extractedText = await extractTextFromPdf(file);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No text could be extracted from PDF',
          data: {
            items: [],
            rawText: '',
            confidence: 'low' as const,
          },
        } as ExtractDataResponse,
        { status: 400 }
      );
    }

    // Parse extracted text into structured data
    const parsedData = parseInvoiceData(extractedText);

    return NextResponse.json(
      {
        success: true,
        data: parsedData,
        message: 'Data extracted successfully',
      } as ExtractDataResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract data',
        data: {
          items: [],
          rawText: '',
          confidence: 'low' as const,
        },
      } as ExtractDataResponse,
      { status: 500 }
    );
  }
}