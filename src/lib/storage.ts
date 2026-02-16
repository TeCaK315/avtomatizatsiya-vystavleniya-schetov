import type { Invoice, StorageService, InvoiceStatus } from '@/types';

const STORAGE_KEY = 'autobillpro_invoices';

function getInvoicesFromStorage(): Invoice[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

function saveInvoicesToStorage(invoices: Invoice[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateItemTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

function calculateInvoiceTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  taxRate: number
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.quantity, item.unitPrice);
  }, 0);
  
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  
  return { subtotal, taxAmount, total };
}

export const storageService: StorageService = {
  getInvoices(): Invoice[] {
    return getInvoicesFromStorage();
  },

  getInvoice(id: string): Invoice | null {
    const invoices = getInvoicesFromStorage();
    return invoices.find(inv => inv.id === id) || null;
  },

  createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Invoice {
    const invoices = getInvoicesFromStorage();
    const now = new Date().toISOString();
    
    const itemsWithTotals = invoiceData.items.map(item => ({
      ...item,
      total: calculateItemTotal(item.quantity, item.unitPrice),
    }));
    
    const { subtotal, taxAmount, total } = calculateInvoiceTotals(
      itemsWithTotals,
      invoiceData.taxRate
    );
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId(),
      items: itemsWithTotals,
      subtotal,
      taxAmount,
      total,
      createdAt: now,
      updatedAt: now,
    };
    
    invoices.push(newInvoice);
    saveInvoicesToStorage(invoices);
    
    return newInvoice;
  },

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const invoices = getInvoicesFromStorage();
    const index = invoices.findIndex(inv => inv.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const existingInvoice = invoices[index];
    const updatedInvoice = { ...existingInvoice, ...updates };
    
    if (updates.items || updates.taxRate !== undefined) {
      const itemsToCalculate = updates.items || existingInvoice.items;
      const taxRateToUse = updates.taxRate !== undefined ? updates.taxRate : existingInvoice.taxRate;
      
      const itemsWithTotals = itemsToCalculate.map(item => ({
        ...item,
        total: calculateItemTotal(item.quantity, item.unitPrice),
      }));
      
      const { subtotal, taxAmount, total } = calculateInvoiceTotals(
        itemsWithTotals,
        taxRateToUse
      );
      
      updatedInvoice.items = itemsWithTotals;
      updatedInvoice.subtotal = subtotal;
      updatedInvoice.taxAmount = taxAmount;
      updatedInvoice.total = total;
    }
    
    updatedInvoice.updatedAt = new Date().toISOString();
    
    invoices[index] = updatedInvoice;
    saveInvoicesToStorage(invoices);
    
    return updatedInvoice;
  },

  deleteInvoice(id: string): boolean {
    const invoices = getInvoicesFromStorage();
    const filteredInvoices = invoices.filter(inv => inv.id !== id);
    
    if (filteredInvoices.length === invoices.length) {
      return false;
    }
    
    saveInvoicesToStorage(filteredInvoices);
    return true;
  },

  clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};