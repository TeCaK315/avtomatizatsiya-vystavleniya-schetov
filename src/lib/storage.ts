import type {
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  StorageService,
} from '@/types';

const STORAGE_KEY = 'invoices';

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

function generateInvoiceNumber(): string {
  const invoices = getInvoicesFromStorage();
  const year = new Date().getFullYear();
  const existingNumbers = invoices
    .map(inv => inv.invoiceNumber)
    .filter(num => num.startsWith(`INV-${year}-`))
    .map(num => {
      const match = num.match(/INV-\d{4}-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
  
  const nextNumber = existingNumbers.length > 0 
    ? Math.max(...existingNumbers) + 1 
    : 1;
  
  return `INV-${year}-${String(nextNumber).padStart(3, '0')}`;
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

const storageService: StorageService = {
  getInvoices(): Invoice[] {
    return getInvoicesFromStorage();
  },

  getInvoice(id: string): Invoice | null {
    const invoices = getInvoicesFromStorage();
    return invoices.find(inv => inv.id === id) || null;
  },

  createInvoice(data: CreateInvoiceRequest): Invoice {
    const invoices = getInvoicesFromStorage();
    const now = new Date().toISOString();
    
    const itemsWithTotals = data.items.map((item, index) => ({
      id: `item_${Date.now()}_${index}`,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: calculateItemTotal(item.quantity, item.unitPrice),
    }));
    
    const { subtotal, taxAmount, total } = calculateInvoiceTotals(
      data.items,
      data.taxRate
    );
    
    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber: data.invoiceNumber,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientAddress: data.clientAddress,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      items: itemsWithTotals,
      subtotal,
      taxRate: data.taxRate,
      taxAmount,
      total,
      status: 'draft',
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    
    invoices.push(newInvoice);
    saveInvoicesToStorage(invoices);
    
    return newInvoice;
  },

  updateInvoice(id: string, data: UpdateInvoiceRequest): Invoice | null {
    const invoices = getInvoicesFromStorage();
    const index = invoices.findIndex(inv => inv.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const existingInvoice = invoices[index];
    const now = new Date().toISOString();
    
    let updatedItems = existingInvoice.items;
    let subtotal = existingInvoice.subtotal;
    let taxAmount = existingInvoice.taxAmount;
    let total = existingInvoice.total;
    let taxRate = existingInvoice.taxRate;
    
    if (data.items || data.taxRate !== undefined) {
      const itemsToCalculate = data.items || existingInvoice.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      
      taxRate = data.taxRate !== undefined ? data.taxRate : existingInvoice.taxRate;
      
      updatedItems = itemsToCalculate.map((item, idx) => ({
        id: data.items ? `item_${Date.now()}_${idx}` : existingInvoice.items[idx]?.id || `item_${Date.now()}_${idx}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: calculateItemTotal(item.quantity, item.unitPrice),
      }));
      
      const calculations = calculateInvoiceTotals(itemsToCalculate, taxRate);
      subtotal = calculations.subtotal;
      taxAmount = calculations.taxAmount;
      total = calculations.total;
    }
    
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      invoiceNumber: data.invoiceNumber ?? existingInvoice.invoiceNumber,
      clientName: data.clientName ?? existingInvoice.clientName,
      clientEmail: data.clientEmail ?? existingInvoice.clientEmail,
      clientAddress: data.clientAddress !== undefined ? data.clientAddress : existingInvoice.clientAddress,
      issueDate: data.issueDate ?? existingInvoice.issueDate,
      dueDate: data.dueDate ?? existingInvoice.dueDate,
      items: updatedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: data.status ?? existingInvoice.status,
      notes: data.notes !== undefined ? data.notes : existingInvoice.notes,
      updatedAt: now,
    };
    
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

  generateInvoiceNumber(): string {
    return generateInvoiceNumber();
  },
};

export { storageService };