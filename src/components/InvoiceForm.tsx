'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import type { InvoiceFormProps, InvoiceFormData, InvoiceFormErrors, CreateInvoiceRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateLineTotal } from '@/lib/calculations';

export function InvoiceForm({ initialData, onSubmit, onCancel, isLoading = false }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: initialData?.invoiceNumber || '',
    clientName: initialData?.clientName || '',
    clientEmail: initialData?.clientEmail || '',
    clientAddress: initialData?.clientAddress || '',
    issueDate: initialData?.issueDate ? initialData.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate ? initialData.dueDate.split('T')[0] : '',
    items: initialData?.items?.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
    })) || [{
      id: crypto.randomUUID(),
      description: '',
      quantity: '1',
      unitPrice: '0',
    }],
    taxRate: initialData?.taxRate?.toString() || '0',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<InvoiceFormErrors>({});
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let calculatedSubtotal = 0;
    formData.items.forEach(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      calculatedSubtotal += calculateLineTotal(quantity, unitPrice);
    });

    const taxRate = parseFloat(formData.taxRate) || 0;
    const calculatedTaxAmount = (calculatedSubtotal * taxRate) / 100;
    const calculatedTotal = calculatedSubtotal + calculatedTaxAmount;

    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTaxAmount);
    setTotal(calculatedTotal);
  }, [formData.items, formData.taxRate]);

  const validateForm = (): boolean => {
    const newErrors: InvoiceFormErrors = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Invalid email format';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) < new Date(formData.issueDate)) {
      newErrors.dueDate = 'Due date must be after issue date';
    }

    const itemErrors: Array<{ description?: string; quantity?: string; unitPrice?: string }> = [];
    let hasItemErrors = false;

    formData.items.forEach((item, index) => {
      const itemError: { description?: string; quantity?: string; unitPrice?: string } = {};

      if (!item.description.trim()) {
        itemError.description = 'Description is required';
        hasItemErrors = true;
      }

      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        itemError.quantity = 'Quantity must be greater than 0';
        hasItemErrors = true;
      }

      const unitPrice = parseFloat(item.unitPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        itemError.unitPrice = 'Unit price must be 0 or greater';
        hasItemErrors = true;
      }

      itemErrors[index] = itemError;
    });

    if (hasItemErrors) {
      newErrors.items = itemErrors;
    }

    const taxRate = parseFloat(formData.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const requestData: CreateInvoiceRequest = {
      invoiceNumber: formData.invoiceNumber.trim(),
      clientName: formData.clientName.trim(),
      clientEmail: formData.clientEmail.trim(),
      clientAddress: formData.clientAddress.trim() || undefined,
      issueDate: new Date(formData.issueDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      items: formData.items.map(item => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
      taxRate: parseFloat(formData.taxRate),
      notes: formData.notes.trim() || undefined,
    };

    await onSubmit(requestData);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          description: '',
          quantity: '1',
          unitPrice: '0',
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length === 1) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceFormData['items'][0], value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Invoice Number"
          value={formData.invoiceNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
          error={errors.invoiceNumber}
          placeholder="INV-001"
          disabled={isLoading}
          required
        />

        <Input
          label="Tax Rate (%)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={formData.taxRate}
          onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
          error={errors.taxRate}
          placeholder="20"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Client Information</h3>
        
        <Input
          label="Client Name"
          value={formData.clientName}
          onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
          error={errors.clientName}
          placeholder="Acme Corporation"
          disabled={isLoading}
          required
        />

        <Input
          label="Client Email"
          type="email"
          value={formData.clientEmail}
          onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
          error={errors.clientEmail}
          placeholder="client@example.com"
          disabled={isLoading}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Client Address
          </label>
          <textarea
            value={formData.clientAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
            placeholder="123 Main St, City, State, ZIP"
            disabled={isLoading}
            rows={3}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Issue Date"
          type="date"
          value={formData.issueDate}
          onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
          error={errors.issueDate}
          disabled={isLoading}
          required
        />

        <Input
          label="Due Date"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
          error={errors.dueDate}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Line Items</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddItem}
            disabled={isLoading}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={item.id} className="bg-gray-800 p-4 rounded-lg space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    error={errors.items?.[index]?.description}
                    placeholder="Product or service description"
                    disabled={isLoading}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      error={errors.items?.[index]?.quantity}
                      placeholder="1"
                      disabled={isLoading}
                      required
                    />

                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      error={errors.items?.[index]?.unitPrice}
                      placeholder="0.00"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <span className="text-sm text-gray-400">Line Total:</span>
                    <span className="text-lg font-semibold text-white">
                      ${calculateLineTotal(parseFloat(item.quantity) || 0, parseFloat(item.unitPrice) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    disabled={isLoading}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg space-y-3">
        <div className="flex items-center justify-between text-gray-300">
          <span>Subtotal:</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-300">
          <span>Tax ({formData.taxRate}%):</span>
          <span className="font-semibold">${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-white text-xl font-bold pt-3 border-t border-gray-700">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes or payment terms..."
          disabled={isLoading}
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-800">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          leftIcon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {initialData ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}