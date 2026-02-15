'use client';

import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceListProps, InvoiceStatus } from '@/types';
import { InvoiceCard } from './InvoiceCard';
import { ArrowUpDown, Filter } from 'lucide-react';

type SortField = 'invoiceNumber' | 'issueDate' | 'dueDate' | 'total' | 'status';
type SortDirection = 'asc' | 'desc';

export function InvoiceList({ invoices, onInvoiceClick, onDeleteInvoice, onSendInvoice }: InvoiceListProps) {
  const [sortField, setSortField] = useState<SortField>('issueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = [...invoices];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'invoiceNumber':
          aValue = a.invoiceNumber;
          bValue = b.invoiceNumber;
          break;
        case 'issueDate':
          aValue = new Date(a.issueDate).getTime();
          bValue = new Date(b.issueDate).getTime();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.issueDate;
          bValue = b.issueDate;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, sortField, sortDirection, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-500" />;
    }
    return (
      <ArrowUpDown 
        className={`w-4 h-4 ${sortDirection === 'asc' ? 'text-blue-500' : 'text-blue-500 rotate-180'}`} 
      />
    );
  };

  const statusOptions: Array<{ value: InvoiceStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Invoices' },
    { value: InvoiceStatus.DRAFT, label: 'Draft' },
    { value: InvoiceStatus.SENT, label: 'Sent' },
    { value: InvoiceStatus.PAID, label: 'Paid' },
    { value: InvoiceStatus.OVERDUE, label: 'Overdue' },
    { value: InvoiceStatus.CANCELLED, label: 'Cancelled' },
  ];

  if (invoices.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-12 text-center">
        <div className="text-gray-400 text-lg mb-2">No invoices yet</div>
        <div className="text-gray-500 text-sm">Create your first invoice or upload a PDF to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-gray-300 text-sm font-medium">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-400 text-sm">Sort by:</span>
          <button
            onClick={() => handleSort('issueDate')}
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            Date {getSortIcon('issueDate')}
          </button>
          <button
            onClick={() => handleSort('total')}
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            Amount {getSortIcon('total')}
          </button>
          <button
            onClick={() => handleSort('status')}
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            Status {getSortIcon('status')}
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-400 px-2">
        Showing {filteredAndSortedInvoices.length} of {invoices.length} invoices
      </div>

      {filteredAndSortedInvoices.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <div className="text-gray-400">No invoices match the selected filter</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedInvoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onClick={() => onInvoiceClick(invoice.id)}
              onDelete={() => onDeleteInvoice(invoice.id)}
              onSend={() => onSendInvoice(invoice.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default InvoiceList;
