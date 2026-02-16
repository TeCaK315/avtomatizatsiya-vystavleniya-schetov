'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Edit, 
  Trash2, 
  Send, 
  Download, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye
} from 'lucide-react';
import type { Invoice, InvoiceListProps, InvoiceStatus } from '@/types';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/types';

export function InvoiceList({ 
  invoices, 
  onEdit, 
  onDelete, 
  onSend, 
  loading = false 
}: InvoiceListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'number'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = [...invoices];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        invoice =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.client.name.toLowerCase().includes(query) ||
          invoice.client.email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'number':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [invoices, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'amount' | 'number') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!onDelete) return;
    
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    setDeletingId(invoiceId);
    try {
      await onDelete(invoiceId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (invoiceId: string) => {
    if (!onSend) return;

    setSendingId(invoiceId);
    try {
      await onSend(invoiceId);
    } finally {
      setSendingId(null);
    }
  };

  const handleView = (invoiceId: string) => {
    router.push(`/invoices/${invoiceId}`);
  };

  const handleEditClick = (invoice: Invoice) => {
    if (onEdit) {
      onEdit(invoice);
    } else {
      router.push(`/invoices/${invoice.id}/edit`);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const SortIcon = ({ field }: { field: 'date' | 'amount' | 'number' }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-12 text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-400">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by invoice number, client name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'number')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="number">Invoice Number</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredAndSortedInvoices.length} of {invoices.length} invoices
      </div>

      {/* Invoice List */}
      {filteredAndSortedInvoices.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
          <p className="text-gray-400">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first invoice to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th
                    onClick={() => handleSort('number')}
                    className="text-left p-4 text-sm font-semibold cursor-pointer hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Invoice #
                      <SortIcon field="number" />
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-semibold">Client</th>
                  <th
                    onClick={() => handleSort('date')}
                    className="text-left p-4 text-sm font-semibold cursor-pointer hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-semibold">Due Date</th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="text-right p-4 text-sm font-semibold cursor-pointer hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Amount
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th className="text-left p-4 text-sm font-semibold">Status</th>
                  <th className="text-right p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-mono text-sm font-semibold text-blue-400">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{invoice.client.name}</div>
                      <div className="text-sm text-gray-400">{invoice.client.email}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          INVOICE_STATUS_COLORS[invoice.status]
                        }`}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(invoice.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(invoice)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {onSend && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <button
                            onClick={() => handleSend(invoice.id)}
                            disabled={sendingId === invoice.id}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send"
                          >
                            {sendingId === invoice.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id}
                            className="p-2 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deletingId === invoice.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}