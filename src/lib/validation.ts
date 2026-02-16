import type { 
  ValidateInvoiceData, 
  ValidateEmail, 
  ValidatePdfFile,
  InvoiceFormData 
} from '@/types';

/**
 * Validate email format using RFC 5322 compliant regex
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 */
export const validateEmail: ValidateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // RFC 5322 compliant email regex (simplified version)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Additional checks
  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0 || trimmedEmail.length > 254) {
    return false;
  }

  return emailRegex.test(trimmedEmail);
};

/**
 * Validate PDF file
 * @param file - File object to validate
 * @returns Object with isValid boolean and optional error message
 */
export const validatePdfFile: ValidatePdfFile = (file: File): { isValid: boolean; error?: string } => {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
    };
  }

  // Check file type
  const validTypes = ['application/pdf'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only PDF files are allowed.',
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    return {
      isValid: false,
      error: 'Invalid file extension. File must have .pdf extension.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit.',
    };
  }

  // Check minimum file size (at least 1KB)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return {
      isValid: false,
      error: 'File is too small. Minimum size is 1KB.',
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Validate invoice form data
 * @param data - Partial invoice form data to validate
 * @returns Object with isValid boolean and errors object
 */
export const validateInvoiceData: ValidateInvoiceData = (
  data: Partial<InvoiceFormData>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate invoice number
  if (!data.invoiceNumber || data.invoiceNumber.trim().length === 0) {
    errors.invoiceNumber = 'Invoice number is required';
  } else if (data.invoiceNumber.trim().length > 50) {
    errors.invoiceNumber = 'Invoice number must be 50 characters or less';
  }

  // Validate client name
  if (!data.clientName || data.clientName.trim().length === 0) {
    errors.clientName = 'Client name is required';
  } else if (data.clientName.trim().length > 255) {
    errors.clientName = 'Client name must be 255 characters or less';
  }

  // Validate client email
  if (!data.clientEmail || data.clientEmail.trim().length === 0) {
    errors.clientEmail = 'Client email is required';
  } else if (!validateEmail(data.clientEmail)) {
    errors.clientEmail = 'Invalid email format';
  }

  // Validate client address (optional but has max length)
  if (data.clientAddress && data.clientAddress.trim().length > 500) {
    errors.clientAddress = 'Client address must be 500 characters or less';
  }

  // Validate issue date
  if (!data.issueDate || data.issueDate.trim().length === 0) {
    errors.issueDate = 'Issue date is required';
  } else {
    const issueDate = new Date(data.issueDate);
    if (isNaN(issueDate.getTime())) {
      errors.issueDate = 'Invalid issue date format';
    }
  }

  // Validate due date
  if (!data.dueDate || data.dueDate.trim().length === 0) {
    errors.dueDate = 'Due date is required';
  } else {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.dueDate = 'Invalid due date format';
    } else if (data.issueDate) {
      const issueDate = new Date(data.issueDate);
      if (!isNaN(issueDate.getTime()) && dueDate < issueDate) {
        errors.dueDate = 'Due date must be after issue date';
      }
    }
  }

  // Validate items
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    data.items.forEach((item, index) => {
      if (!item.description || item.description.trim().length === 0) {
        errors[`items.${index}.description`] = `Item ${index + 1}: Description is required`;
      } else if (item.description.trim().length > 500) {
        errors[`items.${index}.description`] = `Item ${index + 1}: Description must be 500 characters or less`;
      }

      if (item.quantity === undefined || item.quantity === null) {
        errors[`items.${index}.quantity`] = `Item ${index + 1}: Quantity is required`;
      } else if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors[`items.${index}.quantity`] = `Item ${index + 1}: Quantity must be greater than 0`;
      } else if (item.quantity > 999999) {
        errors[`items.${index}.quantity`] = `Item ${index + 1}: Quantity is too large`;
      }

      if (item.unitPrice === undefined || item.unitPrice === null) {
        errors[`items.${index}.unitPrice`] = `Item ${index + 1}: Unit price is required`;
      } else if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        errors[`items.${index}.unitPrice`] = `Item ${index + 1}: Unit price must be 0 or greater`;
      } else if (item.unitPrice > 9999999.99) {
        errors[`items.${index}.unitPrice`] = `Item ${index + 1}: Unit price is too large`;
      }
    });
  }

  // Validate tax rate
  if (data.taxRate === undefined || data.taxRate === null) {
    errors.taxRate = 'Tax rate is required';
  } else if (typeof data.taxRate !== 'number' || data.taxRate < 0) {
    errors.taxRate = 'Tax rate must be 0 or greater';
  } else if (data.taxRate > 100) {
    errors.taxRate = 'Tax rate cannot exceed 100%';
  }

  // Validate notes (optional but has max length)
  if (data.notes && data.notes.trim().length > 1000) {
    errors.notes = 'Notes must be 1000 characters or less';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};