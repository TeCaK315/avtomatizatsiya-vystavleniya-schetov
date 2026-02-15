'use client';

import React, { useState, useRef, DragEvent } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { FileType, UploadInvoiceResponse } from '@/types';

interface InvoiceUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string, fileType: FileType) => void;
  acceptedTypes?: FileType[];
  maxSizeMB?: number;
}

export default function InvoiceUpload({
  onUploadComplete,
  acceptedTypes = [FileType.PDF, FileType.JPEG, FileType.PNG],
  maxSizeMB = 10
}: InvoiceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    if (!acceptedTypes.includes(file.type as FileType)) {
      return 'Invalid file type. Please upload PDF, JPEG, or PNG files';
    }

    return null;
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: UploadInvoiceResponse = JSON.parse(xhr.responseText);
          if (response.success) {
            setSuccess(true);
            onUploadComplete(response.fileUrl, response.fileName, response.fileType);
            setTimeout(() => {
              setSelectedFile(null);
              setSuccess(false);
              setUploadProgress(0);
            }, 2000);
          } else {
            setError(response.message || 'Upload failed');
          }
        } else {
          setError('Upload failed. Please try again.');
        }
        setIsUploading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Network error. Please try again.');
        setIsUploading(false);
      });

      xhr.open('POST', '/api/invoices/upload');
      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="w-12 h-12 text-gray-500" />;
    return <File className="w-12 h-12 text-blue-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-all
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}
          ${selectedFile ? 'border-solid' : ''}
        `}
      >
        {!selectedFile ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {getFileIcon()}
            </div>
            <p className="text-white font-medium mb-2">
              Drag and drop your invoice here
            </p>
            <p className="text-gray-400 text-sm mb-4">
              or
            </p>
            <button
              onClick={handleBrowseClick}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Files
            </button>
            <p className="text-gray-500 text-xs mt-4">
              Supported formats: PDF, JPEG, PNG (max {maxSizeMB}MB)
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getFileIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && !success && (
                    <button
                      onClick={handleRemoveFile}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Uploading...</span>
                      <span className="text-sm text-gray-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mt-4 flex items-center gap-2 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Upload successful!</span>
                  </div>
                )}

                {!isUploading && !success && (
                  <button
                    onClick={handleUpload}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}