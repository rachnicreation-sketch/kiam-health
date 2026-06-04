import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Module, isSectorAllowed } from "@/lib/permissions";
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

  // Not logged in → Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine redirect target for this user's sector
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
  const homeTarget = user.role === 'saas_admin'
    ? '/saas/dashboard'
    : (sectorHome[sector] || '/apps');

  if (module) {
    // ── Cloisonnement sectoriel (prioritaire) ──────────────────────────────
    // Si le module est exclusif à un autre secteur, on redirige immédiatement
    // même si le rôle le permettrait techniquement.
    if (!isSectorAllowed(sector, module)) {
      return <Navigate to={homeTarget} replace />;
    }

    // ── Vérification permission de rôle ────────────────────────────────────
    if (!can(module)) {
      // Erreur spécifique pour le SaaS admin (ne devrait pas arriver)
      if (user.role === 'saas_admin' && module === 'saas') {
        return (
          <div className="p-8 text-destructive font-bold">
            Erreur de permissions : Accès SaaS refusé pour votre compte.
          </div>
        );
      }
      return <Navigate to={homeTarget} replace />;
    }
  }

  // Protection supplémentaire : la route /dashboard est UNIQUEMENT pour Health
  // Les autres secteurs ont leurs propres dashboards
  if (module === 'dashboard' && user.sector && user.sector !== 'health' && user.role !== 'saas_admin') {
    return <Navigate to={homeTarget} replace />;
  }

  return <>{children}</>;
};
