import { NextRequest, NextResponse } from 'next/server';
import { SendInvoiceRequest, SendInvoiceResponse } from '@/types';
import { StorageService } from '@/lib/storage';
import { sendInvoiceEmail } from '@/lib/email';
import { validateEmail } from '@/lib/validators';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SendInvoiceResponse>> {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json() as SendInvoiceRequest;
    const { recipientEmail, subject, message } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    if (!validateEmail(recipientEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const storage = new StorageService();
    const invoice = storage.getInvoice(id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const emailSent = await sendInvoiceEmail(
      invoice,
      recipientEmail,
      subject,
      message
    );

    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    const sentAt = new Date().toISOString();

    const updatedInvoice = storage.updateInvoice(id, {
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
      updatedAt: sentAt
    });

    if (!updatedInvoice) {
      return NextResponse.json(
        { success: false, error: 'Failed to update invoice status' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        sentAt
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send invoice'
      },
      { status: 500 }
    );
  }
}