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
  | 'saas'
  | 'hotel'
  | 'school'
  | 'erp'
  | 'enterprise';

export type Action = 'read' | 'write' | 'delete' | 'admin';

export interface Permission {
  module: Module;
  actions: Action[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Module[]> = {
  'saas_admin': [
    'saas'
  ],
  'clinic_admin': [
    'dashboard', 'patients', 'consultations', 'appointments', 'hospitalization', 
    'laboratory', 'pharmacy', 'billing', 'accounting', 'reports', 'hr', 
    'planning', 'catalogs', 'facilities', 'settings', 'hotel', 'school', 'erp', 'enterprise'
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
  ],
  'school_direction': [
    'dashboard', 'school', 'reports', 'settings'
  ],
  'school_admin': [
    'dashboard', 'school', 'hr', 'planning', 'settings'
  ],
  'school_finance': [
    'dashboard', 'school', 'billing', 'accounting'
  ],
  'school_scolarite': [
    'dashboard', 'school', 'reports'
  ],
  'school_teacher': [
    'dashboard', 'school'
  ]
};

/**
 * Checks if a role has access to a specific module
 */
export function hasModuleAccess(role: UserRole, module: Module): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  return permissions.includes(module);
}

/**
 * Granular check for clinical and administrative actions
 * Following strict separation of concerns for School Module
 */
export function canPerform(role: UserRole, module: Module, action: Action = 'read'): boolean {
  // 1. Initial access check
  if (!hasModuleAccess(role, module)) return false;
  
  // 2. Global Admin bypass
  if (role === 'clinic_admin' || role === 'saas_admin') return true;

  // 3. DIRECTION (Supervision Only)
  if (role === 'school_direction') {
    return action === 'read'; // Direction NEVER writes, only supervises
  }

  // 4. FINANCE (Strictly money)
  if (role === 'school_finance') {
    if (module === 'billing' || module === 'accounting') return true;
    if (module === 'school') return action === 'read'; // Can see students list but nothing academic
    return false;
  }

  // 5. ADMINISTRATION (Organization)
  if (role === 'school_admin') {
    if (module === 'hr' || module === 'planning' || module === 'settings') return true;
    if (module === 'school') {
       // Administration manages organization (students/classes) but NOT academics (grades/bulletins)
       // This will be filtered further in components
       return true; 
    }
    return false;
  }

  // 6. SCOLARITÉ (Academic Heart)
  if (role === 'school_scolarite') {
    if (module === 'school' || module === 'reports') return true;
    if (module === 'billing' || module === 'accounting') return false; // Strict separation from Finance
    return action === 'read';
  }

  // 7. TEACHER (Grading only)
  if (role === 'school_teacher') {
    if (module === 'school') return true; // Will be limited to grades/attendance in UI
    return false;
  }

  // Default fallback for other modules
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
      return ['receptionist', 'pharmacist'].includes(role);
    case 'appointments':
      return ['receptionist', 'medical_secretary', 'doctor', 'nurse'].includes(role);
    default:
      return false;
  }
}
