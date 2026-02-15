'use client';

import React from 'react';
import type { BadgeProps, InvoiceStatus } from '@/types';

export function Badge({ status, size = 'md' }: BadgeProps) {
  const statusConfig: Record<
    InvoiceStatus,
    { label: string; bgColor: string; textColor: string; dotColor: string }
  > = {
    draft: {
      label: 'Draft',
      bgColor: 'bg-gray-800',
      textColor: 'text-gray-300',
      dotColor: 'bg-gray-500',
    },
    sent: {
      label: 'Sent',
      bgColor: 'bg-blue-900/30',
      textColor: 'text-blue-400',
      dotColor: 'bg-blue-500',
    },
    paid: {
      label: 'Paid',
      bgColor: 'bg-green-900/30',
      textColor: 'text-green-400',
      dotColor: 'bg-green-500',
    },
    overdue: {
      label: 'Overdue',
      bgColor: 'bg-red-900/30',
      textColor: 'text-red-400',
      dotColor: 'bg-red-500',
    },
    cancelled: {
      label: 'Cancelled',
      bgColor: 'bg-gray-800',
      textColor: 'text-gray-400',
      dotColor: 'bg-gray-600',
    },
  };

  const config = statusConfig[status];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${config.bgColor} ${config.textColor} rounded-full font-medium`}
    >
      <span className={`${dotSizeClasses[size]} ${config.dotColor} rounded-full`} />
      {config.label}
    </span>
  );
}