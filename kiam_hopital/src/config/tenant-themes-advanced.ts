/**
 * EXEMPLE DE PERSONNALISATION AVANCÉE DES THÈMES
 * 
 * Ce fichier montre comment personnaliser davantage les thèmes par tenant
 * et ajouter des configurations dynamiques depuis une API ou base de données.
 */

import type { TenantSector, TenantModuleConfig } from '@/config/tenant-modules';

/**
 * Configuration avancée des thèmes - À charger depuis la BD ou API
 * 
 * Exemple : GET /api/tenant/config
 */
export interface AdvancedTenantConfig {
  sector: TenantSector;
  branding: {
    logo: string;
    favicon: string;
    fullName: string;
    shortName: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontSize: 'sm' | 'md' | 'lg';
  };
  layout: {
    sidebarPosition: 'left' | 'right';
    compactMode: boolean;
    headerHeight: number;
  };
  features: {
    darkModeEnabled: boolean;
    multiLanguageEnabled: boolean;
    rtlEnabled: boolean;
    analyticsEnabled: boolean;
  };
}

/**
 * EXEMPLES DE CONFIGURATIONS PAR TENANT
 */

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH TENANT - Configuration Complète
// ═══════════════════════════════════════════════════════════════════════════
export const HEALTH_ADVANCED_CONFIG: AdvancedTenantConfig = {
  sector: 'health',
  branding: {
    logo: '/logos/health/logo-full.svg',
    favicon: '/logos/health/favicon.ico',
    fullName: 'KIAM Santé Plus',
    shortName: 'KS+',
  },
  colors: {
    primary: '#0ea5e9',      // Cyan pour la santé (confiance, sérénité)
    secondary: '#06b6d4',    // Cyan plus foncé
    accent: '#0284c7',       // Sky blue
    danger: '#dc2626',       // Red (pour alertes médicales)
    warning: '#ea580c',      // Orange (pour avertissements)
    success: '#16a34a',      // Green (pour succès/guérison)
    info: '#0284c7',         // Blue (pour informations)
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontSize: 'md',
  },
  layout: {
    sidebarPosition: 'left',
    compactMode: false,
    headerHeight: 60,
  },
  features: {
    darkModeEnabled: true,
    multiLanguageEnabled: true,
    rtlEnabled: false,
    analyticsEnabled: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ERP TENANT - Configuration Complète
// ═══════════════════════════════════════════════════════════════════════════
export const ERP_ADVANCED_CONFIG: AdvancedTenantConfig = {
  sector: 'erp',
  branding: {
    logo: '/logos/erp/logo-full.svg',
    favicon: '/logos/erp/favicon.ico',
    fullName: 'ERP Commerce Pro',
    shortName: 'ECP',
  },
  colors: {
    primary: '#8b5cf6',      // Purple pour l'innovation/business
    secondary: '#a855f7',    // Purple plus clair
    accent: '#7c3aed',       // Purple plus foncé
    danger: '#dc2626',       // Red
    warning: '#f59e0b',      // Amber
    success: '#10b981',      // Emerald
    info: '#06b6d4',         // Cyan
  },
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Inter',
    fontSize: 'md',
  },
  layout: {
    sidebarPosition: 'left',
    compactMode: true,       // Mode compact pour plus de données visibles
    headerHeight: 56,
  },
  features: {
    darkModeEnabled: true,
    multiLanguageEnabled: true,
    rtlEnabled: true,        // Support RTL pour clients arabes
    analyticsEnabled: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SCHOOL TENANT - Configuration Complète
// ═══════════════════════════════════════════════════════════════════════════
export const SCHOOL_ADVANCED_CONFIG: AdvancedTenantConfig = {
  sector: 'school',
  branding: {
    logo: '/logos/school/logo-full.svg',
    favicon: '/logos/school/favicon.ico',
    fullName: 'KIAM Éducation',
    shortName: 'KE',
  },
  colors: {
    primary: '#f59e0b',      // Amber pour l'éducation (chaleur, apprentissage)
    secondary: '#fbbf24',    // Amber clair
    accent: '#d97706',       // Amber foncé
    danger: '#ef4444',       // Red
    warning: '#f97316',      // Orange
    success: '#22c55e',      // Green
    info: '#3b82f6',         // Blue
  },
  typography: {
    headingFont: 'Poppins',
    bodyFont: 'Sora',
    fontSize: 'md',
  },
  layout: {
    sidebarPosition: 'left',
    compactMode: false,
    headerHeight: 60,
  },
  features: {
    darkModeEnabled: true,
    multiLanguageEnabled: true,
    rtlEnabled: false,
    analyticsEnabled: true,
  },
};

/**
 * Hook pour charger la configuration avancée depuis une API
 * 
 * Utilisation:
 * const config = useAdvancedTenantConfig();
 */
export function useAdvancedTenantConfig(tenantId?: string) {
  const [config, setConfig] = React.useState<AdvancedTenantConfig | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadConfig() {
      try {
        // Option 1: Charger depuis une API (recommandé)
        const response = await fetch(`/api/tenant/config${tenantId ? `?tenant=${tenantId}` : ''}`);
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        // Option 2: Utiliser la configuration statique par défaut
        console.warn('Failed to load advanced config, using default', error);
        // Fallback à la configuration par défaut
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [tenantId]);

  return { config, isLoading };
}

/**
 * Appliquer la configuration avancée au DOM
 */
export function applyAdvancedConfig(config: AdvancedTenantConfig): void {
  const root = document.documentElement;

  // Appliquer les couleurs
  root.style.setProperty('--color-primary', config.colors.primary);
  root.style.setProperty('--color-secondary', config.colors.secondary);
  root.style.setProperty('--color-accent', config.colors.accent);
  root.style.setProperty('--color-danger', config.colors.danger);
  root.style.setProperty('--color-warning', config.colors.warning);
  root.style.setProperty('--color-success', config.colors.success);
  root.style.setProperty('--color-info', config.colors.info);

  // Appliquer la typographie
  root.style.setProperty('--font-heading', config.typography.headingFont);
  root.style.setProperty('--font-body', config.typography.bodyFont);

  // Appliquer la configuration de layout
  root.style.setProperty('--header-height', `${config.layout.headerHeight}px`);
  root.setAttribute('data-compact-mode', config.layout.compactMode ? 'true' : 'false');
  root.setAttribute('data-sidebar-position', config.layout.sidebarPosition);

  // Appliquer les features
  root.setAttribute('data-dark-mode-enabled', config.features.darkModeEnabled ? 'true' : 'false');
  root.setAttribute('data-rtl-enabled', config.features.rtlEnabled ? 'true' : 'false');

  // Changer la langue si nécessaire
  if (config.features.rtlEnabled) {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'fr';
  }

  // Changer le favicon
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    favicon.href = config.branding.favicon;
  }

  // Ajouter les fonts personnalisées via @import
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=${config.typography.headingFont.replace(' ', '+')}:wght@400;600;700&family=${config.typography.bodyFont.replace(' ', '+')}:wght@400;500&display=swap');
  `;
  document.head.appendChild(style);
}

/**
 * EXEMPLE D'UTILISATION DANS UN COMPOSANT
 */
export function TenantBrandingExample() {
  const { config, isLoading } = useAdvancedTenantConfig();

  React.useEffect(() => {
    if (config) {
      applyAdvancedConfig(config);
    }
  }, [config]);

  if (isLoading) {
    return <div>Chargement de la configuration...</div>;
  }

  if (!config) {
    return <div>Erreur lors du chargement</div>;
  }

  return (
    <div className="tenant-branding">
      <img src={config.branding.logo} alt={config.branding.fullName} className="logo" />
      <h1 style={{ color: config.colors.primary }}>
        {config.branding.fullName}
      </h1>
      <p style={{ color: config.colors.secondary }}>
        Bienvenue sur {config.branding.shortName}
      </p>
    </div>
  );
}

/**
 * INTERFACE POUR L'API DE CONFIGURATION
 */
export interface TenantConfigAPI {
  /**
   * GET /api/tenant/config
   * Récupère la configuration du tenant courant
   */
  getConfig: () => Promise<AdvancedTenantConfig>;

  /**
   * POST /api/tenant/config
   * Met à jour la configuration du tenant (admin only)
   */
  updateConfig: (config: Partial<AdvancedTenantConfig>) => Promise<void>;

  /**
   * GET /api/tenant/branding
   * Récupère uniquement les infos de branding
   */
  getBranding: () => Promise<AdvancedTenantConfig['branding']>;

  /**
   * GET /api/tenant/colors
   * Récupère uniquement les couleurs
   */
  getColors: () => Promise<AdvancedTenantConfig['colors']>;
}

/**
 * EXEMPLE DE RÉPONSE API
 * 
 * GET /api/tenant/config
 * 
 * {
 *   "sector": "health",
 *   "branding": {
 *     "logo": "/logos/health/logo-full.svg",
 *     "favicon": "/logos/health/favicon.ico",
 *     "fullName": "KIAM Santé Plus",
 *     "shortName": "KS+"
 *   },
 *   "colors": {
 *     "primary": "#0ea5e9",
 *     "secondary": "#06b6d4",
 *     ...
 *   },
 *   ...
 * }
 */

/**
 * EXEMPLE D'INTÉGRATION DANS LARAVEL
 * 
 * // Controller
 * Route::get('/api/tenant/config', function () {
 *     $tenant = auth()->user()->tenant;
 *     
 *     return response()->json([
 *         'sector' => $tenant->sector,
 *         'branding' => json_decode($tenant->branding_config),
 *         'colors' => json_decode($tenant->color_config),
 *         ...
 *     ]);
 * });
 * 
 * // Model: Tenant
 * class Tenant extends Model {
 *     protected $casts = [
 *         'branding_config' => 'array',
 *         'color_config' => 'array',
 *         'typography_config' => 'array',
 *         'layout_config' => 'array',
 *         'features_config' => 'array',
 *     ];
 * }
 */
