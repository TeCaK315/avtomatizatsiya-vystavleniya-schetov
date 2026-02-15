'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { IntegrationConfig, IntegrationProvider, CreateIntegrationRequest, IntegrationListResponse, UpdateIntegrationRequest, UpdateIntegrationResponse } from '@/types';
import IntegrationCard from '@/components/IntegrationCard';
import Navbar from '@/components/Navbar';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    accessToken: '',
    refreshToken: '',
    companyId: ''
  });
  const [autoSync, setAutoSync] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/integrations');
      const data: IntegrationListResponse = await response.json();
      
      if (data.success) {
        setIntegrations(data.integrations);
      } else {
        setError('Failed to load integrations');
      }
    } catch (err) {
      setError('Error loading integrations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setCredentials({
      clientId: '',
      clientSecret: '',
      accessToken: '',
      refreshToken: '',
      companyId: ''
    });
    setAutoSync(false);
    setShowAddModal(true);
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/${provider}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadIntegrations();
      } else {
        alert('Failed to disconnect integration');
      }
    } catch (err) {
      console.error(err);
      alert('Error disconnecting integration');
    }
  };

  const handleToggleAutoSync = async (provider: IntegrationProvider, enabled: boolean) => {
    try {
      const requestBody: UpdateIntegrationRequest = {
        autoSync: enabled
      };

      const response = await fetch(`/api/integrations/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: UpdateIntegrationResponse = await response.json();

      if (data.success) {
        await loadIntegrations();
      } else {
        alert('Failed to update auto-sync setting');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating auto-sync');
    }
  };

  const handleSaveIntegration = async () => {
    if (!selectedProvider) return;

    try {
      setIsSaving(true);
      const requestBody: CreateIntegrationRequest = {
        provider: selectedProvider,
        credentials: {
          clientId: credentials.clientId || undefined,
          clientSecret: credentials.clientSecret || undefined,
          accessToken: credentials.accessToken || undefined,
          refreshToken: credentials.refreshToken || undefined,
          companyId: credentials.companyId || undefined
        },
        autoSync
      };

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        setShowAddModal(false);
        setSelectedProvider(null);
        await loadIntegrations();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save integration');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving integration');
    } finally {
      setIsSaving(false);
    }
  };

  const availableProviders: IntegrationProvider[] = [
    IntegrationProvider.QUICKBOOKS,
    IntegrationProvider.XERO,
    IntegrationProvider.FRESHBOOKS
  ];

  const getProviderDisplayName = (provider: IntegrationProvider): string => {
    switch (provider) {
      case IntegrationProvider.QUICKBOOKS:
        return 'QuickBooks';
      case IntegrationProvider.XERO:
        return 'Xero';
      case IntegrationProvider.FRESHBOOKS:
        return 'FreshBooks';
      default:
        return provider;
    }
  };

  const connectedProviders = integrations.filter(i => i.isConnected).map(i => i.provider);
  const availableToConnect = availableProviders.filter(p => !connectedProviders.includes(p));

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Integrations</h1>
            <p className="text-gray-400 mt-2">Connect your accounting systems to sync invoices automatically</p>
          </div>
          <button
            onClick={loadIntegrations}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {integrations.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Connected Integrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {integrations.map(integration => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onToggleAutoSync={handleToggleAutoSync}
                    />
                  ))}
                </div>
              </div>
            )}

            {availableToConnect.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Available Integrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableToConnect.map(provider => (
                    <div
                      key={provider}
                      className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">{getProviderDisplayName(provider)}</h3>
                        <XCircle className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        Connect to sync invoices automatically
                      </p>
                      <button
                        onClick={() => handleConnect(provider)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {integrations.length === 0 && availableToConnect.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">All available integrations are connected</p>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">
              Connect {getProviderDisplayName(selectedProvider)}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Secret
                </label>
                <input
                  type="password"
                  value={credentials.clientSecret}
                  onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client secret"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Token (Optional)
                </label>
                <input
                  type="text"
                  value={credentials.accessToken}
                  onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter access token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company ID (Optional)
                </label>
                <input
                  type="text"
                  value={credentials.companyId}
                  onChange={(e) => setCredentials({ ...credentials, companyId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company ID"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoSync" className="text-sm text-gray-300">
                  Enable automatic sync
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedProvider(null);
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIntegration}
                disabled={isSaving || !credentials.clientId || !credentials.clientSecret}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}