'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { PDFUploaderProps, ExtractedData } from '@/types';

export function PDFUploader({ onUploadSuccess, onUploadError }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadStatus('idle');
        setStatusMessage('');
      } else {
        setUploadStatus('error');
        setStatusMessage('Please select a PDF file');
        onUploadError('Please select a PDF file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadStatus('idle');
        setStatusMessage('');
      } else {
        setUploadStatus('error');
        setStatusMessage('Please select a PDF file');
        onUploadError('Please select a PDF file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');
    setStatusMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      if (data.success && data.extractedData) {
        setUploadStatus('success');
        setStatusMessage('PDF processed successfully!');
        onUploadSuccess(data.extractedData);
        
        // Reset after success
        setTimeout(() => {
          setSelectedFile(null);
          setUploadProgress(0);
          setUploadStatus('idle');
          setStatusMessage('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to extract data from PDF');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload PDF';
      setUploadStatus('error');
      setStatusMessage(errorMessage);
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
            }
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`
              p-4 rounded-full transition-colors
              ${isDragging ? 'bg-blue-500/20' : 'bg-gray-800'}
            `}>
              <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white mb-2">
                {isDragging ? 'Drop your PDF here' : 'Upload Invoice PDF'}
              </p>
              <p className="text-sm text-gray-400">
                Drag and drop your PDF file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supports PDF files up to 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-gray-800 rounded-lg">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && uploadStatus !== 'success' && (
                  <button
                    onClick={handleRemoveFile}
                    className="flex-shrink-0 p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    Processing PDF... {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm">{statusMessage}</p>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{statusMessage}</p>
                </div>
              )}

              {!isUploading && uploadStatus === 'idle' && (
                <button
                  onClick={handleUpload}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Process PDF
                </button>
              )}

              {isUploading && (
                <div className="mt-4 flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Extracting invoice data...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && selectedFile && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Upload Failed</p>
              <p className="text-sm text-red-300 mt-1">{statusMessage}</p>
              <button
                onClick={handleRemoveFile}
                className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
              >
                Try another file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default PDFUploader;
