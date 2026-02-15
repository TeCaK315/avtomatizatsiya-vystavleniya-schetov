import type { CalculateInvoiceTotals, CalculateLineTotal, InvoiceCalculations } from '@/types';

/**
 * Calculate the total for a single line item
 * @param quantity - Number of units
 * @param unitPrice - Price per unit
 * @returns Total amount for the line item
 */
export const calculateLineTotal: CalculateLineTotal = (quantity: number, unitPrice: number): number => {
  if (quantity < 0 || unitPrice < 0) {
    return 0;
  }
  
  // Round to 2 decimal places to avoid floating point errors
  return Math.round(quantity * unitPrice * 100) / 100;
};

/**
 * Calculate invoice totals including subtotal, tax, and final total
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

  const validTaxRate = taxRate >= 0 ? taxRate : 0;

  // Calculate subtotal by summing all line item totals
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = calculateLineTotal(item.quantity, item.unitPrice);
    return sum + lineTotal;
  }, 0);

  // Round subtotal to 2 decimal places
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // Calculate tax amount
  const taxAmount = Math.round(roundedSubtotal * (validTaxRate / 100) * 100) / 100;

  // Calculate final total
  const total = Math.round((roundedSubtotal + taxAmount) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    taxAmount,
    total,
  };
};