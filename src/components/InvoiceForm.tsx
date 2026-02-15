'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import {
  InvoiceFormProps,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  Contact,
  InvoiceItem,
  InvoiceStatus,
  PaymentMethod
} from '@/types';
import { validateEmail, validateAmount } from '@/lib/validators';
import { formatCurrency } from '@/lib/formatters';
import { calculateLineItemTotal, calculateInvoiceTotal } from '@/lib/invoice-calculator';

export function InvoiceForm({ invoice, onSubmit, onCancel, isLoading = false }: InvoiceFormProps) {
  const [from, setFrom] = useState<Contact>({
    name: invoice?.from.name || '',
    email: invoice?.from.email || '',
    phone: invoice?.from.phone || '',
    address: invoice?.from.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    taxId: invoice?.from.taxId || ''
  });

  const [to, setTo] = useState<Contact>({
    name: invoice?.to.name || '',
    email: invoice?.to.email || '',
    phone: invoice?.to.phone || '',
    address: invoice?.to.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    taxId: invoice?.to.taxId || ''
  });

  const [items, setItems] = useState<Omit<InvoiceItem, 'id' | 'total'>[]>(
    invoice?.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate
    })) || [
      { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }
    ]
  );

  const [dueDate, setDueDate] = useState<string>(
    invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [taxRate, setTaxRate] = useState<number>(invoice?.taxRate || 0);
  const [notes, setNotes] = useState<string>(invoice?.notes || '');
  const [terms, setTerms] = useState<string>(invoice?.terms || '');
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || InvoiceStatus.DRAFT);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(invoice?.paymentMethod);
  const [paidDate, setPaidDate] = useState<string>(invoice?.paidDate || '');
  const [paidAmount, setPaidAmount] = useState<number>(invoice?.paidAmount || 0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totals = calculateInvoiceTotal(
    items.map((item, index) => ({
      id: `temp-${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate || 0,
      total: calculateLineItemTotal(item.quantity, item.unitPrice, item.taxRate)
    })),
    taxRate
  );

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Omit<InvoiceItem, 'id' | 'total'>, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!from.name.trim()) newErrors.fromName = 'Sender name is required';
    if (!from.email.trim()) newErrors.fromEmail = 'Sender email is required';
    else if (!validateEmail(from.email)) newErrors.fromEmail = 'Invalid sender email';

    if (!to.name.trim()) newErrors.toName = 'Recipient name is required';
    if (!to.email.trim()) newErrors.toEmail = 'Recipient email is required';
    else if (!validateEmail(to.email)) newErrors.toEmail = 'Invalid recipient email';

    if (!dueDate) newErrors.dueDate = 'Due date is required';

    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item${index}Description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item${index}Quantity`] = 'Quantity must be greater than 0';
      }
      if (!validateAmount(item.unitPrice)) {
        newErrors[`item${index}UnitPrice`] = 'Invalid unit price';
      }
    });

    if (taxRate < 0 || taxRate > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateInvoiceRequest | UpdateInvoiceRequest = invoice
      ? {
          from,
          to,
          items,
          dueDate,
          status,
          taxRate,
          notes: notes || undefined,
          terms: terms || undefined,
          paymentMethod: paymentMethod || undefined,
          paidDate: paidDate || undefined,
          paidAmount: paidAmount > 0 ? paidAmount : undefined
        }
      : {
          from,
          to,
          items,
          dueDate,
          taxRate,
          notes: notes || undefined,
          terms: terms || undefined
        };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* From Section */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">From (Your Details)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={from.name}
              onChange={(e) => setFrom({ ...from, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.fromName && <p className="text-red-400 text-sm mt-1">{errors.fromName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              value={from.email}
              onChange={(e) => setFrom({ ...from, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.fromEmail && <p className="text-red-400 text-sm mt-1">{errors.fromEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={from.phone || ''}
              onChange={(e) => setFrom({ ...from, phone: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tax ID</label>
            <input
              type="text"
              value={from.taxId || ''}
              onChange={(e) => setFrom({ ...from, taxId: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* To Section */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">To (Client Details)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              type="text"
              value={to.name}
              onChange={(e) => setTo({ ...to, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.toName && <p className="text-red-400 text-sm mt-1">{errors.toName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              value={to.email}
              onChange={(e) => setTo({ ...to, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.toEmail && <p className="text-red-400 text-sm mt-1">{errors.toEmail}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={to.phone || ''}
              onChange={(e) => setTo({ ...to, phone: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tax ID</label>
            <input
              type="text"
              value={to.taxId || ''}
              onChange={(e) => setTo({ ...to, taxId: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Invoice Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.dueDate && <p className="text-red-400 text-sm mt-1">{errors.dueDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.taxRate && <p className="text-red-400 text-sm mt-1">{errors.taxRate}</p>}
          </div>
          {invoice && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value={InvoiceStatus.DRAFT}>Draft</option>
                  <option value={InvoiceStatus.SENT}>Sent</option>
                  <option value={InvoiceStatus.PAID}>Paid</option>
                  <option value={InvoiceStatus.OVERDUE}>Overdue</option>
                  <option value={InvoiceStatus.CANCELLED}>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                <select
                  value={paymentMethod || ''}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod || undefined)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Not specified</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                  <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
                  <option value={PaymentMethod.PAYPAL}>PayPal</option>
                  <option value={PaymentMethod.CASH}>Cash</option>
                </select>
              </div>
              {status === InvoiceStatus.PAID && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Paid Date</label>
                    <input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Paid Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Line Items</h3>
          <button
            type="button"
            onClick={addItem}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  {errors[`item${index}Description`] && (
                    <p className="text-red-400 text-sm mt-1">{errors[`item${index}Description`]}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantity *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  {errors[`item${index}Quantity`] && (
                    <p className="text-red-400 text-sm mt-1">{errors[`item${index}Quantity`]}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Unit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  {errors[`item${index}UnitPrice`] && (
                    <p className="text-red-400 text-sm mt-1">{errors[`item${index}UnitPrice`]}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total</label>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white">
                    {formatCurrency(calculateLineItemTotal(item.quantity, item.unitPrice, item.taxRate))}
                  </div>
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1 || isLoading}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="space-y-2 max-w-md ml-auto">
          <div className="flex justify-between text-gray-300">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Tax ({taxRate}%):</span>
            <span className="font-semibold">{formatCurrency(totals.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-gray-700">
            <span>Total:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              placeholder="Additional notes for the client..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Terms & Conditions</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              placeholder="Payment terms, late fees, etc..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
export default InvoiceForm;
