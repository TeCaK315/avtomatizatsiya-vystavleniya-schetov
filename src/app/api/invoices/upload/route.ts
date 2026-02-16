import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { UploadInvoiceResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
        } as UploadInvoiceResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only PDF files are allowed',
        } as UploadInvoiceResponse,
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size exceeds 10MB limit',
        } as UploadInvoiceResponse,
        { status: 400 }
      );
    }

    // Generate unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();
    const savedFileName = `${fileId}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, savedFileName);
    await writeFile(filePath, buffer);

    return NextResponse.json(
      {
        success: true,
        fileId,
        fileName,
        fileSize: file.size,
        message: 'File uploaded successfully',
      } as UploadInvoiceResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload file',
      } as UploadInvoiceResponse,
      { status: 500 }
    );
  }
}