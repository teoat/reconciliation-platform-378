import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/unifiedStore';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles }) => {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    // Optionally render a loading spinner or placeholder
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    // Redirect to an unauthorized page or dashboard if user role does not match
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
