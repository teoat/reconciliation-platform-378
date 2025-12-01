import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch, setAuthTokens, refreshAccessToken, clearAuth } from './store/unifiedStore';
import { AuthTokens, User } from './types/auth';

import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy loaded components for Code Splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(module => ({ default: module.RegisterPage })));
const UserProfilePage = lazy(() => import('./pages/auth/UserProfilePage').then(module => ({ default: module.UserProfilePage })));
const TwoFactorAuthPage = lazy(() => import('./pages/auth/TwoFactorAuthPage').then(module => ({ default: module.TwoFactorAuthPage })));

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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          {/* Example of role-based protection */}
          <Route path="/admin-settings" element={<ProtectedRoute requiredRoles={['admin']}><>Admin Settings</></ProtectedRoute>} />
          <Route path="/2fa-management" element={<UserProfilePage />} /> {/* 2FA management is part of UserProfilePage */}
        </Route>

        {/* Default redirect (handled by useEffect for more robust initial load behavior) */}
        <Route path="*" element={null} /> {/* Catch-all route to prevent unmatched path errors, actual redirect handled by useEffect */}
      </Routes>
    </Suspense>
  );
}

export default App;
