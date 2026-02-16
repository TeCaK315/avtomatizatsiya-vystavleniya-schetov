import type { InvoiceItem } from '@/types';

export function calculateSubtotal(items: InvoiceItem[]): number {
  if (!items || items.length === 0) return 0;
  
  return items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + itemSubtotal;
  }, 0);
}

export function calculateTax(items: InvoiceItem[]): number {
  if (!items || items.length === 0) return 0;
  
  return items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemTax = itemSubtotal * (item.taxRate / 100);
    return sum + itemTax;
  }, 0);
}

export function calculateTotal(
  subtotal: number,
  taxAmount: number,
  discountAmount: number
): number {
  const total = subtotal + taxAmount - discountAmount;
  return Math.max(0, total);
}

export function calculateDiscount(
  subtotal: number,
  discountPercent: number
): number {
  if (discountPercent <= 0) return 0;
  if (discountPercent >= 100) return subtotal;
  
  return subtotal * (discountPercent / 100);
}

export function calculateItemTotal(
  quantity: number,
  unitPrice: number,
  taxRate: number
): number {
  const subtotal = quantity * unitPrice;
  const tax = subtotal * (taxRate / 100);
  return subtotal + tax;
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  discountAmount: number = 0,
  discountPercent: number = 0
): {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
} {
  const subtotal = calculateSubtotal(items);
  const taxAmount = calculateTax(items);
  
  let finalDiscountAmount = discountAmount;
  if (discountPercent > 0) {
    finalDiscountAmount = calculateDiscount(subtotal, discountPercent);
  }
  
  const total = calculateTotal(subtotal, taxAmount, finalDiscountAmount);
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    discountAmount: Math.round(finalDiscountAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function validateInvoiceItem(item: Partial<InvoiceItem>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!item.description || item.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (typeof item.quantity !== 'number' || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
    errors.push('Unit price must be 0 or greater');
  }
  
  if (typeof item.taxRate !== 'number' || item.taxRate < 0 || item.taxRate > 100) {
    errors.push('Tax rate must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function recalculateInvoiceItem(
  quantity: number,
  unitPrice: number,
  taxRate: number
): InvoiceItem['total'] {
  return calculateItemTotal(quantity, unitPrice, taxRate);
}