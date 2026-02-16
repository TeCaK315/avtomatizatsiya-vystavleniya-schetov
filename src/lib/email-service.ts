import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Invoice, SendEmailOptions, EmailAttachment } from '@/types';

const resend = new Resend(process.env.RESEND_API_KEY);

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    flex: 1,
    color: '#333',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colDescription: {
    flex: 3,
  },
  colQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  colTax: {
    flex: 1,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 12,
    color: '#555',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#333',
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  notes: {
    fontSize: 10,
    color: '#666',
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
});

// PDF Document Component
const InvoicePDF = ({ invoice }: { invoice: Invoice }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'sent':
        return '#3b82f6';
      case 'overdue':
        return '#ef4444';
      case 'draft':
        return '#6b7280';
      case 'cancelled':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
            <Text style={{ color: '#fff' }}>{invoice.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Due Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{invoice.client.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{invoice.client.email}</Text>
          </View>
          {invoice.client.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{invoice.client.phone}</Text>
            </View>
          )}
          {invoice.client.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{invoice.client.address}</Text>
            </View>
          )}
          {invoice.client.taxId && (
            <View style={styles.row}>
              <Text style={styles.label}>Tax ID:</Text>
              <Text style={styles.value}>{invoice.client.taxId}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQuantity}>Qty</Text>
            <Text style={styles.colPrice}>Price</Text>
            <Text style={styles.colTax}>Tax %</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colTax}>{item.taxRate}%</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount {invoice.discountPercent > 0 ? `(${invoice.discountPercent}%)` : ''}:
              </Text>
              <Text style={styles.totalValue}>-{formatCurrency(invoice.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.footer}>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text style={styles.notes}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.notes}>
            Thank you for your business. Payment is due by {formatDate(invoice.dueDate)}.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate PDF buffer from invoice data
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  try {
    const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={invoice} />);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
}

/**
 * Send invoice email with PDF attachment
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  options?: {
    recipientEmail?: string;
    subject?: string;
    message?: string;
  }
): Promise<{ success: boolean; sentAt?: string; error?: string }> {
  try {
    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Validate sender email
    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error('RESEND_FROM_EMAIL is not configured');
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Prepare email content
    const recipientEmail = options?.recipientEmail || invoice.client.email;
    const subject = options?.subject || `Invoice ${invoice.invoiceNumber} from AutoInvoice Pro`;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency || 'USD',
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .invoice-number {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .details {
              background-color: #fff;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
            }
            .value {
              color: #111827;
            }
            .total {
              font-size: 20px;
              font-weight: bold;
              color: #059669;
            }
            .message {
              background-color: #f0f9ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin-bottom: 20px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <p>Dear ${invoice.client.name},</p>
            <p>Please find attached your invoice. The details are summarized below:</p>
          </div>

          ${options?.message ? `<div class="message">${options.message}</div>` : ''}

          <div class="details">
            <div class="detail-row">
              <span class="label">Issue Date:</span>
              <span class="value">${formatDate(invoice.issueDate)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Due Date:</span>
              <span class="value">${formatDate(invoice.dueDate)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Subtotal:</span>
              <span class="value">${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Tax:</span>
              <span class="value">${formatCurrency(invoice.taxAmount)}</span>
            </div>
            ${
              invoice.discountAmount > 0
                ? `
            <div class="detail-row">
              <span class="label">Discount:</span>
              <span class="value">-${formatCurrency(invoice.discountAmount)}</span>
            </div>
            `
                : ''
            }
            <div class="detail-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #e5e7eb;">
              <span class="label">Total Amount:</span>
              <span class="total">${formatCurrency(invoice.total)}</span>
            </div>
          </div>

          <p>The complete invoice is attached as a PDF document. Please review it and process payment by the due date.</p>

          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p style="font-size: 12px; color: #9ca3af;">
              This is an automated email from AutoInvoice Pro. Please do not reply directly to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    // Prepare attachment
    const attachment: EmailAttachment = {
      filename: `${invoice.invoiceNumber}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    };

    // Send email via Resend
    const emailOptions: SendEmailOptions = {
      to: recipientEmail,
      subject,
      html: htmlContent,
      attachments: [attachment],
    };

    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.html,
      attachments: emailOptions.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
    });

    if (!response.data?.id) {
      throw new Error('Failed to send email via Resend');
    }

    const sentAt = new Date().toISOString();

    return {
      success: true,
      sentAt,
    };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invoice email',
    };
  }
}