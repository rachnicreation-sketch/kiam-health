/**
 * Configuration des modules disponibles pour chaque tenant
 * Structure cloisonnée : chaque tenant a ses propres modules
 */

export type TenantSector = 'health' | 'erp' | 'school' | 'hotel' | 'pharmacy' | 'enterprise';

export interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  component: () => Promise<any>;
  requiredPermissions?: string[];
  subModules?: ModuleConfig[];
}

export interface TenantModuleConfig {
  sector: TenantSector;
  modules: ModuleConfig[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
    logoPosition?: 'left' | 'center' | 'top';
  };
  features: {
    [key: string]: boolean;
  };
}

// ────────────────────────────────────────────────────────────────────
// HEALTH TENANT - Modules strictement isolés
// ────────────────────────────────────────────────────────────────────
export const HEALTH_MODULES: TenantModuleConfig = {
  sector: 'health',
  theme: {
    primaryColor: '#0ea5e9',    // Cyan
    secondaryColor: '#06b6d4',  // Cyan-600
    accentColor: '#0284c7',     // Sky-600
    logoUrl: '/logos/health-logo.svg',
    logoPosition: 'left'
  },
  features: {
    patients: true,
    consultations: true,
    pharmacy: true,
    laboratory: true,
    hospitalization: true,
    appointments: true,
    billing: true,
    accounting: true,
    humanResources: true,
    reports: true,
    facilities: true,
    messaging: true,
    guardPlanning: true,
    catalogs: true
  },
  modules: [
    {
      id: 'health-dashboard',
      name: 'Tableau de Bord',
      description: 'Aperçu des activités médicales',
      icon: 'LayoutDashboard',
      path: '/health',
      component: () => import('@/modules/health/pages/Dashboard')
    },
    {
      id: 'patients',
      name: 'Patients',
      description: 'Gestion des dossiers patients',
      icon: 'Users',
      path: '/health/patients',
      component: () => import('@/modules/health/pages/Patients'),
      subModules: [
        {
          id: 'patient-detail',
          name: 'Détail Patient',
          description: 'Profil détaillé du patient',
          icon: 'User',
          path: '/health/patients/:id',
          component: () => import('@/modules/health/pages/PatientDetail')
        }
      ]
    },
    {
      id: 'consultations',
      name: 'Consultations',
      description: 'Suivi des consultations médicales',
      icon: 'Stethoscope',
      path: '/health/consultations',
      component: () => import('@/modules/health/pages/Consultations')
    },
    {
      id: 'pharmacy',
      name: 'Pharmacie',
      description: 'Gestion des médicaments et stocks',
      icon: 'Pill',
      path: '/health/pharmacy',
      component: () => import('@/modules/health/pages/Pharmacy')
    },
    {
      id: 'laboratory',
      name: 'Laboratoire',
      description: 'Gestion des analyses et tests',
      icon: 'Beaker',
      path: '/health/laboratory',
      component: () => import('@/modules/health/pages/Laboratory')
    },
    {
      id: 'hospitalization',
      name: 'Hospitalisation',
      description: 'Gestion des lits et séjours',
      icon: 'BedDouble',
      path: '/health/hospitalization',
      component: () => import('@/modules/health/pages/Hospitalization')
    },
    {
      id: 'appointments',
      name: 'Rendez-vous',
      description: 'Agenda et réservations',
      icon: 'Calendar',
      path: '/health/appointments',
      component: () => import('@/modules/health/pages/Appointments')
    },
    {
      id: 'billing',
      name: 'Facturation',
      description: 'Gestion des factures et paiements',
      icon: 'CreditCard',
      path: '/health/billing',
      component: () => import('@/modules/health/pages/Billing')
    },
    {
      id: 'hr',
      name: 'Ressources Humaines',
      description: 'Gestion RH spécifique Health',
      icon: 'Users',
      path: '/health/hr',
      component: () => import('@/modules/health/pages/HumanResources'),
      requiredPermissions: ['hr.manage']
    },
    {
      id: 'accounting',
      name: 'Comptabilité',
      description: 'Suivi comptable',
      icon: 'Landmark',
      path: '/health/accounting',
      component: () => import('@/modules/health/pages/Accounting')
    },
    {
      id: 'reports',
      name: 'Rapports',
      description: 'Génération de rapports médicaux',
      icon: 'FileText',
      path: '/health/reports',
      component: () => import('@/modules/health/pages/Reports')
    }
  ]
};

