'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import type { InvoiceUploadProps, ExtractedData } from '@/types';

export function InvoiceUpload({ onUploadComplete, onError }: InvoiceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('processing');
    setProgress(0);
    setErrorMessage('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Call extraction API
      const response = await fetch('/api/invoices/extract', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract invoice data');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract invoice data');
      }

      setUploadStatus('success');
      
      // Wait a moment to show success state
      setTimeout(() => {
        onUploadComplete(result.data as ExtractedData);
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Failed to process file';
      setErrorMessage(message);
      setUploadStatus('error');
      onError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setErrorMessage(validationError);
      setUploadStatus('error');
      onError(validationError);
      return;
    }

    setSelectedFile(file);
    processFile(file);
  }, [onError]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setProgress(0);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {uploadStatus === 'idle' && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
            }
          `}
          onClick={handleBrowseClick}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-lg font-medium mb-2 text-gray-200">
            {isDragging ? 'Drop your PDF here' : 'Upload Invoice PDF'}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Drag and drop your PDF file here, or click to browse
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Browse Files
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Maximum file size: 10MB • Supported format: PDF
          </p>
        </div>
      )}

      {uploadStatus === 'processing' && selectedFile && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <FileText className="w-10 h-10 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-200 truncate mb-1">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-400 mb-3">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-400">
                {progress < 100 ? 'Extracting invoice data...' : 'Processing complete'}
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadStatus === 'success' && selectedFile && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-200 mb-1">
                Successfully extracted invoice data
              </p>
              <p className="text-sm text-green-300 truncate">
                {selectedFile.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="space-y-4">
          {selectedFile && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <FileText className="w-10 h-10 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-white flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-200 mb-1">Upload Failed</p>
                <p className="text-sm text-red-300">{errorMessage}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}