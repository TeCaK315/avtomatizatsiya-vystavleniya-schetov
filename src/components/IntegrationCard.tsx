'use client';

import React, { useState } from 'react';
import { Check, X, RefreshCw, Settings, Link as LinkIcon, Unlink } from 'lucide-react';
import type { IntegrationCardProps, IntegrationProvider } from '@/types';

const PROVIDER_INFO: Record<IntegrationProvider, {
  name: string;
  description: string;
  logo: string;
  color: string;
}> = {
  quickbooks: {
    name: 'QuickBooks',
    description: 'Sync invoices to QuickBooks Online',
    logo: 'QB',
    color: 'bg-green-600'
  },
  xero: {
    name: 'Xero',
    description: 'Sync invoices to Xero accounting',
    logo: 'XR',
    color: 'bg-blue-600'
  },
  freshbooks: {
    name: 'FreshBooks',
    description: 'Sync invoices to FreshBooks',
    logo: 'FB',
    color: 'bg-purple-600'
  }
};

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onToggleAutoSync
}: IntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const providerInfo = PROVIDER_INFO[integration.provider];

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      await onConnect(integration.provider);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm(`Are you sure you want to disconnect ${providerInfo.name}?`)) {
      setIsProcessing(true);
      try {
        await onDisconnect(integration.provider);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleToggleAutoSync = async () => {
    setIsProcessing(true);
    try {
      await onToggleAutoSync(integration.provider, !integration.autoSync);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className={`${providerInfo.color} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
              {providerInfo.logo}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">
                  {providerInfo.name}
                </h3>
                {integration.isConnected && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-600 bg-opacity-20 text-green-400 text-xs rounded-full">
                    <Check className="w-3 h-3" />
                    Connected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {providerInfo.description}
              </p>
              {integration.isConnected && integration.lastSyncAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex items-center gap-2">
            {integration.isConnected ? (
              <div className="p-2 bg-green-600 bg-opacity-20 rounded-lg">
                <LinkIcon className="w-5 h-5 text-green-400" />
              </div>
            ) : (
              <div className="p-2 bg-gray-800 rounded-lg">
                <Unlink className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          {integration.isConnected ? (
            <>
              <button
                onClick={handleDisconnect}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Disconnect
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && integration.isConnected && (
        <div className="border-t border-gray-800 p-6 bg-gray-950">
          <h4 className="text-sm font-medium text-white mb-4">Integration Settings</h4>
          
          {/* Auto Sync Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-white">Auto-sync</span>
              </div>
              <p className="text-xs text-gray-400">
                Automatically sync new invoices to {providerInfo.name}
              </p>
            </div>
            <button
              onClick={handleToggleAutoSync}
              disabled={isProcessing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                integration.autoSync ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  integration.autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Connection Details */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Connection ID:</span>
              <span className="text-white font-mono text-xs">
                {integration.id.substring(0, 8)}...
              </span>
            </div>
            {integration.credentials.companyId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Company ID:</span>
                <span className="text-white font-mono text-xs">
                  {integration.credentials.companyId}
                </span>
              </div>
            )}
          </div>

          {/* Test Connection */}
          <button
            onClick={() => {
              alert(`Testing connection to ${providerInfo.name}...`);
            }}
            disabled={isProcessing}
            className="w-full mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            Test Connection
          </button>
        </div>
      )}
    </div>
  );
}
export default IntegrationCard;
