'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Invoice, 
  InvoiceStatus, 
  InvoiceFilters,
  IntegrationProvider 
} from '@/types';
import { InvoiceList } from '@/components/InvoiceList';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Send, 
  RefreshCw,
  X,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: [],
    dateFrom: '',
    dateTo: '',
    minAmount: undefined,
    maxAmount: undefined,
    vendorName: '',
    searchQuery: ''
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchQuery, filters]);

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

  const applyFilters = () => {
    let filtered = [...invoices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.fileName.toLowerCase().includes(query) ||
        inv.extractedData?.invoiceNumber?.toLowerCase().includes(query) ||
        inv.extractedData?.vendorName?.toLowerCase().includes(query) ||
        inv.extractedData?.customerName?.toLowerCase().includes(query)
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(inv => filters.status!.includes(inv.status));
    }

    if (filters.vendorName) {
      const vendor = filters.vendorName.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.extractedData?.vendorName?.toLowerCase().includes(vendor)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(inv => 
        inv.extractedData?.invoiceDate && 
        new Date(inv.extractedData.invoiceDate) >= new Date(filters.dateFrom!)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(inv => 
        inv.extractedData?.invoiceDate && 
        new Date(inv.extractedData.invoiceDate) <= new Date(filters.dateTo!)
      );
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(inv => 
        inv.extractedData?.totalAmount && 
        inv.extractedData.totalAmount >= filters.minAmount!
      );
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(inv => 
        inv.extractedData?.totalAmount && 
        inv.extractedData.totalAmount <= filters.maxAmount!
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleView = (id: string) => {
    router.push(`/invoices/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/invoices/${id}?edit=true`);
  };

  const handleSend = async (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice || !invoice.extractedData?.customerEmail) {
      alert('Cannot send invoice: missing customer email');
      return;
    }

    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: id,
          recipients: [invoice.extractedData.customerEmail],
          subject: `Invoice ${invoice.extractedData.invoiceNumber}`,
          message: 'Please find attached invoice.',
          attachPDF: true
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Invoice sent successfully');
        loadInvoices();
      } else {
        alert(`Failed to send invoice: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('Failed to send invoice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        loadInvoices();
      } else {
        alert(`Failed to delete invoice: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const handleSync = async (id: string, provider: IntegrationProvider) => {
    try {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: id, provider })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Synced to ${provider} successfully`);
        loadInvoices();
      } else {
        alert(`Failed to sync: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to sync invoice:', error);
      alert('Failed to sync invoice');
    }
  };

  const toggleInvoiceSelection = (id: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvoices(newSelected);
  };

  const selectAllInvoices = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return;
    if (!confirm(`Delete ${selectedInvoices.size} selected invoices?`)) return;

    const deletePromises = Array.from(selectedInvoices).map(id =>
      fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    );

    try {
      await Promise.all(deletePromises);
      setSelectedInvoices(new Set());
      loadInvoices();
    } catch (error) {
      console.error('Failed to delete invoices:', error);
      alert('Failed to delete some invoices');
    }
  };

  const handleBulkSend = async () => {
    if (selectedInvoices.size === 0) return;

    const invoicesToSend = filteredInvoices.filter(inv => 
      selectedInvoices.has(inv.id) && inv.extractedData?.customerEmail
    );

    if (invoicesToSend.length === 0) {
      alert('No invoices with customer email selected');
      return;
    }

    const sendPromises = invoicesToSend.map(inv =>
      fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: inv.id,
          recipients: [inv.extractedData!.customerEmail!],
          subject: `Invoice ${inv.extractedData!.invoiceNumber}`,
          message: 'Please find attached invoice.',
          attachPDF: true
        })
      })
    );

    try {
      await Promise.all(sendPromises);
      alert(`Sent ${invoicesToSend.length} invoices`);
      setSelectedInvoices(new Set());
      loadInvoices();
    } catch (error) {
      console.error('Failed to send invoices:', error);
      alert('Failed to send some invoices');
    }
  };

  const toggleStatusFilter = (status: InvoiceStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    setFilters({ ...filters, status: newStatuses });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      dateFrom: '',
      dateTo: '',
      minAmount: undefined,
      maxAmount: undefined,
      vendorName: '',
      searchQuery: ''
    });
    setSearchQuery('');
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.UPLOADED: return 'bg-blue-500/20 text-blue-400';
      case InvoiceStatus.PROCESSING: return 'bg-yellow-500/20 text-yellow-400';
      case InvoiceStatus.EXTRACTED: return 'bg-purple-500/20 text-purple-400';
      case InvoiceStatus.VERIFIED: return 'bg-green-500/20 text-green-400';
      case InvoiceStatus.SENT: return 'bg-teal-500/20 text-teal-400';
      case InvoiceStatus.FAILED: return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const activeFilterCount = 
    (filters.status?.length || 0) +
    (filters.vendorName ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.minAmount !== undefined ? 1 : 0) +
    (filters.maxAmount !== undefined ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-gray-400 mt-1">
              {filteredInvoices.length} of {invoices.length} invoices
            </p>
          </div>
          <button
            onClick={loadInvoices}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number, vendor, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(InvoiceStatus).map(status => (
                      <button
                        key={status}
                        onClick={() => toggleStatusFilter(status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filters.status?.includes(status)
                            ? getStatusColor(status)
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by vendor"
                    value={filters.vendorName || ''}
                    onChange={(e) => setFilters({ ...filters, vendorName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Min Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.minAmount || ''}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Max Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.maxAmount || ''}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {selectedInvoices.size > 0 && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-300">
                {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkSend}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  Send Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredInvoices.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInvoices.size === filteredInvoices.length}
                onChange={selectAllInvoices}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
              />
              Select All
            </label>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">
              {invoices.length === 0 
                ? 'No invoices yet. Upload your first invoice to get started.'
                : 'No invoices match your filters.'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map(invoice => (
              <div
                key={invoice.id}
                className={`bg-gray-900 rounded-lg p-4 border transition-colors ${
                  selectedInvoices.has(invoice.id)
                    ? 'border-blue-500'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.has(invoice.id)}
                    onChange={() => toggleInvoiceSelection(invoice.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {invoice.extractedData?.invoiceNumber || invoice.fileName}
                        </h3>
                        {invoice.extractedData?.vendorName && (
                          <p className="text-gray-400 text-sm">
                            {invoice.extractedData.vendorName}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>

                    {invoice.extractedData && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-400">Date:</span>
                          <p className="text-white">
                            {new Date(invoice.extractedData.invoiceDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Due:</span>
                          <p className="text-white">
                            {new Date(invoice.extractedData.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Customer:</span>
                          <p className="text-white">{invoice.extractedData.customerName}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <p className="text-white font-semibold">
                            {invoice.extractedData.currency} {invoice.extractedData.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleView(invoice.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleEdit(invoice.id)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        Edit
                      </button>
                      {invoice.extractedData?.customerEmail && (
                        <button
                          onClick={() => handleSend(invoice.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}