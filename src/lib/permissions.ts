import { UserRole } from "./mock-data";

export type Module = 
  | 'dashboard'
  | 'patients' 
  | 'consultations' 
  | 'appointments' 
  | 'hospitalization' 
  | 'laboratory' 
  | 'pharmacy' 
  | 'billing' 
  | 'accounting' 
  | 'reports' 
  | 'hr' 
  | 'planning'
  | 'catalogs'
  | 'facilities'
  | 'settings'
  | 'saas';

export type Action = 'read' | 'write' | 'delete' | 'admin';

export interface Permission {
  module: Module;
  actions: Action[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Module[]> = {
  'saas_admin': [
    'saas', 'dashboard', 'patients', 'consultations', 'appointments', 'hospitalization', 
    'laboratory', 'pharmacy', 'billing', 'accounting', 'reports', 'hr', 
    'planning', 'catalogs', 'facilities', 'settings'
  ],
  'clinic_admin': [
    'dashboard', 'patients', 'consultations', 'appointments', 'hospitalization', 
    'laboratory', 'pharmacy', 'billing', 'accounting', 'reports', 'hr', 
    'planning', 'catalogs', 'facilities', 'settings'
  ],
  'doctor': [
    'dashboard', 'patients', 'consultations', 'appointments', 'hospitalization', 
    'laboratory', 'pharmacy', 'planning', 'catalogs', 'billing'
  ],
  'nurse': [
    'dashboard', 'patients', 'consultations', 'hospitalization', 'pharmacy', 'planning', 'laboratory'
  ],
  'lab_tech': [
    'dashboard', 'laboratory', 'patients', 'catalogs'
  ],
  'pharmacist': [
    'dashboard', 'pharmacy', 'billing', 'patients'
  ],
  'receptionist': [
    'dashboard', 'patients', 'appointments', 'billing'
  ],
  'medical_secretary': [
    'dashboard', 'patients', 'appointments', 'reports', 'consultations', 'billing'
  ],
  'hr': [
    'dashboard', 'hr'
  ],
  'inventory_manager': [
    'dashboard', 'pharmacy', 'facilities'
  ],
  'nurse_aide': [
    'dashboard', 'patients', 'hospitalization'
  ],
  'agent': [
    'dashboard'
  ]
};

/**
 * Checks if a role has access to a specific module
 */
export function hasModuleAccess(role: UserRole, module: Module): boolean {
  if (role === 'saas_admin' && !['saas', 'settings'].includes(module)) return false;
  
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  return permissions.includes(module);
}

/**
 * Granular check for clinical and administrative actions
 */
export function canPerform(role: UserRole, module: Module, action: Action = 'read'): boolean {
  if (!hasModuleAccess(role, module)) return false;
  
  if (action === 'read') return true;

  // Clinic Admin can do everything within their clinic
  if (role === 'clinic_admin') return true;

  // Write permissions per role
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
      return ['receptionist', 'pharmacist'].includes(role);
    case 'appointments':
      return ['receptionist', 'medical_secretary', 'doctor', 'nurse'].includes(role);
    case 'hr':
      return role === 'hr';
    case 'planning':
      return ['doctor', 'nurse', 'clinic_admin'].includes(role);
    default:
      return false;
  }
}
