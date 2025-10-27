import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useProjects,
  useProject,
  useDataSources,
  useReconciliationRecords,
  useReconciliationJobs,
  useWebSocket
} from '../useApi'

// Mock the apiClient
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    getProjects: vi.fn(),
    getProjectById: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getDataSources: vi.fn(),
    uploadFile: vi.fn(),
    processFile: vi.fn(),
    getReconciliationRecords: vi.fn(),
    getReconciliationJobs: vi.fn(),
    createReconciliationJob: vi.fn(),
    updateReconciliationJob: vi.fn(),
    deleteReconciliationJob: vi.fn(),
    startReconciliationJob: vi.fn(),
  },
  wsClient: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
}))

describe('useApi Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('useProjects', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useProjects())
      
      expect(result.current.projects).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should fetch projects successfully', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', description: 'Test project 1', created_at: new Date().toISOString(), owner_id: 'user1' },
        { id: '2', name: 'Project 2', description: 'Test project 2', created_at: new Date().toISOString(), owner_id: 'user1' }
      ]

      const mockResponse = {
        projects: mockProjects,
        page: 1,
        per_page: 10,
        total: 2,
        total_pages: 1
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

      expect(result.current.projects).toHaveLength(2)
      expect(result.current.pagination.total).toBe(2)
    })

    it('should handle fetch errors', async () => {
      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.getProjects).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useProjects())

      await result.current.fetchProjects()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.projects).toEqual([])
    })

    it('should create a project', async () => {
      const mockProject = {
        id: '1',
        name: 'New Project',
        description: 'Test project',
        created_at: new Date().toISOString(),
        owner_id: 'user1'
      }

      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.createProject).mockResolvedValueOnce({
        data: mockProject,
        error: null
      } as any)

      const { result } = renderHook(() => useProjects())

      const response = await result.current.createProject({
        name: 'New Project',
        description: 'Test project'
      })

      expect(response.success).toBe(true)
    })

    it('should update a project', async () => {
      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.updateProject).mockResolvedValueOnce({
        data: { id: '1', name: 'Updated Project' },
        error: null
      } as any)

      const { result } = renderHook(() => useProjects())

      const response = await result.current.updateProject('1', {
        name: 'Updated Project'
      })

      expect(response.success).toBe(true)
    })

    it('should delete a project', async () => {
      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.deleteProject).mockResolvedValueOnce({
        data: null,
        error: null
      } as any)

      const { result } = renderHook(() => useProjects())

      const response = await result.current.deleteProject('1')

      expect(response.success).toBe(true)
    })
  })

  describe('useProject', () => {
    it('should fetch a single project', async () => {
      const mockProject = {
        id: '1',
        name: 'Project 1',
        description: 'Test project',
        created_at: new Date().toISOString(),
        owner_id: 'user1'
      }

      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.getProjectById).mockResolvedValueOnce({
        data: mockProject,
        error: null
      } as any)

      const { result } = renderHook(() => useProject('1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.project).toBeTruthy()
      expect(result.current.project?.id).toBe('1')
    })

    it('should handle null project ID', () => {
      const { result } = renderHook(() => useProject(null))

      expect(result.current.project).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('useDataSources', () => {
    it('should fetch data sources', async () => {
      const mockDataSources = [
        { id: '1', name: 'Source 1', source_type: 'csv', project_id: 'proj1' }
      ]

      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.getDataSources).mockResolvedValueOnce({
        data: { data_sources: mockDataSources },
        error: null
      } as any)

      const { result } = renderHook(() => useDataSources('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.dataSources).toHaveLength(1)
    })
  })

  describe('useReconciliationRecords', () => {
    it('should fetch reconciliation records', async () => {
      const mockRecords = [
        { id: '1', reconciliation_id: 'REC001', status: 'matched', confidence: 0.95 }
      ]

      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.getReconciliationRecords).mockResolvedValueOnce({
        data: { records: mockRecords },
        error: null
      } as any)

      const { result } = renderHook(() => useReconciliationRecords('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.records).toHaveLength(1)
    })
  })

  describe('useReconciliationJobs', () => {
    it('should fetch reconciliation jobs', async () => {
      const mockJobs = [
        { id: '1', name: 'Job 1', status: 'pending', project_id: 'proj1' }
      ]

      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.getReconciliationJobs).mockResolvedValueOnce({
        data: { jobs: mockJobs },
        error: null
      } as any)

      const { result } = renderHook(() => useReconciliationJobs('proj1'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.jobs).toHaveLength(1)
    })

    it('should create a reconciliation job', async () => {
      const mockJob = { id: '1', name: 'New Job', status: 'pending' }

      const { apiClient } = await import('../../services/apiClient')
      vi.mocked(apiClient.createReconciliationJob).mockResolvedValueOnce({
        data: mockJob,
        error: null
      } as any)

      const { result } = renderHook(() => useReconciliationJobs('proj1'))

      const response = await result.current.createJob({
        name: 'New Job',
        description: 'Test job'
      })

      expect(response.success).toBe(true)
    })
  })

  describe('useWebSocket', () => {
    it('should initialize disconnected', () => {
      const { result } = renderHook(() => useWebSocket())

      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionStatus).toBe('disconnected')
    })

    it('should connect to WebSocket', async () => {
      const { wsClient } = await import('../../services/apiClient')
      vi.mocked(wsClient.connect).mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useWebSocket())

      await result.current.connect('test-token')

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      expect(result.current.connectionStatus).toBe('connected')
    })

    it('should disconnect from WebSocket', () => {
      const { result } = renderHook(() => useWebSocket())

      result.current.disconnect()

      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionStatus).toBe('disconnected')
    })
  })
})

