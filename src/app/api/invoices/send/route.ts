import { NextRequest, NextResponse } from 'next/server';
import { SendInvoiceRequest, SendInvoiceResponse } from '@/types';
import { storageService } from '@/lib/storage';
import { sendInvoiceEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SendInvoiceRequest;

    const { invoiceId, recipientEmail, subject, message } = body;

    if (!invoiceId) {
      const response: SendInvoiceResponse = {
        success: false,
        error: 'Invoice ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const invoice = storageService.getInvoice(invoiceId);

    if (!invoice) {
      const response: SendInvoiceResponse = {
        success: false,
        error: 'Invoice not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const targetEmail = recipientEmail || invoice.clientEmail;

    if (!targetEmail) {
      const response: SendInvoiceResponse = {
        success: false,
        error: 'Recipient email is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      const response: SendInvoiceResponse = {
        success: false,
        error: 'Invalid email address',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const emailOptions = {
      to: targetEmail,
      subject: subject || `Invoice ${invoice.invoiceNumber} from ${invoice.clientName}`,
      message: message,
    };

    const emailResult = await sendInvoiceEmail(invoice, emailOptions);

    if (!emailResult.success) {
      const response: SendInvoiceResponse = {
        success: false,
        error: emailResult.error || 'Failed to send email',
      };
      return NextResponse.json(response, { status: 500 });
    }

    const sentAt = new Date().toISOString();

    if (invoice.status === 'draft') {
      storageService.updateInvoice(invoiceId, {
        status: 'sent',
      });
    }

    const response: SendInvoiceResponse = {
      success: true,
      sentAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in send invoice route:', error);
    const response: SendInvoiceResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
    return NextResponse.json(response, { status: 500 });
  }
}