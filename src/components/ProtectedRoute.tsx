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
    // If we're already at the intended destination, don't redirect back to it (loop)
    // For saas_admin, if they can't access 'saas', something is wrong with their role/permissions
    if (user.role === 'saas_admin' && module === 'saas') {
       return <div className="p-8 text-destructive font-bold">Erreur de permissions : Accès SaaS refusé pour votre compte.</div>;
    }
    
    // Redirect to sector-specific dashboard if trying to access restricted module
    const sector = user.sector || 'health';
    const sectorHome: Record<string, string> = {
      health:     '/dashboard',
      hotel:      '/hotel/dashboard',
      school:     '/school/dashboard',
      erp:        '/erp',
      shop:       '/erp',
      pharmacy:   '/pharmacy/dashboard',
      enterprise: '/enterprise/dashboard',
    };
    const target = user.role === 'saas_admin' ? '/saas/dashboard' : (sectorHome[sector] || '/apps');
    return <Navigate to={target} replace />;
  }

  // Also prevent non-health sectors from accessing the health dashboard module directly
  if (module === 'dashboard' && user.sector && user.sector !== 'health' && user.role !== 'saas_admin') {
    const sectorHome: Record<string, string> = {
      hotel:      '/hotel/dashboard',
      school:     '/school/dashboard',
      erp:        '/erp',
      shop:       '/erp',
      pharmacy:   '/pharmacy/dashboard',
      enterprise: '/enterprise/dashboard',
    };
    const target = sectorHome[user.sector] || '/apps';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};
