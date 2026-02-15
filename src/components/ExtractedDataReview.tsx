'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit2, Plus, Trash2 } from 'lucide-react';
import { ExtractedDataReviewProps, CreateInvoiceRequest, InvoiceFormData, InvoiceFormErrors } from '@/types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { calculateLineTotal } from '@/lib/calculations';

export function ExtractedDataReview({
  data,
  onConfirm,
  onCancel,
  isOpen,
}: ExtractedDataReviewProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    issueDate: '',
    dueDate: '',
    items: [],
    taxRate: '',
    notes: '',
  });

  const [errors, setErrors] = useState<InvoiceFormErrors>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
      // Convert extracted data to form data
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      setFormData({
        invoiceNumber: data.invoiceNumber || generateInvoiceNumber(),
        clientName: data.clientName || '',
        clientEmail: data.clientEmail || '',
        clientAddress: data.clientAddress || '',
        issueDate: data.issueDate || today,
        dueDate: data.dueDate || dueDateStr,
        items: data.items.map((item, index) => ({
          id: `item-${index}`,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
        })),
        taxRate: data.taxRate?.toString() || '0',
        notes: '',
      });
      setErrors({});
      setIsEditing(false);
    }
  }, [isOpen, data]);

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleItemChange = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
    if (errors.items?.[index]?.[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.items) {
          newErrors.items[index] = { ...newErrors.items[index], [field]: undefined };
        }
        return newErrors;
      });
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          description: '',
          quantity: '1',
          unitPrice: '0',
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

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

    const taxRate = parseFloat(formData.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    if (formData.items.length === 0) {
      newErrors.items = [{ description: 'At least one item is required' }];
    } else {
      const itemErrors: Array<{ description?: string; quantity?: string; unitPrice?: string }> = [];
      formData.items.forEach((item, index) => {
        const itemError: { description?: string; quantity?: string; unitPrice?: string } = {};
        
        if (!item.description.trim()) {
          itemError.description = 'Description is required';
        }

        const quantity = parseFloat(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          itemError.quantity = 'Quantity must be greater than 0';
        }

        const unitPrice = parseFloat(item.unitPrice);
        if (isNaN(unitPrice) || unitPrice < 0) {
          itemError.unitPrice = 'Unit price must be 0 or greater';
        }

        if (Object.keys(itemError).length > 0) {
          itemErrors[index] = itemError;
        }
      });

      if (itemErrors.length > 0) {
        newErrors.items = itemErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      return;
    }

    const requestData: CreateInvoiceRequest = {
      invoiceNumber: formData.invoiceNumber.trim(),
      clientName: formData.clientName.trim(),
      clientEmail: formData.clientEmail.trim(),
      clientAddress: formData.clientAddress.trim() || undefined,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      items: formData.items.map(item => ({
        description: item.description.trim(),
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
      taxRate: parseFloat(formData.taxRate),
      notes: formData.notes.trim() || undefined,
    };

    onConfirm(requestData);
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + calculateLineTotal(quantity, unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(formData.taxRate) || 0;
    return (subtotal * taxRate) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const confidenceColor = data.confidence >= 0.8 ? 'text-green-400' : data.confidence >= 0.5 ? 'text-yellow-400' : 'text-red-400';
  const confidenceIcon = data.confidence >= 0.8 ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="xl" title="Review Extracted Data">
      <div className="flex flex-col h-full">
        {/* Confidence Score */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={confidenceColor}>{confidenceIcon}</span>
              <span className="text-sm font-medium text-gray-300">
                Extraction Confidence: {Math.round(data.confidence * 100)}%
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              {isEditing ? 'View Mode' : 'Edit Mode'}
            </Button>
          </div>
          {data.confidence < 0.8 && (
            <p className="text-sm text-gray-400 mt-2">
              Please review and correct the extracted data before creating the invoice.
            </p>
          )}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              value={formData.invoiceNumber}
              onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
              error={errors.invoiceNumber}
              disabled={!isEditing}
            />
            <Input
              label="Tax Rate (%)"
              type="number"
              value={formData.taxRate}
              onChange={(e) => handleInputChange('taxRate', e.target.value)}
              error={errors.taxRate}
              disabled={!isEditing}
              min="0"
              max="100"
              step="0.01"
            />
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase">Client Information</h3>
            <Input
              label="Client Name"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              error={errors.clientName}
              disabled={!isEditing}
            />
            <Input
              label="Client Email"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              error={errors.clientEmail}
              disabled={!isEditing}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Address (Optional)
              </label>
              <textarea
                value={formData.clientAddress}
                onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleInputChange('issueDate', e.target.value)}
              error={errors.issueDate}
              disabled={!isEditing}
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              error={errors.dueDate}
              disabled={!isEditing}
            />
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300 uppercase">Line Items</h3>
              {isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddItem}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Item
                </Button>
              )}
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No items found. Click "Add Item" to add line items.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-400">Item {index + 1}</span>
                      {isEditing && formData.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Input
                        label="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        error={errors.items?.[index]?.description}
                        disabled={!isEditing}
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          label="Quantity"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          error={errors.items?.[index]?.quantity}
                          disabled={!isEditing}
                          min="0"
                          step="0.01"
                        />
                        <Input
                          label="Unit Price"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          error={errors.items?.[index]?.unitPrice}
                          disabled={!isEditing}
                          min="0"
                          step="0.01"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-semibold">
                            {formatCurrency(calculateLineTotal(parseFloat(item.quantity) || 0, parseFloat(item.unitPrice) || 0))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={!isEditing}
              rows={3}
              placeholder="Add any additional notes or payment terms..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 uppercase mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tax ({formData.taxRate}%)</span>
                <span className="font-semibold">{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex justify-between text-white text-lg font-bold pt-2 border-t border-gray-700">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Create Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
}