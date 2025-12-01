import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, setAuthTokens, clearAuth } from './store/unifiedStore';
import { AuthTokens, User } from './types/auth';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { UserProfilePage } from './pages/auth/UserProfilePage';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Tier4ErrorBoundary } from './components/error/Tier4ErrorBoundary';

// Import Disconnected Pages
import IngestionPage from './pages/IngestionPage';
import AdjudicationPage from './pages/AdjudicationPage';
import ReconciliationPage from './pages/ReconciliationPage';
import VisualizationPage from './pages/VisualizationPage';

// Placeholder for a Dashboard page
const DashboardPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-extrabold text-gray-900">Welcome to the Dashboard!</h1>
    <p>You are logged in.</p>
    <div className="mt-8 grid grid-cols-2 gap-4">
      <a href="/ingestion" className="p-4 bg-white shadow rounded hover:bg-gray-50">Data Ingestion</a>
      <a href="/reconciliation" className="p-4 bg-white shadow rounded hover:bg-gray-50">Reconciliation</a>
      <a href="/adjudication" className="p-4 bg-white shadow rounded hover:bg-gray-50">Adjudication</a>
      <a href="/visualization" className="p-4 bg-white shadow rounded hover:bg-gray-50">Visualization</a>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-extrabold text-red-600">Unauthorized Access</h1>
    <p className="text-gray-600">You do not have permission to view this page.</p>
  </div>
);

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // On app load, try to rehydrate auth state from local storage
    const storedTokens = localStorage.getItem('authTokens');
    if (storedTokens) {
      try {
        const parsedTokens: AuthTokens = JSON.parse(storedTokens);
        // You might need to fetch user info from an API if not stored in tokens
        // For now, assume user info is part of the login/refresh response
        const mockUser: User = { // Placeholder user until actual user fetch logic is in place
            id: 'rehydrated-user',
            email: 'rehydrated@example.com',
            firstName: 'Rehydrated',
            lastName: 'User',
            role: 'user',
            status: 'active',
            emailVerified: true,
            is2faEnabled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        dispatch(setAuthTokens({ tokens: parsedTokens, user: mockUser }));
      } catch (e) {
        console.error("Failed to parse stored tokens", e);
        dispatch(clearAuth());
      }
    }
  }, [dispatch]);

  // Handle redirection after auth state changes
  useEffect(() => {
    if (!isLoading) { // Only redirect once loading is complete
        if (isAuthenticated && !user) {
            dispatch(clearAuth()); // Force re-login
            navigate('/login');
        } else if (isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
          navigate('/dashboard'); // Redirect to dashboard if already logged in and on login/register page
        } else if (!isAuthenticated && window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/unauthorized') {
            navigate('/login'); // Redirect to login if not authenticated and not on a public page
        }
    }
  }, [isAuthenticated, user, isLoading, navigate, dispatch]);

  return (
    <Tier4ErrorBoundary componentName="AppRoot">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <Tier4ErrorBoundary componentName="DashboardPage">
              <DashboardPage />
            </Tier4ErrorBoundary>
          } />
          <Route path="/profile" element={
            <Tier4ErrorBoundary componentName="UserProfilePage">
              <UserProfilePage />
            </Tier4ErrorBoundary>
          } />

          {/* New Connected Feature Pages */}
          <Route path="/ingestion" element={
            <Tier4ErrorBoundary componentName="IngestionPage">
              <IngestionPage project={{ id: 'current', name: 'Current Project' }} onProgressUpdate={console.log} />
            </Tier4ErrorBoundary>
          } />
          <Route path="/reconciliation" element={
            <Tier4ErrorBoundary componentName="ReconciliationPage">
              <ReconciliationPage />
            </Tier4ErrorBoundary>
          } />
          <Route path="/adjudication" element={
            <Tier4ErrorBoundary componentName="AdjudicationPage">
              <AdjudicationPage />
            </Tier4ErrorBoundary>
          } />
          <Route path="/visualization" element={
            <Tier4ErrorBoundary componentName="VisualizationPage">
              <VisualizationPage />
            </Tier4ErrorBoundary>
          } />

          {/* Example of role-based protection */}
          <Route path="/admin-settings" element={<ProtectedRoute requiredRoles={['admin']}><>Admin Settings</></ProtectedRoute>} />
        </Route>

        {/* Default redirect (handled by useEffect for more robust initial load behavior) */}
        <Route path="*" element={null} />
      </Routes>
    </Tier4ErrorBoundary>
  );
}

export default App;
