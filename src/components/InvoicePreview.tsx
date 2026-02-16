'use client';

import React from 'react';
import { InvoicePreviewProps } from '@/types';
import { Edit, Send, Download, Calendar, DollarSign, FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function InvoicePreview({
  invoice,
  onEdit,
  onSend,
  onDownload,
}: InvoicePreviewProps) {
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
      currency: invoice.currency || 'USD',
    }).format(amount);
  };

  const isOverdue =
    invoice.status !== 'paid' &&
    invoice.status !== 'cancelled' &&
    new Date(invoice.dueDate) < new Date();

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header with Actions */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Invoice Preview</h2>
            <StatusBadge status={invoice.status} size="md" />
            {isOverdue && invoice.status !== 'overdue' && (
              <span className="px-3 py-1 bg-red-600/20 text-red-400 text-sm font-medium rounded-full">
                Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
            {onSend && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={onSend}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Send className="h-4 w-4" />
                Send Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="p-8">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">INVOICE</h1>
            <div className="text-gray-400">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4" />
                <span className="font-mono">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Issued: {formatDate(invoice.issueDate)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Total Amount</div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(invoice.total)}
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Bill To
            </h3>
            <div className="text-white">
              <div className="font-semibold text-lg mb-1">{invoice.client.name}</div>
              <div className="text-gray-400 text-sm space-y-1">
                <div>{invoice.client.email}</div>
                {invoice.client.phone && <div>{invoice.client.phone}</div>}
                {invoice.client.address && (
                  <div className="whitespace-pre-line">{invoice.client.address}</div>
                )}
                {invoice.client.taxId && (
                  <div className="mt-2">Tax ID: {invoice.client.taxId}</div>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
              Payment Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Issue Date:</span>
                <span className="text-white">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Due Date:</span>
                <span className={`font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Currency:</span>
                <span className="text-white">{invoice.currency}</span>
              </div>
              {invoice.sentAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Sent:</span>
                  <span className="text-white">{formatDate(invoice.sentAt)}</span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Paid:</span>
                  <span className="text-green-400">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">
            Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400 uppercase">
                    Quantity
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400 uppercase">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400 uppercase">
                    Tax Rate
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/50">
                    <td className="py-4 px-4 text-white">{item.description}</td>
                    <td className="py-4 px-4 text-right text-gray-300">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-300">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-300">
                      {item.taxRate}%
                    </td>
                    <td className="py-4 px-4 text-right text-white font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tax:</span>
              <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>
                  Discount
                  {invoice.discountPercent > 0 && ` (${invoice.discountPercent}%)`}:
                </span>
                <span className="font-medium">
                  -{formatCurrency(invoice.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-white pt-3 border-t border-gray-700">
              <span>Total:</span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">
              Notes
            </h3>
            <p className="text-gray-300 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">
            Invoice created on {formatDate(invoice.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}