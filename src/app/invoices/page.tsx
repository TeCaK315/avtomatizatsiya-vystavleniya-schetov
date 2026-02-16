'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Invoice, InvoiceStatus, InvoiceFilters, Client } from '@/types';
import { InvoiceList } from '@/components/InvoiceList';
import { StatusBadge } from '@/components/StatusBadge';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus[]>([]);
  const [clientFilter, setClientFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'total' | 'invoiceNumber'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchQuery, statusFilter, clientFilter, dateFromFilter, dateToFilter, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [invoicesRes, clientsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/clients')
      ]);

      if (!invoicesRes.ok || !clientsRes.ok) {
        throw new Error('Failed to load data');
      }

      const invoicesData = await invoicesRes.json();
      const clientsData = await clientsRes.json();

      if (invoicesData.success && invoicesData.invoices) {
        setInvoices(invoicesData.invoices);
      }

      if (clientsData.success && clientsData.clients) {
        setClients(clientsData.clients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.client.name.toLowerCase().includes(query) ||
          inv.client.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((inv) => statusFilter.includes(inv.status));
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter((inv) => inv.clientId === clientFilter);
    }

    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter((inv) => inv.issueDate >= dateFromFilter);
    }
    if (dateToFilter) {
      filtered = filtered.filter((inv) => inv.issueDate <= dateToFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'dueDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (sortBy === 'total') {
        aVal = a.total;
        bVal = b.total;
      } else {
        aVal = a.invoiceNumber;
        bVal = b.invoiceNumber;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  };

  const toggleStatusFilter = (status: InvoiceStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setClientFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const handleCreateInvoice = () => {
    router.push('/invoices/new');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete invoice');
      }

      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error('Failed to send invoice');
      }

      alert('Invoice sent successfully!');
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invoice');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Client', 'Date', 'Due Date', 'Amount', 'Status'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.client.name,
      new Date(inv.issueDate).toLocaleDateString(),
      new Date(inv.dueDate).toLocaleDateString(),
      inv.total.toFixed(2),
      inv.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const hasActiveFilters = searchQuery || statusFilter.length > 0 || clientFilter || dateFromFilter || dateToFilter;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Invoices</h1>
            <p className="text-gray-400">
              {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              disabled={filteredInvoices.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleCreateInvoice}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice number, client name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {[searchQuery, ...statusFilter, clientFilter, dateFromFilter, dateToFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="border-t border-gray-800 pt-4 space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        statusFilter.includes(status)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <StatusBadge status={status} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Client</label>
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="">All Clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From Date</label>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">To Date</label>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="createdAt">Created Date</option>
            <option value="dueDate">Due Date</option>
            <option value="total">Amount</option>
            <option value="invoiceNumber">Invoice Number</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        {/* Invoice List */}
        {error ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <InvoiceList
              invoices={paginatedInvoices}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
              onSend={handleSendInvoice}
              loading={loading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredInvoices.length)} of{' '}
                  {filteredInvoices.length} invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}