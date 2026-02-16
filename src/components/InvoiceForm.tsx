'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import {
  InvoiceFormProps,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceItem,
  Client,
} from '@/types';
import { ClientSelector } from './ClientSelector';

export function InvoiceForm({
  invoice,
  clients,
  onSubmit,
  onCancel,
  loading = false,
}: InvoiceFormProps) {
  const [clientId, setClientId] = useState<string>(invoice?.clientId || '');
  const [items, setItems] = useState<
    Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>
  >(
    invoice?.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })) || [
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 20,
      },
    ]
  );
  const [discountAmount, setDiscountAmount] = useState<number>(
    invoice?.discountAmount || 0
  );
  const [discountPercent, setDiscountPercent] = useState<number>(
    invoice?.discountPercent || 0
  );
  const [currency, setCurrency] = useState<string>(invoice?.currency || 'USD');
  const [issueDate, setIssueDate] = useState<string>(
    invoice?.issueDate
      ? new Date(invoice.issueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    invoice?.dueDate
      ? new Date(invoice.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
  );
  const [notes, setNotes] = useState<string>(invoice?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateItemTotal = (
    quantity: number,
    unitPrice: number,
    taxRate: number
  ): number => {
    return quantity * unitPrice * (1 + taxRate / 100);
  };

  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
  };

  const calculateTax = (): number => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice * (item.taxRate / 100);
    }, 0);
  };

  const calculateDiscount = (): number => {
    const subtotal = calculateSubtotal();
    if (discountPercent > 0) {
      return subtotal * (discountPercent / 100);
    }
    return discountAmount;
  };

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discount = calculateDiscount();
    return subtotal + tax - discount;
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 20,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof typeof items[0],
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientId) {
      newErrors.clientId = 'Please select a client';
    }

    if (!issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      newErrors.dueDate = 'Due date must be after issue date';
    }

    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative';
      }
      if (item.taxRate < 0 || item.taxRate > 100) {
        newErrors[`item_${index}_taxRate`] = 'Tax rate must be between 0 and 100';
      }
    });

    if (discountPercent < 0 || discountPercent > 100) {
      newErrors.discountPercent = 'Discount percent must be between 0 and 100';
    }

    if (discountAmount < 0) {
      newErrors.discountAmount = 'Discount amount cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateInvoiceRequest | UpdateInvoiceRequest = {
      clientId,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
      discountAmount,
      discountPercent,
      currency,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      notes,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Client Information</h3>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Client *
          </label>
          <ClientSelector
            clients={clients}
            selectedClientId={clientId}
            onSelect={setClientId}
            loading={loading}
          />
          {errors.clientId && (
            <p className="mt-1 text-sm text-red-400">{errors.clientId}</p>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Invoice Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Issue Date *
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            {errors.issueDate && (
              <p className="mt-1 text-sm text-red-400">{errors.issueDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-400">{errors.dueDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Line Items</h3>
          <button
            type="button"
            onClick={addItem}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-800 rounded-lg border border-gray-700"
            >
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, 'description', e.target.value)
                  }
                  placeholder="Item description"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                {errors[`item_${index}_description`] && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors[`item_${index}_description`]}
                  </p>
                )}
              </div>

              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                {errors[`item_${index}_quantity`] && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors[`item_${index}_quantity`]}
                  </p>
                )}
              </div>

              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Unit Price *
                </label>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                {errors[`item_${index}_unitPrice`] && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors[`item_${index}_unitPrice`]}
                  </p>
                )}
              </div>

              <div className="col-span-3 md:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={item.taxRate}
                  onChange={(e) =>
                    updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                {errors[`item_${index}_taxRate`] && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors[`item_${index}_taxRate`]}
                  </p>
                )}
              </div>

              <div className="col-span-4 md:col-span-1 flex flex-col">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Total
                </label>
                <div className="flex items-center h-10 text-sm text-gray-300">
                  {calculateItemTotal(
                    item.quantity,
                    item.unitPrice,
                    item.taxRate
                  ).toFixed(2)}
                </div>
              </div>

              <div className="col-span-1 flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1 || loading}
                  className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discounts */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Discounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discount Amount ({currency})
            </label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => {
                setDiscountAmount(parseFloat(e.target.value) || 0);
                setDiscountPercent(0);
              }}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || discountPercent > 0}
            />
            {errors.discountAmount && (
              <p className="mt-1 text-sm text-red-400">{errors.discountAmount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discount Percent (%)
            </label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => {
                setDiscountPercent(parseFloat(e.target.value) || 0);
                setDiscountAmount(0);
              }}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || discountAmount > 0}
            />
            {errors.discountPercent && (
              <p className="mt-1 text-sm text-red-400">{errors.discountPercent}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes or payment terms..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={loading}
        />
      </div>

      {/* Summary */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>Subtotal:</span>
            <span>
              {currency} {calculateSubtotal().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Tax:</span>
            <span>
              {currency} {calculateTax().toFixed(2)}
            </span>
          </div>
          {(discountAmount > 0 || discountPercent > 0) && (
            <div className="flex justify-between text-gray-300">
              <span>Discount:</span>
              <span className="text-red-400">
                -{currency} {calculateDiscount().toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-700">
            <span>Total:</span>
            <span>
              {currency} {calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
export default InvoiceForm;
