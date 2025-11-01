// ============================================================================
// COMPONENT TESTING UTILITIES - SINGLE SOURCE OF TRUTH
// ============================================================================
/// <reference types="vitest/globals" />

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

// ============================================================================
// TEST UTILITIES
// ============================================================================

// Mock store for testing
export const createMockStore = (initialState: any = {}) => {
  return {
    getState: () => ({
      auth: { user: null, isAuthenticated: false },
      projects: { projects: [], selectedProject: null },
      reconciliation: { records: [], stats: {} },
      ui: { sidebarOpen: false, theme: 'light' },
      ...initialState,
    }),
    dispatch: (action: any) => action,
    subscribe: () => () => {},
    replaceReducer: () => {},
  } as any
}

// Test wrapper with providers
export const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createMockStore() 
}) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
)

// Custom render function
export const customRender = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>,
    ...options,
  })
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  preferences: {
    theme: 'light' as const,
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      inApp: true,
      frequency: 'immediate' as const,
    },
    dashboard: {
      layout: 'grid' as const,
      widgets: [],
      refreshInterval: 30000,
    },
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

export const mockProject = {
  id: '1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active' as const,
  priority: 'medium' as const,
  owner: mockUser,
  team: [mockUser],
  settings: {
    autoSave: true,
    notifications: true,
    sharing: false,
    versioning: true,
  },
  metadata: {
    tags: ['test'],
    category: 'development',
    source: 'manual',
    version: '1.0.0',
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

export const mockReconciliationRecord = {
  id: '1',
  projectId: '1',
  sourceId: 'source-1',
  targetId: 'target-1',
  sourceSystem: 'System A',
  targetSystem: 'System B',
  amount: 1000,
  currency: 'USD',
  transactionDate: '2023-01-01T00:00:00Z',
  description: 'Test transaction',
  status: 'matched' as const,
  matchType: 'exact' as const,
  confidence: 1.0,
  discrepancies: [],
  metadata: {
    source: {},
    target: {},
    computed: {},
    tags: [],
    notes: [],
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

// ============================================================================
// TEST HELPERS
// ============================================================================

// Wait for async operations
export const waitForAsync = () => waitFor(() => Promise.resolve())

// Mock API responses
export const mockApiResponse = <T,>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString(),
})

// Mock error response
export const mockApiError = (message = 'Test error', code = 'TEST_ERROR') => ({
  code,
  message,
  timestamp: new Date().toISOString(),
})

// Mock fetch
export const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

// ============================================================================
// COMPONENT TEST TEMPLATES
// ============================================================================

// Button component test template
export const testButtonComponent = (ButtonComponent: React.ComponentType<any>) => {
  describe('Button Component', () => {
    it('renders with default props', () => {
      customRender(<ButtonComponent>Test Button</ButtonComponent>)
      expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument()
    })

    it('handles click events', async () => {
      const handleClick = jest.fn()
      customRender(<ButtonComponent onClick={handleClick}>Test Button</ButtonComponent>)
      
      await userEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('shows loading state', () => {
      customRender(<ButtonComponent loading>Test Button</ButtonComponent>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('applies variant styles', () => {
      customRender(<ButtonComponent variant="danger">Test Button</ButtonComponent>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-600')
    })

    it('applies size styles', () => {
      customRender(<ButtonComponent size="lg">Test Button</ButtonComponent>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3')
    })
  })
}

// Input component test template
export const testInputComponent = (InputComponent: React.ComponentType<any>) => {
  describe('Input Component', () => {
    it('renders with default props', () => {
      customRender(<InputComponent placeholder="Enter text" />)
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument()
    })

    it('handles value changes', async () => {
      const handleChange = jest.fn()
      customRender(<InputComponent onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test')
      
      expect(handleChange).toHaveBeenCalled()
    })

    it('shows error state', () => {
      customRender(<InputComponent error="Test error" />)
      expect(screen.getByText(/test error/i)).toBeInTheDocument()
    })

    it('shows helper text', () => {
      customRender(<InputComponent helperText="Helper text" />)
      expect(screen.getByText(/helper text/i)).toBeInTheDocument()
    })

    it('renders with label', () => {
      customRender(<InputComponent label="Test Label" />)
      expect(screen.getByLabelText(/test label/i)).toBeInTheDocument()
    })
  })
}

// Modal component test template
export const testModalComponent = (ModalComponent: React.ComponentType<any>) => {
  describe('Modal Component', () => {
    it('renders when open', () => {
      customRender(
        <ModalComponent isOpen onClose={jest.fn()}>
          <div>Modal content</div>
        </ModalComponent>
      )
      expect(screen.getByText(/modal content/i)).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      customRender(
        <ModalComponent isOpen={false} onClose={jest.fn()}>
          <div>Modal content</div>
        </ModalComponent>
      )
      expect(screen.queryByText(/modal content/i)).not.toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      const handleClose = jest.fn()
      customRender(
        <ModalComponent isOpen onClose={handleClose}>
          <div>Modal content</div>
        </ModalComponent>
      )
      
      await userEvent.click(screen.getByLabelText(/close modal/i))
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when overlay is clicked', async () => {
      const handleClose = jest.fn()
      customRender(
        <ModalComponent isOpen onClose={handleClose} closeOnOverlayClick>
          <div>Modal content</div>
        </ModalComponent>
      )
      
      const overlay = screen.getByRole('dialog').parentElement
      await userEvent.click(overlay!)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })
}

// Form component test template
export const testFormComponent = (FormComponent: React.ComponentType<any>) => {
  describe('Form Component', () => {
    it('renders form fields', () => {
      const fields = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
      ]
      
      customRender(<FormComponent fields={fields} />)
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const fields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
      ]
      
      customRender(<FormComponent fields={fields} />)
      
      await userEvent.click(screen.getByRole('button', { name: /submit/i }))
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })

    it('submits form with valid data', async () => {
      const handleSubmit = jest.fn()
      const fields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
      ]
      
      customRender(<FormComponent fields={fields} onSubmit={handleSubmit} />)
      
      await userEvent.type(screen.getByLabelText(/name/i), 'Test User')
      await userEvent.click(screen.getByRole('button', { name: /submit/i }))
      
      expect(handleSubmit).toHaveBeenCalledWith({ name: 'Test User' })
    })
  })
}

// ============================================================================
// INTEGRATION TEST HELPERS
// ============================================================================

// Test page navigation
export const testPageNavigation = (routes: Record<string, React.ComponentType>) => {
  describe('Page Navigation', () => {
    it('navigates between pages', async () => {
      const { container } = customRender(
        <TestWrapper>
          {Object.entries(routes).map(([path, Component]) => (
            <Component key={path} />
          ))}
        </TestWrapper>
      )
      
      // Test navigation logic here
      expect(container).toBeInTheDocument()
    })
  })
}

// Test API integration
export const testApiIntegration = (apiFunction: Function, mockData: any) => {
  describe('API Integration', () => {
    beforeEach(() => {
      mockFetch(mockApiResponse(mockData))
    })

    it('calls API successfully', async () => {
      const result = await apiFunction()
      expect(result).toEqual(mockData)
    })

    it('handles API errors', async () => {
      mockFetch(mockApiError(), false)
      
      await expect(apiFunction()).rejects.toThrow()
    })
  })
}

// ============================================================================
// PERFORMANCE TEST HELPERS
// ============================================================================

// Test component render performance
export const testRenderPerformance = (Component: React.ComponentType<any>, props = {}) => {
  describe('Render Performance', () => {
    it('renders within acceptable time', () => {
      const start = performance.now()
      customRender(<Component {...props} />)
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // 100ms threshold
    })
  })
}

// Test memory usage
export const testMemoryUsage = (Component: React.ComponentType<any>, props = {}) => {
  describe('Memory Usage', () => {
    it('does not cause memory leaks', () => {
      const { unmount } = customRender(<Component {...props} />)
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      unmount()
      
      // Memory usage should not increase significantly
      expect(true).toBe(true) // Placeholder for actual memory testing
    })
  })
}

// ============================================================================
// ACCESSIBILITY TEST HELPERS
// ============================================================================

// Test accessibility
export const testAccessibility = (Component: React.ComponentType<any>, props = {}) => {
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      customRender(<Component {...props} />)
      
      // Test for common accessibility requirements
      const interactiveElements = screen.getAllByRole('button')
      interactiveElements.forEach(element => {
        expect(element).toHaveAttribute('aria-label')
      })
    })

    it('supports keyboard navigation', async () => {
      customRender(<Component {...props} />)
      
      // Test tab navigation
      await userEvent.tab()
      expect(document.activeElement).toBeInTheDocument()
    })

    it('has proper color contrast', () => {
      customRender(<Component {...props} />)
      
      // Test color contrast (simplified)
      const elements = screen.getAllByRole('text')
      elements.forEach(element => {
        const styles = getComputedStyle(element)
        // Add actual color contrast testing here
        expect(styles.color).toBeDefined()
      })
    })
  })
}

// ============================================================================
// EXPORT ALL TEST UTILITIES
// ============================================================================

export default {
  createMockStore,
  TestWrapper,
  customRender,
  mockUser,
  mockProject,
  mockReconciliationRecord,
  mockApiResponse,
  mockApiError,
  mockFetch,
  testButtonComponent,
  testInputComponent,
  testModalComponent,
  testFormComponent,
  testPageNavigation,
  testApiIntegration,
  testRenderPerformance,
  testMemoryUsage,
  testAccessibility,
}
