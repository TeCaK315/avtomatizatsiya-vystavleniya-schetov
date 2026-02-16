'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { InvoiceUpload } from '@/components/InvoiceUpload';
import { InvoiceList } from '@/components/InvoiceList';
import { InvoiceForm } from '@/components/InvoiceForm';
import { ExtractedDataViewer } from '@/components/ExtractedDataViewer';
import type { 
  Invoice, 
  ExtractedData, 
  InvoiceFormData, 
  InvoiceStatus,
  UploadInvoiceResponse,
  ExtractDataResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  UpdateInvoiceRequest,
  UpdateInvoiceResponse,
  DeleteInvoiceResponse,
  SendInvoiceRequest,
  SendInvoiceResponse,
  GetInvoicesResponse
} from '@/types';

type ViewMode = 'list' | 'upload' | 'create' | 'edit' | 'extracted';

export default function HomePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      const data: GetInvoicesResponse = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/invoices/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData: UploadInvoiceResponse = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Upload failed');
      }

      setUploadingFileId(uploadData.fileId);

      const extractResponse = await fetch('/api/invoices/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadData.fileId,
          fileName: uploadData.fileName,
        }),
      });

      const extractData: ExtractDataResponse = await extractResponse.json();

      if (!extractData.success) {
        throw new Error(extractData.error || 'Extraction failed');
      }

      setExtractedData(extractData.data);
      setViewMode('extracted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setUploadingFileId(null);
    }
  };

  const handleExtractedDataConfirm = (data: ExtractedData) => {
    setExtractedData(data);
    setViewMode('create');
  };

  const handleExtractedDataEdit = (field: keyof ExtractedData, value: any) => {
    if (extractedData) {
      setExtractedData({
        ...extractedData,
        [field]: value,
      });
    }
  };

  const handleCreateInvoice = async (formData: InvoiceFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const requestData: CreateInvoiceRequest = {
        invoiceNumber: formData.invoiceNumber,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        taxRate: formData.taxRate,
        notes: formData.notes,
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data: CreateInvoiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create invoice');
      }

      await loadInvoices();
      setViewMode('list');
      setExtractedData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewMode('edit');
  };

  const handleUpdateInvoice = async (formData: InvoiceFormData) => {
    if (!selectedInvoice) return;

    setIsLoading(true);
    setError(null);

    try {
      const requestData: UpdateInvoiceRequest = {
        invoiceNumber: formData.invoiceNumber,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        taxRate: formData.taxRate,
        notes: formData.notes,
      };

      const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data: UpdateInvoiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update invoice');
      }

      await loadInvoices();
      setViewMode('list');
      setSelectedInvoice(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      const data: DeleteInvoiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete invoice');
      }

      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    setIsLoading(true);
    setError(null);

    try {
      const requestData: SendInvoiceRequest = {
        invoiceId: invoice.id,
        recipientEmail: invoice.clientEmail,
        subject: `Invoice ${invoice.invoiceNumber} from AutoBillPro`,
        message: `Dear ${invoice.clientName},\n\nPlease find attached invoice ${invoice.invoiceNumber}.\n\nThank you for your business.`,
      };

      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data: SendInvoiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      await loadInvoices();
      alert('Invoice sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      alert('Failed to send invoice: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (invoiceId: string, status: InvoiceStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const requestData: UpdateInvoiceRequest = { status };

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data: UpdateInvoiceResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update status');
      }

      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedInvoice(null);
    setExtractedData(null);
    setError(null);
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter(inv => inv.status === 'draft').length,
    sent: invoices.filter(inv => inv.status === 'sent').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AutoBillPro</h1>
              <p className="text-gray-400">Automated Invoice Management System</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode('upload')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <FileText className="w-5 h-5" />
                Upload PDF
              </button>
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  setExtractedData(null);
                  setViewMode('create');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <Plus className="w-5 h-5" />
                New Invoice
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Invoices</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Draft</span>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Sent</span>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Paid</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats.paid}</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <main>
          {viewMode === 'list' && (
            <InvoiceList
              invoices={invoices}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
              onSend={handleSendInvoice}
              onStatusChange={handleStatusChange}
            />
          )}

          {viewMode === 'upload' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Upload Invoice PDF</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              <InvoiceUpload
                onFileSelect={handleFileUpload}
                isUploading={isLoading}
              />
            </div>
          )}

          {viewMode === 'extracted' && extractedData && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-6">Review Extracted Data</h2>
              <ExtractedDataViewer
                extractedData={extractedData}
                onConfirm={handleExtractedDataConfirm}
                onCancel={handleCancel}
                onEdit={handleExtractedDataEdit}
              />
            </div>
          )}

          {viewMode === 'create' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-6">Create New Invoice</h2>
              <InvoiceForm
                extractedData={extractedData || undefined}
                onSubmit={handleCreateInvoice}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          )}

          {viewMode === 'edit' && selectedInvoice && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-semibold mb-6">Edit Invoice</h2>
              <InvoiceForm
                invoice={selectedInvoice}
                onSubmit={handleUpdateInvoice}
                onCancel={handleCancel}
                isLoading={isLoading}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}