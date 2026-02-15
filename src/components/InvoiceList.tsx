'use client';

import React, { useState } from 'react';
import { Eye, Send, Trash2, Edit, FileText, Calendar, DollarSign, Mail } from 'lucide-react';
import type { InvoiceListProps, Invoice } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function InvoiceList({
  invoices,
  onView,
  onEdit,
  onDelete,
  onSend,
  isLoading = false,
}: InvoiceListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    setDeletingId(invoiceId);
    try {
      await onDelete(invoiceId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSend = async (invoiceId: string) => {
    setSendingId(invoiceId);
    try {
      await onSend(invoiceId);
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No invoices yet</h3>
        <p className="text-gray-400">Create your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Invoice #</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Client</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Issue Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Due Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-white">{invoice.invoiceNumber}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-white">{invoice.clientName}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {invoice.clientEmail}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatDate(invoice.issueDate)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatDate(invoice.dueDate)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 font-semibold text-white">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(invoice.total)}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge status={invoice.status} />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(invoice)}
                      title="View invoice"
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(invoice)}
                      title="Edit invoice"
                      disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                      leftIcon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSend(invoice.id)}
                      isLoading={sendingId === invoice.id}
                      disabled={invoice.status === 'paid' || invoice.status === 'cancelled' || sendingId === invoice.id}
                      title="Send invoice via email"
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Send
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(invoice.id)}
                      isLoading={deletingId === invoice.id}
                      disabled={deletingId === invoice.id}
                      title="Delete invoice"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-gray-800 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-white">{invoice.invoiceNumber}</span>
                </div>
                <div className="text-sm text-gray-400">{invoice.clientName}</div>
              </div>
              <Badge status={invoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 mb-1">Issue Date</div>
                <div className="text-white">{formatDate(invoice.issueDate)}</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Due Date</div>
                <div className="text-white">{formatDate(invoice.dueDate)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="text-gray-400">Total Amount</div>
              <div className="text-xl font-bold text-white">{formatCurrency(invoice.total)}</div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(invoice)}
                className="flex-1"
                leftIcon={<Eye className="w-4 h-4" />}
              >
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(invoice)}
                disabled={invoice.status === 'paid' || invoice.status === 'cancelled'}
                className="flex-1"
                leftIcon={<Edit className="w-4 h-4" />}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSend(invoice.id)}
                isLoading={sendingId === invoice.id}
                disabled={invoice.status === 'paid' || invoice.status === 'cancelled' || sendingId === invoice.id}
                className="flex-1"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(invoice.id)}
                isLoading={deletingId === invoice.id}
                disabled={deletingId === invoice.id}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-400 pt-4">
        Showing {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
      </div>
    </div>
  );
}