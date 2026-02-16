import { NextRequest, NextResponse } from 'next/server';
import { GetStatsResponse, DashboardStats, Invoice } from '@/types';
import { StorageService } from '@/lib/storage';

export async function GET(_request : NextRequest) {
  try {
    const storage = new StorageService();
    const invoices = storage.getInvoices();

    // Calculate total invoices
    const totalInvoices = invoices.length;

    // Calculate total revenue (sum of all paid invoices)
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);

    // Count invoices by status
    const pendingInvoices = invoices.filter(
      invoice => invoice.status === 'sent' || invoice.status === 'draft'
    ).length;

    const paidInvoices = invoices.filter(
      invoice => invoice.status === 'paid'
    ).length;

    // Calculate overdue invoices (sent invoices past due date)
    const now = new Date();
    const overdueInvoices = invoices.filter(invoice => {
      if (invoice.status !== 'sent') return false;
      const dueDate = new Date(invoice.dueDate);
      return dueDate < now;
    }).length;

    // Get recent invoices (last 5, sorted by creation date)
    const recentInvoices = [...invoices]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    const stats: DashboardStats = {
      totalInvoices,
      totalRevenue,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      recentInvoices,
    };

    const response: GetStatsResponse = {
      success: true,
      stats,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching stats:', error);

    const response: GetStatsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    };

    return NextResponse.json(response, { status: 500 });
  }
}