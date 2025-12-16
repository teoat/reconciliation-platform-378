import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, setAuthTokens, refreshAccessToken, clearAuth } from './store/unifiedStore';
import { AuthTokens, User } from './types/auth';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { UserProfilePage } from './pages/auth/UserProfilePage';
import { TwoFactorAuthPage } from './pages/auth/TwoFactorAuthPage';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Navigation from './components/Navigation';

// Import additional pages
import ProjectSelectionPage from './pages/ProjectSelectionPage';
import IngestionPage from './pages/IngestionPage';
import ReconciliationPage from './pages/ReconciliationPage';
import AdjudicationPage from './pages/AdjudicationPage';
import VisualizationPage from './pages/VisualizationPage';
import SummaryExportPage from './pages/SummaryExportPage';
import CashflowEvaluationPage from './pages/CashflowEvaluationPage';
import PresummaryPage from './pages/PresummaryPage';

// Placeholder for a Dashboard page
const DashboardPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-extrabold text-gray-900">Welcome to the Dashboard!</h1>
    <p>You are logged in.</p>
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
            // This case should ideally not happen if user is always set with tokens
            // but as a safeguard, if isAuthenticated is true but user is null, it means partial state
            // Try to fetch user or clear auth.
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
    <>
      <Navigation />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/2fa-management" element={<UserProfilePage />} />
          
          {/* Project & Reconciliation Routes */}
          <Route path="/projects" element={<ProjectSelectionPage onProjectSelect={(project) => console.log('Selected:', project)} />} />
          <Route path="/ingestion" element={<IngestionPage project={{ name: 'Current Project' }} onProgressUpdate={(step) => console.log(step)} />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          <Route path="/adjudication" element={<AdjudicationPage />} />
          <Route path="/visualization" element={<VisualizationPage />} />
          <Route path="/summary" element={<SummaryExportPage />} />
          <Route path="/cashflow-evaluation" element={<CashflowEvaluationPage />} />
          <Route path="/presummary" element={<PresummaryPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin-settings" element={<ProtectedRoute requiredRoles={['admin']}><>Admin Settings</></ProtectedRoute>} />
        </Route>

        {/* Default redirect (handled by useEffect for more robust initial load behavior) */}
        <Route path="*" element={null} /> {/* Catch-all route to prevent unmatched path errors, actual redirect handled by useEffect */}
      </Routes>
    </>
  );
}

export default App;
