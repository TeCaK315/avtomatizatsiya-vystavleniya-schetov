'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Send,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
} from 'lucide-react';
import { Invoice, InvoiceStatus, UpdateInvoiceRequest } from '@/types';
import InvoiceForm from '@/components/InvoiceForm';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadInvoice = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      const data = await response.json();

      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        setError(data.error || 'Invoice not found');
      }
    } catch (err) {
      setError('Failed to load invoice');
      console.error('Load invoice error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const handleUpdateInvoice = async (data: UpdateInvoiceRequest) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        setIsEditing(false);
        await loadInvoice();
      } else {
        alert(result.error || 'Failed to update invoice');
      }
    } catch (err) {
      alert('Failed to update invoice');
      console.error('Update error:', err);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;

    const email = prompt('Enter recipient email:', invoice.to.email);
    if (!email) return;

    try {
      setIsSending(true);
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email }),
      });
      const data = await response.json();

      if (data.success) {
        alert('Invoice sent successfully!');
        await loadInvoice();
      } else {
        alert(data.error || 'Failed to send invoice');
      }
    } catch (err) {
      alert('Failed to send invoice');
      console.error('Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        router.push('/');
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch (err) {
      alert('Failed to delete invoice');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: InvoiceStatus.PAID,
          paidDate: new Date().toISOString(),
          paidAmount: invoice.total,
        }),
      });
      const data = await response.json();

      if (data.success) {
        await loadInvoice();
      } else {
        alert(data.error || 'Failed to update invoice');
      }
    } catch (err) {
      alert('Failed to update invoice');
      console.error('Update error:', err);
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case InvoiceStatus.SENT:
        return <Send className="w-5 h-5 text-blue-500" />;
      case InvoiceStatus.OVERDUE:
        return <Clock className="w-5 h-5 text-red-500" />;
      case InvoiceStatus.CANCELLED:
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <FileText className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-green-900/30 text-green-400 border-green-800';
      case InvoiceStatus.SENT:
        return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-900/30 text-red-400 border-red-800';
      case InvoiceStatus.CANCELLED:
        return 'bg-gray-800/30 text-gray-400 border-gray-700';
      default:
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The invoice you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">Edit Invoice</h1>
                  <p className="text-gray-400 mt-1">{invoice.invoiceNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gray-900 rounded-lg p-6">
            <InvoiceForm
              invoice={invoice}
              onSubmit={handleUpdateInvoice}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">{invoice.invoiceNumber}</h1>
                <p className="text-gray-400 mt-1">Invoice Details</p>
              </div>
            </div>
            <div className="flex gap-3">
              {invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED && (
                <button
                  onClick={handleMarkAsPaid}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Paid
                </button>
              )}
              <button
                onClick={handleSendInvoice}
                disabled={isSending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {isSending ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(invoice.status)}`}>
            {getStatusIcon(invoice.status)}
            <span className="font-semibold capitalize">{invoice.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Invoice Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Invoice Number</p>
                  <p className="text-white font-semibold">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Issue Date</p>
                  <p className="text-white">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Due Date</p>
                  <p className="text-white">{formatDate(invoice.dueDate)}</p>
                </div>
                {invoice.paidDate && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Paid Date</p>
                    <p className="text-white">{formatDate(invoice.paidDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* From/To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  From
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-white font-semibold">{invoice.from.name}</p>
                  </div>
                  <div className="flex items-start gap-2 text-gray-400">
                    <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm">{invoice.from.email}</p>
                  </div>
                  {invoice.from.phone && (
                    <div className="flex items-start gap-2 text-gray-400">
                      <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                      <p className="text-sm">{invoice.from.phone}</p>
                    </div>
                  )}
                  {invoice.from.address && (
                    <div className="flex items-start gap-2 text-gray-400">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <p className="text-sm">
                        {invoice.from.address.street}<br />
                        {invoice.from.address.city}, {invoice.from.address.state} {invoice.from.address.zipCode}<br />
                        {invoice.from.address.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* To */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Bill To
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-white font-semibold">{invoice.to.name}</p>
                  </div>
                  <div className="flex items-start gap-2 text-gray-400">
                    <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                    <p className="text-sm">{invoice.to.email}</p>
                  </div>
                  {invoice.to.phone && (
                    <div className="flex items-start gap-2 text-gray-400">
                      <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                      <p className="text-sm">{invoice.to.phone}</p>
                    </div>
                  )}
                  {invoice.to.address && (
                    <div className="flex items-start gap-2 text-gray-400">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <p className="text-sm">
                        {invoice.to.address.street}<br />
                        {invoice.to.address.city}, {invoice.to.address.state} {invoice.to.address.zipCode}<br />
                        {invoice.to.address.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-gray-400 font-semibold py-3 px-2">Description</th>
                      <th className="text-right text-gray-400 font-semibold py-3 px-2">Qty</th>
                      <th className="text-right text-gray-400 font-semibold py-3 px-2">Unit Price</th>
                      <th className="text-right text-gray-400 font-semibold py-3 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-3 px-2 text-white">{item.description}</td>
                        <td className="py-3 px-2 text-right text-gray-300">{item.quantity}</td>
                        <td className="py-3 px-2 text-right text-gray-300">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-2 text-right text-white font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                {invoice.notes && (
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">Notes</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Terms & Conditions</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Amount Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Amount</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="border-t border-gray-800 pt-3 flex justify-between text-white text-xl font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                {invoice.paidAmount !== undefined && (
                  <>
                    <div className="flex justify-between text-green-400">
                      <span>Paid</span>
                      <span>{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                    {invoice.total - invoice.paidAmount > 0 && (
                      <div className="flex justify-between text-red-400 font-semibold">
                        <span>Balance Due</span>
                        <span>{formatCurrency(invoice.total - invoice.paidAmount)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Info */}
            {invoice.paymentMethod && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Payment</h2>
                <div className="space-y-2">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Method</p>
                    <p className="text-white capitalize">{invoice.paymentMethod.replace('_', ' ')}</p>
                  </div>
                  {invoice.paidDate && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Paid On</p>
                      <p className="text-white">{formatDate(invoice.paidDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Metadata</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Created</p>
                  <p className="text-gray-300">{formatDate(invoice.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Last Updated</p>
                  <p className="text-gray-300">{formatDate(invoice.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}