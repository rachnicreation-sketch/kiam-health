import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Module } from "@/lib/permissions";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: Module;
}

export const ProtectedRoute = ({ children, module }: ProtectedRouteProps) => {
  const { user, can, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check module permission if specified
  if (module && !can(module)) {
    // Redirect to dashboard if trying to access restricted module
    return <Navigate to={user.role === 'saas_admin' ? '/saas/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};
