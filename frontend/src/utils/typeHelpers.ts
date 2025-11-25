/**
 * Type Helper Utilities
 * 
 * Provides utility functions and types for common TypeScript type conversions
 * and assertions to prevent type errors throughout the codebase.
 */

/**
 * Safely converts unknown to Record<string, unknown>
 * Use this when you need to convert unknown data to a record type
 */
export function toRecord(data: unknown): Record<string, unknown> | undefined {
  if (data === null || data === undefined) {
    return undefined;
  }
  if (typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return undefined;
}

/**
 * Type guard to check if value is a Record
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Safely converts unknown to array of records
 */
export function toRecordArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }
  return [];
}

/**
 * Type assertion helper for unknown to specific type
 * Use with caution - only when you're certain of the type
 */
export function assertType<T>(value: unknown, typeGuard?: (val: unknown) => val is T): T {
  if (typeGuard && !typeGuard(value)) {
    throw new Error(`Type assertion failed: value does not match expected type`);
  }
  return value as T;
}

/**
 * Safely gets a property from unknown object
 */
export function getProperty(obj: unknown, key: string): unknown {
  if (isRecord(obj)) {
    return obj[key];
  }
  return undefined;
}

/**
 * Type-safe way to handle unknown data in callbacks
 */
export function safeCallback<T extends Record<string, unknown>>(
  callback: (data: T) => void,
  data: unknown
): void {
  if (isRecord(data)) {
    callback(data as T);
  }
}

