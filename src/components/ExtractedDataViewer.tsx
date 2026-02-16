'use client';

import React, { useState } from 'react';
import { Check, X, Edit2, AlertCircle } from 'lucide-react';
import type { ExtractedDataViewerProps, ExtractedData } from '@/types';

export function ExtractedDataViewer({ extractedData, onConfirm, onCancel, onEdit }: ExtractedDataViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);

  const handleFieldEdit = (field: keyof ExtractedData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemEdit = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    const newItems = [...editedData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'description' ? value : Number(value),
    };
    setEditedData(prev => ({ ...prev, items: newItems }));
  };

  const handleConfirm = () => {
    onConfirm(editedData);
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'text-green-500 bg-green-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-red-500 bg-red-500/10';
    }
  };

  const getConfidenceText = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Extracted Invoice Data</h2>
          <p className="text-gray-400 mt-1">Review and edit the extracted information before creating the invoice</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getConfidenceColor(editedData.confidence)}`}>
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{getConfidenceText(editedData.confidence)}</span>
        </div>
      </div>

      {editedData.confidence === 'low' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-500 font-semibold">Low Confidence Extraction</h3>
              <p className="text-gray-300 text-sm mt-1">
                The extracted data may not be accurate. Please review and correct all fields before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Invoice Details</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          {isEditing ? 'View Mode' : 'Edit Mode'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Number</label>
          {isEditing ? (
            <input
              type="text"
              value={editedData.invoiceNumber || ''}
              onChange={(e) => handleFieldEdit('invoiceNumber', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="INV-001"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              {editedData.invoiceNumber || <span className="text-gray-500">Not extracted</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Client Name</label>
          {isEditing ? (
            <input
              type="text"
              value={editedData.clientName || ''}
              onChange={(e) => handleFieldEdit('clientName', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Corporation"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              {editedData.clientName || <span className="text-gray-500">Not extracted</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Client Email</label>
          {isEditing ? (
            <input
              type="email"
              value={editedData.clientEmail || ''}
              onChange={(e) => handleFieldEdit('clientEmail', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="client@example.com"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              {editedData.clientEmail || <span className="text-gray-500">Not extracted</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Client Address</label>
          {isEditing ? (
            <input
              type="text"
              value={editedData.clientAddress || ''}
              onChange={(e) => handleFieldEdit('clientAddress', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St, City, Country"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              {editedData.clientAddress || <span className="text-gray-500">Not extracted</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Issue Date</label>
          {isEditing ? (
            <input
              type="date"
              value={editedData.issueDate ? editedData.issueDate.split('T')[0] : ''}
              onChange={(e) => handleFieldEdit('issueDate', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              {editedData.issueDate ? new Date(editedData.issueDate).toLocaleDateString() : <span className="text-gray-500">Not extracted</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
          {isEditing ? (
            <input
              type="date"
              value={editedData.dueDate ? editedData.dueDate.split('T')[0] : ''}
              onChange={(e) => handleFieldEdit('dueDate', e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              {editedData.dueDate ? new Date(editedData.dueDate).toLocaleDateString() : <span className="text-gray-500">Not extracted</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={editedData.taxRate || 0}
              onChange={(e) => handleFieldEdit('taxRate', Number(e.target.value))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="20"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              {editedData.taxRate !== undefined ? `${editedData.taxRate}%` : <span className="text-gray-500">Not extracted</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Total Amount</label>
          <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
            {editedData.total !== undefined ? `$${editedData.total.toFixed(2)}` : <span className="text-gray-500">Not extracted</span>}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Invoice Items</h3>
        {editedData.items.length > 0 ? (
          <div className="space-y-4">
            {editedData.items.map((item, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemEdit(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Service or product description"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white">
                        {item.description || <span className="text-gray-500">No description</span>}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemEdit(index, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white">
                        {item.quantity}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Unit Price</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemEdit(index, 'unitPrice', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white">
                        ${item.unitPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Total</label>
                    <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-gray-400">No items extracted from the PDF</p>
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Raw Extracted Text (Preview)</h3>
        <div className="bg-gray-900 p-4 rounded-lg max-h-40 overflow-y-auto">
          <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
            {editedData.rawText.substring(0, 500)}
            {editedData.rawText.length > 500 && '...'}
          </pre>
        </div>
      </div>

      <div className="flex gap-4 justify-end pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" />
          Confirm & Create Invoice
        </button>
      </div>
    </div>
  );
}