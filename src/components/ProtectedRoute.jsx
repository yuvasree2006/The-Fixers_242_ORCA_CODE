import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { Waves, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, currentUser, setCurrentUser }) {
  const [isVerifying, setIsVerifying] = useState(!currentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      const token = authService.getToken();
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsVerifying(false);
        }
        return;
      }

      const user = await authService.getCurrentUser();
      if (isMounted) {
        if (user) {
          setIsAuthenticated(true);
          if (setCurrentUser) setCurrentUser(user);
        } else {
          setIsAuthenticated(false);
          if (setCurrentUser) setCurrentUser(null);
        }
        setIsVerifying(false);
      }
    }

    if (!currentUser) {
      verify();
    } else {
      setIsVerifying(false);
      setIsAuthenticated(true);
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser, setCurrentUser]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-ocean-950 flex flex-col items-center justify-center text-cyan-400">
        <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
          <Waves className="w-7 h-7 text-cyan-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Verifying Marine Security Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
