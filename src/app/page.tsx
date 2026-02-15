'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FileText, Upload, Send, Eye, Trash2, Edit } from 'lucide-react';
import { InvoiceUpload } from '@/components/InvoiceUpload';
import type { 
  Invoice, 
  ExtractedData, 
  CreateInvoiceRequest,
  InvoiceStatus 
} from '@/types';

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 20,
    notes: ''
  });

  // Load invoices from localStorage
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem('invoices');
      if (stored) {
        setInvoices(JSON.parse(stored));
      }
    } catch (err) {
      setError('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const saveInvoices = (newInvoices: Invoice[]) => {
    localStorage.setItem('invoices', JSON.stringify(newInvoices));
    setInvoices(newInvoices);
  };

  const handleUploadComplete = (data: ExtractedData) => {
    setExtractedData(data);
    setShowUploadModal(false);
    setShowCreateModal(true);
    
    // Pre-fill form with extracted data
    setFormData({
      invoiceNumber: data.invoiceNumber || generateInvoiceNumber(),
      clientName: data.clientName || '',
      clientEmail: data.clientEmail || '',
      clientAddress: data.clientAddress || '',
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: data.items.length > 0 ? data.items : [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: data.taxRate || 20,
      notes: ''
    });
  };

  const handleUploadError = (errorMsg: string) => {
    setError(errorMsg);
    setTimeout(() => setError(null), 5000);
  };

  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  const calculateTotals = (items: Array<{ quantity: number; unitPrice: number }>, taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, taxAmount, total } = calculateTotals(formData.items, formData.taxRate);
    
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber: formData.invoiceNumber,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientAddress: formData.clientAddress,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      items: formData.items.map((item, idx) => ({
        id: `item_${idx}_${Date.now()}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      })),
      subtotal,
      taxRate: formData.taxRate,
      taxAmount,
      total,
      status: 'draft',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveInvoices([...invoices, newInvoice]);
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 20,
      notes: ''
    });
    setExtractedData(null);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      saveInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  const handleUpdateStatus = (id: string, status: InvoiceStatus) => {
    const updated = invoices.map(inv => 
      inv.id === id 
        ? { ...inv, status, updatedAt: new Date().toISOString() }
        : inv
    );
    saveInvoices(updated);
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const getStatusColor = (status: InvoiceStatus) => {
    const colors = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      paid: 'bg-green-500',
      overdue: 'bg-red-500',
      cancelled: 'bg-gray-400'
    };
    return colors[status];
  };

  const currentTotals = calculateTotals(formData.items, formData.taxRate);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold">Invoice Manager</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload PDF
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber() }));
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Total Invoices</div>
            <div className="text-3xl font-bold">{invoices.length}</div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Draft</div>
            <div className="text-3xl font-bold text-gray-400">
              {invoices.filter(i => i.status === 'draft').length}
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Sent</div>
            <div className="text-3xl font-bold text-blue-400">
              {invoices.filter(i => i.status === 'sent').length}
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <div className="text-gray-400 text-sm mb-1">Paid</div>
            <div className="text-3xl font-bold text-green-400">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Invoices</h2>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No invoices yet</p>
              <button
                onClick={() => {
                  resetForm();
                  setFormData(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber() }));
                  setShowCreateModal(true);
                }}
                className="text-blue-500 hover:text-blue-400"
              >
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4 text-sm font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{invoice.clientName}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        ${invoice.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)} text-white`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleUpdateStatus(invoice.id, 'sent')}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                              title="Mark as Sent"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {invoice.status === 'sent' && (
                            <button
                              onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
                              title="Mark as Paid"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Upload Invoice PDF</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <InvoiceUpload
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />
          </div>
        </div>
      )}

      {/* Create/Edit Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full p-6 border border-gray-800 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {extractedData ? 'Review Extracted Data' : 'Create Invoice'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Client Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Client Address
                  </label>
                  <input
                    type="text"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Line Items</h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-sm text-blue-500 hover:text-blue-400"
                  >
                    + Add Item
                  </button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                        min="0"
                        step="1"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span>${currentTotals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax ({formData.taxRate}%):</span>
                  <span>${currentTotals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-700 pt-2">
                  <span>Total:</span>
                  <span>${currentTotals.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full p-8 border border-gray-800 my-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Invoice Preview</h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-white text-gray-900 p-8 rounded-lg">
              {/* Header */}
              <div className="flex justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                  <p className="text-gray-600">#{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Issue Date</p>
                  <p className="font-medium">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 mt-2">Due Date</p>
                  <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Client Info */}
              <div className="mb-8">
                <p className="text-sm text-gray-600 mb-1">Bill To:</p>
                <p className="font-bold text-lg">{selectedInvoice.clientName}</p>
                <p className="text-gray-600">{selectedInvoice.clientEmail}</p>
                {selectedInvoice.clientAddress && (
                  <p className="text-gray-600">{selectedInvoice.clientAddress}</p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead className="border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-3">{item.description}</td>
                      <td className="text-right py-3">{item.quantity}</td>
                      <td className="text-right py-3">${item.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-3">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({selectedInvoice.taxRate}%):</span>
                    <span>${selectedInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t-2 border-gray-300 pt-2">
                    <span>Total:</span>
                    <span>${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-1">Notes:</p>
                  <p className="text-gray-700">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}