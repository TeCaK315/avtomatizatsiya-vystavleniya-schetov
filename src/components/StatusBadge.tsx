'use client';

import React from 'react';
import { StatusBadgeProps, InvoiceStatus } from '@/types';
import { CheckCircle, Clock, Send, XCircle, AlertCircle } from 'lucide-react';

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          icon: Clock,
          bgColor: 'bg-gray-700',
          textColor: 'text-gray-300',
          borderColor: 'border-gray-600',
        };
      case 'sent':
        return {
          label: 'Sent',
          icon: Send,
          bgColor: 'bg-blue-900/50',
          textColor: 'text-blue-300',
          borderColor: 'border-blue-700',
        };
      case 'paid':
        return {
          label: 'Paid',
          icon: CheckCircle,
          bgColor: 'bg-green-900/50',
          textColor: 'text-green-300',
          borderColor: 'border-green-700',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          icon: AlertCircle,
          bgColor: 'bg-red-900/50',
          textColor: 'text-red-300',
          borderColor: 'border-red-700',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: XCircle,
          bgColor: 'bg-gray-800',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-700',
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          bgColor: 'bg-gray-700',
          textColor: 'text-gray-300',
          borderColor: 'border-gray-600',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}