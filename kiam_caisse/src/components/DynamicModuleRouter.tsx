/**
 * DynamicModuleRouter.tsx
 * 
 * Composant qui gère le routage dynamique des modules selon le tenant.
 * - Charge les modules du tenant courant
 * - Bloque l'accès aux modules d'autres tenants
 * - Gère les redirections non autorisées
 * - Charge dynamiquement les composants via React.lazy()
 */

import React, { Suspense, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTenantModules, useTenantPathValidation } from '@/hooks/useTenantModules';
import { useAuth } from '@/hooks/useAuth';
import { ModulePlaceholder } from '@/core/pages/ModulePlaceholder';

interface DynamicModuleRouterProps {
  children?: React.ReactNode;
}

/**
 * Composant wrapper pour valider les accès aux routes tenant-spécifiques
 */
export const TenantRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isPathAllowed, getTenantBasePath } = useTenantPathValidation();

  // Vérifier que la path correspond au tenant
  useEffect(() => {
    if (!isPathAllowed(location.pathname)) {
      console.warn(`[RouteGuard] Unauthorized path access: ${location.pathname} for tenant: ${user?.sector}`);
      // Redirection vers la page d'accueil du tenant
    }
  }, [location.pathname, isPathAllowed, user?.sector]);

  if (!isPathAllowed(location.pathname) && !location.pathname.startsWith('/core')) {
    return <Navigate to={`${getTenantBasePath()}`} replace />;
  }

  return <>{children}</>;
};

/**
 * Composant pour charger un module dynamiquement avec gestion d'erreur
 */
interface ModuleLoaderProps {
  moduleId: string;
  componentPromise: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
}

const ModuleLoader: React.FC<ModuleLoaderProps> = ({ moduleId, componentPromise, fallback }) => {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    componentPromise()
      .then(module => {
        setComponent(() => module.default);
      })
      .catch(err => {
        console.error(`[ModuleLoader] Error loading module: ${moduleId}`, err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [moduleId, componentPromise]);

  if (isLoading) {
    return fallback || <ModulePlaceholder message={`Chargement du module ${moduleId}...`} />;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2>Erreur du module</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!Component) {
    return <ModulePlaceholder message="Module non trouvé" />;
  }

  return <Component />;
};

/**
 * Composant pour contrôler dynamiquement le rendu des modules
 */
export const DynamicModuleRouter: React.FC<DynamicModuleRouterProps> = ({ children }) => {
  const { modules, isLoading, getTenantSector } = useTenantModules();
  const { user } = useAuth();

  if (isLoading) {
    return <ModulePlaceholder message="Chargement des modules du tenant..." />;
  }

  if (!user?.sector) {
    return <Navigate to="/login" replace />;
  }

  return (
    <TenantRouteGuard>
      <Suspense fallback={<ModulePlaceholder message="Chargement..." />}>
        {children}
      </Suspense>
    </TenantRouteGuard>
  );
};

/**
 * Fonction helper pour créer une route de module isolée
 */
export function createTenantModuleRoute(
  moduleId: string,
  path: string,
  componentPromise: () => Promise<{ default: React.ComponentType<any> }>
) {
  return {
    path,
    element: (
      <TenantRouteGuard>
        <Suspense fallback={<ModulePlaceholder message={`Chargement du module...`} />}>
          <ModuleLoader moduleId={moduleId} componentPromise={componentPromise} />
        </Suspense>
      </TenantRouteGuard>
    ),
  };
}

/**
 * Hook pour obtenir les routes dynamiques du tenant
 */
export function useTenantRoutes() {
  const { modules } = useTenantModules();
  const { user } = useAuth();

  const generateRoutes = React.useMemo(() => {
    if (!user?.sector) return [];

    return modules.flatMap(module => {
      const routes = [
        createTenantModuleRoute(module.id, module.path, module.component),
      ];

      // Ajouter les sub-modules
      if (module.subModules) {
        module.subModules.forEach(subModule => {
          routes.push(
            createTenantModuleRoute(subModule.id, subModule.path, subModule.component)
          );
        });
      }

      return routes;
    });
  }, [modules, user?.sector]);

  return generateRoutes;
}

/**
 * Protecteur de route pour les modules tenant-spécifiques
 */
export const ProtectedModuleRoute: React.FC<{
  moduleId: string;
  children: React.ReactNode;
}> = ({ moduleId, children }) => {
  const { isModuleAllowed } = useTenantModules();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isModuleAllowed(moduleId)) {
      console.warn(`[ProtectedModuleRoute] Access denied to module: ${moduleId}`);
      navigate('/');
    }
  }, [moduleId, isModuleAllowed, navigate]);

  if (!isModuleAllowed(moduleId)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold">Accès refusé</h2>
        <p>Vous n'avez pas accès à ce module.</p>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Exemple d'utilisation dans App.tsx :
 *
 * import { useTenantRoutes, DynamicModuleRouter } from '@/components/DynamicModuleRouter';
 *
 * function App() {
 *   const tenantRoutes = useTenantRoutes();
 *
 *   return (
 *     <DynamicModuleRouter>
 *       <Routes>
 *         <Route path="/login" element={<Login />} />
 *         <Route element={<AppLayout />}>
 *           {tenantRoutes.map((route, idx) => (
 *             <Route key={idx} {...route} />
 *           ))}
 *         </Route>
 *       </Routes>
 *     </DynamicModuleRouter>
 *   );
 * }
 */
