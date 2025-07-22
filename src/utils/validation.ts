// Input validation utilities for Stella app

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule<T = any> {
  name: string;
  validator: (value: T, allValues?: Record<string, any>) => boolean;
  message: string;
}

// Common validation functions
export const validators = {
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  },

  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  phone: (phone: string): boolean => {
    // International phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  },

  whatsappPhone: (phone: string): boolean => {
    // WhatsApp phone number (without + but with country code)
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    return /^[1-9]\d{7,14}$/.test(cleanPhone);
  },

  password: (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  strongPassword: (password: string): boolean => {
    // At least 12 characters, uppercase, lowercase, number, special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return strongPasswordRegex.test(password);
  },

  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  webhookUrl: (url: string): boolean => {
    if (!validators.url(url)) return false;
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  },

  minLength: (min: number) => (value: string): boolean => {
    return value.length >= min;
  },

  maxLength: (max: number) => (value: string): boolean => {
    return value.length <= max;
  },

  minValue: (min: number) => (value: number): boolean => {
    return value >= min;
  },

  maxValue: (max: number) => (value: number): boolean => {
    return value <= max;
  },

  pattern: (regex: RegExp) => (value: string): boolean => {
    return regex.test(value);
  },

  matches: (fieldName: string) => (value: string, allValues?: Record<string, any>): boolean => {
    return allValues ? value === allValues[fieldName] : false;
  },

  businessName: (name: string): boolean => {
    // Business name should be 2-100 characters, allow letters, numbers, spaces, basic punctuation
    const businessNameRegex = /^[a-zA-Z0-9\s\.\,\'\-\&]{2,100}$/;
    return businessNameRegex.test(name.trim());
  },

  messageText: (text: string): boolean => {
    // Message should be 1-4096 characters (WhatsApp limit)
    const trimmed = text.trim();
    return trimmed.length >= 1 && trimmed.length <= 4096;
  },

  templateName: (name: string): boolean => {
    // Template name: 1-512 characters, lowercase, underscores, numbers only
    const templateNameRegex = /^[a-z0-9_]{1,512}$/;
    return templateNameRegex.test(name);
  },

  phoneNumberId: (id: string): boolean => {
    // WhatsApp Phone Number ID format
    return /^\d{15,16}$/.test(id);
  },

  accessToken: (token: string): boolean => {
    // Basic token format validation
    return token.length > 100 && /^[A-Za-z0-9\-_]+$/.test(token);
  }
};

// Validation rule definitions
export const validationRules = {
  // Authentication rules
  email: [
    { name: 'required', validator: validators.required, message: 'Email is required' },
    { name: 'email', validator: validators.email, message: 'Please enter a valid email address' }
  ] as ValidationRule[],

  password: [
    { name: 'required', validator: validators.required, message: 'Password is required' },
    { name: 'password', validator: validators.password, message: 'Password must be at least 8 characters with uppercase, lowercase, and number' }
  ] as ValidationRule[],

  confirmPassword: [
    { name: 'required', validator: validators.required, message: 'Please confirm your password' },
    { name: 'matches', validator: validators.matches('password'), message: 'Passwords do not match' }
  ] as ValidationRule[],

  fullName: [
    { name: 'required', validator: validators.required, message: 'Full name is required' },
    { name: 'minLength', validator: validators.minLength(2), message: 'Name must be at least 2 characters' },
    { name: 'maxLength', validator: validators.maxLength(50), message: 'Name must be less than 50 characters' }
  ] as ValidationRule[],

  businessName: [
    { name: 'required', validator: validators.required, message: 'Business name is required' },
    { name: 'businessName', validator: validators.businessName, message: 'Business name contains invalid characters' }
  ] as ValidationRule[],

  phone: [
    { name: 'required', validator: validators.required, message: 'Phone number is required' },
    { name: 'phone', validator: validators.phone, message: 'Please enter a valid phone number' }
  ] as ValidationRule[],

  // WhatsApp rules
  whatsappPhone: [
    { name: 'required', validator: validators.required, message: 'WhatsApp phone number is required' },
    { name: 'whatsappPhone', validator: validators.whatsappPhone, message: 'Please enter a valid WhatsApp phone number' }
  ] as ValidationRule[],

  accessToken: [
    { name: 'required', validator: validators.required, message: 'Access token is required' },
    { name: 'accessToken', validator: validators.accessToken, message: 'Please enter a valid access token' }
  ] as ValidationRule[],

  phoneNumberId: [
    { name: 'required', validator: validators.required, message: 'Phone Number ID is required' },
    { name: 'phoneNumberId', validator: validators.phoneNumberId, message: 'Please enter a valid Phone Number ID' }
  ] as ValidationRule[],

  webhookUrl: [
    { name: 'required', validator: validators.required, message: 'Webhook URL is required' },
    { name: 'webhookUrl', validator: validators.webhookUrl, message: 'Please enter a valid HTTPS webhook URL' }
  ] as ValidationRule[],

  verifyToken: [
    { name: 'required', validator: validators.required, message: 'Verify token is required' },
    { name: 'minLength', validator: validators.minLength(10), message: 'Verify token must be at least 10 characters' }
  ] as ValidationRule[],

  // Message rules
  messageText: [
    { name: 'required', validator: validators.required, message: 'Message text is required' },
    { name: 'messageText', validator: validators.messageText, message: 'Message must be 1-4096 characters' }
  ] as ValidationRule[],

  templateName: [
    { name: 'required', validator: validators.required, message: 'Template name is required' },
    { name: 'templateName', validator: validators.templateName, message: 'Template name must be lowercase letters, numbers, and underscores only' }
  ] as ValidationRule[]
};

// Main validation function
export function validateField(value: any, rules: ValidationRule[], allValues?: Record<string, any>): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validator(value, allValues)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate multiple fields
export function validateForm(values: Record<string, any>, fieldRules: Record<string, ValidationRule[]>): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [fieldName, rules] of Object.entries(fieldRules)) {
    const value = values[fieldName];
    results[fieldName] = validateField(value, rules, values);
  }

  return results;
}