// ────────────────────────────────────────────────────────────────────
// ERP TENANT - Modules Commerce & Gestion
// ────────────────────────────────────────────────────────────────────
export const ERP_MODULES: TenantModuleConfig = {
  sector: 'erp',
  theme: {
    primaryColor: '#8b5cf6',    // Purple
    secondaryColor: '#a855f7',  // Purple-500
    accentColor: '#7c3aed',     // Purple-600
    logoUrl: '/logos/erp-logo.svg',
    logoPosition: 'left'
  },
  features: {
    pos: true,
    inventory: true,
    customers: true,
    suppliers: true,
    procurement: true,
    expenses: true,
    transactions: true,
    humanResources: true,
    accounting: true,
    physicalInventories: true,
    commercialDocs: true,
    reports: true
  },
  modules: [
    {
      id: 'erp-dashboard',
      name: 'Tableau de Bord',
      description: 'Vue commerciale et opérationnelle',
      icon: 'LayoutDashboard',
      path: '/erp',
      component: () => import('@/modules/erp/pages/ErpDashboard')
    },
    {
      id: 'pos',
      name: 'Point de Vente',
      description: 'Gestion des ventes et caisse',
      icon: 'ShoppingCart',
      path: '/erp/pos',
      component: () => import('@/modules/erp/pages/PointOfSale')
    },
    {
      id: 'inventory',
      name: 'Inventaire',
      description: 'Gestion des stocks et articles',
      icon: 'Package',
      path: '/erp/inventory',
      component: () => import('@/modules/erp/pages/InventoryManager')
    },
    {
      id: 'customers',
      name: 'Clients',
      description: 'Base de données clients',
      icon: 'Store',
      path: '/erp/customers',
      component: () => import('@/modules/erp/pages/Customers')
    },
    {
      id: 'suppliers',
      name: 'Fournisseurs',
      description: 'Gestion des fournisseurs',
      icon: 'Truck',
      path: '/erp/suppliers',
      component: () => import('@/modules/erp/pages/Suppliers')
    },
    {
      id: 'procurement',
      name: 'Approvisionnement',
      description: 'Gestion des commandes d\'achat',
      icon: 'Zap',
      path: '/erp/procurement',
      component: () => import('@/modules/erp/pages/ProcurementDashboard'),
      subModules: [
        {
          id: 'purchase-orders',
          name: 'Commandes d\'Achat',
          description: 'Suivi des PO',
          icon: 'FileText',
          path: '/erp/procurement/purchase-orders',
          component: () => import('@/modules/erp/pages/PurchaseOrders')
        },
        {
          id: 'goods-receipts',
          name: 'Réceptions de Marchandises',
          description: 'Enregistrement des entrées stock',
          icon: 'CheckSquare',
          path: '/erp/procurement/goods-receipts',
          component: () => import('@/modules/erp/pages/GoodsReceipts')
        }
      ]
    },
    {
      id: 'expenses',
      name: 'Dépenses',
      description: 'Gestion des frais et charges',
      icon: 'TrendingDown',
      path: '/erp/expenses',
      component: () => import('@/modules/erp/pages/Expenses')
    },
    {
      id: 'hr',
      name: 'Ressources Humaines',
      description: 'Gestion RH spécifique ERP/Commerce',
      icon: 'Users',
      path: '/erp/hr',
      component: () => import('@/modules/erp/pages/ErpHumanResources'),
      requiredPermissions: ['hr.manage']
    },
    {
      id: 'accounting',
      name: 'Comptabilité',
      description: 'Suivi comptable et financier',
      icon: 'Landmark',
      path: '/erp/accounting',
      component: () => import('@/modules/erp/pages/ErpAccounting')
    },
    {
      id: 'reports',
      name: 'Rapports',
      description: 'Rapports commerciaux et financiers',
      icon: 'FileText',
      path: '/erp/reports',
      component: () => import('@/modules/erp/pages/Reports')
    }
  ]
};

