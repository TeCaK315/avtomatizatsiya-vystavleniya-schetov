'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, Send, Trash2, Eye, Edit } from 'lucide-react';
import InvoiceUpload from '@/components/InvoiceUpload';
import InvoiceList from '@/components/InvoiceList';
import ExtractionStatus from '@/components/ExtractionStatus';
import SendInvoiceModal from '@/components/SendInvoiceModal';
import { Invoice, InvoiceStatus, FileType, IntegrationProvider } from '@/types';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    extracted: 0,
    sent: 0,
    failed: 0,
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [invoices]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices');
      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    setStats({
      total: invoices.length,
      processing: invoices.filter(inv => inv.status === InvoiceStatus.PROCESSING).length,
      extracted: invoices.filter(inv => inv.status === InvoiceStatus.EXTRACTED || inv.status === InvoiceStatus.VERIFIED).length,
      sent: invoices.filter(inv => inv.status === InvoiceStatus.SENT).length,
      failed: invoices.filter(inv => inv.status === InvoiceStatus.FAILED).length,
    });
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/invoices/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Upload failed');
      }

      const createResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadData.fileName,
          fileUrl: uploadData.fileUrl,
          fileType: uploadData.fileType,
        }),
      });

      const createData = await createResponse.json();

      if (createData.success) {
        setInvoices(prev => [createData.invoice, ...prev]);

        const extractResponse = await fetch('/api/invoices/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceId: createData.invoice.id,
            fileUrl: uploadData.fileUrl,
            fileType: uploadData.fileType,
          }),
        });

        const extractData = await extractResponse.json();

        if (extractData.success) {
          setInvoices(prev =>
            prev.map(inv =>
              inv.id === extractData.invoiceId
                ? {
                    ...inv,
                    status: InvoiceStatus.EXTRACTED,
                    extractedData: extractData.extractedData,
                    processedAt: new Date().toISOString(),
                  }
                : inv
            )
          );
        } else {
          setInvoices(prev =>
            prev.map(inv =>
              inv.id === createData.invoice.id
                ? {
                    ...inv,
                    status: InvoiceStatus.FAILED,
                    errorMessage: extractData.message || 'Extraction failed',
                  }
                : inv
            )
          );
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload invoice. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = (id: string) => {
    window.location.href = `/invoices/${id}`;
  };

  const handleEdit = (id: string) => {
    window.location.href = `/invoices/${id}`;
  };

  const handleSend = (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
      setSelectedInvoice(invoice);
      setIsSendModalOpen(true);
    }
  };

  const handleSendInvoice = async (recipients: string[], subject: string, message: string) => {
    if (!selectedInvoice) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          recipients,
          subject,
          message,
          attachPDF: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInvoices(prev =>
          prev.map(inv =>
            inv.id === selectedInvoice.id
              ? {
                  ...inv,
                  status: InvoiceStatus.SENT,
                  sentAt: data.sentAt,
                  sentTo: data.sentTo,
                }
              : inv
          )
        );
        setIsSendModalOpen(false);
        setSelectedInvoice(null);
      } else {
        alert(data.message || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Send error:', error);
      alert('Failed to send invoice. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      } else {
        alert(data.message || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  const handleSync = async (id: string, provider: IntegrationProvider) => {
    try {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id, provider }),
      });

      const data = await response.json();

      if (data.success) {
        setInvoices(prev =>
          prev.map(inv =>
            inv.id === id
              ? {
                  ...inv,
                  syncedToIntegrations: [...(inv.syncedToIntegrations || []), provider],
                }
              : inv
          )
        );
        alert(`Successfully synced to ${provider}`);
      } else {
        alert(data.message || 'Failed to sync invoice');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync invoice. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoice Dashboard</h1>
          <p className="text-gray-400 mt-2">Upload, process, and manage your invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Invoices</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Processing</p>
              <p className="text-3xl font-bold text-yellow-500 mt-1">{stats.processing}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Extracted</p>
              <p className="text-3xl font-bold text-green-500 mt-1">{stats.extracted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sent</p>
              <p className="text-3xl font-bold text-blue-500 mt-1">{stats.sent}</p>
            </div>
            <Send className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Failed</p>
              <p className="text-3xl font-bold text-red-500 mt-1">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Invoice
        </h2>
        <InvoiceUpload
          onUpload={handleUpload}
          acceptedTypes={[FileType.PDF, FileType.JPEG, FileType.PNG]}
          maxSizeMB={10}
          isUploading={isUploading}
        />
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Invoices
          </h2>
          <a
            href="/invoices"
            className="text-blue-500 hover:text-blue-400 text-sm font-medium"
          >
            View All →
          </a>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No invoices yet. Upload your first invoice above.</p>
          </div>
        ) : (
          <InvoiceList
            invoices={invoices.slice(0, 5)}
            onView={handleView}
            onEdit={handleEdit}
            onSend={handleSend}
            onDelete={handleDelete}
            onSync={handleSync}
            isLoading={false}
          />
        )}
      </div>

      {selectedInvoice && (
        <SendInvoiceModal
          invoice={selectedInvoice}
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSend={handleSendInvoice}
          isSending={isSending}
        />
      )}
    </div>
  );
}