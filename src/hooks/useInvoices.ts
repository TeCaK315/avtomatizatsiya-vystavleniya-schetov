import { useState, useEffect, useCallback } from 'react';
import {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  SendInvoiceRequest,
  UseInvoicesReturn,
  InvoiceListResponse,
  CreateInvoiceResponse,
  UpdateInvoiceResponse,
  DeleteInvoiceResponse,
  SendInvoiceResponse,
} from '@/types';

export const useInvoices = (): UseInvoicesReturn => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/invoices');
      const data: InvoiceListResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }

      if (data.success) {
        setInvoices(data.invoices);
      } else {
        throw new Error(data.error || 'Failed to fetch invoices');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  const createInvoice = useCallback(
    async (data: CreateInvoiceRequest): Promise<Invoice | null> => {
      setError(null);

      try {
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result: CreateInvoiceResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create invoice');
        }

        if (result.success && result.invoice) {
          setInvoices((prev) => [result.invoice!, ...prev]);
          return result.invoice;
        } else {
          throw new Error(result.error || 'Failed to create invoice');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error creating invoice:', err);
        return null;
      }
    },
    []
  );

  const updateInvoice = useCallback(
    async (id: string, data: UpdateInvoiceRequest): Promise<Invoice | null> => {
      setError(null);

      try {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result: UpdateInvoiceResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update invoice');
        }

        if (result.success && result.invoice) {
          setInvoices((prev) =>
            prev.map((inv) => (inv.id === id ? result.invoice! : inv))
          );
          return result.invoice;
        } else {
          throw new Error(result.error || 'Failed to update invoice');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error updating invoice:', err);
        return null;
      }
    },
    []
  );

  const deleteInvoice = useCallback(async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      const result: DeleteInvoiceResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete invoice');
      }

      if (result.success) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete invoice');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error deleting invoice:', err);
      return false;
    }
  }, []);

  const sendInvoice = useCallback(
    async (id: string, options?: Partial<SendInvoiceRequest>): Promise<boolean> => {
      setError(null);

      try {
        const requestBody: SendInvoiceRequest = {
          invoiceId: id,
          ...options,
        };

        const response = await fetch('/api/invoices/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const result: SendInvoiceResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to send invoice');
        }

        if (result.success) {
          setInvoices((prev) =>
            prev.map((inv) =>
              inv.id === id ? { ...inv, status: 'sent' as const } : inv
            )
          );
          return true;
        } else {
          throw new Error(result.error || 'Failed to send invoice');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error sending invoice:', err);
        return false;
      }
    },
    []
  );

  return {
    invoices,
    isLoading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    refreshInvoices,
  };
};