// ────────────────────────────────────────────────────────────────────
// SCHOOL TENANT - Modules Éducation
// ────────────────────────────────────────────────────────────────────
export const SCHOOL_MODULES: TenantModuleConfig = {
  sector: 'school',
  theme: {
    primaryColor: '#f59e0b',    // Amber
    secondaryColor: '#fbbf24',  // Amber-400
    accentColor: '#d97706',     // Amber-600
    logoUrl: '/logos/school-logo.svg',
    logoPosition: 'left'
  },
  features: {
    students: true,
    classes: true,
    grades: true,
    attendance: true,
    schedule: true,
    elearning: true,
    payments: true,
    humanResources: true,
    reports: true
  },
  modules: [
    {
      id: 'school-dashboard',
      name: 'Tableau de Bord',
      description: 'Aperçu pédagogique',
      icon: 'LayoutDashboard',
      path: '/school',
      component: () => import('@/modules/school/pages/SchoolDashboard')
    },
    {
      id: 'students',
      name: 'Élèves',
      description: 'Gestion des dossiers scolaires',
      icon: 'Users',
      path: '/school/students',
      component: () => import('@/modules/school/pages/Students')
    },
    {
      id: 'classes',
      name: 'Classes',
      description: 'Gestion des salles et niveaux',
      icon: 'DoorOpen',
      path: '/school/classes',
      component: () => import('@/modules/school/pages/Classes')
    },
    {
      id: 'grades',
      name: 'Notes',
      description: 'Saisie et suivi des notes',
      icon: 'Award',
      path: '/school/grades',
      component: () => import('@/modules/school/pages/Grades')
    },
    {
      id: 'attendance',
      name: 'Présence',
      description: 'Suivi des présences',
      icon: 'CheckCircle',
      path: '/school/attendance',
      component: () => import('@/modules/school/pages/Attendance')
    },
    {
      id: 'schedule',
      name: 'Horaires',
      description: 'Emploi du temps et calendrier',
      icon: 'Calendar',
      path: '/school/schedule',
      component: () => import('@/modules/school/pages/Schedule')
    },
    {
      id: 'elearning',
      name: 'E-Learning',
      description: 'Plateforme d\'apprentissage en ligne',
      icon: 'Monitor',
      path: '/school/elearning',
      component: () => import('@/modules/school/pages/Elearning')
    },
    {
      id: 'payments',
      name: 'Scolarité',
      description: 'Gestion des frais et paiements',
      icon: 'CreditCard',
      path: '/school/payments',
      component: () => import('@/modules/school/pages/Payments')
    },
    {
      id: 'hr',
      name: 'Ressources Humaines',
      description: 'Gestion RH spécifique École',
      icon: 'Users',
      path: '/school/hr',
      component: () => import('@/modules/school/pages/SchoolHumanResources'),
      requiredPermissions: ['hr.manage']
    }
  ]
};

// ────────────────────────────────────────────────────────────────────
// HOTEL TENANT
// ────────────────────────────────────────────────────────────────────
export const HOTEL_MODULES: TenantModuleConfig = {
  sector: 'hotel',
  theme: {
    primaryColor: '#ec4899',    // Pink
    secondaryColor: '#f472b6',  // Pink-400
    accentColor: '#be185d',     // Pink-700
    logoUrl: '/logos/hotel-logo.svg',
    logoPosition: 'left'
  },
  features: {
    rooms: true,
    bookings: true,
    guests: true,
    housekeeping: true,
    billing: true,
    reports: true
  },
  modules: [
    {
      id: 'hotel-dashboard',
      name: 'Tableau de Bord',
      description: 'Aperçu de l\'hôtel',
      icon: 'LayoutDashboard',
      path: '/hotel',
      component: () => import('@/modules/hotel/pages/HotelDashboard')
    },
    {
      id: 'rooms',
      name: 'Chambres',
      description: 'Gestion des chambres',
      icon: 'DoorOpen',
      path: '/hotel/rooms',
      component: () => import('@/modules/hotel/pages/Rooms')
    },
    {
      id: 'bookings',
      name: 'Réservations',
      description: 'Suivi des réservations',
      icon: 'Calendar',
      path: '/hotel/bookings',
      component: () => import('@/modules/hotel/pages/Bookings')
    }
  ]
};

