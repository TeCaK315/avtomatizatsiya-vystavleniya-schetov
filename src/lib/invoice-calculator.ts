import {
  CalculateInvoiceTotalFn,
  CalculateLineItemTotalFn,
  CalculateTaxFn,
  InvoiceItem,
} from '@/types';

/**
 * Calculates the total for a single line item
 * @param quantity - Number of units
 * @param unitPrice - Price per unit
 * @param taxRate - Optional tax rate (0-100, e.g., 20 for 20%)
 * @returns Total amount for the line item including tax if provided
 */
export const calculateLineItemTotal: CalculateLineItemTotalFn = (
  quantity: number,
  unitPrice: number,
  taxRate?: number
): number => {
  if (quantity < 0 || unitPrice < 0) {
    throw new Error('Quantity and unit price must be non-negative');
  }

  const subtotal = quantity * unitPrice;
  
  if (taxRate !== undefined && taxRate !== null) {
    if (taxRate < 0 || taxRate > 100) {
      throw new Error('Tax rate must be between 0 and 100');
    }
    const taxAmount = (subtotal * taxRate) / 100;
    return Math.round((subtotal + taxAmount) * 100) / 100;
  }

  return Math.round(subtotal * 100) / 100;
};

/**
 * Calculates tax amount for a given amount and tax rate
 * @param amount - Base amount to calculate tax on
 * @param taxRate - Tax rate (0-100, e.g., 20 for 20%)
 * @returns Tax amount
 */
export const calculateTax: CalculateTaxFn = (
  amount: number,
  taxRate: number
): number => {
  if (amount < 0) {
    throw new Error('Amount must be non-negative');
  }

  if (taxRate < 0 || taxRate > 100) {
    throw new Error('Tax rate must be between 0 and 100');
  }

  const taxAmount = (amount * taxRate) / 100;
  return Math.round(taxAmount * 100) / 100;
};

/**
 * Calculates invoice totals (subtotal, tax, and grand total)
 * @param items - Array of invoice line items
 * @param taxRate - Tax rate to apply (0-100, e.g., 20 for 20%)
 * @returns Object containing subtotal, taxAmount, and total
 */
export const calculateInvoiceTotal: CalculateInvoiceTotalFn = (
  items: InvoiceItem[],
  taxRate: number
): { subtotal: number; taxAmount: number; total: number } => {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  if (taxRate < 0 || taxRate > 100) {
    throw new Error('Tax rate must be between 0 and 100');
  }

  // Calculate subtotal from all items
  const subtotal = items.reduce((sum, item) => {
    if (!item || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
      throw new Error('Invalid item: must have quantity and unitPrice');
    }

    if (item.quantity < 0 || item.unitPrice < 0) {
      throw new Error('Item quantity and unit price must be non-negative');
    }

    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + itemSubtotal;
  }, 0);

  // Round subtotal to 2 decimal places
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // Calculate tax amount
  const taxAmount = calculateTax(roundedSubtotal, taxRate);

  // Calculate total
  const total = roundedSubtotal + taxAmount;
  const roundedTotal = Math.round(total * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    taxAmount: taxAmount,
    total: roundedTotal,
  };
};

/**
 * Recalculates all line item totals based on quantity, unit price, and tax rate
 * Useful when updating invoice items
 * @param items - Array of invoice items (without calculated totals)
 * @param globalTaxRate - Global tax rate to apply to all items
 * @returns Array of items with calculated totals
 */
export const recalculateLineItems = (
  items: Omit<InvoiceItem, 'total'>[],
  globalTaxRate: number
): InvoiceItem[] => {
  return items.map((item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const roundedTotal = Math.round(itemTotal * 100) / 100;

    return {
      ...item,
      total: roundedTotal,
    };
  });
};

/**
 * Validates invoice amounts for consistency
 * @param subtotal - Calculated subtotal
 * @param taxAmount - Calculated tax amount
 * @param total - Calculated total
 * @param items - Invoice items
 * @returns True if amounts are consistent, false otherwise
 */
export const validateInvoiceAmounts = (
  subtotal: number,
  taxAmount: number,
  total: number,
  items: InvoiceItem[]
): boolean => {
  try {
    // Recalculate subtotal from items
    const calculatedSubtotal = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    const roundedCalculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;

    // Check if subtotal matches
    if (Math.abs(roundedCalculatedSubtotal - subtotal) > 0.01) {
      return false;
    }

    // Check if total equals subtotal + tax
    const calculatedTotal = subtotal + taxAmount;
    const roundedCalculatedTotal = Math.round(calculatedTotal * 100) / 100;

    if (Math.abs(roundedCalculatedTotal - total) > 0.01) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Formats amount to currency string
 * Helper function for displaying calculated amounts
 * @param amount - Numeric amount
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with fixed decimal places
 */
export const formatAmount = (amount: number, decimals: number = 2): string => {
  return amount.toFixed(decimals);
};