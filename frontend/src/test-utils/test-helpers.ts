// ============================================================================
// SHARED TEST HELPERS FOR FRONTEND TESTS
// ============================================================================

import { vi } from 'vitest';

/**
 * Mocks the global fetch function for testing API calls.
 * @param {boolean} ok - Whether the fetch call should be successful.
 * @param {object} data - The data to be returned in the response body.
 * @param {number} status - The HTTP status code.
 */
export function mockFetch(ok: boolean, data: object, status: number = 200) {
  const mockResponse = {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
  global.fetch = vi.fn().mockResolvedValue(mockResponse);
}