// ────────────────────────────────────────────────────────────────────
// PHARMACY TENANT
// ────────────────────────────────────────────────────────────────────
export const PHARMACY_MODULES: TenantModuleConfig = {
  sector: 'pharmacy',
  theme: {
    primaryColor: '#10b981',    // Emerald
    secondaryColor: '#34d399',  // Emerald-400
    accentColor: '#059669',     // Emerald-600
    logoUrl: '/logos/pharmacy-logo.svg',
    logoPosition: 'left'
  },
  features: {
    pharmacy: true,
    inventory: true,
    sales: true,
    suppliers: true,
    billing: true,
    reports: true
  },
  modules: [
    {
      id: 'pharmacy-dashboard',
      name: 'Tableau de Bord',
      description: 'Aperçu pharmacie',
      icon: 'LayoutDashboard',
      path: '/pharmacy',
      component: () => import('@/modules/pharmacy/pages/PharmacyDashboard')
    }
  ]
};

// ────────────────────────────────────────────────────────────────────
// ENTERPRISE TENANT
// ────────────────────────────────────────────────────────────────────
export const ENTERPRISE_MODULES: TenantModuleConfig = {
  sector: 'enterprise',
  theme: {
    primaryColor: '#ef4444',    // Red
    secondaryColor: '#f87171',  // Red-400
    accentColor: '#991b1b',     // Red-900
    logoUrl: '/logos/enterprise-logo.svg',
    logoPosition: 'left'
  },
  features: {
    projects: true,
    tasks: true,
    teams: true,
    reports: true
  },
  modules: [
    {
      id: 'enterprise-dashboard',
      name: 'Tableau de Bord',
      description: 'Vue d\'ensemble projets',
      icon: 'LayoutDashboard',
      path: '/enterprise',
      component: () => import('@/modules/enterprise/pages/EnterpriseDashboard')
    },
    {
      id: 'projects',
      name: 'Projets',
      description: 'Gestion des projets',
      icon: 'Briefcase',
      path: '/enterprise/projects',
      component: () => import('@/modules/enterprise/pages/Projects')
    },
    {
      id: 'tasks',
      name: 'Tâches',
      description: 'Suivi des tâches',
      icon: 'CheckSquare',
      path: '/enterprise/tasks',
      component: () => import('@/modules/enterprise/pages/Tasks')
    }
  ]
};

// ────────────────────────────────────────────────────────────────────
// MAPPING GLOBAL
// ────────────────────────────────────────────────────────────────────
export const TENANT_MODULES_MAP: Record<TenantSector, TenantModuleConfig> = {
  health: HEALTH_MODULES,
  erp: ERP_MODULES,
  school: SCHOOL_MODULES,
  hotel: HOTEL_MODULES,
  pharmacy: PHARMACY_MODULES,
  enterprise: ENTERPRISE_MODULES
};

/**
 * Obtenir les modules pour un tenant
 */
export function getTenantModules(sector: TenantSector): TenantModuleConfig {
  return TENANT_MODULES_MAP[sector] || HEALTH_MODULES;
}

/**
 * Vérifier si un module est accessible pour un tenant
 */
export function isModuleAvailable(sector: TenantSector, moduleId: string): boolean {
  const config = getTenantModules(sector);
  return config.modules.some(m => m.id === moduleId || m.subModules?.some(sub => sub.id === moduleId));
}

/**
 * Obtenir la couleur primaire du tenant
 */
export function getTenantPrimaryColor(sector: TenantSector): string {
  return getTenantModules(sector).theme.primaryColor;
}

/**
 * Obtenir tous les modules d'un tenant
 */
export function getAllModuleIds(sector: TenantSector): string[] {
  const config = getTenantModules(sector);
  return config.modules.flatMap(m => [m.id, ...(m.subModules?.map(s => s.id) || [])]);
}
