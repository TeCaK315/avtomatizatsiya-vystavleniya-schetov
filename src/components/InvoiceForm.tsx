'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, ExtractedData, InvoiceFormProps, InvoiceItem } from '@/types';
import { Plus, Trash2, Save, X } from 'lucide-react';

export function InvoiceForm({ invoice, onSave, onCancel, isLoading = false }: InvoiceFormProps) {
  const [formData, setFormData] = useState<ExtractedData>({
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    vendorName: '',
    vendorAddress: '',
    vendorEmail: '',
    vendorPhone: '',
    customerName: '',
    customerAddress: '',
    customerEmail: '',
    items: [],
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    currency: 'USD',
    notes: '',
    confidence: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (invoice.extractedData) {
      setFormData(invoice.extractedData);
    }
  }, [invoice]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (formData.vendorEmail && !isValidEmail(formData.vendorEmail)) {
      newErrors.vendorEmail = 'Invalid email format';
    }

    if (formData.customerEmail && !isValidEmail(formData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email format';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculateTotals = (items: InvoiceItem[]): { subtotal: number; taxAmount: number; totalAmount: number } => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = items.reduce((sum, item) => {
      const taxRate = item.taxRate || 0;
      return sum + (item.total * taxRate / 100);
    }, 0);
    const totalAmount = subtotal + taxAmount;

    return { subtotal, taxAmount, totalAmount };
  };

  const handleInputChange = (field: keyof ExtractedData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      taxRate: 0
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = formData.items.filter(item => item.id !== itemId);
    const totals = calculateTotals(updatedItems);

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = formData.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }

        return updatedItem;
      }
      return item;
    });

    const totals = calculateTotals(updatedItems);

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));

    const errorKey = `item_${formData.items.findIndex(i => i.id === itemId)}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-white mb-4">Invoice Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Invoice Number *
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isLoading}
            />
            {errors.invoiceNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Invoice Date *
            </label>
            <input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.invoiceDate ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isLoading}
            />
            {errors.invoiceDate && (
              <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-800 border ${errors.dueDate ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isLoading}
            />
            {errors.dueDate && (
              <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Vendor Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor Name *
              </label>
              <input
                type="text"
                value={formData.vendorName}
                onChange={(e) => handleInputChange('vendorName', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.vendorName ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.vendorName && (
                <p className="text-red-500 text-xs mt-1">{errors.vendorName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor Address
              </label>
              <textarea
                value={formData.vendorAddress}
                onChange={(e) => handleInputChange('vendorAddress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor Email
              </label>
              <input
                type="email"
                value={formData.vendorEmail || ''}
                onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.vendorEmail ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.vendorEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.vendorEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor Phone
              </label>
              <input
                type="tel"
                value={formData.vendorPhone || ''}
                onChange={(e) => handleInputChange('vendorPhone', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Customer Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.customerName ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.customerName && (
                <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Address
              </label>
              <textarea
                value={formData.customerAddress}
                onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Customer Email
              </label>
              <input
                type="email"
                value={formData.customerEmail || ''}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-800 border ${errors.customerEmail ? 'border-red-500' : 'border-gray-700'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.customerEmail && (
                <p className="text-red-500 text-xs mt-1">{errors.customerEmail}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Line Items</h3>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {errors.items && (
          <p className="text-red-500 text-sm">{errors.items}</p>
        )}

        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={item.id} className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 border ${errors[`item_${index}_description`] ? 'border-red-500' : 'border-gray-600'} rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isLoading}
                  />
                  {errors[`item_${index}_description`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 bg-gray-700 border ${errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-600'} rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isLoading}
                  />
                  {errors[`item_${index}_quantity`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 bg-gray-700 border ${errors[`item_${index}_unitPrice`] ? 'border-red-500' : 'border-gray-600'} rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={isLoading}
                  />
                  {errors[`item_${index}_unitPrice`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_unitPrice`]}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.taxRate || 0}
                    onChange={(e) => handleItemChange(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>

                <div className="md:col-span-1 flex items-end">
                  <div className="text-right w-full">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Total
                    </label>
                    <div className="text-white font-medium">
                      ${item.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-4 mt-4">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span className="font-medium">${formData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Tax:</span>
              <span className="font-medium">${formData.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white text-lg font-semibold border-t border-gray-700 pt-2">
              <span>Total:</span>
              <span>${formData.totalAmount.toFixed(2)} {formData.currency}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes or comments..."
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
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
          {isLoading ? 'Saving...' : 'Save Invoice'}
        </button>
      </div>
    </form>
  );
}