'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  Trash2,
  Check,
  X,
  Mail,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import {
  Invoice,
  GetInvoiceResponse,
  SendInvoiceResponse,
  DeleteInvoiceResponse,
  UpdateInvoiceResponse,
  INVOICE_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
} from '@/types';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [showSendModal, setShowSendModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data: GetInvoiceResponse = await response.json();

      if (data.success && data.invoice) {
        setInvoice(data.invoice);
        setEmailRecipient(data.invoice.client.email);
        setEmailSubject(`Invoice ${data.invoice.invoiceNumber}`);
        setEmailMessage(
          `Dear ${data.invoice.client.name},\n\nPlease find attached invoice ${data.invoice.invoiceNumber} for ${data.invoice.currency} ${data.invoice.total.toFixed(2)}.\n\nPayment is due by ${new Date(data.invoice.dueDate).toLocaleDateString()}.\n\nThank you for your business.`
        );
      } else {
        setError(data.error || 'Invoice not found');
      }
    } catch (err) {
      setError('Failed to load invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;

    setSendingEmail(true);
    setError('');

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          recipientEmail: emailRecipient,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      const data: SendInvoiceResponse = await response.json();

      if (data.success) {
        setShowSendModal(false);
        fetchInvoice();
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (err) {
      setError('An error occurred while sending email');
      console.error(err);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'paid',
        }),
      });

      const data: UpdateInvoiceResponse = await response.json();

      if (data.success) {
        fetchInvoice();
      } else {
        setError(data.error || 'Failed to update invoice');
      }
    } catch (err) {
      setError('An error occurred while updating invoice');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      const data: DeleteInvoiceResponse = await response.json();

      if (data.success) {
        router.push('/invoices');
      } else {
        setError(data.error || 'Failed to delete invoice');
      }
    } catch (err) {
      setError('An error occurred while deleting invoice');
      console.error(err);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/invoices')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const statusColor = INVOICE_STATUS_COLORS[invoice.status];
  const statusLabel = INVOICE_STATUS_LABELS[invoice.status];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/invoices')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <p className="text-gray-400 mt-1">
                Created {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => router.push(`/invoices/${invoiceId}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </>
            )}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {invoice.status === 'sent' && invoice.status !== 'paid' && (
            <button
              onClick={handleMarkAsPaid}
              className="ml-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              Mark as Paid
            </button>
          )}
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Client Info */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Bill To
            </h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-white">{invoice.client.name}</p>
              <p className="text-gray-400">{invoice.client.email}</p>
              {invoice.client.phone && (
                <p className="text-gray-400">{invoice.client.phone}</p>
              )}
              {invoice.client.address && (
                <p className="text-gray-400">{invoice.client.address}</p>
              )}
              {invoice.client.taxId && (
                <p className="text-gray-400">Tax ID: {invoice.client.taxId}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Dates
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Issue Date</p>
                <p className="font-medium">
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Due Date</p>
                <p className="font-medium">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              {invoice.sentAt && (
                <div>
                  <p className="text-gray-400">Sent At</p>
                  <p className="font-medium">
                    {new Date(invoice.sentAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              {invoice.paidAt && (
                <div>
                  <p className="text-gray-400">Paid At</p>
                  <p className="font-medium text-green-400">
                    {new Date(invoice.paidAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              Amount
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-medium">
                  {invoice.currency} {invoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tax</span>
                <span className="font-medium">
                  {invoice.currency} {invoice.taxAmount.toFixed(2)}
                </span>
              </div>
              {(invoice.discountAmount > 0 || invoice.discountPercent > 0) && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span className="font-medium">
                    -{invoice.currency}{' '}
                    {(invoice.discountAmount > 0
                      ? invoice.discountAmount
                      : invoice.subtotal * (invoice.discountPercent / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-400">
                    {invoice.currency} {invoice.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Line Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Tax Rate
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800">
                    <td className="py-3 px-4 text-sm">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {invoice.currency} {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      {item.taxRate}%
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium">
                      {invoice.currency} {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3">Notes</h2>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>

      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Send Invoice</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Invoice</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete invoice {invoice.invoiceNumber}?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}