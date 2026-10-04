import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner size="lg" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
