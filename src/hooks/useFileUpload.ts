'use client';

import { useState, useCallback } from 'react';
import type { ExtractedData, UseFileUploadReturn } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF files are allowed';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }

    return null;
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<ExtractedData | null> => {
    setError(null);
    setProgress(0);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to API
      const response = await fetch('/api/invoices/extract', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to extract data from PDF');
      }

      setProgress(100);
      setIsUploading(false);

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      setIsUploading(false);
      setProgress(0);
      return null;
    }
  }, [validateFile]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset,
  };
}