// Check if form is valid
export function isFormValid(validationResults: Record<string, ValidationResult>): boolean {
  return Object.values(validationResults).every(result => result.isValid);
}

// Get all form errors
export function getFormErrors(validationResults: Record<string, ValidationResult>): string[] {
  const allErrors: string[] = [];
  
  for (const result of Object.values(validationResults)) {
    allErrors.push(...result.errors);
  }
  
  return allErrors;
}

// Real-time validation hook helper
export function createValidator(rules: ValidationRule[]) {
  return (value: any, allValues?: Record<string, any>) => {
    return validateField(value, rules, allValues);
  };
}

// Custom validation messages
export const errorMessages = {
  network: {
    offline: 'You appear to be offline. Please check your internet connection.',
    timeout: 'Request timed out. Please try again.',
    serverError: 'Server error occurred. Please try again later.',
    unauthorized: 'Your session has expired. Please log in again.',
    forbidden: 'You do not have permission to perform this action.',
    notFound: 'The requested resource was not found.',
    conflict: 'A conflict occurred. Please refresh and try again.',
    tooManyRequests: 'Too many requests. Please wait before trying again.'
  },
  whatsapp: {
    configurationRequired: 'Please configure your WhatsApp settings first.',
    invalidPhoneNumber: 'The phone number format is not supported by WhatsApp.',
    messageDeliveryFailed: 'Failed to deliver message. Please try again.',
    webhookValidationFailed: 'Webhook validation failed. Please check your settings.',
    quotaExceeded: 'Message quota exceeded. Please upgrade your plan.',
    templateNotApproved: 'Message template is not approved yet.',
    businessNotVerified: 'Your WhatsApp Business account needs verification.'
  },
  auth: {
    loginFailed: 'Invalid email or password.',
    registrationFailed: 'Registration failed. Please try again.',
    passwordResetFailed: 'Password reset failed. Please try again.',
    tokenExpired: 'Your session has expired. Please log in again.',
    accountLocked: 'Your account has been temporarily locked.',
    emailNotVerified: 'Please verify your email address first.',
    weakPassword: 'Password is too weak. Please choose a stronger password.'
  }
};

// Sanitization functions
export const sanitizers = {
  phone: (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '');
  },

  whatsappPhone: (phone: string): string => {
    return phone.replace(/[\s\-\(\)\+]/g, '');
  },

  email: (email: string): string => {
    return email.toLowerCase().trim();
  },

  businessName: (name: string): string => {
    return name.trim().replace(/\s+/g, ' ');
  },

  messageText: (text: string): string => {
    return text.trim();
  },

  templateName: (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }
};
