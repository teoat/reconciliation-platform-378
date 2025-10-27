import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useProjects } from '../useApi'

// Mock apiClient
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  }
}))

describe('useProjects Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useProjects())
    
    expect(result.current.projects).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch projects', async () => {
    const mockResponse = {
      projects: [{ id: '1', name: 'Test Project' }],
      page: 1,
      per_page: 10,
      total: 1,
    }

    const { apiClient } = await import('../../services/apiClient')
    vi.mocked(apiClient.getProjects).mockResolvedValueOnce({
      data: mockResponse,
      error: null
    } as any)

    const { result } = renderHook(() => useProjects())

    await result.current.fetchProjects()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.projects).toHaveLength(1)
  })
})

