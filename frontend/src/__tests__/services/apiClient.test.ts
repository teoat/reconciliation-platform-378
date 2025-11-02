import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiClient } from '../../services/apiClient'

// Mock fetch
global.fetch = vi.fn()

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('makes authenticated requests with token', async () => {
    const mockToken = 'test-token'
    apiClient.setAuthToken(mockToken)
    
    const mockResponse = { data: { id: '1' } }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const response = await apiClient.getProjects()
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockToken}`,
        }),
      })
    )
  })

  it('handles login request', async () => {
    const mockResponse = { 
      token: 'test-token',
      user: { id: '1', email: 'test@example.com' }
    }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const response = await apiClient.login({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(response.data).toBeDefined()
    expect(localStorage.getItem('authToken')).toBe('test-token')
  })

  it('handles registration request', async () => {
    const mockResponse = { 
      token: 'test-token',
      user: { id: '1', email: 'test@example.com' }
    }
    
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const response = await apiClient.register({
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    })

    expect(response.data).toBeDefined()
    expect(localStorage.getItem('authToken')).toBe('test-token')
  })

  it('handles errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(
      new Error('Network error')
    )

    await expect(apiClient.getProjects()).rejects.toThrow()
  })
})

