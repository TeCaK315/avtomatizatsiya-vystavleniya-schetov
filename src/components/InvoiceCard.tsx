'use client';

import React, { useState } from 'react';
import { InvoiceCardProps, InvoiceStatus } from '@/types';
import { StatusBadge } from './StatusBadge';
import { 
  Edit, 
  Trash2, 
  Send, 
  Calendar, 
  Mail, 
  DollarSign, 
  FileText,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export function InvoiceCard({ 
  invoice, 
  onEdit, 
  onDelete, 
  onSend, 
  onStatusChange 
}: InvoiceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const isOverdue = () => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  const getDaysUntilDue = () => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStatusChange = (status: InvoiceStatus) => {
    onStatusChange(status);
    setShowStatusMenu(false);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      onDelete();
    }
    setShowMenu(false);
  };

  const handleSend = () => {
    onSend();
    setShowMenu(false);
  };

  const statusActions: { status: InvoiceStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'draft', label: 'Mark as Draft', icon: <FileText className="w-4 h-4" /> },
    { status: 'sent', label: 'Mark as Sent', icon: <Send className="w-4 h-4" /> },
    { status: 'paid', label: 'Mark as Paid', icon: <CheckCircle className="w-4 h-4" /> },
    { status: 'overdue', label: 'Mark as Overdue', icon: <Clock className="w-4 h-4" /> },
    { status: 'cancelled', label: 'Mark as Cancelled', icon: <XCircle className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">
              {invoice.invoiceNumber}
            </h3>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-gray-400">{invoice.clientName}</p>
        </div>
        
        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleSend}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Invoice</span>
                </button>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Change Status</span>
                </button>
                <div className="border-t border-gray-700" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Change Submenu */}
      {showStatusMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowStatusMenu(false)}
          />
          <div className="absolute right-0 top-16 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
            {statusActions.map(({ status, label, icon }) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={invoice.status === status}
                className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors ${
                  invoice.status === status
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Client Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">{invoice.clientEmail}</span>
        </div>
        {invoice.clientAddress && (
          <div className="text-sm text-gray-400 pl-6">
            {invoice.clientAddress}
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Calendar className="w-3 h-3" />
            <span>Issue Date</span>
          </div>
          <p className="text-sm text-white">{formatDate(invoice.issueDate)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Calendar className="w-3 h-3" />
            <span>Due Date</span>
          </div>
          <p className="text-sm text-white">{formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      {/* Due Date Warning */}
      {isOverdue() && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-400">
          Overdue by {Math.abs(getDaysUntilDue())} days
        </div>
      )}
      {!isOverdue() && invoice.status !== 'paid' && invoice.status !== 'cancelled' && getDaysUntilDue() <= 7 && (
        <div className="mb-4 p-2 bg-yellow-900/20 border border-yellow-800 rounded text-xs text-yellow-400">
          Due in {getDaysUntilDue()} days
        </div>
      )}

      {/* Items Summary */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-2">Items ({invoice.items.length})</p>
        <div className="space-y-1">
          {invoice.items.slice(0, 3).map((item, index) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-300 truncate flex-1 mr-2">
                {item.description}
              </span>
              <span className="text-white whitespace-nowrap">
                {formatCurrency(item.total)}
              </span>
            </div>
          ))}
          {invoice.items.length > 3 && (
            <p className="text-xs text-gray-500">
              +{invoice.items.length - 3} more items
            </p>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="border-t border-gray-800 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-gray-300">{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Tax ({invoice.taxRate}%)</span>
          <span className="text-gray-300">{formatCurrency(invoice.taxAmount)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-800">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Total</span>
          </div>
          <span className="text-xl font-bold text-white">
            {formatCurrency(invoice.total)}
          </span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-300 line-clamp-2">{invoice.notes}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={handleSend}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}