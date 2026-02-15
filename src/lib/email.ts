import { Resend } from 'resend';
import type { Invoice, SendInvoiceEmail, EmailOptions } from '@/types';

// Initialize Resend client with lazy loading
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Sends an invoice via email using Resend API
 * Includes formatted invoice details in HTML email
 */
export const sendInvoiceEmail: SendInvoiceEmail = async (invoice, options) => {
  try {
    const resend = getResendClient();

    // Get sender email from environment or use default
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@example.com';

    // Prepare email content
    const recipientEmail = options?.to || invoice.clientEmail;
    const subject =
      options?.subject || `Invoice ${invoice.invoiceNumber} from Your Company`;
    const htmlContent = options?.html || generateInvoiceEmailHTML(invoice);

    // Send email via Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      attachments: options?.attachments,
    });

    if (!result.data) {
      throw new Error('Failed to send email - no response data');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send invoice email',
    };
  }
};

/**
 * Generates HTML email content for invoice
 * Creates a professional, responsive email template
 */
function generateInvoiceEmailHTML(invoice: Invoice): string {
  const formattedIssueDate = new Date(invoice.issueDate).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const itemsHTML = invoice.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${item.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #111827;">Invoice</h1>
      <p style="margin: 0; font-size: 16px; color: #6b7280;">Invoice #${invoice.invoiceNumber}</p>
    </div>

    <!-- Invoice Details -->
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
        <div>
          <h2 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Bill To</h2>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${invoice.clientName}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${invoice.clientEmail}</p>
          ${invoice.clientAddress ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${invoice.clientAddress}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Invoice Date</h2>
          <p style="margin: 0; font-size: 16px; color: #111827;">${formattedIssueDate}</p>
          <h2 style="margin: 16px 0 8px 0; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Due Date</h2>
          <p style="margin: 0; font-size: 16px; color: #111827;">${formattedDueDate}</p>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 32px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Description</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Rate</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Subtotal</span>
          <span style="font-size: 14px; color: #111827;">$${invoice.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Tax (${invoice.taxRate}%)</span>
          <span style="font-size: 14px; color: #111827;">$${invoice.taxAmount.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <span style="font-size: 18px; font-weight: 700; color: #111827;">Total</span>
          <span style="font-size: 18px; font-weight: 700; color: #111827;">$${invoice.total.toFixed(2)}</span>
        </div>
      </div>

      ${invoice.notes ? `<div style="margin-top: 32px; padding: 16px; background-color: #f9fafb; border-radius: 6px;"><p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Notes:</strong> ${invoice.notes}</p></div>` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">Thank you for your business!</p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends a payment reminder email for overdue invoices
 */
export async function sendPaymentReminder(
  invoice: Invoice
): Promise<{ success: boolean; error?: string }> {
  const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber} is Overdue`;
  const html = generatePaymentReminderHTML(invoice);

  return sendInvoiceEmail(invoice, { subject, html });
}

/**
 * Generates HTML for payment reminder email
 */
function generatePaymentReminderHTML(invoice: Invoice): string {
  const daysOverdue = Math.floor(
    (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #991b1b;">Payment Reminder</h1>
        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue</p>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 16px; color: #111827;">Dear ${invoice.clientName},</p>
      
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> with a total amount of 
        <strong>$${invoice.total.toFixed(2)}</strong> was due on 
        <strong>${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> 
        and is now ${daysOverdue} days overdue.
      </p>

      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have already made the payment, please disregard this message. Otherwise, we kindly request that you process the payment at your earliest convenience.
      </p>

      <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Invoice Number</span>
          <span style="font-size: 14px; font-weight: 600; color: #111827;">${invoice.invoiceNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Amount Due</span>
          <span style="font-size: 14px; font-weight: 600; color: #111827;">$${invoice.total.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 14px; color: #6b7280;">Days Overdue</span>
          <span style="font-size: 14px; font-weight: 600; color: #ef4444;">${daysOverdue} days</span>
        </div>
      </div>

      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
        If you have any questions or concerns, please don't hesitate to contact us.
      </p>

      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        Best regards,<br>
        Your Company
      </p>
    </div>

    <div style="text-align: center; padding: 24px;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated reminder. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends invoice receipt confirmation after payment
 */
export async function sendPaymentConfirmation(
  invoice: Invoice
): Promise<{ success: boolean; error?: string }> {
  const subject = `Payment Received: Invoice ${invoice.invoiceNumber}`;
  const html = generatePaymentConfirmationHTML(invoice);

  return sendInvoiceEmail(invoice, { subject, html });
}

/**
 * Generates HTML for payment confirmation email
 */
function generatePaymentConfirmationHTML(invoice: Invoice): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #166534;">Payment Received</h1>
        <p style="margin: 0; font-size: 14px; color: #15803d;">Thank you for your payment!</p>
      </div>

      <p style="margin: 0 0 16px 0; font-size: 16px; color: #111827;">Dear ${invoice.clientName},</p>
      
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        We have received your payment for invoice <strong>${invoice.invoiceNumber}</strong>. 
        This email serves as confirmation that your payment of <strong>$${invoice.total.toFixed(2)}</strong> has been processed successfully.
      </p>

      <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Invoice Number</span>
          <span style="font-size: 14px; font-weight: 600; color: #111827;">${invoice.invoiceNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Amount Paid</span>
          <span style="font-size: 14px; font-weight: 600; color: #111827;">$${invoice.total.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 14px; color: #6b7280;">Payment Date</span>
          <span style="font-size: 14px; font-weight: 600; color: #111827;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
        Thank you for your business. We appreciate your prompt payment!
      </p>

      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        Best regards,<br>
        Your Company
      </p>
    </div>

    <div style="text-align: center; padding: 24px;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated confirmation. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}