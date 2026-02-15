import { EmailService as IEmailService, Invoice } from '@/types';

class EmailServiceImpl implements IEmailService {
  private apiEndpoint: string;

  constructor() {
    this.apiEndpoint = '/api/email/send';
  }

  async sendInvoice(
    invoice: Invoice,
    recipients: string[],
    subject: string,
    message: string
  ): Promise<boolean> {
    try {
      // Validate all recipients
      const invalidEmails = recipients.filter(email => !this.validateEmail(email));
      if (invalidEmails.length > 0) {
        console.error('Invalid email addresses:', invalidEmails);
        throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      }

      // Prepare email data
      const emailData = {
        to: recipients,
        subject: subject || this.generateDefaultSubject(invoice),
        html: this.generateEmailHTML(invoice, message),
        text: this.generateEmailText(invoice, message),
        attachments: [
          {
            filename: invoice.fileName,
            path: invoice.fileUrl,
            contentType: invoice.fileType
          }
        ]
      };

      // Send via API endpoint (which will use nodemailer on server side)
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional validation rules
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }

    const [localPart, domain] = parts;

    // Local part validation
    if (localPart.length === 0 || localPart.length > 64) {
      return false;
    }

    // Domain validation
    if (domain.length === 0 || domain.length > 255) {
      return false;
    }

    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return false;
    }

    // Check for valid TLD
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return false;
    }

    return true;
  }

  private generateDefaultSubject(invoice: Invoice): string {
    const invoiceNumber = invoice.extractedData?.invoiceNumber || 'N/A';
    const vendorName = invoice.extractedData?.vendorName || 'Vendor';
    return `Invoice ${invoiceNumber} from ${vendorName}`;
  }

  private generateEmailHTML(invoice: Invoice, customMessage: string): string {
    const data = invoice.extractedData;
    
    if (!data) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Invoice</h2>
          <p>${customMessage || 'Please find the attached invoice.'}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
        <div style="background-color: #f8f9fa; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Invoice ${data.invoiceNumber}</h2>
          <p style="color: #666; margin: 5px 0 0 0;">From ${data.vendorName}</p>
        </div>

        ${customMessage ? `
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #333;">${customMessage}</p>
          </div>
        ` : ''}

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
              <strong>Invoice Date:</strong>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
              ${new Date(data.invoiceDate).toLocaleDateString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
              <strong>Due Date:</strong>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
              ${new Date(data.dueDate).toLocaleDateString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
              <strong>Customer:</strong>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
              ${data.customerName}
            </td>
          </tr>
        </table>

        <h3 style="color: #333; margin-top: 30px;">Items</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.description}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">${data.currency} ${item.unitPrice.toFixed(2)}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">${data.currency} ${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table style="width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: right; padding: 5px;"><strong>Subtotal:</strong></td>
            <td style="text-align: right; padding: 5px; width: 150px;">${data.currency} ${data.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="text-align: right; padding: 5px;"><strong>Tax:</strong></td>
            <td style="text-align: right; padding: 5px;">${data.currency} ${data.taxAmount.toFixed(2)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="text-align: right; padding: 10px; font-size: 18px;"><strong>Total:</strong></td>
            <td style="text-align: right; padding: 10px; font-size: 18px;"><strong>${data.currency} ${data.totalAmount.toFixed(2)}</strong></td>
          </tr>
        </table>

        ${data.notes ? `
          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Notes</h4>
            <p style="margin: 0; color: #666;">${data.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated email. Please do not reply.
          </p>
          <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
            For questions, please contact ${data.vendorEmail || data.vendorName}.
          </p>
        </div>
      </div>
    `;
  }

  private generateEmailText(invoice: Invoice, customMessage: string): string {
    const data = invoice.extractedData;
    
    if (!data) {
      return `
Invoice

${customMessage || 'Please find the attached invoice.'}

This is an automated email. Please do not reply.
      `.trim();
    }

    return `
Invoice ${data.invoiceNumber}
From: ${data.vendorName}

${customMessage ? `${customMessage}\n\n` : ''}

Invoice Details:
- Invoice Date: ${new Date(data.invoiceDate).toLocaleDateString()}
- Due Date: ${new Date(data.dueDate).toLocaleDateString()}
- Customer: ${data.customerName}

Items:
${data.items.map(item => 
  `${item.description} - Qty: ${item.quantity} x ${data.currency} ${item.unitPrice.toFixed(2)} = ${data.currency} ${item.total.toFixed(2)}`
).join('\n')}

Summary:
Subtotal: ${data.currency} ${data.subtotal.toFixed(2)}
Tax: ${data.currency} ${data.taxAmount.toFixed(2)}
Total: ${data.currency} ${data.totalAmount.toFixed(2)}

${data.notes ? `\nNotes:\n${data.notes}\n` : ''}

This is an automated email. Please do not reply.
For questions, please contact ${data.vendorEmail || data.vendorName}.
    `.trim();
  }
}

export const EmailService = new EmailServiceImpl();