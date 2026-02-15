'use client';

import React, { useMemo } from 'react';
import { InvoiceStatsProps, InvoiceStatus } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter(inv => inv.status === InvoiceStatus.PAID).length;
    const pending = invoices.filter(inv => inv.status === InvoiceStatus.SENT).length;
    const overdue = invoices.filter(inv => inv.status === InvoiceStatus.OVERDUE).length;
    const draft = invoices.filter(inv => inv.status === InvoiceStatus.DRAFT).length;

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = invoices
      .filter(inv => inv.status === InvoiceStatus.SENT)
      .reduce((sum, inv) => sum + inv.total, 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      total,
      paid,
      pending,
      overdue,
      draft,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
    };
  }, [invoices]);

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.total,
      amount: stats.totalAmount,
      icon: FileText,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Paid',
      value: stats.paid,
      amount: stats.paidAmount,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Pending',
      value: stats.pending,
      amount: stats.pendingAmount,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      amount: stats.overdueAmount,
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.title}</div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-800">
              <div className="text-lg font-semibold text-white">
                {formatCurrency(stat.amount)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total Amount</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default InvoiceStats;
