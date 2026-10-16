import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md min-h-screen bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Memeriksa sesi...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/seller/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
