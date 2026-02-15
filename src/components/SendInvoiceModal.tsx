'use client';

import React, { useState } from 'react';
import { X, Mail, Send, Plus, Trash2, FileText } from 'lucide-react';
import type { SendInvoiceModalProps } from '@/types';

export function SendInvoiceModal({
  invoice,
  isOpen,
  onClose,
  onSend,
  isSending = false
}: SendInvoiceModalProps) {
  const [recipients, setRecipients] = useState<string[]>(
    invoice.extractedData?.customerEmail ? [invoice.extractedData.customerEmail] : ['']
  );
  const [subject, setSubject] = useState(
    `Invoice ${invoice.extractedData?.invoiceNumber || invoice.fileName}`
  );
  const [message, setMessage] = useState(
    `Dear ${invoice.extractedData?.customerName || 'Customer'},\n\nPlease find attached invoice ${invoice.extractedData?.invoiceNumber || invoice.fileName}.\n\nTotal Amount: ${invoice.extractedData?.currency || '$'}${invoice.extractedData?.totalAmount?.toFixed(2) || '0.00'}\nDue Date: ${invoice.extractedData?.dueDate || 'N/A'}\n\nThank you for your business.\n\nBest regards`
  );
  const [errors, setErrors] = useState<{ [key: number]: string }>({});

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length > 1) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);

    const newErrors = { ...errors };
    if (value && !validateEmail(value)) {
      newErrors[index] = 'Invalid email address';
    } else {
      delete newErrors[index];
    }
    setErrors(newErrors);
  };

  const handleSend = async () => {
    const validRecipients = recipients.filter(r => r.trim() !== '');
    const newErrors: { [key: number]: string } = {};
    let hasErrors = false;

    validRecipients.forEach((email, index) => {
      if (!validateEmail(email)) {
        newErrors[index] = 'Invalid email address';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    if (validRecipients.length === 0) {
      setErrors({ 0: 'At least one recipient is required' });
      return;
    }

    try {
      await onSend(validRecipients, subject, message);
      onClose();
    } catch (error) {
      console.error('Failed to send invoice:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSending) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Send Invoice</h2>
              <p className="text-sm text-gray-400 mt-1">
                {invoice.fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Invoice Preview */}
          {invoice.extractedData && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-400 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white">
                      Invoice #{invoice.extractedData.invoiceNumber}
                    </h3>
                    <span className="text-lg font-semibold text-blue-400">
                      {invoice.extractedData.currency}{invoice.extractedData.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">From:</span>
                      <p className="text-white truncate">{invoice.extractedData.vendorName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">To:</span>
                      <p className="text-white truncate">{invoice.extractedData.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Date:</span>
                      <p className="text-white">{invoice.extractedData.invoiceDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Due:</span>
                      <p className="text-white">{invoice.extractedData.dueDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipients
            </label>
            <div className="space-y-2">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => handleRecipientChange(index, e.target.value)}
                      placeholder="recipient@example.com"
                      disabled={isSending}
                      className={`w-full px-4 py-2 bg-gray-800 border ${
                        errors[index] ? 'border-red-500' : 'border-gray-700'
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
                    />
                    {errors[index] && (
                      <p className="text-red-400 text-xs mt-1">{errors[index]}</p>
                    )}
                  </div>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => handleRemoveRecipient(index)}
                      disabled={isSending}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={handleAddRecipient}
              disabled={isSending}
              className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={8}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            />
          </div>

          {/* Attachment Info */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FileText className="w-4 h-4" />
              <span>PDF attachment will be included</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || recipients.filter(r => r.trim()).length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default SendInvoiceModal;
