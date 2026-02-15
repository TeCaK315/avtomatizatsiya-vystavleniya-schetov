'use client';

import React from 'react';
import { X, Send, Download, Printer } from 'lucide-react';
import { InvoicePreviewProps, Invoice } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function InvoicePreview({
  invoice,
  isOpen,
  onClose,
  onSend,
  onDownload,
}: InvoicePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior - create HTML and convert to PDF-like format
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintableHTML(invoice));
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Invoice Preview">
      <div className="flex flex-col h-full">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Badge status={invoice.status} />
            <span className="text-sm text-gray-400">
              Created {formatDate(invoice.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onSend && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <Button
                variant="primary"
                size="sm"
                onClick={onSend}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Invoice
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white text-gray-900 p-8 rounded-lg" id="invoice-content">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <p className="text-lg text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Issue Date</p>
                <p className="font-semibold">{formatDate(invoice.issueDate)}</p>
                <p className="text-sm text-gray-600 mt-3 mb-1">Due Date</p>
                <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            {/* Client Information */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                Bill To
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-lg mb-1">{invoice.clientName}</p>
                <p className="text-gray-600">{invoice.clientEmail}</p>
                {invoice.clientAddress && (
                  <p className="text-gray-600 mt-2 whitespace-pre-line">
                    {invoice.clientAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="text-left py-3 px-2 font-semibold text-sm uppercase">
                      Description
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm uppercase w-24">
                      Qty
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm uppercase w-32">
                      Unit Price
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-sm uppercase w-32">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-4 px-2 text-gray-700">{item.description}</td>
                      <td className="py-4 px-2 text-right text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-2 text-right text-gray-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-4 px-2 text-right font-semibold">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                  <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900 mt-2">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                  Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function generatePrintableHTML(invoice: Invoice): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #1f2937;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .invoice-number {
          font-size: 18px;
          color: #6b7280;
        }
        .date-info {
          text-align: right;
        }
        .date-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .date-value {
          font-weight: 600;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .client-box {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 32px;
        }
        .client-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }
        thead {
          border-bottom: 2px solid #1f2937;
        }
        th {
          text-align: left;
          padding: 12px 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        th.right {
          text-align: right;
        }
        td {
          padding: 16px 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        td.right {
          text-align: right;
        }
        .totals {
          width: 320px;
          margin-left: auto;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-final {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 2px solid #1f2937;
          margin-top: 8px;
          font-size: 18px;
          font-weight: bold;
        }
        .notes {
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
          margin-top: 48px;
        }
        .footer {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">INVOICE</div>
          <div class="invoice-number">#${invoice.invoiceNumber}</div>
        </div>
        <div class="date-info">
          <div class="date-label">Issue Date</div>
          <div class="date-value">${formatDate(invoice.issueDate)}</div>
          <div class="date-label">Due Date</div>
          <div class="date-value">${formatDate(invoice.dueDate)}</div>
        </div>
      </div>

      <div class="section-title">Bill To</div>
      <div class="client-box">
        <div class="client-name">${invoice.clientName}</div>
        <div>${invoice.clientEmail}</div>
        ${invoice.clientAddress ? `<div style="margin-top: 8px;">${invoice.clientAddress.replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="right" style="width: 80px;">Qty</th>
            <th class="right" style="width: 120px;">Unit Price</th>
            <th class="right" style="width: 120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="right">${item.quantity}</td>
              <td class="right">${formatCurrency(item.unitPrice)}</td>
              <td class="right" style="font-weight: 600;">${formatCurrency(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span style="font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>Tax (${invoice.taxRate}%)</span>
          <span style="font-weight: 600;">${formatCurrency(invoice.taxAmount)}</span>
        </div>
        <div class="total-final">
          <span>Total</span>
          <span>${formatCurrency(invoice.total)}</span>
        </div>
      </div>

      ${invoice.notes ? `
        <div class="notes">
          <div class="section-title">Notes</div>
          <div>${invoice.notes.replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;
}