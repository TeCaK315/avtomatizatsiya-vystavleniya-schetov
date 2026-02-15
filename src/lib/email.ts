import nodemailer from 'nodemailer';
import type { Invoice } from '@/types';

/**
 * Get email service configuration from environment variables
 */
function getEmailConfig() {
  // Check if all required env vars are present
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.warn('Email service not configured. Missing environment variables.');
    return null;
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: port === '465', // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    from,
  };
}

/**
 * Create email transporter (lazy initialization)
 */
function createTransporter() {
  const config = getEmailConfig();
  
  if (!config) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

/**
 * Format invoice data as HTML email body
 */
function formatInvoiceEmailHTML(invoice: Invoice): string {
  const itemsHTML = invoice.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.total.toFixed(2)}</td>
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
          <h1 style="color: #1f2937; margin-bottom: 10px;">Invoice ${invoice.invoiceNumber}</h1>
          <p style="color: #6b7280; margin-bottom: 30px;">Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <h3 style="color: #1f2937; margin-bottom: 10px;">From:</h3>
              <p style="margin: 5px 0;"><strong>${invoice.from.name}</strong></p>
              <p style="margin: 5px 0; color: #6b7280;">${invoice.from.email}</p>
              ${invoice.from.phone ? `<p style="margin: 5px 0; color: #6b7280;">${invoice.from.phone}</p>` : ''}
              ${invoice.from.address ? `
                <p style="margin: 5px 0; color: #6b7280;">
                  ${invoice.from.address.street}<br>
                  ${invoice.from.address.city}, ${invoice.from.address.state} ${invoice.from.address.zipCode}<br>
                  ${invoice.from.address.country}
                </p>
              ` : ''}
            </div>
            
            <div>
              <h3 style="color: #1f2937; margin-bottom: 10px;">Bill To:</h3>
              <p style="margin: 5px 0;"><strong>${invoice.to.name}</strong></p>
              <p style="margin: 5px 0; color: #6b7280;">${invoice.to.email}</p>
              ${invoice.to.phone ? `<p style="margin: 5px 0; color: #6b7280;">${invoice.to.phone}</p>` : ''}
              ${invoice.to.address ? `
                <p style="margin: 5px 0; color: #6b7280;">
                  ${invoice.to.address.street}<br>
                  ${invoice.to.address.city}, ${invoice.to.address.state} ${invoice.to.address.zipCode}<br>
                  ${invoice.to.address.country}
                </p>
              ` : ''}
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #1f2937; color: white;">
                <th style="padding: 12px; text-align: left;">Description</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Unit Price</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-bottom: 30px;">
            <p style="margin: 8px 0; color: #6b7280;">Subtotal: <strong>$${invoice.subtotal.toFixed(2)}</strong></p>
            <p style="margin: 8px 0; color: #6b7280;">Tax (${invoice.taxRate}%): <strong>$${invoice.taxAmount.toFixed(2)}</strong></p>
            <p style="margin: 8px 0; font-size: 1.25rem; color: #1f2937;">Total: <strong>$${invoice.total.toFixed(2)}</strong></p>
            <p style="margin: 8px 0; color: #6b7280;">Due Date: <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong></p>
          </div>
          
          ${invoice.notes ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-bottom: 10px;">Notes:</h3>
              <p style="color: #6b7280;">${invoice.notes}</p>
            </div>
          ` : ''}
          
          ${invoice.terms ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-bottom: 10px;">Terms:</h3>
              <p style="color: #6b7280;">${invoice.terms}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280;">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format invoice data as plain text email body
 */
function formatInvoiceEmailText(invoice: Invoice): string {
  const itemsText = invoice.items
    .map(
      (item) =>
        `${item.description} - Qty: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.total.toFixed(2)}`
    )
    .join('\n');

  let text = `
INVOICE ${invoice.invoiceNumber}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}

FROM:
${invoice.from.name}
${invoice.from.email}
${invoice.from.phone || ''}
`;

  if (invoice.from.address) {
    text += `${invoice.from.address.street}
${invoice.from.address.city}, ${invoice.from.address.state} ${invoice.from.address.zipCode}
${invoice.from.address.country}
`;
  }

  text += `
BILL TO:
${invoice.to.name}
${invoice.to.email}
${invoice.to.phone || ''}
`;

  if (invoice.to.address) {
    text += `${invoice.to.address.street}
${invoice.to.address.city}, ${invoice.to.address.state} ${invoice.to.address.zipCode}
${invoice.to.address.country}
`;
  }

  text += `
ITEMS:
${itemsText}

SUMMARY:
Subtotal: $${invoice.subtotal.toFixed(2)}
Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}
Total: $${invoice.total.toFixed(2)}

Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
`;

  if (invoice.notes) {
    text += `\nNOTES:\n${invoice.notes}\n`;
  }

  if (invoice.terms) {
    text += `\nTERMS:\n${invoice.terms}\n`;
  }

  text += '\nThank you for your business!';

  return text;
}

/**
 * Send invoice via email
 * For prototype, this is a mock implementation that logs to console
 * In production, this would use nodemailer to send actual emails
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  recipientEmail: string,
  subject?: string,
  message?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    // If email is not configured, use mock mode (log to console)
    if (!transporter) {
      console.log('=== MOCK EMAIL SEND ===');
      console.log('To:', recipientEmail);
      console.log('Subject:', subject || `Invoice ${invoice.invoiceNumber}`);
      console.log('Invoice:', invoice.invoiceNumber);
      console.log('Amount:', `$${invoice.total.toFixed(2)}`);
      console.log('Due Date:', new Date(invoice.dueDate).toLocaleDateString());
      if (message) {
        console.log('Custom Message:', message);
      }
      console.log('======================');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    }

    // Real email sending
    const config = getEmailConfig();
    if (!config) {
      throw new Error('Email configuration not available');
    }

    const emailSubject = subject || `Invoice ${invoice.invoiceNumber} from ${invoice.from.name}`;
    const htmlBody = formatInvoiceEmailHTML(invoice);
    const textBody = formatInvoiceEmailText(invoice);

    const customMessage = message
      ? `<div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
           <p style="margin: 0; color: #1e40af;">${message}</p>
         </div>`
      : '';

    await transporter.sendMail({
      from: config.from,
      to: recipientEmail,
      subject: emailSubject,
      text: message ? `${message}\n\n${textBody}` : textBody,
      html: customMessage + htmlBody,
    });

    console.log(`Invoice ${invoice.invoiceNumber} sent successfully to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return false;
  }
}