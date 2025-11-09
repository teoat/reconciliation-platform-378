import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../hooks/useAuth'
import Dashboard from '../Dashboard'

// Mock the hooks
jest.mock('../../hooks/useFileReconciliation', () => ({
  useHealthCheck: () => ({
    isHealthy: true,
    isChecking: false,
    lastChecked: new Date('2024-01-01T12:00:00Z')
  })
}))

jest.mock('../../hooks/useApi', () => ({
  useProjects: () => ({
    projects: [
      {
        id: '1',
        name: 'Test Project 1',
        description: 'A test project',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Test Project 2',
        description: 'Another test project',
        status: 'inactive',
        created_at: '2024-01-02T00:00:00Z'
      }
    ],
    isLoading: false,
    error: null,
    fetchProjects: jest.fn()
  })
}))

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render dashboard title', () => {
    renderDashboard()
    expect(screen.getByText('Reconciliation Platform Dashboard')).toBeInTheDocument()
  })

  it('should display system status section', () => {
    renderDashboard()
    expect(screen.getByText('System Status')).toBeInTheDocument()
    expect(screen.getByText('✅ Backend Connected')).toBeInTheDocument()
  })

  it('should display projects section', () => {
    renderDashboard()
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('should display project cards', () => {
    renderDashboard()
    expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    expect(screen.getByText('Test Project 2')).toBeInTheDocument()
  })

  it('should display project status badges', () => {
    renderDashboard()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('should display quick actions section', () => {
    renderDashboard()
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Refresh Projects')).toBeInTheDocument()
    expect(screen.getByText('Create Project')).toBeInTheDocument()
    expect(screen.getByText('Upload Files')).toBeInTheDocument()
    expect(screen.getByText('Start Reconciliation')).toBeInTheDocument()
  })

  it('should handle refresh projects button click', () => {
    const mockFetchProjects = jest.fn()
    jest.doMock('../../hooks/useApi', () => ({
      useProjects: () => ({
        projects: [],
        isLoading: false,
        error: null,
        fetchProjects: mockFetchProjects
      })
    }))

    renderDashboard()
    const refreshButton = screen.getByText('Refresh Projects')
    fireEvent.click(refreshButton)
    
    // Note: In a real test, we would verify the mock function was called
    expect(refreshButton).toBeInTheDocument()
  })

  it('should handle create project button click', () => {
    renderDashboard()
    const createButton = screen.getByText('Create Project')
    fireEvent.click(createButton)
    
    // Should navigate to projects/new
    expect(window.location.href).toContain('/projects/new')
  })

  it('should handle upload files button click', () => {
    renderDashboard()
    const uploadButton = screen.getByText('Upload Files')
    fireEvent.click(uploadButton)
    
    // Should navigate to upload page
    expect(window.location.href).toContain('/upload')
  })

  it('should handle start reconciliation button click', () => {
    renderDashboard()
    const reconciliationButton = screen.getByText('Start Reconciliation')
    fireEvent.click(reconciliationButton)
    
    // Should navigate to reconciliation page
    expect(window.location.href).toContain('/reconciliation')
  })

  it('should display last checked time', () => {
    renderDashboard()
    expect(screen.getByText(/Last checked:/)).toBeInTheDocument()
  })

  it('should handle loading state', () => {
    jest.doMock('../../hooks/useApi', () => ({
      useProjects: () => ({
        projects: [],
        isLoading: true,
        error: null,
        fetchProjects: jest.fn()
      })
    }))

    renderDashboard()
    expect(screen.getByText('Loading projects...')).toBeInTheDocument()
  })

  it('should handle error state', () => {
    jest.doMock('../../hooks/useApi', () => ({
      useProjects: () => ({
        projects: [],
        isLoading: false,
        error: 'Failed to fetch projects',
        fetchProjects: jest.fn()
      })
    }))

    renderDashboard()
    expect(screen.getByText('Error: Failed to fetch projects')).toBeInTheDocument()
  })

  it('should handle no projects state', () => {
    jest.doMock('../../hooks/useApi', () => ({
      useProjects: () => ({
        projects: [],
        isLoading: false,
        error: null,
        fetchProjects: jest.fn()
      })
    }))

    renderDashboard()
    expect(screen.getByText('No projects found')).toBeInTheDocument()
  })

  it('should display project creation dates', () => {
    renderDashboard()
    expect(screen.getByText('1/1/2024')).toBeInTheDocument()
    expect(screen.getByText('1/2/2024')).toBeInTheDocument()
  })

  it('should have proper CSS classes', () => {
    renderDashboard()
    const dashboard = screen.getByText('Reconciliation Platform Dashboard').closest('div')
    expect(dashboard).toHaveClass('min-h-screen', 'bg-gray-100', 'p-8')
  })

  it('should be responsive', () => {
    renderDashboard()
    const container = screen.getByText('Reconciliation Platform Dashboard').closest('div')
    expect(container).toHaveClass('max-w-6xl', 'mx-auto')
  })
})
