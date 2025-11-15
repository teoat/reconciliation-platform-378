import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '../../services/apiClient'

// Mock fetch
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('should set auth token', () => {
      const token = 'mock-jwt-token'
      apiClient.setAuthToken(token)
      
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', token)
    })

    it('should clear auth token', () => {
      apiClient.clearAuthToken()
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken')
    })

    it('should get auth token from localStorage', () => {
      const token = 'mock-jwt-token'
      localStorage.setItem('authToken', token)
      
      // This would be tested through the actual API calls
      expect(localStorage.getItem('authToken')).toBe(token)
    })
  })

  describe('HTTP Methods', () => {
    it('should make GET request', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
        statusText: 'OK',
      } as Response)

      const result = await apiClient.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make POST request with data', async () => {
      const mockData = { name: 'Test Project' }
      const mockResponse = { data: { id: 1, ...mockData } }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 201,
        statusText: 'Created',
      } as Response)

      const result = await apiClient.post('/projects', mockData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make PUT request with data', async () => {
      const mockData = { name: 'Updated Project' }
      const mockResponse = { data: { id: 1, ...mockData } }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
        statusText: 'OK',
      } as Response)

      const result = await apiClient.put('/projects/1', mockData)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should make DELETE request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        status: 204,
        statusText: 'No Content',
      } as Response)

      await apiClient.delete('/projects/1')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
        status: 404,
        statusText: 'Not Found',
      } as Response)

      await expect(apiClient.get('/nonexistent')).rejects.toThrow('Not found')
    })

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toThrow('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        status: 200,
        statusText: 'OK',
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Invalid JSON')
    })
  })

  describe('Request Interceptors', () => {
    it('should add auth token to headers when available', async () => {
      const token = 'mock-jwt-token'
      localStorage.setItem('authToken', token)
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        status: 200,
        statusText: 'OK',
      } as Response)

      await apiClient.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      )
    })

    it('should not add auth token when not available', async () => {
      localStorage.removeItem('authToken')
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        status: 200,
        statusText: 'OK',
      } as Response)

      await apiClient.get('/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      )
    })
  })

  describe('Response Interceptors', () => {
    it('should handle successful responses', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
        statusText: 'OK',
      } as Response)

      const result = await apiClient.get('/test')
      expect(result).toEqual(mockResponse)
    })

    it('should handle 401 unauthorized responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
        status: 401,
        statusText: 'Unauthorized',
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Unauthorized')
      
      // Should clear auth token on 401
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken')
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      // First call fails, second succeeds
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          status: 200,
          statusText: 'OK',
        } as Response)

      const result = await apiClient.get('/test')
      expect(result).toEqual({ data: 'success' })
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('should not retry 4xx errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Bad Request' }),
        status: 400,
        statusText: 'Bad Request',
      } as Response)

      await expect(apiClient.get('/test')).rejects.toThrow('Bad Request')
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
        statusText: 'OK',
      } as Response)

      // First call
      const result1 = await apiClient.get('/test')
      expect(result1).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledTimes(1)

      // Second call should use cache
      const result2 = await apiClient.get('/test')
      expect(result2).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledTimes(1) // Should not make another request
    })

    it('should not cache POST requests', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
        statusText: 'OK',
      } as Response)

      await apiClient.post('/test', {})
      await apiClient.post('/test', {})

      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})
