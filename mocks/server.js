import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock API handlers
export const handlers = [
  // Authentication endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        },
        token: 'mock-jwt-token'
      })
    )
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    )
  }),

  // Project endpoints
  rest.get('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        projects: [
          {
            id: '1',
            name: 'Test Project',
            description: 'A test project',
            status: 'active',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]
      })
    )
  }),

  rest.post('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: '2',
        name: 'New Project',
        description: 'A new test project',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    )
  }),

  // Reconciliation endpoints
  rest.get('/api/reconciliation/records', (req, res, ctx) => {
    const page = req.url.searchParams.get('page') || '1'
    const limit = req.url.searchParams.get('limit') || '50'
    
    return res(
      ctx.status(200),
      ctx.json({
        records: [
          {
            id: 'rec-1',
            reconciliationId: 'REC-2023-001',
            status: 'matched',
            confidence: 95,
            matchScore: 98,
            sources: [
              {
                id: 'src-1',
                systemId: 'system-1',
                systemName: 'Expense Journal',
                recordId: 'exp-1',
                data: { amount: 1000000, description: 'Test expense' },
                timestamp: '2024-01-01T00:00:00Z'
              }
            ],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        page: parseInt(page),
        limit: parseInt(limit)
      })
    )
  }),

  rest.post('/api/reconciliation/records', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'rec-new',
        reconciliationId: 'REC-2023-NEW',
        status: 'pending',
        confidence: 0,
        matchScore: 0,
        sources: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    )
  }),

  // Cashflow endpoints
  rest.get('/api/cashflow/analysis', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        categories: [
          {
            id: 'cat-1',
            name: 'Operational',
            description: 'Operational expenses',
            totalReported: 5000000,
            totalCashflow: 4800000,
            discrepancy: 200000,
            discrepancyPercentage: 4,
            transactionCount: 25,
            status: 'discrepancy'
          }
        ],
        metrics: {
          totalReportedExpenses: 10000000,
          totalCashflowExpenses: 9500000,
          totalDiscrepancy: 500000,
          discrepancyPercentage: 5,
          balancedCategories: 3,
          discrepancyCategories: 2
        }
      })
    )
  }),

  // File upload endpoints
  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'file-1',
        name: 'test-file.csv',
        size: 1024,
        type: 'text/csv',
        status: 'completed',
        records: 100,
        uploadedAt: new Date().toISOString()
      })
    )
  }),

  // Error simulation endpoints
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: 'Internal Server Error',
        message: 'Something went wrong'
      })
    )
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        error: 'Not Found',
        message: 'Resource not found'
      })
    )
  })
]

// Setup MSW server
export const server = setupServer(...handlers)
