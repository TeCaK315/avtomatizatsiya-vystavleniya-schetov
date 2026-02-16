import { NextRequest, NextResponse } from 'next/server';
import { SendInvoiceRequest, SendInvoiceResponse } from '@/types';
import { sendInvoiceEmail } from '@/lib/email-service';
import { StorageService } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SendInvoiceResponse>> {
  try {
    const invoiceId = params.id;
    
    // Parse request body
    let body: Partial<SendInvoiceRequest> = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional, continue with defaults
    }

    // Get invoice from storage
    const storage = new StorageService();
    const invoice = storage.getInvoice(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // Check if invoice has a client
    if (!invoice.client || !invoice.client.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice has no client email',
        },
        { status: 400 }
      );
    }

    // Determine recipient email
    const recipientEmail = body.recipientEmail || invoice.client.email;

    // Prepare email subject and message
    const subject = body.subject || `Invoice ${invoice.invoiceNumber} from AutoInvoice Pro`;
    const message = body.message || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.client.name},</p>
        <p>Please find attached your invoice for the amount of ${invoice.currency} ${invoice.total.toFixed(2)}.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${invoice.currency} ${invoice.total.toFixed(2)}</p>
        </div>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>AutoInvoice Pro Team</p>
      </div>
    `;

    // Send email with invoice
    const sentAt = await sendInvoiceEmail(invoice, recipientEmail, subject, message);

    // Update invoice status and sentAt timestamp
    storage.updateInvoice(invoiceId, {
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
      sentAt,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        sentAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send invoice',
      },
      { status: 500 }
    );
  }
}