import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { user, isAdmin, accessStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If not admin AND not approved -> Redirect to landing with status
  if (!isAdmin && accessStatus !== 'approved') {
    return <Navigate to="/?access_denied=true" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
