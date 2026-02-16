import type { Invoice, Client, StorageService as IStorageService } from '@/types';

const STORAGE_KEYS = {
  INVOICES: 'autoinvoice_invoices',
  CLIENTS: 'autoinvoice_clients',
  COUNTER: 'autoinvoice_counter',
} as const;

class StorageServiceImpl implements IStorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  }

  private setToStorage<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  }

  // Invoice methods
  getInvoices(): Invoice[] {
    return this.getFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  }

  getInvoice(id: string): Invoice | null {
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.id === id) || null;
  }

  saveInvoice(invoice: Invoice): void {
    const invoices = this.getInvoices();
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    this.setToStorage(STORAGE_KEYS.INVOICES, invoices);
  }

  updateInvoice(id: string, updates: Partial<Invoice>): void {
    const invoices = this.getInvoices();
    const index = invoices.findIndex(inv => inv.id === id);
    
    if (index >= 0) {
      invoices[index] = {
        ...invoices[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.setToStorage(STORAGE_KEYS.INVOICES, invoices);
    }
  }

  deleteInvoice(id: string): void {
    const invoices = this.getInvoices();
    const filtered = invoices.filter(inv => inv.id !== id);
    this.setToStorage(STORAGE_KEYS.INVOICES, filtered);
  }

  // Client methods
  getClients(): Client[] {
    return this.getFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
  }

  getClient(id: string): Client | null {
    const clients = this.getClients();
    return clients.find(client => client.id === id) || null;
  }

  saveClient(client: Client): void {
    const clients = this.getClients();
    const existingIndex = clients.findIndex(c => c.id === client.id);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    this.setToStorage(STORAGE_KEYS.CLIENTS, clients);
  }

  updateClient(id: string, updates: Partial<Client>): void {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === id);
    
    if (index >= 0) {
      clients[index] = {
        ...clients[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.setToStorage(STORAGE_KEYS.CLIENTS, clients);
    }
  }

  deleteClient(id: string): void {
    const clients = this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    this.setToStorage(STORAGE_KEYS.CLIENTS, filtered);
  }

  // Utility methods
  clear(): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.removeItem(STORAGE_KEYS.INVOICES);
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.COUNTER);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  getNextInvoiceNumber(): string {
    const counter = this.getFromStorage<{ invoiceNumber: number }>(
      STORAGE_KEYS.COUNTER,
      { invoiceNumber: 0 }
    );
    
    const nextNumber = counter.invoiceNumber + 1;
    const year = new Date().getFullYear();
    const paddedNumber = String(nextNumber).padStart(3, '0');
    
    this.setToStorage(STORAGE_KEYS.COUNTER, { invoiceNumber: nextNumber });
    
    return `INV-${year}-${paddedNumber}`;
  }

  // Seed initial data for demo purposes
  seedInitialData(): void {
    const clients = this.getClients();
    const invoices = this.getInvoices();
    
    if (clients.length === 0) {
      const demoClients: Client[] = [
        {
          id: 'client-1',
          name: 'Acme Corporation',
          email: 'billing@acme.com',
          phone: '+1 (555) 123-4567',
          address: '123 Business St, San Francisco, CA 94105',
          taxId: 'US123456789',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'client-2',
          name: 'TechStart Inc',
          email: 'accounts@techstart.io',
          phone: '+1 (555) 987-6543',
          address: '456 Innovation Ave, Austin, TX 78701',
          taxId: 'US987654321',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'client-3',
          name: 'Global Solutions Ltd',
          email: 'finance@globalsolutions.com',
          phone: '+44 20 7123 4567',
          address: '789 Enterprise Rd, London, UK EC1A 1BB',
          taxId: 'GB123456789',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      demoClients.forEach(client => this.saveClient(client));
    }
    
    if (invoices.length === 0) {
      const now = new Date();
      const demoInvoices: Invoice[] = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-2024-001',
          clientId: 'client-1',
          client: this.getClient('client-1')!,
          items: [
            {
              id: 'item-1',
              description: 'Web Development Services',
              quantity: 40,
              unitPrice: 150,
              taxRate: 20,
              total: 7200,
            },
            {
              id: 'item-2',
              description: 'UI/UX Design',
              quantity: 20,
              unitPrice: 120,
              taxRate: 20,
              total: 2880,
            },
          ],
          subtotal: 8400,
          taxAmount: 1680,
          discountAmount: 0,
          discountPercent: 0,
          total: 10080,
          currency: 'USD',
          status: 'paid',
          issueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Thank you for your business!',
          paidAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'invoice-2',
          invoiceNumber: 'INV-2024-002',
          clientId: 'client-2',
          client: this.getClient('client-2')!,
          items: [
            {
              id: 'item-3',
              description: 'Monthly Retainer - January',
              quantity: 1,
              unitPrice: 5000,
              taxRate: 20,
              total: 6000,
            },
          ],
          subtotal: 5000,
          taxAmount: 1000,
          discountAmount: 0,
          discountPercent: 0,
          total: 6000,
          currency: 'USD',
          status: 'sent',
          issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Payment terms: Net 15',
          sentAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'invoice-3',
          invoiceNumber: 'INV-2024-003',
          clientId: 'client-3',
          client: this.getClient('client-3')!,
          items: [
            {
              id: 'item-4',
              description: 'Consulting Services',
              quantity: 15,
              unitPrice: 200,
              taxRate: 20,
              total: 3600,
            },
          ],
          subtotal: 3000,
          taxAmount: 600,
          discountAmount: 0,
          discountPercent: 0,
          total: 3600,
          currency: 'USD',
          status: 'overdue',
          issueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Please remit payment at your earliest convenience.',
          sentAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'invoice-4',
          invoiceNumber: 'INV-2024-004',
          clientId: 'client-1',
          client: this.getClient('client-1')!,
          items: [
            {
              id: 'item-5',
              description: 'API Integration',
              quantity: 25,
              unitPrice: 180,
              taxRate: 20,
              total: 5400,
            },
          ],
          subtotal: 4500,
          taxAmount: 900,
          discountAmount: 0,
          discountPercent: 0,
          total: 5400,
          currency: 'USD',
          status: 'draft',
          issueDate: new Date().toISOString(),
          dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Draft - pending review',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      demoInvoices.forEach(invoice => this.saveInvoice(invoice));
      
      this.setToStorage(STORAGE_KEYS.COUNTER, { invoiceNumber: 4 });
    }
  }
}

export const StorageService = new StorageServiceImpl();