'use client';

import React, { useState } from 'react';
import { InvoiceCardProps, InvoiceStatus } from '@/types';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Mail, 
  Trash2, 
  Eye,
  MoreVertical,
  Send
} from 'lucide-react';

export function InvoiceCard({ invoice, onClick, onDelete, onSend }: InvoiceCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case InvoiceStatus.SENT:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case InvoiceStatus.OVERDUE:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case InvoiceStatus.DRAFT:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case InvoiceStatus.CANCELLED:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: InvoiceStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const isOverdue = (): boolean => {
    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      return false;
    }
    return new Date(invoice.dueDate) < new Date();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      setIsDeleting(true);
      try {
        await onDelete();
      } finally {
        setIsDeleting(false);
        setShowMenu(false);
      }
    }
  };

  const handleSend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSending(true);
    try {
      await onSend();
    } finally {
      setIsSending(false);
      setShowMenu(false);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setShowMenu(false);
  };

  return (
    <div 
      className="bg-gray-900 rounded-lg p-5 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer relative group"
      onClick={onClick}
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
            <button
              onClick={handleView}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-left text-gray-300 text-sm transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || invoice.status === InvoiceStatus.CANCELLED}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 text-left text-gray-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending...' : 'Send Invoice'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-900/50 text-left text-red-400 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-b-lg"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{invoice.invoiceNumber}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(invoice.status)}`}>
                {getStatusLabel(invoice.status)}
              </span>
              {isOverdue() && (
                <span className="text-xs px-2 py-1 rounded-full border bg-red-500/20 text-red-400 border-red-500/30">
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <User className="w-4 h-4" />
          <span className="text-gray-300">{invoice.to.name}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Mail className="w-4 h-4" />
          <span className="text-gray-300 truncate">{invoice.to.email}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span className="text-gray-300">Due: {formatDate(invoice.dueDate)}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Total Amount</span>
          </div>
          <span className="text-white font-bold text-xl">{formatCurrency(invoice.total)}</span>
        </div>
        
        {invoice.status === InvoiceStatus.PAID && invoice.paidDate && (
          <div className="mt-2 text-xs text-green-400">
            Paid on {formatDate(invoice.paidDate)}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''} • 
          Issued {formatDate(invoice.issueDate)}
        </div>
      </div>
    </div>
  );
}