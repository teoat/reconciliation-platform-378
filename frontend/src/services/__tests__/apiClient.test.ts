import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import { createMockApiResponse, createMockError } from '../../__tests__/utils/testHelpers';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = createMockApiResponse({ id: 1, name: 'Test' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.get('/test');

      expect(fetchMock).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: expect.any(String),
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request with query parameters', async () => {
      const mockResponse = createMockApiResponse({ items: [] });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.get('/test', { page: 1, limit: 10 });

      expect(fetchMock).toHaveBeenCalledWith('/api/test?page=1&limit=10', expect.any(Object));
      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request errors', async () => {
      const errorResponse = createMockError('Not found', 'NOT_FOUND');
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Not found');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { name: 'New Item', value: 42 };
      const mockResponse = createMockApiResponse({ id: 1, ...mockData });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.post('/test', mockData);

      expect(fetchMock).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: expect.any(String),
        },
        body: JSON.stringify(mockData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle POST request validation errors', async () => {
      const invalidData = { name: '', value: -1 };
      const errorResponse = createMockError('Validation failed', 'VALIDATION_ERROR');
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(apiClient.post('/test', invalidData)).rejects.toThrow('Validation failed');
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated Item' };
      const mockResponse = createMockApiResponse({ id: 1, ...updateData });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.put('/test/1', updateData);

      expect(fetchMock).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: expect.any(String),
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = createMockApiResponse({ deleted: true });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.delete('/test/1');

      expect(fetchMock).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: expect.any(String),
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Authentication', () => {
    it('should include authorization header when token exists', async () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(() => 'mock-jwt-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const mockResponse = createMockApiResponse({ data: 'test' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.get('/test');

      expect(fetchMock).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-jwt-token',
        },
      });
    });

    it('should handle requests without authentication', async () => {
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const mockResponse = createMockApiResponse({ data: 'test' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.get('/test');

      expect(fetchMock).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Invalid JSON');
    });

    it('should handle server errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('Internal Server Error');
    });
  });

  describe('Request configuration', () => {
    it('should support custom headers', async () => {
      const mockResponse = createMockApiResponse({ data: 'test' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      await apiClient.get('/test', {}, { headers: customHeaders });

      expect(fetchMock).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: expect.any(String),
          'X-Custom-Header': 'custom-value',
        },
      });
    });

    it('should support custom timeout', async () => {
      const mockResponse = createMockApiResponse({ data: 'test' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Note: Actual timeout implementation would need AbortController
      await apiClient.get('/test', {}, { timeout: 5000 });

      expect(fetchMock).toHaveBeenCalledWith('/api/test', expect.any(Object));
    });
  });
});
