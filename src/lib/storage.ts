import {
  Invoice,
  IntegrationConfig,
  IntegrationProvider,
  StorageService as IStorageService
} from '@/types';

const INVOICES_KEY = 'invoices';
const INTEGRATIONS_KEY = 'integrations';

class StorageServiceImpl implements IStorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getFromStorage<T>(key: string): T | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }

  private setToStorage<T>(key: string, value: T): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  }

  // Invoice methods
  saveInvoice(invoice: Invoice): void {
    const invoices = this.getAllInvoices();
    const existingIndex = invoices.findIndex((inv) => inv.id === invoice.id);

    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }

    this.setToStorage(INVOICES_KEY, invoices);
  }

  getInvoice(id: string): Invoice | null {
    const invoices = this.getAllInvoices();
    return invoices.find((inv) => inv.id === id) || null;
  }

  getAllInvoices(): Invoice[] {
    const invoices = this.getFromStorage<Invoice[]>(INVOICES_KEY);
    return invoices || [];
  }

  updateInvoice(id: string, updates: Partial<Invoice>): void {
    const invoices = this.getAllInvoices();
    const index = invoices.findIndex((inv) => inv.id === id);

    if (index >= 0) {
      invoices[index] = {
        ...invoices[index],
        ...updates
      };
      this.setToStorage(INVOICES_KEY, invoices);
    }
  }

  deleteInvoice(id: string): void {
    const invoices = this.getAllInvoices();
    const filtered = invoices.filter((inv) => inv.id !== id);
    this.setToStorage(INVOICES_KEY, filtered);
  }

  // Integration methods
  saveIntegration(integration: IntegrationConfig): void {
    const integrations = this.getAllIntegrations();
    const existingIndex = integrations.findIndex(
      (int) => int.provider === integration.provider
    );

    if (existingIndex >= 0) {
      integrations[existingIndex] = integration;
    } else {
      integrations.push(integration);
    }

    this.setToStorage(INTEGRATIONS_KEY, integrations);
  }

  getIntegration(provider: IntegrationProvider): IntegrationConfig | null {
    const integrations = this.getAllIntegrations();
    return integrations.find((int) => int.provider === provider) || null;
  }

  getAllIntegrations(): IntegrationConfig[] {
    const integrations = this.getFromStorage<IntegrationConfig[]>(INTEGRATIONS_KEY);
    return integrations || [];
  }

  updateIntegration(
    provider: IntegrationProvider,
    updates: Partial<IntegrationConfig>
  ): void {
    const integrations = this.getAllIntegrations();
    const index = integrations.findIndex((int) => int.provider === provider);

    if (index >= 0) {
      integrations[index] = {
        ...integrations[index],
        ...updates
      };
      this.setToStorage(INTEGRATIONS_KEY, integrations);
    }
  }

  deleteIntegration(provider: IntegrationProvider): void {
    const integrations = this.getAllIntegrations();
    const filtered = integrations.filter((int) => int.provider !== provider);
    this.setToStorage(INTEGRATIONS_KEY, filtered);
  }

  // Utility methods for bulk operations
  clearAllInvoices(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(INVOICES_KEY);
    }
  }

  clearAllIntegrations(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(INTEGRATIONS_KEY);
    }
  }

  clearAll(): void {
    this.clearAllInvoices();
    this.clearAllIntegrations();
  }

  exportData(): { invoices: Invoice[]; integrations: IntegrationConfig[] } {
    return {
      invoices: this.getAllInvoices(),
      integrations: this.getAllIntegrations()
    };
  }

  importData(data: {
    invoices?: Invoice[];
    integrations?: IntegrationConfig[];
  }): void {
    if (data.invoices) {
      this.setToStorage(INVOICES_KEY, data.invoices);
    }
    if (data.integrations) {
      this.setToStorage(INTEGRATIONS_KEY, data.integrations);
    }
  }

  // Search and filter utilities
  searchInvoices(query: string): Invoice[] {
    const invoices = this.getAllInvoices();
    const lowerQuery = query.toLowerCase();

    return invoices.filter((invoice) => {
      const searchableFields = [
        invoice.fileName,
        invoice.extractedData?.invoiceNumber,
        invoice.extractedData?.vendorName,
        invoice.extractedData?.customerName,
        invoice.status
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  filterInvoicesByStatus(statuses: string[]): Invoice[] {
    const invoices = this.getAllInvoices();
    return invoices.filter((invoice) => statuses.includes(invoice.status));
  }

  filterInvoicesByDateRange(startDate: string, endDate: string): Invoice[] {
    const invoices = this.getAllInvoices();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return invoices.filter((invoice) => {
      const uploadDate = new Date(invoice.uploadedAt).getTime();
      return uploadDate >= start && uploadDate <= end;
    });
  }

  getInvoiceStats(): {
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
  } {
    const invoices = this.getAllInvoices();
    const byStatus: Record<string, number> = {};
    let totalAmount = 0;

    invoices.forEach((invoice) => {
      byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;
      if (invoice.extractedData?.totalAmount) {
        totalAmount += invoice.extractedData.totalAmount;
      }
    });

    return {
      total: invoices.length,
      byStatus,
      totalAmount
    };
  }
}

export const StorageService = new StorageServiceImpl();