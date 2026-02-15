'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Upload, Search, Filter, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { Invoice, InvoiceStatus, ExtractedData, InvoiceFilters } from '@/types';
import InvoiceList from '@/components/InvoiceList';
import InvoiceStats from '@/components/InvoiceStats';
import FilterBar from '@/components/FilterBar';
import PDFUploader from '@/components/PDFUploader';
import InvoiceForm from '@/components/InvoiceForm';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<InvoiceFilters>({});

  // Load invoices from API
  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/invoices');
      const data = await response.json();
      
      if (data.success && data.invoices) {
        setInvoices(data.invoices);
        setFilteredInvoices(data.invoices);
      } else {
        setError(data.error || 'Failed to load invoices');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Load invoices error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...invoices];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.to.name.toLowerCase().includes(query) ||
        inv.to.email.toLowerCase().includes(query) ||
        inv.from.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilters.status && activeFilters.status.length > 0) {
      result = result.filter(inv => activeFilters.status!.includes(inv.status));
    }

    // Apply date range filter
    if (activeFilters.dateFrom) {
      result = result.filter(inv => new Date(inv.issueDate) >= new Date(activeFilters.dateFrom!));
    }
    if (activeFilters.dateTo) {
      result = result.filter(inv => new Date(inv.issueDate) <= new Date(activeFilters.dateTo!));
    }

    // Apply amount filter
    if (activeFilters.minAmount !== undefined) {
      result = result.filter(inv => inv.total >= activeFilters.minAmount!);
    }
    if (activeFilters.maxAmount !== undefined) {
      result = result.filter(inv => inv.total <= activeFilters.maxAmount!);
    }

    setFilteredInvoices(result);
  }, [invoices, searchQuery, activeFilters]);

  const handleInvoiceClick = (id: string) => {
    window.location.href = `/invoices/${id}`;
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        await loadInvoices();
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch (err) {
      alert('Failed to delete invoice');
      console.error('Delete error:', err);
    }
  };

  const handleSendInvoice = async (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    const email = prompt('Enter recipient email:', invoice.to.email);
    if (!email) return;

    try {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email }),
      });
      const data = await response.json();

      if (data.success) {
        alert('Invoice sent successfully!');
        await loadInvoices();
      } else {
        alert(data.error || 'Failed to send invoice');
      }
    } catch (err) {
      alert('Failed to send invoice');
      console.error('Send error:', err);
    }
  };

  const handleUploadSuccess = (extractedData: ExtractedData) => {
    setShowUploader(false);
    setShowCreateForm(true);
  };

  const handleUploadError = (error: string) => {
    alert(`Upload failed: ${error}`);
  };

  const handleCreateInvoice = async (data: any) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        await loadInvoices();
      } else {
        alert(result.error || 'Failed to create invoice');
      }
    } catch (err) {
      alert('Failed to create invoice');
      console.error('Create error:', err);
    }
  };

  const handleFilterChange = (filters: InvoiceFilters) => {
    setActiveFilters(filters);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Invoice Manager</h1>
              <p className="text-gray-400 mt-1">Manage and track your invoices</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Upload PDF
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Invoice
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8">
          <InvoiceStats invoices={invoices} />
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
          />
        </div>

        {/* Invoice List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadInvoices}
              className="mt-4 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || Object.keys(activeFilters).length > 0
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first invoice'}
            </p>
            {!searchQuery && Object.keys(activeFilters).length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Invoice
              </button>
            )}
          </div>
        ) : (
          <InvoiceList
            invoices={filteredInvoices}
            onInvoiceClick={handleInvoiceClick}
            onDeleteInvoice={handleDeleteInvoice}
            onSendInvoice={handleSendInvoice}
          />
        )}
      </main>

      {/* PDF Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Upload Invoice PDF</h2>
              <button
                onClick={() => setShowUploader(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <PDFUploader
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Invoice</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <InvoiceForm
              onSubmit={handleCreateInvoice}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}