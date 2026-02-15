import { NextRequest, NextResponse } from 'next/server';
import { UploadInvoiceResponse, FileType } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json<UploadInvoiceResponse>(
        {
          success: false,
          fileUrl: '',
          fileName: '',
          fileType: FileType.PDF,
          message: 'No file provided'
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [FileType.PDF, FileType.JPEG, FileType.PNG];
    if (!allowedTypes.includes(file.type as FileType)) {
      return NextResponse.json<UploadInvoiceResponse>(
        {
          success: false,
          fileUrl: '',
          fileName: '',
          fileType: FileType.PDF,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json<UploadInvoiceResponse>(
        {
          success: false,
          fileUrl: '',
          fileName: '',
          fileType: file.type as FileType,
          message: 'File size exceeds 10MB limit'
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const uniqueFileName = `invoice_${timestamp}_${randomString}.${fileExtension}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, uniqueFileName);
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/${uniqueFileName}`;

    return NextResponse.json<UploadInvoiceResponse>(
      {
        success: true,
        fileUrl,
        fileName: file.name,
        fileType: file.type as FileType,
        message: 'File uploaded successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json<UploadInvoiceResponse>(
      {
        success: false,
        fileUrl: '',
        fileName: '',
        fileType: FileType.PDF,
        message: error instanceof Error ? error.message : 'Failed to upload file'
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};