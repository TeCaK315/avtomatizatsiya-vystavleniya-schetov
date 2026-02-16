'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save, X } from 'lucide-react';
import { Invoice, Client, CreateInvoiceRequest, GetInvoiceResponse, GetClientsResponse, UpdateInvoiceResponse } from '@/types';
import InvoiceForm from '@/components/InvoiceForm';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [invoiceRes, clientsRes] = await Promise.all([
          fetch(`/api/invoices/${invoiceId}`),
          fetch('/api/clients')
        ]);

        if (!invoiceRes.ok) {
          throw new Error('Failed to fetch invoice');
        }

        if (!clientsRes.ok) {
          throw new Error('Failed to fetch clients');
        }

        const invoiceData: GetInvoiceResponse = await invoiceRes.json();
        const clientsData: GetClientsResponse = await clientsRes.json();

        if (!invoiceData.success || !invoiceData.invoice) {
          throw new Error(invoiceData.error || 'Invoice not found');
        }

        if (!clientsData.success) {
          throw new Error(clientsData.error || 'Failed to load clients');
        }

        setInvoice(invoiceData.invoice);
        setClients(clientsData.clients);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoiceId]);

  const handleSubmit = async (data: CreateInvoiceRequest) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: UpdateInvoiceResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update invoice');
      }

      router.push(`/invoices/${invoiceId}`);
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/invoices/${invoiceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-gray-400">Loading invoice...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Error</h2>
                  <p className="text-sm text-gray-400">Failed to load invoice</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">{error || 'Invoice not found'}</p>
              <button
                onClick={() => router.push('/invoices')}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/invoices/${invoiceId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoice
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Edit Invoice</h1>
              <p className="text-gray-400">
                Editing invoice {invoice.invoiceNumber}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-6">
          <InvoiceForm
            invoice={invoice}
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={submitting}
          />
        </div>
      </div>
    </div>
  );
}