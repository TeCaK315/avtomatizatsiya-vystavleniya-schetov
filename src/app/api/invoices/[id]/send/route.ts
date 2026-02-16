import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { SendInvoiceRequest, SendInvoiceResponse, Invoice } from '@/types';
import { storageService } from '@/lib/storage';
import { validateEmail } from '@/lib/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SendInvoiceResponse>> {
  try {
    const invoiceId = params.id;

    // Get invoice from storage
    const invoice = storageService.getInvoice(invoiceId);
    
    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          sentAt: new Date().toISOString(),
          error: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // Parse request body
    let body: Partial<SendInvoiceRequest>;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          sentAt: new Date().toISOString(),
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }

    const recipientEmail = body.recipientEmail || invoice.clientEmail;
    const subject = body.subject || `Invoice ${invoice.invoiceNumber} from AutoBillPro`;
    const customMessage = body.message || '';

    // Validate recipient email
    if (!recipientEmail || !validateEmail(recipientEmail)) {
      return NextResponse.json(
        {
          success: false,
          sentAt: new Date().toISOString(),
          error: 'Invalid recipient email address',
        },
        { status: 400 }
      );
    }

    // Check required environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);

    if (!emailUser || !emailPassword) {
      return NextResponse.json(
        {
          success: false,
          sentAt: new Date().toISOString(),
          error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.',
        },
        { status: 500 }
      );
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return NextResponse.json(
        {
          success: false,
          sentAt: new Date().toISOString(),
          error: 'Email service configuration error. Please check your email credentials.',
        },
        { status: 500 }
      );
    }

    // Generate email HTML content
    const emailHtml = generateInvoiceEmailHtml(invoice, customMessage);
    const emailText = generateInvoiceEmailText(invoice, customMessage);

    // Send email
    try {
      await transporter.sendMail({
        from: `"AutoBillPro" <${emailUser}>`,
        to: recipientEmail,
        subject: subject,
        text: emailText,
        html: emailHtml,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      return NextResponse.json(
        {
          success: false,
          sentAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Failed to send email',
        },
        { status: 500 }
      );
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      storageService.updateInvoice(invoiceId, {
        status: 'sent',
      });
    }

    const sentAt = new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        sentAt,
        message: `Invoice sent successfully to ${recipientEmail}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in send invoice API:', error);
    return NextResponse.json(
      {
        success: false,
        sentAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML email content
function generateInvoiceEmailHtml(invoice: Invoice, customMessage: string): string {
  const itemsHtml = invoice.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
    <h1 style="color: #1f2937; margin-top: 0;">Invoice ${invoice.invoiceNumber}</h1>
    
    ${customMessage ? `<p style="background-color: #fff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">${customMessage}</p>` : ''}
    
    <div style="background-color: #fff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="color: #374151; font-size: 18px; margin-top: 0;">Invoice Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
          <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Issue Date:</strong></td>
          <td style="padding: 8px 0;">${new Date(invoice.issueDate).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Due Date:</strong></td>
          <td style="padding: 8px 0;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Client:</strong></td>
          <td style="padding: 8px 0;">${invoice.clientName}</td>
        </tr>
        ${invoice.clientAddress ? `<tr><td style="padding: 8px 0;"><strong>Address:</strong></td><td style="padding: 8px 0;">${invoice.clientAddress}</td></tr>` : ''}
      </table>
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="color: #374151; font-size: 18px; margin-top: 0;">Items</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Unit Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <div style="background-color: #fff; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; max-width: 300px; margin-left: auto;">
        <tr>
          <td style="padding: 8px 0;"><strong>Subtotal:</strong></td>
          <td style="padding: 8px 0; text-align: right;">$${invoice.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Tax (${invoice.taxRate}%):</strong></td>
          <td style="padding: 8px 0; text-align: right;">$${invoice.taxAmount.toFixed(2)}</td>
        </tr>
        <tr style="border-top: 2px solid #e5e7eb;">
          <td style="padding: 12px 0; font-size: 18px;"><strong>Total:</strong></td>
          <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #3b82f6;"><strong>$${invoice.total.toFixed(2)}</strong></td>
        </tr>
      </table>
    </div>

    ${invoice.notes ? `<div style="background-color: #fff; padding: 20px; border-radius: 6px; margin: 20px 0;"><h3 style="color: #374151; font-size: 16px; margin-top: 0;">Notes</h3><p style="margin: 0;">${invoice.notes}</p></div>` : ''}

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
      <p>Thank you for your business!</p>
      <p style="margin: 5px 0;">This invoice was generated by AutoBillPro</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function to generate plain text email content
function generateInvoiceEmailText(invoice: Invoice, customMessage: string): string {
  const itemsText = invoice.items
    .map(
      (item) =>
        `${item.description} - Qty: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.total.toFixed(2)}`
    )
    .join('\n');

  return `
Invoice ${invoice.invoiceNumber}

${customMessage ? `${customMessage}\n\n` : ''}

INVOICE DETAILS
---------------
Invoice Number: ${invoice.invoiceNumber}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Client: ${invoice.clientName}
${invoice.clientAddress ? `Address: ${invoice.clientAddress}` : ''}

ITEMS
-----
${itemsText}

SUMMARY
-------
Subtotal: $${invoice.subtotal.toFixed(2)}
Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}
Total: $${invoice.total.toFixed(2)}

${invoice.notes ? `NOTES\n-----\n${invoice.notes}\n\n` : ''}

Thank you for your business!
This invoice was generated by AutoBillPro
  `.trim();
}