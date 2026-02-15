import type { 
  ValidateEmailFn, 
  ValidateInvoiceDataFn, 
  ValidateAmountFn,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  Contact,
  InvoiceItem
} from '@/types';

/**
 * Validates email address format using RFC 5322 compliant regex
 */
export const validateEmail: ValidateEmailFn = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates monetary amount (must be positive number with max 2 decimal places)
 */
export const validateAmount: ValidateAmountFn = (amount: number): boolean => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }

  if (amount < 0) {
    return false;
  }

  // Check max 2 decimal places
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return false;
  }

  return true;
};

/**
 * Validates contact information
 */
const validateContact = (contact: Contact, fieldName: string): string[] => {
  const errors: string[] = [];

  if (!contact) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  if (!contact.name || contact.name.trim().length === 0) {
    errors.push(`${fieldName}.name is required`);
  }

  if (!contact.email || !validateEmail(contact.email)) {
    errors.push(`${fieldName}.email is invalid`);
  }

  if (contact.phone && contact.phone.trim().length > 0) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(contact.phone)) {
      errors.push(`${fieldName}.phone contains invalid characters`);
    }
  }

  if (contact.address) {
    if (!contact.address.street || contact.address.street.trim().length === 0) {
      errors.push(`${fieldName}.address.street is required when address is provided`);
    }
    if (!contact.address.city || contact.address.city.trim().length === 0) {
      errors.push(`${fieldName}.address.city is required when address is provided`);
    }
    if (!contact.address.zipCode || contact.address.zipCode.trim().length === 0) {
      errors.push(`${fieldName}.address.zipCode is required when address is provided`);
    }
    if (!contact.address.country || contact.address.country.trim().length === 0) {
      errors.push(`${fieldName}.address.country is required when address is provided`);
    }
  }

  return errors;
};

/**
 * Validates invoice line items
 */
const validateItems = (items: Omit<InvoiceItem, 'id' | 'total'>[]): string[] => {
  const errors: string[] = [];

  if (!items || !Array.isArray(items)) {
    errors.push('items must be an array');
    return errors;
  }

  if (items.length === 0) {
    errors.push('At least one item is required');
    return errors;
  }

  items.forEach((item, index) => {
    if (!item.description || item.description.trim().length === 0) {
      errors.push(`Item ${index + 1}: description is required`);
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: quantity must be a positive number`);
    }

    if (!validateAmount(item.unitPrice)) {
      errors.push(`Item ${index + 1}: unitPrice is invalid`);
    }

    if (item.unitPrice <= 0) {
      errors.push(`Item ${index + 1}: unitPrice must be greater than 0`);
    }

    if (item.taxRate !== undefined) {
      if (typeof item.taxRate !== 'number' || item.taxRate < 0 || item.taxRate > 100) {
        errors.push(`Item ${index + 1}: taxRate must be between 0 and 100`);
      }
    }
  });

  return errors;
};

/**
 * Validates date string (ISO 8601 format)
 */
const validateDate = (dateString: string, fieldName: string): string[] => {
  const errors: string[] = [];

  if (!dateString || typeof dateString !== 'string') {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} is not a valid date`);
  }

  return errors;
};

/**
 * Validates tax rate (0-100)
 */
const validateTaxRate = (taxRate: number): string[] => {
  const errors: string[] = [];

  if (typeof taxRate !== 'number' || isNaN(taxRate)) {
    errors.push('taxRate must be a number');
    return errors;
  }

  if (taxRate < 0 || taxRate > 100) {
    errors.push('taxRate must be between 0 and 100');
  }

  return errors;
};

/**
 * Validates complete invoice data for creation or update
 */
export const validateInvoiceData: ValidateInvoiceDataFn = (
  data: CreateInvoiceRequest | UpdateInvoiceRequest
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // For CreateInvoiceRequest, all fields are required
  const isCreateRequest = 'from' in data && 'to' in data && 'items' in data;

  if (isCreateRequest) {
    const createData = data as CreateInvoiceRequest;

    // Validate from contact
    errors.push(...validateContact(createData.from, 'from'));

    // Validate to contact
    errors.push(...validateContact(createData.to, 'to'));

    // Validate items
    errors.push(...validateItems(createData.items));

    // Validate dueDate
    errors.push(...validateDate(createData.dueDate, 'dueDate'));

    // Validate due date is in the future
    const dueDate = new Date(createData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      errors.push('dueDate must be today or in the future');
    }

    // Validate taxRate
    errors.push(...validateTaxRate(createData.taxRate));

    // Validate optional fields
    if (createData.notes && typeof createData.notes !== 'string') {
      errors.push('notes must be a string');
    }

    if (createData.terms && typeof createData.terms !== 'string') {
      errors.push('terms must be a string');
    }
  } else {
    // For UpdateInvoiceRequest, validate only provided fields
    const updateData = data as UpdateInvoiceRequest;

    if (updateData.from) {
      errors.push(...validateContact(updateData.from, 'from'));
    }

    if (updateData.to) {
      errors.push(...validateContact(updateData.to, 'to'));
    }

    if (updateData.items) {
      errors.push(...validateItems(updateData.items));
    }

    if (updateData.dueDate) {
      errors.push(...validateDate(updateData.dueDate, 'dueDate'));
    }

    if (updateData.taxRate !== undefined) {
      errors.push(...validateTaxRate(updateData.taxRate));
    }

    if (updateData.status !== undefined) {
      const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(updateData.status)) {
        errors.push(`status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    if (updateData.paymentMethod !== undefined) {
      const validMethods = ['bank_transfer', 'credit_card', 'paypal', 'cash'];
      if (!validMethods.includes(updateData.paymentMethod)) {
        errors.push(`paymentMethod must be one of: ${validMethods.join(', ')}`);
      }
    }

    if (updateData.paidDate !== undefined) {
      errors.push(...validateDate(updateData.paidDate, 'paidDate'));
    }

    if (updateData.paidAmount !== undefined) {
      if (!validateAmount(updateData.paidAmount)) {
        errors.push('paidAmount is invalid');
      }
    }

    if (updateData.notes !== undefined && typeof updateData.notes !== 'string') {
      errors.push('notes must be a string');
    }

    if (updateData.terms !== undefined && typeof updateData.terms !== 'string') {
      errors.push('terms must be a string');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};