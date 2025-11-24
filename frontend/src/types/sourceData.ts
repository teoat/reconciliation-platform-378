// ============================================================================
// SOURCE DATA TYPE DEFINITIONS
// ============================================================================
// Type-safe definitions for reconciliation source data structures

/**
 * Standard fields that may be present in reconciliation source data
 * Based on common reconciliation patterns (amount, currency, date, description)
 */
export interface SourceDataFields {
  /** Transaction amount (numeric) */
  amount?: number;
  /** Currency code (ISO 4217, e.g., 'USD', 'EUR') */
  currency?: string;
  /** Transaction date (ISO 8601 string) */
  date?: string;
  /** Transaction description */
  description?: string;
  /** Additional custom fields */
  [key: string]: unknown;
}

/**
 * Type guard to check if data has expected source fields structure
 * 
 * @param data - Unknown data to validate
 * @returns True if data is an object (may contain source fields)
 */
export function isSourceData(data: unknown): data is SourceDataFields {
  return typeof data === 'object' && data !== null;
}

/**
 * Safely extract numeric value from source data
 * Handles string-to-number conversion and NaN cases
 * 
 * @param data - Source data object
 * @param field - Field name to extract
 * @param defaultValue - Default value if field is missing or invalid
 * @returns Extracted number or default value
 */
export function extractNumber(
  data: unknown,
  field: string,
  defaultValue: number
): number {
  if (!isSourceData(data)) return defaultValue;
  const value = data[field];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safely extract string value from source data
 * Handles null/undefined and type conversion
 * 
 * @param data - Source data object
 * @param field - Field name to extract
 * @param defaultValue - Default value if field is missing or invalid
 * @returns Extracted string or default value
 */
export function extractString(
  data: unknown,
  field: string,
  defaultValue: string
): string {
  if (!isSourceData(data)) return defaultValue;
  const value = data[field];
  if (typeof value === 'string') return value;
  if (value != null) return String(value);
  return defaultValue;
}

/**
 * Safely extract date value from source data
 * Validates ISO 8601 format and provides fallback
 * 
 * @param data - Source data object
 * @param field - Field name to extract (default: 'date')
 * @param defaultValue - Default ISO date string
 * @returns Extracted date string or default value
 */
export function extractDate(
  data: unknown,
  field: string = 'date',
  defaultValue: string = new Date().toISOString()
): string {
  const dateString = extractString(data, field, defaultValue);
  // Basic ISO 8601 validation
  if (dateString === defaultValue) return defaultValue;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return defaultValue;
    return dateString;
  } catch {
    return defaultValue;
  }
}

