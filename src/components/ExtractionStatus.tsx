'use client';

import React from 'react';
import { ExtractionStatusProps, InvoiceStatus } from '@/types';
import { CheckCircle, Clock, AlertCircle, Loader2, Upload, FileCheck } from 'lucide-react';

export function ExtractionStatus({ 
  status, 
  confidence, 
  processingTime, 
  errorMessage 
}: ExtractionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case InvoiceStatus.UPLOADED:
        return {
          icon: Upload,
          label: 'Uploaded',
          description: 'File uploaded successfully',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          showProgress: false,
          progress: 0
        };
      
      case InvoiceStatus.PROCESSING:
        return {
          icon: Loader2,
          label: 'Processing',
          description: 'Extracting data from invoice...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          showProgress: true,
          progress: 50,
          animate: true
        };
      
      case InvoiceStatus.EXTRACTED:
        return {
          icon: FileCheck,
          label: 'Extracted',
          description: 'Data extracted successfully',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          showProgress: true,
          progress: 100
        };
      
      case InvoiceStatus.VERIFIED:
        return {
          icon: CheckCircle,
          label: 'Verified',
          description: 'Invoice verified and ready',
          color: 'text-green-600',
          bgColor: 'bg-green-600/10',
          borderColor: 'border-green-600/20',
          showProgress: true,
          progress: 100
        };
      
      case InvoiceStatus.SENT:
        return {
          icon: CheckCircle,
          label: 'Sent',
          description: 'Invoice sent successfully',
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          showProgress: true,
          progress: 100
        };
      
      case InvoiceStatus.FAILED:
        return {
          icon: AlertCircle,
          label: 'Failed',
          description: errorMessage || 'Processing failed',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          showProgress: false,
          progress: 0
        };
      
      default:
        return {
          icon: Clock,
          label: 'Pending',
          description: 'Waiting to process',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          showProgress: false,
          progress: 0
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'text-green-500';
    if (conf >= 70) return 'text-yellow-500';
    if (conf >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 90) return 'High';
    if (conf >= 70) return 'Medium';
    if (conf >= 50) return 'Low';
    return 'Very Low';
  };

  return (
    <div className={`border ${config.borderColor} ${config.bgColor} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${config.color} mt-0.5`}>
          <Icon 
            className={`w-5 h-5 ${config.animate ? 'animate-spin' : ''}`} 
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-sm font-semibold ${config.color}`}>
              {config.label}
            </h4>
            
            {status === InvoiceStatus.PROCESSING && (
              <span className="text-xs text-gray-400">
                Processing...
              </span>
            )}
          </div>

          <p className="text-sm text-gray-400 mb-3">
            {config.description}
          </p>

          {config.showProgress && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs text-gray-400">{config.progress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${config.color.replace('text-', 'bg-')} transition-all duration-500 ease-out`}
                  style={{ width: `${config.progress}%` }}
                />
              </div>
            </div>
          )}

          {confidence !== undefined && confidence > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded border border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Confidence:</span>
                <span className={`text-xs font-semibold ${getConfidenceColor(confidence)}`}>
                  {getConfidenceLabel(confidence)}
                </span>
              </div>
              <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
                {confidence.toFixed(1)}%
              </span>
            </div>
          )}

          {processingTime !== undefined && processingTime > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                Processed in {processingTime < 1000 
                  ? `${processingTime}ms` 
                  : `${(processingTime / 1000).toFixed(2)}s`}
              </span>
            </div>
          )}

          {status === InvoiceStatus.FAILED && errorMessage && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400">
              {errorMessage}
            </div>
          )}

          {status === InvoiceStatus.EXTRACTED && confidence !== undefined && confidence < 70 && (
            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
              <strong>Note:</strong> Low confidence score. Please review extracted data carefully.
            </div>
          )}
        </div>
      </div>

      {status === InvoiceStatus.PROCESSING && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Analyzing document structure and extracting fields...</span>
          </div>
        </div>
      )}
    </div>
  );
}
export default ExtractionStatus;
