import { NextRequest, NextResponse } from 'next/server';
import { SendInvoiceRequest, SendInvoiceResponse, Invoice } from '@/types';
import { StorageService } from '@/lib/storage';
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body: SendInvoiceRequest = await request.json();
    const { invoiceId, recipients, subject, message, attachPDF } = body;

    // Validate request
    if (!invoiceId || !recipients || recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice ID and at least one recipient are required'
        } as SendInvoiceResponse,
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailService = EmailService;
    const invalidEmails = recipients.filter(email => !emailService.validateEmail(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid email addresses: ${invalidEmails.join(', ')}`
        } as SendInvoiceResponse,
        { status: 400 }
      );
    }

    // Get invoice from storage
    const storageService = StorageService;
    const invoice = storageService.getInvoice(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice not found'
        } as SendInvoiceResponse,
        { status: 404 }
      );
    }

    // Check if invoice has extracted data
    if (!invoice.extractedData) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice data has not been extracted yet'
        } as SendInvoiceResponse,
        { status: 400 }
      );
    }

    // Prepare email subject and message
    const emailSubject = subject || `Invoice ${invoice.extractedData.invoiceNumber} from ${invoice.extractedData.vendorName}`;
    const emailMessage = message || `
      Dear ${invoice.extractedData.customerName},

      Please find attached invoice ${invoice.extractedData.invoiceNumber}.

      Invoice Details:
      - Invoice Number: ${invoice.extractedData.invoiceNumber}
      - Invoice Date: ${new Date(invoice.extractedData.invoiceDate).toLocaleDateString()}
      - Due Date: ${new Date(invoice.extractedData.dueDate).toLocaleDateString()}
      - Total Amount: ${invoice.extractedData.currency} ${invoice.extractedData.totalAmount.toFixed(2)}

      ${invoice.extractedData.notes ? `Notes: ${invoice.extractedData.notes}` : ''}

      Best regards,
      ${invoice.extractedData.vendorName}
    `.trim();

    // Send email
    const sendSuccess = await emailService.sendInvoice(
      invoice,
      recipients,
      emailSubject,
      emailMessage
    );

    if (!sendSuccess) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send invoice email'
        } as SendInvoiceResponse,
        { status: 500 }
      );
    }

    // Update invoice status
    const sentAt = new Date().toISOString();
    storageService.updateInvoice(invoiceId, {
      status: 'sent' as any,
      sentAt,
      sentTo: recipients
    });

    return NextResponse.json(
      {
        success: true,
        sentTo: recipients,
        sentAt,
        message: 'Invoice sent successfully'
      } as SendInvoiceResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      } as SendInvoiceResponse,
      { status: 500 }
    );
  }
}