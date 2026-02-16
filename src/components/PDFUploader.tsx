'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { PDFUploaderProps, ExtractedPDFData } from '@/types';

export function PDFUploader({
  onUploadComplete,
  onError,
  maxSizeMB = 10,
}: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file';
    }

    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = useCallback(
    (selectedFile: File) => {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        if (onError) {
          onError(validationError);
        }
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    },
    [maxSizeBytes, onError]
  );

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

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFile(droppedFiles[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFile(selectedFiles[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.data) {
              setSuccess(true);
              onUploadComplete(response.data);
            } else {
              const errorMsg = response.error || 'Failed to extract data from PDF';
              setError(errorMsg);
              if (onError) {
                onError(errorMsg);
              }
            }
          } catch (parseError) {
            const errorMsg = 'Invalid response from server';
            setError(errorMsg);
            if (onError) {
              onError(errorMsg);
            }
          }
        } else {
          const errorMsg = `Upload failed with status ${xhr.status}`;
          setError(errorMsg);
          if (onError) {
            onError(errorMsg);
          }
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        const errorMsg = 'Network error during upload';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        setUploading(false);
      });

      xhr.addEventListener('abort', () => {
        const errorMsg = 'Upload cancelled';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
        setUploading(false);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      if (onError) {
        onError(errorMsg);
      }
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!file && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleUploadClick}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
            ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-800 rounded-full">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>

            <div>
              <p className="text-lg font-medium text-white mb-1">
                {isDragging ? 'Drop PDF file here' : 'Upload PDF Invoice'}
              </p>
              <p className="text-sm text-gray-400">
                Drag and drop or click to browse
              </p>
            </div>

            <div className="text-xs text-gray-500">
              Maximum file size: {maxSizeMB}MB
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                </div>

                {!uploading && !success && (
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Uploading...</span>
                    <span className="text-sm text-gray-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mt-4 flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Data extracted successfully!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Upload Button */}
              {!uploading && !success && (
                <button
                  onClick={uploadFile}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Extract Data from PDF
                </button>
              )}

              {/* Upload Another Button */}
              {success && (
                <button
                  onClick={handleRemoveFile}
                  className="mt-4 w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Upload Another File
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Supported PDF Types:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-300/80">
              <li>Text-based PDF invoices (preferred)</li>
              <li>Scanned invoices (OCR will be used)</li>
              <li>Multi-page invoices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}