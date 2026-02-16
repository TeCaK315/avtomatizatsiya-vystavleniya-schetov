'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Upload, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { Invoice, DashboardStats } from '@/types';
import { InvoiceList } from '@/components/InvoiceList';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, invoicesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/invoices?limit=5&sortBy=createdAt&sortOrder=desc')
      ]);

      if (!statsRes.ok || !invoicesRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const statsData = await statsRes.json();
      const invoicesData = await invoicesRes.json();

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }

      if (invoicesData.success && invoicesData.invoices) {
        setRecentInvoices(invoicesData.invoices);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    router.push('/invoices/new');
  };

  const handleUploadPDF = () => {
    router.push('/upload');
  };

  const handleViewAllInvoices = () => {
    router.push('/invoices');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete invoice');
      }

      await loadDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error('Failed to send invoice');
      }

      alert('Invoice sent successfully!');
      await loadDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invoice');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Invoice Dashboard</h1>
          <p className="text-gray-400">Manage your invoices and track payments</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleCreateInvoice}
            className="bg-blue-600 hover:bg-blue-700 p-6 rounded-lg flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Create New Invoice</h3>
                <p className="text-blue-200 text-sm">Start from scratch</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleUploadPDF}
            className="bg-purple-600 hover:bg-purple-700 p-6 rounded-lg flex items-center justify-between transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">Upload PDF Invoice</h3>
                <p className="text-purple-200 text-sm">Extract data automatically</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Invoices"
            value={stats?.totalInvoices || 0}
            icon={<FileText className="w-6 h-6 text-blue-500" />}
            loading={loading}
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
            loading={loading}
          />
          <StatsCard
            title="Paid Invoices"
            value={stats?.paidInvoices || 0}
            icon={<CheckCircle className="w-6 h-6 text-green-500" />}
            loading={loading}
          />
          <StatsCard
            title="Overdue"
            value={stats?.overdueInvoices || 0}
            icon={<AlertCircle className="w-6 h-6 text-red-500" />}
            loading={loading}
          />
        </div>

        {/* Status Overview */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Invoice Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Pending</span>
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.pendingInvoices || 0}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Paid</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.paidInvoices || 0}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Overdue</span>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.overdueInvoices || 0}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalInvoices || 0}</p>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Invoices</h2>
            <button
              onClick={handleViewAllInvoices}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-sm transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
              <p className="text-gray-400 mb-6">Create your first invoice to get started</p>
              <button
                onClick={handleCreateInvoice}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Invoice
              </button>
            </div>
          ) : (
            <InvoiceList
              invoices={recentInvoices}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
              onSend={handleSendInvoice}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}