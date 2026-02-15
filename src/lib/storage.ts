import {
  Invoice,
  InvoiceStatus,
  InvoiceFilters,
  StorageService as IStorageService,
} from '@/types';

const STORAGE_KEY = 'invoices_data';
const COUNTER_KEY = 'invoice_counter';

class StorageServiceImpl implements IStorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getStorage(): Invoice[] {
    if (!this.isBrowser()) {
      return [];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as Invoice[];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private setStorage(invoices: Invoice[]): void {
    if (!this.isBrowser()) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  private getCounter(): number {
    if (!this.isBrowser()) {
      return 1;
    }
    try {
      const counter = localStorage.getItem(COUNTER_KEY);
      return counter ? parseInt(counter, 10) : 1;
    } catch (error) {
      console.error('Error reading counter from localStorage:', error);
      return 1;
    }
  }

  private incrementCounter(): number {
    if (!this.isBrowser()) {
      return 1;
    }
    try {
      const current = this.getCounter();
      const next = current + 1;
      localStorage.setItem(COUNTER_KEY, next.toString());
      return current;
    } catch (error) {
      console.error('Error incrementing counter:', error);
      return 1;
    }
  }

  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getInvoices(): Invoice[] {
    return this.getStorage();
  }

  getInvoice(id: string): Invoice | null {
    const invoices = this.getStorage();
    const invoice = invoices.find((inv) => inv.id === id);
    return invoice || null;
  }

  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    const invoices = this.getStorage();
    const now = new Date().toISOString();
    
    const newInvoice: Invoice = {
      ...invoice,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    invoices.push(newInvoice);
    this.setStorage(invoices);
    
    return newInvoice;
  }

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoices = this.getStorage();
    const index = invoices.findIndex((inv) => inv.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedInvoice: Invoice = {
      ...invoices[index],
      ...updates,
      id: invoices[index].id,
      createdAt: invoices[index].createdAt,
      updatedAt: new Date().toISOString(),
    };

    invoices[index] = updatedInvoice;
    this.setStorage(invoices);
    
    return updatedInvoice;
  }

  deleteInvoice(id: string): boolean {
    const invoices = this.getStorage();
    const index = invoices.findIndex((inv) => inv.id === id);
    
    if (index === -1) {
      return false;
    }

    invoices.splice(index, 1);
    this.setStorage(invoices);
    
    return true;
  }

  searchInvoices(query: string): Invoice[] {
    const invoices = this.getStorage();
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return invoices;
    }

    return invoices.filter((invoice) => {
      return (
        invoice.invoiceNumber.toLowerCase().includes(lowerQuery) ||
        invoice.from.name.toLowerCase().includes(lowerQuery) ||
        invoice.from.email.toLowerCase().includes(lowerQuery) ||
        invoice.to.name.toLowerCase().includes(lowerQuery) ||
        invoice.to.email.toLowerCase().includes(lowerQuery) ||
        invoice.items.some((item) =>
          item.description.toLowerCase().includes(lowerQuery)
        ) ||
        (invoice.notes && invoice.notes.toLowerCase().includes(lowerQuery))
      );
    });
  }

  filterInvoices(filters: InvoiceFilters): Invoice[] {
    let invoices = this.getStorage();

    if (filters.status && filters.status.length > 0) {
      invoices = invoices.filter((inv) =>
        filters.status!.includes(inv.status)
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      invoices = invoices.filter(
        (inv) => new Date(inv.issueDate) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      invoices = invoices.filter(
        (inv) => new Date(inv.issueDate) <= toDate
      );
    }

    if (filters.minAmount !== undefined) {
      invoices = invoices.filter((inv) => inv.total >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      invoices = invoices.filter((inv) => inv.total <= filters.maxAmount!);
    }

    return invoices;
  }
}

export const StorageService = new StorageServiceImpl();