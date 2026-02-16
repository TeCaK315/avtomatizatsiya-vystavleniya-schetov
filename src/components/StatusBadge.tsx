'use client';

import React from 'react';
import { StatusBadgeProps, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/types';

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const colorClasses = INVOICE_STATUS_COLORS[status];
  const label = INVOICE_STATUS_LABELS[status];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${colorClasses}`}
    >
      {label}
    </span>
  );
}