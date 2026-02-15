'use client';

import React from 'react';
import { InvoiceCardProps, InvoiceStatus, IntegrationProvider } from '@/types';
import { FileText, Calendar, DollarSign, Send, Edit, Trash2, CheckCircle, AlertCircle, Clock, Loader2, ExternalLink } from 'lucide-react';

export function InvoiceCard({ invoice, onView, onEdit, onSend, onDelete, onSync }: InvoiceCardProps) {
  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.UPLOADED:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case InvoiceStatus.PROCESSING:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case InvoiceStatus.EXTRACTED:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case InvoiceStatus.VERIFIED:
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case InvoiceStatus.SENT:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case InvoiceStatus.FAILED:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.UPLOADED:
        return <Clock className="w-4 h-4" />;
      case InvoiceStatus.PROCESSING:
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case InvoiceStatus.EXTRACTED:
      case InvoiceStatus.VERIFIED:
        return <CheckCircle className="w-4 h-4" />;
      case InvoiceStatus.SENT:
        return <Send className="w-4 h-4" />;
      case InvoiceStatus.FAILED:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const canSend = invoice.status === InvoiceStatus.VERIFIED || invoice.status === InvoiceStatus.EXTRACTED;
  const canEdit = invoice.status !== InvoiceStatus.PROCESSING && invoice.status !== InvoiceStatus.SENT;
  const canSync = invoice.status === InvoiceStatus.VERIFIED || invoice.status === InvoiceStatus.SENT;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className="p-2 bg-gray-800 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate mb-1">
              {invoice.extractedData?.invoiceNumber || invoice.fileName}
            </h3>
            <p className="text-gray-400 text-sm truncate">{invoice.fileName}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${getStatusColor(invoice.status)}`}>
          {getStatusIcon(invoice.status)}
          <span className="capitalize">{invoice.status}</span>
        </div>
      </div>

      {/* Extracted Data */}
      {invoice.extractedData && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-500 text-xs mb-1">Vendor</p>
              <p className="text-white text-sm font-medium truncate">
                {invoice.extractedData.vendorName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Customer</p>
              <p className="text-white text-sm font-medium truncate">
                {invoice.extractedData.customerName || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Invoice Date</p>
                <p className="text-white text-sm">
                  {invoice.extractedData.invoiceDate ? formatDate(invoice.extractedData.invoiceDate) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Total Amount</p>
                <p className="text-white text-sm font-semibold">
                  {formatCurrency(invoice.extractedData.totalAmount, invoice.extractedData.currency)}
                </p>
              </div>
            </div>
          </div>

          {invoice.extractedData.confidence !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-500 text-xs">OCR Confidence</p>
                <p className="text-gray-400 text-xs">{invoice.extractedData.confidence.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    invoice.extractedData.confidence >= 80
                      ? 'bg-green-500'
                      : invoice.extractedData.confidence >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${invoice.extractedData.confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {invoice.errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{invoice.errorMessage}</p>
        </div>
      )}

      {/* Sent Info */}
      {invoice.sentAt && invoice.sentTo && invoice.sentTo.length > 0 && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-emerald-400 text-xs mb-1">Sent to {invoice.sentTo.length} recipient(s)</p>
          <p className="text-gray-400 text-xs">{formatDate(invoice.sentAt)}</p>
        </div>
      )}

      {/* Synced Integrations */}
      {invoice.syncedToIntegrations && invoice.syncedToIntegrations.length > 0 && (
        <div className="mb-4 flex items-center space-x-2">
          <ExternalLink className="w-4 h-4 text-gray-500" />
          <p className="text-gray-400 text-xs">
            Synced to: {invoice.syncedToIntegrations.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-800">
        <button
          onClick={() => onView(invoice.id)}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>View</span>
        </button>

        {canEdit && (
          <button
            onClick={() => onEdit(invoice.id)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}

        {canSend && (
          <button
            onClick={() => onSend(invoice.id)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        )}

        {canSync && onSync && (
          <button
            onClick={() => onSync(invoice.id, IntegrationProvider.QUICKBOOKS)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Sync to Integration"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onDelete(invoice.id)}
          className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}