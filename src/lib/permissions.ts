import { UserRole } from "./mock-data";

export type Module = 
  // ── Modules communs (partagés) ──────────────────────────────────────────────
  | 'billing' 
  | 'accounting' 
  | 'reports' 
  | 'hr'         // RH santé (health)
  | 'erp_hr'     // RH ERP/Commerce
  | 'school_hr'  // RH École
  | 'settings'
  | 'saas'
  // ── Modules Health exclusifs ────────────────────────────────────────────────
  | 'dashboard'
  | 'patients' 
  | 'consultations' 
  | 'appointments' 
  | 'hospitalization' 
  | 'laboratory' 
  | 'pharmacy'   // pharmacie interne santé
  | 'planning'
  | 'catalogs'
  | 'facilities'
  // ── Modules ERP/Commerce exclusifs ─────────────────────────────────────────
  | 'erp'
  // ── Modules School exclusifs ────────────────────────────────────────────────
  | 'school'
  // ── Modules Hotel exclusifs ─────────────────────────────────────────────────
  | 'hotel'
  // ── Modules Enterprise exclusifs ────────────────────────────────────────────
  | 'enterprise';

export type Action = 'read' | 'write' | 'delete' | 'admin';

export interface Permission {
  module: Module;
  actions: Action[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Module[]> = {
  // ── SaaS ────────────────────────────────────────────────────────────────────
  'saas_admin': ['saas'],

  // ── Health ──────────────────────────────────────────────────────────────────
  'clinic_admin': [
    'dashboard', 'patients', 'consultations', 'appointments', 'hospitalization',
    'laboratory', 'pharmacy', 'billing', 'accounting', 'reports', 'hr',
    'planning', 'catalogs', 'facilities', 'settings',
  ],
  'doctor': [
    'dashboard', 'patients', 'consultations', 'appointments', 'hospitalization',
    'laboratory', 'pharmacy', 'planning', 'catalogs', 'billing',
  ],
  'nurse': [
    'dashboard', 'patients', 'consultations', 'hospitalization', 'pharmacy',
    'planning', 'laboratory',
  ],
  'lab_tech': ['dashboard', 'laboratory', 'patients', 'catalogs'],
  'pharmacist': ['dashboard', 'pharmacy', 'billing', 'patients'],
  'receptionist': ['dashboard', 'patients', 'appointments', 'billing'],
  'medical_secretary': [
    'dashboard', 'patients', 'appointments', 'reports', 'consultations', 'billing',
  ],
  'hr': ['dashboard', 'hr'],
  'inventory_manager': ['dashboard', 'pharmacy', 'facilities'],
  'nurse_aide': ['dashboard', 'patients', 'hospitalization'],
  'agent': ['dashboard'],

  // ── ERP/Commerce ─────────────────────────────────────────────────────────────
  'erp_admin': [
    'erp', 'billing', 'accounting', 'reports', 'erp_hr', 'settings',
  ],
  'erp_manager': [
    'erp', 'billing', 'reports',
  ],
  'caissier': ['erp'],
  'stockiste': ['erp'],
  'commercial': ['erp', 'billing'],

  // ── School ───────────────────────────────────────────────────────────────────
  'school_direction': ['school', 'reports', 'settings'],
  'school_admin': ['school', 'school_hr', 'planning', 'settings'],
  'school_finance': ['school', 'billing', 'accounting'],
  'school_scolarite': ['school', 'reports'],
  'school_teacher': ['school'],
};

/**
 * Modules qui appartiennent EXCLUSIVEMENT au secteur Health.
 * Aucun autre secteur ne peut y accéder, même avec la permission de rôle.
 */
export const HEALTH_EXCLUSIVE_MODULES: Module[] = [
  'dashboard', 'patients', 'consultations', 'appointments',
  'hospitalization', 'laboratory', 'pharmacy', 'planning', 'catalogs', 'facilities', 'hr',
];

/**
 * Modules qui appartiennent EXCLUSIVEMENT au secteur ERP.
 */
export const ERP_EXCLUSIVE_MODULES: Module[] = ['erp', 'erp_hr'];

/**
 * Modules qui appartiennent EXCLUSIVEMENT au secteur School.
 */
export const SCHOOL_EXCLUSIVE_MODULES: Module[] = ['school', 'school_hr'];

/**
 * Modules qui appartiennent EXCLUSIVEMENT au secteur Hotel.
 */
export const HOTEL_EXCLUSIVE_MODULES: Module[] = ['hotel'];

/**
 * Modules qui appartiennent EXCLUSIVEMENT au secteur Enterprise.
 */
export const ENTERPRISE_EXCLUSIVE_MODULES: Module[] = ['enterprise'];

/**
 * Vérifie si un rôle a accès à un module donné.
 */
export function hasModuleAccess(role: UserRole, module: Module): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(module);
}

/**
 * Vérifie si un secteur est autorisé à accéder à un module donné.
 * Empêche la fuite de données entre tenants.
 *
 * IMPORTANT : si le secteur est inconnu (null/undefined), on laisse passer
 * et c'est la vérification de rôle qui décide — cela évite de bloquer
 * des utilisateurs créés avant l'ajout du champ sector.
 */
export function isSectorAllowed(sector: string | undefined | null, module: Module): boolean {
  // Secteur inconnu → on ne bloque pas (fallback sur les permissions de rôle)
  if (!sector) return true;

  // Health exclusif → uniquement secteur health
  if (HEALTH_EXCLUSIVE_MODULES.includes(module)) return sector === 'health';

  // ERP exclusif → secteurs erp et shop
  if (ERP_EXCLUSIVE_MODULES.includes(module)) return sector === 'erp' || sector === 'shop';

  // School exclusif → secteur school
  if (SCHOOL_EXCLUSIVE_MODULES.includes(module)) return sector === 'school';

  // Hotel exclusif → secteur hotel
  if (HOTEL_EXCLUSIVE_MODULES.includes(module)) return sector === 'hotel';

  // Enterprise exclusif → secteur enterprise
  if (ENTERPRISE_EXCLUSIVE_MODULES.includes(module)) return sector === 'enterprise';

  // Modules communs (billing, accounting, reports, settings, saas) → tous secteurs
  return true;
}

/**
 * Vérification combinée rôle + secteur.
 * C'est la fonction principale à utiliser dans ProtectedRoute et can().
 */
export function canPerform(role: UserRole, module: Module, action: Action = 'read', sector?: string | null): boolean {
  // 1. Vérification cloisonnement secteur (prioritaire sur le rôle)
  if (!isSectorAllowed(sector, module)) return false;

  // 2. Admin SaaS → accès total aux modules saas (et uniquement saas)
  if (role === 'saas_admin') return module === 'saas';

  // 3. Admins sectoriels / Locataires → accès total à tous les modules de leur secteur (sauf saas)
  if (role === 'clinic_admin' || role === 'erp_admin') {
    return module !== 'saas';
  }

  // 4. Vérification accès par rôle
  if (!hasModuleAccess(role, module)) return false;

  // 5. DIRECTION école (supervision uniquement)
  if (role === 'school_direction') return action === 'read';

  // 6. FINANCE école (strictement financier)
  if (role === 'school_finance') {
    if (module === 'billing' || module === 'accounting') return true;
    if (module === 'school') return action === 'read';
    return false;
  }

  // 7. ADMINISTRATION école
  if (role === 'school_admin') {
    if (module === 'school_hr' || module === 'planning' || module === 'settings') return true;
    if (module === 'school') return true;
    return false;
  }

  // 8. SCOLARITÉ
  if (role === 'school_scolarite') {
    if (module === 'school' || module === 'reports') return true;
    return action === 'read';
  }

  // 9. ENSEIGNANT
  if (role === 'school_teacher') {
    return module === 'school';
  }

  // 10. Fallback → lecture autorisée pour les rôles ayant accès au module
  if (action === 'read') return true;

  switch (module) {
    case 'patients':
      return ['doctor', 'nurse', 'receptionist', 'medical_secretary'].includes(role);
    case 'consultations':
      return ['doctor', 'nurse', 'medical_secretary'].includes(role);
    case 'laboratory':
      return ['doctor', 'lab_tech'].includes(role);
    case 'pharmacy':
      return ['pharmacist', 'inventory_manager'].includes(role);
    case 'billing':
      return ['receptionist', 'pharmacist', 'commercial'].includes(role);
    case 'appointments':
      return ['receptionist', 'medical_secretary', 'doctor', 'nurse'].includes(role);
    default:
      return false;
  }
}
