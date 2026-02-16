'use client';

import React, { useState, useMemo } from 'react';
import { 
  Invoice, 
  InvoiceListProps, 
  InvoiceFilters, 
  InvoiceSortOptions, 
  InvoiceSortField, 
  SortDirection,
  InvoiceStatus 
} from '@/types';
import { InvoiceCard } from './InvoiceCard';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function InvoiceList({ 
  invoices, 
  onEdit, 
  onDelete, 
  onSend, 
  onStatusChange 
}: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [sortOptions, setSortOptions] = useState<InvoiceSortOptions>({
    field: 'issueDate',
    direction: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.clientName.toLowerCase().includes(query) ||
        invoice.clientEmail.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter(invoice => filters.status!.includes(invoice.status));
    }

    // Apply date range filter
    if (filters.dateFrom) {
      result = result.filter(invoice => invoice.issueDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(invoice => invoice.issueDate <= filters.dateTo!);
    }

    // Apply amount range filter
    if (filters.minAmount !== undefined) {
      result = result.filter(invoice => invoice.total >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter(invoice => invoice.total <= filters.maxAmount!);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortOptions.field];
      let bValue: any = b[sortOptions.field];

      // Handle date strings
      if (sortOptions.field === 'issueDate' || sortOptions.field === 'dueDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numbers
      if (sortOptions.field === 'total') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Handle strings
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, searchQuery, filters, sortOptions]);

  const handleSort = (field: InvoiceSortField) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatusFilterToggle = (status: InvoiceStatus) => {
    setFilters(prev => {
      const currentStatuses = prev.status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];
      
      return {
        ...prev,
        status: newStatuses.length > 0 ? newStatuses : undefined
      };
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== undefined) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filters, searchQuery]);

  const SortIcon = ({ field }: { field: InvoiceSortField }) => {
    if (sortOptions.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-500" />;
    }
    return sortOptions.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-400" />
      : <ArrowDown className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number, client name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-750 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusFilterToggle(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.status?.includes(status)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount Range Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minAmount: e.target.value ? Number(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxAmount: e.target.value ? Number(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-400 py-2">Sort by:</span>
        {[
          { field: 'invoiceNumber' as InvoiceSortField, label: 'Invoice #' },
          { field: 'clientName' as InvoiceSortField, label: 'Client' },
          { field: 'issueDate' as InvoiceSortField, label: 'Issue Date' },
          { field: 'dueDate' as InvoiceSortField, label: 'Due Date' },
          { field: 'total' as InvoiceSortField, label: 'Amount' },
          { field: 'status' as InvoiceSortField, label: 'Status' }
        ].map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortOptions.field === field
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span>{label}</span>
            <SortIcon field={field} />
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredAndSortedInvoices.length} of {invoices.length} invoices
      </div>

      {/* Invoice List */}
      {filteredAndSortedInvoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-lg">No invoices found</p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Clear filters to see all invoices
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedInvoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onEdit={() => onEdit(invoice)}
              onDelete={() => onDelete(invoice.id)}
              onSend={() => onSend(invoice)}
              onStatusChange={(status) => onStatusChange(invoice.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}