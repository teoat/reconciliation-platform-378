import React, { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './hooks/useAuth'
import { useHealthCheck } from './hooks/useFileReconciliation'
import { useProjects } from './hooks/useApi'
import { ReduxProvider } from './store/ReduxProvider'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { WebSocketProvider } from './services/WebSocketProvider'
import UnifiedFetchInterceptor from './services/unifiedFetchInterceptor'
import AppShell from './components/layout/AppShell'
import AuthPage from './pages/AuthPage'
import Button from './components/ui/Button'

// Lazy load heavy components for better performance
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'))
const QuickReconciliationWizard = lazy(() => import('./pages/QuickReconciliationWizard'))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'))
const UserManagement = lazy(() => import('./components/UserManagement'))
const ApiIntegrationStatus = lazy(() => import('./components/ApiIntegrationStatus'))
const ApiTester = lazy(() => import('./components/ApiTester'))
const ApiDocumentation = lazy(() => import('./components/ApiDocumentation'))

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

// App Layout Component - Uses Tier 0 AppShell
interface AppLayoutProps {
  children: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return <AppShell>{children}</AppShell>
}

function App() {
  const wsConfig = {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:2000',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    debug: import.meta.env.DEV
  }

  // Initialize unified fetch interceptor on mount
  useEffect(() => {
    const interceptor = UnifiedFetchInterceptor.getInstance()
    interceptor.initialize()
    
    // Cleanup on unmount
    return () => {
      interceptor.restore()
    }
  }, [])

  return (
    <ErrorBoundary>
      <ReduxProvider>
        <WebSocketProvider config={wsConfig}>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gray-100">
                <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/reconciliation" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <ReconciliationPage />
                      </Suspense>
                    </AppLayout>
                  </ProtectedRoute>
                 } />
                 <Route path="/quick-reconciliation" element={
                   <ProtectedRoute>
                     <AppLayout>
                       <Suspense fallback={<LoadingSpinner />}>
                         <QuickReconciliationWizard />
                       </Suspense>
                     </AppLayout>
                   </ProtectedRoute>
                 } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Suspense fallback={<LoadingSpinner />}>
                        <AnalyticsDashboard />
                      </Suspense>
                    </AppLayout>
                  </ProtectedRoute>
                } />
            <Route path="/users" element={
              <ProtectedRoute>
                  <AppLayout>
                    <Suspense fallback={<LoadingSpinner />}>
                      <UserManagement />
                    </Suspense>
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/api-status" element={
              <ProtectedRoute>
                <AppLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ApiIntegrationStatus />
                  </Suspense>
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/api-tester" element={
              <ProtectedRoute>
                <AppLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ApiTester />
                  </Suspense>
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/api-docs" element={
              <ProtectedRoute>
                <AppLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ApiDocumentation />
                  </Suspense>
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
        </WebSocketProvider>
      </ReduxProvider>
    </ErrorBoundary>
  )
}

// Dashboard Component
function Dashboard() {
  const { isHealthy, isChecking, lastChecked } = useHealthCheck()
  const { projects, isLoading, error, fetchProjects } = useProjects()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Reconciliation Platform Dashboard
        </h1>
        
        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${
              isHealthy === true ? 'bg-green-500' : 
              isHealthy === false ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-lg">
              {isChecking ? 'Checking...' : 
               isHealthy === true ? '✅ Backend Connected' : 
               isHealthy === false ? '❌ Backend Disconnected' : '⏳ Checking Status'}
            </span>
            {isHealthy === false && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/health')
                    if (response.ok) {
                      window.location.reload()
                    }
                  } catch (error) {
                    console.error('Health check failed:', error)
                  }
                }}
              >
                Retry Connection
              </Button>
            )}
            {lastChecked && (
              <span className="text-sm text-gray-500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 p-4 bg-red-50 rounded">
              Error: {error}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-medium text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {project.description || 'No description'}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No projects found</p>
              <button 
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => fetchProjects()}
              >
                Refresh Projects
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              onClick={() => fetchProjects()}
            >
              Refresh Projects
            </button>
            <button 
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              onClick={() => window.location.href = '/projects/new'}
            >
              Create Project
            </button>
            <button 
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
              onClick={() => window.location.href = '/upload'}
            >
              Upload Files
            </button>
            <button 
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors"
              onClick={() => window.location.href = '/reconciliation'}
            >
              Start Reconciliation
            </button>
            <button 
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
              onClick={() => window.location.href = '/analytics'}
            >
              View Analytics
            </button>
            <button 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              onClick={() => window.location.href = '/users'}
            >
              Manage Users
            </button>
            <button 
              className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-cyan-600 transition-colors"
              onClick={() => window.location.href = '/api-status'}
            >
              API Status
            </button>
            <button 
              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 transition-colors"
              onClick={() => window.location.href = '/api-tester'}
            >
              API Tester
            </button>
            <button 
              className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors"
              onClick={() => window.location.href = '/api-docs'}
            >
              API Docs
            </button>
          </div>
        </div>
    </div>
  )
}

export default App
