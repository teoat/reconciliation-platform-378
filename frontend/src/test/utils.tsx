import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }, action) => state,
      projects: (state = { projects: [], loading: false }, action) => state,
      reconciliation: (state = { records: [], loading: false }, action) => state,
      ingestion: (state = { jobs: [], loading: false }, action) => state,
      analytics: (state = { metrics: {}, loading: false }, action) => state,
      ui: (state = { theme: 'light', sidebarOpen: true }, action) => state,
      settings: (state = { preferences: {} }, action) => state,
    },
    preloadedState: initialState,
  })
}

// Custom render function that includes providers
const AllTheProviders = ({ children, initialState = {} }: { children: React.ReactNode; initialState?: any }) => {
  const store = createMockStore(initialState)
  const persistor = persistStore(store)

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </PersistGate>
    </Provider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialState?: any }
) => render(ui, { wrapper: (props) => <AllTheProviders {...props} initialState={options?.initialState} />, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// Mock API error
export const mockApiError = (message = 'API Error', status = 500) => {
  return Promise.reject(new Error(message))
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  organizationName: 'Test Org',
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: '1',
  name: 'Test Project',
  description: 'Test project description',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockReconciliationRecord = (overrides = {}) => ({
  id: '1',
  projectId: '1',
  sourceRecordId: 'source-1',
  targetRecordId: 'target-1',
  status: 'matched',
  confidence: 0.95,
  differences: [],
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockIngestionJob = (overrides = {}) => ({
  id: '1',
  projectId: '1',
  status: 'completed',
  sourceType: 'csv',
  recordCount: 100,
  processedCount: 100,
  errorCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  completedAt: '2024-01-01T00:05:00Z',
  ...overrides,
})

// Mock hooks
export const mockUseAuth = (overrides = {}) => ({
  user: createMockUser(),
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue(undefined),
  refreshUser: vi.fn().mockResolvedValue(undefined),
  ...overrides,
})

export const mockUseApi = (overrides = {}) => ({
  data: null,
  loading: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
})

// Wait for async operations
export const waitFor = (callback: () => void | Promise<void>, options = {}) => {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for callback'))
    }, 5000)

    const check = async () => {
      try {
        await callback()
        clearTimeout(timeout)
        resolve()
      } catch (error) {
        setTimeout(check, 10)
      }
    }

    check()
  })
}
