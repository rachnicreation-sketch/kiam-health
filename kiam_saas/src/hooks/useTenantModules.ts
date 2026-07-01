/**
 * Hook useTenantModules
 * 
 * Charge les modules disponibles pour le tenant courant.
 * Filtre les routes et pages selon le secteur du tenant.
 * Empêche l'accès à des modules non autorisés.
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  getTenantModules,
  TENANT_MODULES_MAP,
  TenantSector,
  TenantModuleConfig,
  ModuleConfig,
  isModuleAvailable,
  getAllModuleIds,
} from '@/config/tenant-modules';

export interface UseTenantModulesReturn {
  modules: ModuleConfig[];
  allModuleIds: string[];
  config: TenantModuleConfig | null;
  isLoading: boolean;
  isModuleAllowed: (moduleId: string) => boolean;
  hasPermission: (permission: string) => boolean;
  getTenantSector: () => TenantSector;
}

export function useTenantModules(): UseTenantModulesReturn {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [config, setConfig] = useState<TenantModuleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.sector) {
      setIsLoading(false);
      return;
    }

    try {
      // Récupérer la configuration du tenant
      const sector = user.sector as TenantSector;
      const tenantConfig = getTenantModules(sector);

      // Filtrer les modules selon les permissions de l'utilisateur
      const filteredModules = tenantConfig.modules.filter(module => {
        // Vérifier les permissions requises
        if (module.requiredPermissions && module.requiredPermissions.length > 0) {
          return module.requiredPermissions.some(perm => hasUserPermission(user, perm));
        }
        return true;
      });

      setConfig(tenantConfig);
      setModules(filteredModules);

      // Log pour debug
      console.log(`[TenantModules] Loaded ${filteredModules.length} modules for sector: ${sector}`, {
        sector,
        modules: filteredModules.map(m => m.id),
      });
    } catch (error) {
      console.error('[TenantModules] Error loading modules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Vérifier si un module est autorisé pour le tenant courant
   */
  const isModuleAllowed = (moduleId: string): boolean => {
    if (!user?.sector) return false;
    const sector = user.sector as TenantSector;
    return isModuleAvailable(sector, moduleId);
  };

  /**
   * Vérifier les permissions de l'utilisateur
   */
  const hasPermission = (permission: string): boolean => {
    return hasUserPermission(user, permission);
  };

  /**
   * Obtenir le secteur du tenant
   */
  const getTenantSector = (): TenantSector => {
    return (user?.sector || 'health') as TenantSector;
  };

  return {
    modules,
    allModuleIds: user?.sector ? getAllModuleIds(user.sector as TenantSector) : [],
    config,
    isLoading,
    isModuleAllowed,
    hasPermission,
    getTenantSector,
  };
}

/**
 * Vérifier les permissions de l'utilisateur
 * À adapter selon votre système de permissions
 */
function hasUserPermission(user: any, permission: string): boolean {
  if (!user) return false;

  // Les admins ont toutes les permissions
  if (user.role === 'admin' || user.role === 'clinic_admin') {
    return true;
  }

  // Vérifier les permissions spécifiques
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  // Vérifier les rôles
  if (user.roles && Array.isArray(user.roles)) {
    // Mapper les rôles aux permissions
    const rolePermissions: Record<string, string[]> = {
      'manager': ['hr.view', 'hr.manage'],
      'doctor': ['patients.view', 'consultations.manage'],
      'teacher': ['students.view', 'grades.manage'],
      'cashier': ['pos.manage', 'payments.manage'],
    };

    for (const role of user.roles) {
      if (rolePermissions[role]?.includes(permission)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Hook pour vérifier si un path appartient au tenant courant
 */
export function useTenantPathValidation(): {
  isPathAllowed: (path: string) => boolean;
  getTenantBasePath: () => string;
} {
  const { user } = useAuth();

  const getTenantBasePath = (): string => {
    if (!user?.sector) return '/';

    const sectorMap: Record<string, string> = {
      health: '/health',
      erp: '/erp',
      school: '/school',
      hotel: '/hotel',
      pharmacy: '/pharmacy',
      enterprise: '/enterprise',
    };

    return sectorMap[user.sector] || '/';
  };

  const isPathAllowed = (path: string): boolean => {
    if (!user?.sector) return false;

    const basePath = getTenantBasePath();
    const normalizedPath = path.startsWith('/') ? path : '/' + path;

    // Vérifier que le path commence par le basePath du tenant
    return normalizedPath.startsWith(basePath);
  };

  return {
    isPathAllowed,
    getTenantBasePath,
  };
}

/**
 * Hook pour récupérer un module spécifique
 */
export function useTenantModule(moduleId: string) {
  const { modules, config } = useTenantModules();

  const getModule = (): ModuleConfig | undefined => {
    return modules.find(m => m.id === moduleId) ||
           modules
             .flatMap(m => m.subModules || [])
             .find(m => m.id === moduleId);
  };

  const getModulePath = (): string | undefined => {
    return getModule()?.path;
  };

  const canAccessModule = (): boolean => {
    return getModule() !== undefined;
  };

  return {
    module: getModule(),
    modulePath: getModulePath(),
    canAccess: canAccessModule(),
    config,
  };
}
