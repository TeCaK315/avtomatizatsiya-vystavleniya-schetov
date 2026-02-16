import type { CalculateInvoiceTotals, CalculateItemTotal, InvoiceCalculations } from '@/types';

/**
 * Calculate item total based on quantity and unit price
 * @param quantity - Number of items
 * @param unitPrice - Price per unit
 * @returns Total price for the item
 */
export const calculateItemTotal: CalculateItemTotal = (quantity: number, unitPrice: number): number => {
  if (quantity < 0 || unitPrice < 0) {
    return 0;
  }
  
  const total = quantity * unitPrice;
  return Math.round(total * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate invoice totals including subtotal, tax amount, and final total
 * @param items - Array of invoice items with quantity and unitPrice
 * @param taxRate - Tax rate as percentage (e.g., 20 for 20%)
 * @returns Object containing subtotal, taxAmount, and total
 */
export const calculateInvoiceTotals: CalculateInvoiceTotals = (
  items: Array<{ quantity: number; unitPrice: number }>,
  taxRate: number
): InvoiceCalculations => {
  // Validate inputs
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    };
  }

  if (taxRate < 0) {
    taxRate = 0;
  }

  // Calculate subtotal by summing all item totals
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item.quantity, item.unitPrice);
    return sum + itemTotal;
  }, 0);

  // Round subtotal to 2 decimal places
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // Calculate tax amount
  const taxAmount = (roundedSubtotal * taxRate) / 100;
  const roundedTaxAmount = Math.round(taxAmount * 100) / 100;

  // Calculate final total
  const total = roundedSubtotal + roundedTaxAmount;
  const roundedTotal = Math.round(total * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    taxAmount: roundedTaxAmount,
    total: roundedTotal,
  };
};