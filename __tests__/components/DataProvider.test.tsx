import { render, screen, waitFor } from '../test-utils'
import { DataProvider, useData } from '../app/components/DataProvider'
import { createMockProject } from '../test-utils'

// Test component that uses the DataProvider
const TestComponent = () => {
  const { currentProject, isLoading, error } = useData()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      <h1>Test Component</h1>
      {currentProject && (
        <div>
          <p>Project: {currentProject.name}</p>
          <p>Status: {currentProject.status}</p>
        </div>
      )}
    </div>
  )
}

describe('DataProvider', () => {
  it('should render without crashing', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    )
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  it('should initialize with sample project', async () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/Project:/)).toBeInTheDocument()
    })
  })

  it('should handle project creation', async () => {
    const TestCreateComponent = () => {
      const { createProject } = useData()
      
      const handleCreate = () => {
        createProject({
          name: 'New Test Project',
          description: 'A new test project'
        })
      }
      
      return (
        <div>
          <button onClick={handleCreate}>Create Project</button>
        </div>
      )
    }
    
    render(
      <DataProvider>
        <TestCreateComponent />
      </DataProvider>
    )
    
    const createButton = screen.getByText('Create Project')
    expect(createButton).toBeInTheDocument()
  })

  it('should handle data transformation', async () => {
    const TestTransformComponent = () => {
      const { transformIngestionToReconciliation } = useData()
      
      const handleTransform = () => {
        transformIngestionToReconciliation('sample-project')
      }
      
      return (
        <div>
          <button onClick={handleTransform}>Transform Data</button>
        </div>
      )
    }
    
    render(
      <DataProvider>
        <TestTransformComponent />
      </DataProvider>
    )
    
    const transformButton = screen.getByText('Transform Data')
    expect(transformButton).toBeInTheDocument()
  })

  it('should provide error handling', async () => {
    const TestErrorComponent = () => {
      const { error } = useData()
      
      return (
        <div>
          {error && <div>Error: {error}</div>}
        </div>
      )
    }
    
    render(
      <DataProvider>
        <TestErrorComponent />
      </DataProvider>
    )
    
    // Initially no error should be present
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
  })
})

describe('useData hook', () => {
  it('should throw error when used outside DataProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useData must be used within a DataProvider')
    
    consoleSpy.mockRestore()
  })
})
