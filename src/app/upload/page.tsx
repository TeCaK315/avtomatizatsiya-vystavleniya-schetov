'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import type { ExtractedPDFData, UploadPDFResponse } from '@/types';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPDFData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
      setExtractedData(null);
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExtractedData(null);
    setError(null);
    setUploadProgress(0);
  };

  const handleExtractData = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: UploadPDFResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to extract data from PDF');
      }

      if (result.data) {
        setExtractedData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateInvoice = () => {
    if (!extractedData) return;
    
    const queryParams = new URLSearchParams({
      data: JSON.stringify(extractedData)
    });
    
    router.push(`/invoices/new?${queryParams.toString()}`);
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'USD') => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Invoice PDF</h1>
          <p className="text-gray-400">Upload a PDF invoice to automatically extract data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              {!file ? (
                <>
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-xl font-semibold mb-2">Drop PDF here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
                  >
                    Select PDF File
                  </label>
                  <p className="text-sm text-gray-500 mt-4">Maximum file size: 10MB</p>
                </>
              ) : (
                <div className="space-y-4">
                  <FileText className="w-16 h-16 mx-auto text-blue-500" />
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{file.name}</h3>
                    <p className="text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Remove File
                  </button>
                </div>
              )}
            </div>

            {file && !extractedData && (
              <button
                onClick={handleExtractData}
                disabled={isUploading}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting Data... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Extract Data
                  </>
                )}
              </button>
            )}

            {isUploading && (
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-500 mb-1">Error</h4>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Data Section */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Extracted Data</h2>
            
            {!extractedData ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Upload and extract a PDF to see the data here</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-500 mb-1">Data Extracted Successfully</h4>
                    <p className="text-green-300 text-sm">
                      Confidence: {(extractedData.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Invoice Number</label>
                    <div className="bg-gray-800 rounded-lg p-3">
                      {extractedData.invoiceNumber || 'Not found'}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Client Name</label>
                    <div className="bg-gray-800 rounded-lg p-3">
                      {extractedData.clientName || 'Not found'}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Client Email</label>
                    <div className="bg-gray-800 rounded-lg p-3">
                      {extractedData.clientEmail || 'Not found'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Issue Date</label>
                      <div className="bg-gray-800 rounded-lg p-3">
                        {extractedData.issueDate ? new Date(extractedData.issueDate).toLocaleDateString() : 'Not found'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Due Date</label>
                      <div className="bg-gray-800 rounded-lg p-3">
                        {extractedData.dueDate ? new Date(extractedData.dueDate).toLocaleDateString() : 'Not found'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Line Items</label>
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      {extractedData.items.length === 0 ? (
                        <div className="p-3 text-gray-500">No items found</div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="text-left p-3 text-sm">Description</th>
                              <th className="text-right p-3 text-sm">Qty</th>
                              <th className="text-right p-3 text-sm">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extractedData.items.map((item, index) => (
                              <tr key={index} className="border-t border-gray-700">
                                <td className="p-3 text-sm">{item.description}</td>
                                <td className="p-3 text-sm text-right">{item.quantity}</td>
                                <td className="p-3 text-sm text-right">
                                  {formatCurrency(item.unitPrice, extractedData.currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Subtotal</label>
                      <div className="bg-gray-800 rounded-lg p-3">
                        {formatCurrency(extractedData.subtotal, extractedData.currency)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Tax</label>
                      <div className="bg-gray-800 rounded-lg p-3">
                        {formatCurrency(extractedData.taxAmount, extractedData.currency)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Total</label>
                      <div className="bg-gray-800 rounded-lg p-3 font-bold">
                        {formatCurrency(extractedData.total, extractedData.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <button
                    onClick={handleCreateInvoice}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Create Invoice from Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}