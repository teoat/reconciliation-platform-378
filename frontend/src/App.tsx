import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, ProtectedRoute } from './hooks/useAuth';
import { ReduxProvider } from './store/ReduxProvider';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { WebSocketProvider } from './services/WebSocketProvider';
import UnifiedFetchInterceptor from './services/unifiedFetchInterceptor';
// Lazy load memory monitoring to reduce initial bundle
const initializeMemoryMonitoring = async () => {
  const { initializeMemoryMonitoring: init } = await import('./utils/memoryOptimization');
  return init();
};
import AppShell from './components/layout/AppShell';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ToastContainer from './components/ui/ToastContainer';
import { APP_CONFIG } from './config/AppConfig';
import KeyboardShortcuts from './components/pages/KeyboardShortcuts';
import { SessionTimeoutHandler } from './components/SessionTimeoutHandler';

// Lazy load route components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'));
const QuickReconciliationWizard = lazy(() => import('./pages/QuickReconciliationWizard'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const ApiIntegrationStatus = lazy(() => import('./components/ApiIntegrationStatus'));
const ApiTester = lazy(() => import('./components/ApiTester'));
const ApiDocumentation = lazy(() => import('./components/ApiDocumentation'));
const ProjectCreate = lazy(() => import('./components/pages/ProjectCreate'));
const ProjectDetail = lazy(() => import('./components/pages/ProjectDetail'));
const ProjectEdit = lazy(() => import('./components/pages/ProjectEdit'));
const FileUpload = lazy(() => import('./components/pages/FileUpload'));
const Settings = lazy(() => import('./components/pages/Settings'));
const Profile = lazy(() => import('./components/pages/Profile'));
const NotFound = lazy(() => import('./components/pages/NotFound'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// App Layout Component - Uses Tier 0 AppShell
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return <AppShell>{children}</AppShell>;
};

function App() {
  // Use unified config from AppConfig (SSOT)
  const wsConfig = {
    url: APP_CONFIG.WS_URL || 'ws://localhost:2000',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    debug: import.meta.env.DEV, // Vite: Use import.meta.env.DEV instead of process.env.NODE_ENV
  };

  // Initialize unified fetch interceptor on mount
  useEffect(() => {
    const interceptor = UnifiedFetchInterceptor.getInstance();
    interceptor.initialize();

    // Cleanup on unmount
    return () => {
      interceptor.restore();
    };
  }, []);

  // Initialize memory monitoring (lazy loaded)
  useEffect(() => {
    initializeMemoryMonitoring().then((init) => {
      const cleanup = init(30000); // Monitor every 30 seconds
      return cleanup;
    });
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ReduxProvider>
          <WebSocketProvider config={wsConfig}>
            <AuthProvider>
              <Router 
                basename={import.meta.env.VITE_BASE_PATH || '/'}
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <div className="min-h-screen bg-gray-100">
                  <KeyboardShortcuts />
                  <ToastContainer />
                  <SessionTimeoutHandler />
                  <Routes>
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <Dashboard />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projects/:projectId/reconciliation"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ReconciliationPage />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quick-reconciliation"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <QuickReconciliationWizard />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <AnalyticsDashboard />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projects/new"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ProjectCreate />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projects/:id"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ProjectDetail />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/projects/:id/edit"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ProjectEdit />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/upload"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <FileUpload />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <UserManagement />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/api-status"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ApiIntegrationStatus />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/api-tester"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ApiTester />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/api-docs"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ApiDocumentation />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <Settings />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner />}>
                              <Profile />
                            </Suspense>
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <AppLayout>
                          <Suspense fallback={<LoadingSpinner />}>
                            <NotFound />
                          </Suspense>
                        </AppLayout>
                      }
                    />
                  </Routes>
                </div>
              </Router>
            </AuthProvider>
          </WebSocketProvider>
        </ReduxProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
