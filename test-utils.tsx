import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { DataProvider } from '../app/components/DataProvider'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <DataProvider>
      {children}
    </DataProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  permissions: ['read', 'write', 'admin'],
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: true
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

export const createMockProject = (overrides = {}) => ({
  id: '1',
  name: 'Test Project',
  description: 'A test project for reconciliation',
  status: 'active',
  type: 'reconciliation',
  owner: createMockUser(),
  team: [createMockUser()],
  settings: {
    autoMatch: true,
    notifications: true,
    retentionDays: 365
  },
  data: {
    ingestionData: {
      uploadedFiles: [],
      processedData: [],
      dataQuality: {
        completeness: 95,
        accuracy: 98,
        consistency: 92,
        validity: 96,
        duplicates: 2,
        errors: 1
      }
    },
    reconciliationData: {
      records: [],
      matchingRules: [],
      metrics: {
        totalRecords: 0,
        matchedRecords: 0,
        unmatchedRecords: 0,
        discrepancyRecords: 0,
        matchRate: 0,
        accuracy: 0
      }
    }
  },
  analytics: {
    performance: {
      matchRate: 95,
      accuracy: 98,
      processingTime: 2.5,
      throughput: 150,
      errorRate: 1.2
    }
  },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides
})

export const createMockReconciliationRecord = (overrides = {}) => ({
  id: 'rec-1',
  reconciliationId: 'REC-2023-001',
  batchId: 'BATCH-001',
  sources: [
    {
      id: 'src-1',
      systemId: 'system-1',
      systemName: 'Expense Journal',
      recordId: 'exp-1',
      data: {
        amount: 1000000,
        description: 'Test expense',
        date: '2024-01-01',
        category: 'operational'
      },
      timestamp: '2024-01-01T00:00:00Z',
      quality: {
        completeness: 100,
        accuracy: 95,
        consistency: 90,
        validity: 98,
        duplicates: 0,
        errors: 0
      },
      confidence: 95,
      metadata: {}
    }
  ],
  status: 'matched',
  confidence: 95,
  matchingRules: [
    {
      id: 'rule-1',
      name: 'Amount Match',
      type: 'exact',
      criteria: [
        {
          field: 'amount',
          operator: 'equals',
          value: 1000000,
          weight: 1.0
        }
      ],
      weight: 1.0,
      applied: true,
      result: {
        matched: true,
        confidence: 100,
        reason: 'Exact amount match'
      },
      confidence: 100
    }
  ],
  auditTrail: [
    {
      id: 'audit-1',
      userId: '1',
      userName: 'Test User',
      action: 'Record Created',
      timestamp: '2024-01-01T00:00:00Z',
      details: { source: 'system-1' }
    }
  ],
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: '1',
    updatedBy: '1',
    version: 1,
    tags: ['test'],
    priority: 'medium'
  },
  relationships: [],
  matchScore: 98,
  riskLevel: 'low',
  ...overrides
})

export const createMockExpenseCategory = (overrides = {}) => ({
  id: 'cat-1',
  name: 'Operational',
  description: 'Operational expenses',
  color: 'blue',
  icon: 'Activity',
  totalReported: 5000000,
  totalCashflow: 4800000,
  discrepancy: 200000,
  discrepancyPercentage: 4,
  transactionCount: 25,
  lastUpdated: '2024-01-01T00:00:00Z',
  status: 'discrepancy',
  subcategories: [
    {
      id: 'subcat-1',
      name: 'Field Operations',
      reportedAmount: 3000000,
      cashflowAmount: 2900000,
      discrepancy: 100000,
      transactions: []
    }
  ],
  ...overrides
})

// Mock functions
export const mockConsoleError = () => {
  const originalError = console.error
  console.error = jest.fn()
  return () => {
    console.error = originalError
  }
}

export const mockConsoleWarn = () => {
  const originalWarn = console.warn
  console.warn = jest.fn()
  return () => {
    console.warn = originalWarn
  }
}

// Wait for async operations
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Mock file for testing file uploads
export const createMockFile = (name = 'test.csv', type = 'text/csv', size = 1024) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Mock FormData
export const createMockFormData = () => {
  const formData = new FormData()
  formData.append('file', createMockFile())
  return formData
}

// Test helpers for common assertions
export const expectToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveTextContent = (element: HTMLElement | null, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectToHaveClass = (element: HTMLElement | null, className: string) => {
  expect(element).toHaveClass(className)
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }
