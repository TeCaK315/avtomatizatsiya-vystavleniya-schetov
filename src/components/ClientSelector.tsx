'use client';

import React, { useState, useMemo } from 'react';
import { Client, ClientSelectorProps } from '@/types';
import { Search, Plus, Check, ChevronDown } from 'lucide-react';

export function ClientSelector({
  clients,
  selectedClientId,
  onSelect,
  onCreateNew,
  loading = false,
}: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.phone && client.phone.toLowerCase().includes(query))
    );
  }, [clients, searchQuery]);

  const handleSelect = (clientId: string) => {
    onSelect(clientId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    setSearchQuery('');
    if (onCreateNew) {
      onCreateNew();
    }
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Client *
      </label>

      {/* Selected Client Display / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-left transition-colors ${
          loading
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-750 hover:border-gray-600'
        } ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}`}
      >
        <div className="flex-1 min-w-0">
          {selectedClient ? (
            <div>
              <div className="text-white font-medium truncate">
                {selectedClient.name}
              </div>
              <div className="text-sm text-gray-400 truncate">
                {selectedClient.email}
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Select a client...</span>
          )}
        </div>
        <ChevronDown
          className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
            </div>
          </div>

          {/* Client List */}
          <div className="overflow-y-auto max-h-64">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No clients found' : 'No clients available'}
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelect(client.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    client.id === selectedClientId
                      ? 'bg-blue-600/20 border-l-4 border-blue-500'
                      : 'hover:bg-gray-750 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {client.name}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {client.email}
                    </div>
                    {client.phone && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {client.phone}
                      </div>
                    )}
                  </div>
                  {client.id === selectedClientId && (
                    <Check className="ml-2 h-5 w-5 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Create New Client Button */}
          {onCreateNew && (
            <div className="p-3 border-t border-gray-700">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Create New Client
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}