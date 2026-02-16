'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import type { InvoiceFormProps, InvoiceFormData, InvoiceItem } from '@/types';
import { calculateInvoiceTotals, calculateItemTotal } from '@/lib/calculations';
import { validateInvoiceData, validateEmail } from '@/lib/validation';

export function InvoiceForm({ invoice, extractedData, onSubmit, onCancel, isLoading = false }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(() => {
    if (invoice) {
      return {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientAddress: invoice.clientAddress || '',
        issueDate: invoice.issueDate.split('T')[0],
        dueDate: invoice.dueDate.split('T')[0],
        items: invoice.items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        taxRate: invoice.taxRate,
        notes: invoice.notes || '',
      };
    }

    if (extractedData) {
      return {
        invoiceNumber: extractedData.invoiceNumber || '',
        clientName: extractedData.clientName || '',
        clientEmail: extractedData.clientEmail || '',
        clientAddress: extractedData.clientAddress || '',
        issueDate: extractedData.issueDate ? extractedData.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: extractedData.dueDate ? extractedData.dueDate.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: extractedData.items.length > 0 ? extractedData.items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) : [{
          id: `item-${Date.now()}`,
          description: '',
          quantity: 1,
          unitPrice: 0,
        }],
        taxRate: extractedData.taxRate || 0,
        notes: '',
      };
    }

    return {
      invoiceNumber: '',
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
      }],
      taxRate: 0,
      notes: '',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totals, setTotals] = useState({ subtotal: 0, taxAmount: 0, total: 0 });

  useEffect(() => {
    const itemsForCalculation = formData.items.map(item => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
    const calculated = calculateInvoiceTotals(itemsForCalculation, formData.taxRate);
    setTotals(calculated);
  }, [formData.items, formData.taxRate]);

  const handleInputChange = (field: keyof InvoiceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleItemChange = (itemId: string, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, [field]: field === 'description' ? value : Number(value) }
          : item
      ),
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
  };

  const removeItem = (itemId: string) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateInvoiceData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!validateEmail(formData.clientEmail)) {
      setErrors(prev => ({ ...prev, clientEmail: 'Invalid email format' }));
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-300 mb-2">
            Invoice Number *
          </label>
          <input
            type="text"
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
            className={`w-full px-4 py-2 bg-gray-800 border ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="INV-001"
            disabled={isLoading}
          />
          {errors.invoiceNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.invoiceNumber}</p>
          )}
        </div>

        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-300 mb-2">
            Client Name *
          </label>
          <input
            type="text"
            id="clientName"
            value={formData.clientName}
            onChange={(e) => handleInputChange('clientName', e.target.value)}
            className={`w-full px-4 py-2 bg-gray-800 border ${errors.clientName ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Acme Corporation"
            disabled={isLoading}
          />
          {errors.clientName && (
            <p className="mt-1 text-sm text-red-500">{errors.clientName}</p>
          )}
        </div>

        <div>
          <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-300 mb-2">
            Client Email *
          </label>
          <input
            type="email"
            id="clientEmail"
            value={formData.clientEmail}
            onChange={(e) => handleInputChange('clientEmail', e.target.value)}
            className={`w-full px-4 py-2 bg-gray-800 border ${errors.clientEmail ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="client@example.com"
            disabled={isLoading}
          />
          {errors.clientEmail && (
            <p className="mt-1 text-sm text-red-500">{errors.clientEmail}</p>
          )}
        </div>

        <div>
          <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-300 mb-2">
            Client Address
          </label>
          <input
            type="text"
            id="clientAddress"
            value={formData.clientAddress}
            onChange={(e) => handleInputChange('clientAddress', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123 Main St, City, Country"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-300 mb-2">
            Issue Date *
          </label>
          <input
            type="date"
            id="issueDate"
            value={formData.issueDate}
            onChange={(e) => handleInputChange('issueDate', e.target.value)}
            className={`w-full px-4 py-2 bg-gray-800 border ${errors.issueDate ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isLoading}
          />
          {errors.issueDate && (
            <p className="mt-1 text-sm text-red-500">{errors.issueDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
            Due Date *
          </label>
          <input
            type="date"
            id="dueDate"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            className={`w-full px-4 py-2 bg-gray-800 border ${errors.dueDate ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isLoading}
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Invoice Items</h3>
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
          {formData.items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-start bg-gray-800 p-4 rounded-lg">
              <div className="col-span-12 md:col-span-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Service or product description"
                  disabled={isLoading}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Unit Price *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div className="col-span-10 md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total
                </label>
                <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400">
                  ${calculateItemTotal(item.quantity, item.unitPrice).toFixed(2)}
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={formData.items.length === 1 || isLoading}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {errors.items && (
          <p className="mt-2 text-sm text-red-500">{errors.items}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="taxRate" className="block text-sm font-medium text-gray-300 mb-2">
            Tax Rate (%) *
          </label>
          <input
            type="number"
            id="taxRate"
            min="0"
            max="100"
            step="0.01"
            value={formData.taxRate}
            onChange={(e) => handleInputChange('taxRate', Number(e.target.value))}
            className={`w-full px-4 py-2 bg-gray-800 border ${errors.taxRate ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="20"
            disabled={isLoading}
          />
          {errors.taxRate && (
            <p className="mt-1 text-sm text-red-500">{errors.taxRate}</p>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-gray-300">
            <span>Subtotal:</span>
            <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Tax ({formData.taxRate}%):</span>
            <span className="font-semibold">${totals.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white text-lg font-bold pt-2 border-t border-gray-700">
            <span>Total:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes or payment terms..."
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-4 justify-end pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}