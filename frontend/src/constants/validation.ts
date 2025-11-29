/**
 * Validation Constants
 * 
 * Validation rules and regex patterns
 */

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[1-9][\d]{0,15}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  USERNAME: /^[a-zA-Z0-9_-]{3,50}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHABETIC: /^[a-zA-Z]+$/,
  NUMERIC: /^[0-9]+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  CURRENCY: /^\d+(\.\d{2})?$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^\d{2}:\d{2}(:\d{2})?$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
} as const;

export const REGEX_PATTERNS = {
  // Common Patterns
  EMAIL: VALIDATION_RULES.EMAIL,
  PHONE: VALIDATION_RULES.PHONE,
  URL: VALIDATION_RULES.URL,
  PASSWORD: VALIDATION_RULES.PASSWORD,
  USERNAME: VALIDATION_RULES.USERNAME,

  // Indonesian Specific
  NIK: /^[0-9]{16}$/,
  NPWP: /^[0-9]{15}$/,
  BANK_ACCOUNT: /^[0-9]{10,16}$/,
  CURRENCY_IDR: /^Rp\s?[0-9]{1,3}(\.[0-9]{3})*(,[0-9]{2})?$/,

  // International
  CREDIT_CARD: /^[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}$/,
  IBAN: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
  SWIFT: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,

  // Technical
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  PORT: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
} as const;

