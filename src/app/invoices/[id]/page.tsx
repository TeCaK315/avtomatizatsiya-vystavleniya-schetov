'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Invoice, 
  ExtractedData,
  InvoiceStatus,
  IntegrationProvider 
} from '@/types';
import { InvoiceForm } from '@/components/InvoiceForm';
import { SendInvoiceModal } from '@/components/SendInvoiceModal';
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  Trash2, 
  Download, 
  RefreshCw,
  FileText,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  const loadInvoice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invoices/${params.id}`);
      const data = await response.json();
      if (data.success && data.invoice) {
        setInvoice(data.invoice);
      } else {
        alert('Invoice not found');
        router.push('/invoices');
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      alert('Failed to load invoice');
      router.push('/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: ExtractedData) => {
    if (!invoice) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedData: data,
          status: InvoiceStatus.VERIFIED
        })
      });

      const result = await response.json();
      if (result.success) {
        setInvoice(result.invoice);
        setIsEditing(false);
        alert('Invoice updated successfully');
      } else {
        alert(`Failed to update invoice: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
      alert('Failed to update invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvoice = async (recipients: string[], subject: string, message: string) => {
    if (!invoice) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          recipients,
          subject,
          message,
          attachPDF: true
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Invoice sent successfully');
        setShowSendModal(false);
        loadInvoice();
      } else {
        alert(`Failed to send invoice: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('Invoice deleted successfully');
        router.push('/invoices');
      } else {
        alert(`Failed to delete invoice: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const handleReprocess = async () => {
    if (!invoice) return;

    try {
      const response = await fetch('/api/invoices/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          fileUrl: invoice.fileUrl,
          fileType: invoice.fileType
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Invoice reprocessed successfully');
        loadInvoice();
      } else {
        alert(`Failed to reprocess invoice: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to reprocess invoice:', error);
      alert('Failed to reprocess invoice');
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.VERIFIED:
      case InvoiceStatus.SENT:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case InvoiceStatus.FAILED:
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case InvoiceStatus.PROCESSING:
        return <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.UPLOADED: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case InvoiceStatus.PROCESSING: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case InvoiceStatus.EXTRACTED: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case InvoiceStatus.VERIFIED: return 'bg-green-500/20 text-green-400 border-green-500/30';
      case InvoiceStatus.SENT: return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case InvoiceStatus.FAILED: return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Invoice not found</p>
      </div>
    );
  }

  if (isEditing && invoice.extractedData) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel Editing
          </button>
          <InvoiceForm
            invoice={invoice}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isLoading={isSaving}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/invoices')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </button>

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold">
                  {invoice.extractedData?.invoiceNumber || invoice.fileName}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Uploaded {new Date(invoice.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(invoice.status)}`}>
              {getStatusIcon(invoice.status)}
              <span className="font-medium">{invoice.status}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {invoice.extractedData && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {invoice.extractedData?.customerEmail && (
              <button
                onClick={() => setShowSendModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Invoice
              </button>
            )}
            <button
              onClick={handleReprocess}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reprocess
            </button>
            <a
              href={invoice.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {invoice.errorMessage && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">Error</h3>
                <p className="text-red-300 text-sm">{invoice.errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {!invoice.extractedData ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              {invoice.status === InvoiceStatus.PROCESSING
                ? 'Processing invoice...'
                : 'No extracted data available'}
            </p>
            <p className="text-gray-500 text-sm">
              {invoice.status === InvoiceStatus.PROCESSING
                ? 'OCR extraction is in progress. This may take a few moments.'
                : 'Click "Reprocess" to extract data from this invoice.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                Vendor Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Name</label>
                  <p className="text-white font-medium">{invoice.extractedData.vendorName}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Address</label>
                  <p className="text-white">{invoice.extractedData.vendorAddress}</p>
                </div>
                {invoice.extractedData.vendorEmail && (
                  <div>
                    <label className="text-gray-400 text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    <p className="text-white">{invoice.extractedData.vendorEmail}</p>
                  </div>
                )}
                {invoice.extractedData.vendorPhone && (
                  <div>
                    <label className="text-gray-400 text-sm flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Phone
                    </label>
                    <p className="text-white">{invoice.extractedData.vendorPhone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-400" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Name</label>
                  <p className="text-white font-medium">{invoice.extractedData.customerName}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Address</label>
                  <p className="text-white">{invoice.extractedData.customerAddress}</p>
                </div>
                {invoice.extractedData.customerEmail && (
                  <div>
                    <label className="text-gray-400 text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    <p className="text-white">{invoice.extractedData.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Invoice Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Invoice Number</label>
                  <p className="text-white font-medium">{invoice.extractedData.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Invoice Date</label>
                  <p className="text-white">
                    {new Date(invoice.extractedData.invoiceDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Due Date</label>
                  <p className="text-white">
                    {new Date(invoice.extractedData.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Line Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Quantity</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Unit Price</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.extractedData.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-800">
                        <td className="py-3 px-4 text-white">{item.description}</td>
                        <td className="py-3 px-4 text-white text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-white text-right">
                          {invoice.extractedData!.currency} {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-white text-right font-medium">
                          {invoice.extractedData!.currency} {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                Totals
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-medium">
                    {invoice.extractedData.currency} {invoice.extractedData.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tax</span>
                  <span className="text-white font-medium">
                    {invoice.extractedData.currency} {invoice.extractedData.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <span className="text-white font-semibold text-lg">Total</span>
                  <span className="text-white font-bold text-xl">
                    {invoice.extractedData.currency} {invoice.extractedData.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {invoice.extractedData.notes && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Notes</h2>
                <p className="text-gray-300">{invoice.extractedData.notes}</p>
              </div>
            )}

            {invoice.extractedData.confidence && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">OCR Confidence</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        invoice.extractedData.confidence >= 90
                          ? 'bg-green-500'
                          : invoice.extractedData.confidence >= 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${invoice.extractedData.confidence}%` }}
                    />
                  </div>
                  <span className="text-white font-medium">
                    {invoice.extractedData.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {invoice.sentAt && invoice.sentTo && invoice.sentTo.length > 0 && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Sent Information
                </h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">Sent to:</span>
                    <p className="text-white">{invoice.sentTo.join(', ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Sent at:</span>
                    <p className="text-white">{new Date(invoice.sentAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showSendModal && invoice.extractedData && (
        <SendInvoiceModal
          invoice={invoice}
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSend={handleSendInvoice}
          isSending={isSending}
        />
      )}
    </div>
  );
}