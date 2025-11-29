// ============================================================================
// SERVICE UTILITIES - SSOT
// ============================================================================
// Consolidated service utilities to eliminate duplication
// This is the single source of truth for common service helper functions

/**
 * Build query string from parameters object
 * 
 * @param params - Object with key-value pairs to convert to query string
 * @returns Query string (e.g., "?key1=value1&key2=value2") or empty string
 * 
 * @example
 * ```typescript
 * buildQueryString({ page: 1, limit: 20 }); // Returns: "?page=1&limit=20"
 * buildQueryString({ tags: ['a', 'b'] }); // Returns: "?tags=a&tags=b"
 * buildQueryString(); // Returns: ""
 * ```
 */
export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) searchParams.append(key, String(v));
    } else if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value));
    } else {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Parse query string to object
 * 
 * @param queryString - Query string (with or without leading "?")
 * @returns Object with parsed parameters
 * 
 * @example
 * ```typescript
 * parseQueryString("?page=1&limit=20"); // Returns: { page: "1", limit: "20" }
 * parseQueryString("page=1&limit=20"); // Returns: { page: "1", limit: "20" }
 * ```
 */
export function parseQueryString(queryString: string): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  const searchParams = new URLSearchParams(queryString.replace(/^\?/, ''));
  
  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      // Multiple values for same key - convert to array
      const existing = params[key];
      params[key] = Array.isArray(existing) 
        ? [...existing, value]
        : [existing as string, value];
    } else {
      params[key] = value;
    }
  }
  
  return params;
}

/**
 * Merge multiple query parameter objects
 * 
 * @param params - Array of parameter objects to merge
 * @returns Merged parameters object (later objects override earlier ones)
 * 
 * @example
 * ```typescript
 * mergeQueryParams({ page: 1 }, { limit: 20 }); 
 * // Returns: { page: 1, limit: 20 }
 * ```
 */
export function mergeQueryParams(...params: Array<Record<string, unknown>>): Record<string, unknown> {
  return Object.assign({}, ...params);
}

