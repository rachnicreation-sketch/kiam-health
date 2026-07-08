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
    },
    {
      id: 'guard-planning',
      name: 'Planning de Garde',
      description: 'Planification des gardes médicales',
      icon: 'Shield',
      path: '/health/guard-planning',
      component: () => import('@/modules/health/pages/GuardPlanning')
    },
    {
      id: 'messaging',
      name: 'Messagerie Interne',
      description: 'Communication entre équipes médicales',
      icon: 'MessageSquare',
      path: '/health/messaging',
      component: () => import('@/modules/health/pages/Messaging')
    },
    {
      id: 'catalogs',
      name: 'Catalogues',
      description: 'Actes médicaux et examens de labo',
      icon: 'BookOpen',
      path: '/health/catalogs',
      component: () => import('@/modules/health/pages/Catalogs')
    },
    {
      id: 'facilities',
      name: 'Équipements',
      description: 'Gestion des installations et équipements',
      icon: 'Building2',
      path: '/health/facilities',
      component: () => import('@/modules/health/pages/Facilities')
    },
    {
      id: 'patient-portal',
      name: 'Portail Patient',
      description: 'Espace self-service pour les patients',
      icon: 'HeartPulse',
      path: '/health/patient-portal',
      component: () => import('@/modules/health/pages/PatientPortal')
    },
    {
      id: 'health-settings',
      name: 'Paramètres',
      description: 'Configuration de la clinique',
      icon: 'Settings',
      path: '/health/settings',
      component: () => import('@/modules/health/pages/Settings')
    },
    {
      id: 'health-insurance',
      name: 'Assurances',
      description: 'Conventions de tiers-payant',
      icon: 'Shield',
      path: '/health/insurance',
      component: () => import('@/modules/health/pages/InsuranceManager')
    },
    {
      id: 'health-telemedicine',
      name: 'Télémédecine',
      description: 'Téléconsultations vidéo intégrées',
      icon: 'Video',
      path: '/health/telemedicine',
      component: () => import('@/modules/health/pages/Telemedicine')
    },
    {
      id: 'health-imaging',
      name: 'Imagerie Médicale',
      description: 'Radiographies et comptes-rendus',
      icon: 'FileImage',
      path: '/health/imaging',
      component: () => import('@/modules/health/pages/MedicalImaging')
    },
    {
      id: 'health-campaigns',
      name: 'Campagnes & Rappels',
      description: 'Rappels automatiques par SMS/WhatsApp',
      icon: 'Bell',
      path: '/health/campaigns',
      component: () => import('@/modules/health/pages/CampaignManager')
    },
    {
      id: 'health-epidemio',
      name: 'Épidémiologie',
      description: 'Suivi statistique des pathologies',
      icon: 'Activity',
      path: '/health/epidemio',
      component: () => import('@/modules/health/pages/EpidemioStats')
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
          id: 'purchase-requests',
          name: 'Demandes d\'Achat',
          description: 'Demandes et approbations',
          icon: 'ClipboardList',
          path: '/erp/procurement/purchase-requests',
          component: () => import('@/modules/erp/pages/PurchaseRequests')
        },
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
        },
        {
          id: 'supplier-invoices',
          name: 'Factures Fournisseurs',
          description: 'Contrôle et validation des factures',
          icon: 'Receipt',
          path: '/erp/procurement/supplier-invoices',
          component: () => import('@/modules/erp/pages/SupplierInvoices')
        },
        {
          id: 'supplier-payments',
          name: 'Paiements Fournisseurs',
          description: 'Règlements et échéanciers',
          icon: 'Wallet',
          path: '/erp/procurement/supplier-payments',
          component: () => import('@/modules/erp/pages/SupplierPayments')
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
      id: 'erp-transactions',
      name: 'Transactions',
      description: 'Historique des ventes et encaissements',
      icon: 'ArrowRightLeft',
      path: '/erp/transactions',
      component: () => import('@/modules/erp/pages/ErpTransactions')
    },
    {
      id: 'physical-inventories',
      name: 'Inventaires Physiques',
      description: 'Audits et comptages de stock',
      icon: 'ClipboardCheck',
      path: '/erp/physical-inventories',
      component: () => import('@/modules/erp/pages/PhysicalInventories')
    },
    {
      id: 'commercial-docs',
      name: 'Documents Commerciaux',
      description: 'Devis et bons de livraison',
      icon: 'FolderOpen',
      path: '/erp/commercial-docs',
      component: () => import('@/modules/erp/pages/CommercialDocs')
    },
    {
      id: 'register-closing',
      name: 'Clôture de Caisse',
      description: 'Bilan journalier et fermeture',
      icon: 'Lock',
      path: '/erp/register-closing',
      component: () => import('@/modules/erp/pages/RegisterClosing')
    },
    {
      id: 'reports',
      name: 'Rapports',
      description: 'Rapports commerciaux et financiers',
      icon: 'FileText',
      path: '/erp/reports',
      component: () => import('@/modules/erp/pages/Reports')
    },
    {
      id: 'erp-crm',
      name: 'CRM Commercial',
      description: 'Pipeline prospects et opportunités',
      icon: 'Target',
      path: '/erp/crm',
      component: () => import('@/modules/erp/pages/CRMPipeline')
    },
    {
      id: 'erp-ecommerce',
      name: 'E-Commerce',
      description: 'Catalogue en ligne et commandes web',
      icon: 'Globe',
      path: '/erp/ecommerce',
      component: () => import('@/modules/erp/pages/EcommerceStore')
    },
    {
      id: 'erp-warehouses',
      name: 'Multi-Dépôts',
      description: 'Gestion logistique inter-entrepôts',
      icon: 'Package',
      path: '/erp/warehouses',
      component: () => import('@/modules/erp/pages/MultiWarehouse')
    },
    {
      id: 'erp-loyalty',
      name: 'Fidélité',
      description: 'Points de fidélité et remises',
      icon: 'Gift',
      path: '/erp/loyalty',
      component: () => import('@/modules/erp/pages/LoyaltyProgram')
    },
    {
      id: 'erp-einvoicing',
      name: 'Facture Électronique',
      description: 'Facturation électronique certifiée DGI',
      icon: 'ShieldAlert',
      path: '/erp/einvoicing',
      component: () => import('@/modules/erp/pages/EInvoicing')
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
    },
    {
      id: 'teachers',
      name: 'Enseignants',
      description: 'Gestion du corps professoral',
      icon: 'GraduationCap',
      path: '/school/teachers',
      component: () => import('@/modules/school/pages/Teachers')
    },
    {
      id: 'bulletins',
      name: 'Bulletins',
      description: 'Génération et impression des bulletins',
      icon: 'FileSpreadsheet',
      path: '/school/bulletins',
      component: () => import('@/modules/school/pages/Bulletins')
    },
    {
      id: 'school-accounting',
      name: 'Comptabilité',
      description: 'Suivi financier de l\'établissement',
      icon: 'Landmark',
      path: '/school/accounting',
      component: () => import('@/modules/school/pages/Accounting')
    },
    {
      id: 'school-billing',
      name: 'Facturation',
      description: 'Factures et reçus de scolarité',
      icon: 'CreditCard',
      path: '/school/billing',
      component: () => import('@/modules/school/pages/Billing')
    },
    {
      id: 'school-reports',
      name: 'Rapports',
      description: 'Statistiques et rapports pédagogiques',
      icon: 'BarChart2',
      path: '/school/reports',
      component: () => import('@/modules/school/pages/Reports')
    },
    {
      id: 'school-settings',
      name: 'Paramètres',
      description: 'Configuration de l\'établissement',
      icon: 'Settings',
      path: '/school/settings',
      component: () => import('@/modules/school/pages/Settings')
    },
    {
      id: 'school-canteen',
      name: 'Cantine & Restauration',
      description: 'Abonnements et suivi des repas',
      icon: 'Coffee',
      path: '/school/canteen',
      component: () => import('@/modules/school/pages/Canteen')
    },
    {
      id: 'school-transport',
      name: 'Transport Scolaire',
      description: 'Gestion des bus et des circuits',
      icon: 'Bus',
      path: '/school/transport',
      component: () => import('@/modules/school/pages/SchoolTransport')
    },
    {
      id: 'school-library',
      name: 'Bibliothèque',
      description: 'Gestion des ouvrages et emprunts',
      icon: 'BookOpen',
      path: '/school/library',
      component: () => import('@/modules/school/pages/Library')
    },
    {
      id: 'school-parent-portal',
      name: 'Portail Parents',
      description: 'Accès parents et suivi élève',
      icon: 'Users',
      path: '/school/parent-portal',
      component: () => import('@/modules/school/pages/ParentPortal')
    },
    {
      id: 'school-exams',
      name: 'Examens en Ligne',
      description: 'QCM et devoirs numériques',
      icon: 'Monitor',
      path: '/school/exams',
      component: () => import('@/modules/school/pages/OnlineExams')
    },
    {
      id: 'school-student-life',
      name: 'Vie Scolaire',
      description: 'Registre disciplinaire et mérites',
      icon: 'Sparkles',
      path: '/school/student-life',
      component: () => import('@/modules/school/pages/StudentLife')
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
    },
    {
      id: 'hotel-billing',
      name: 'Facturation',
      description: 'Factures et encaissements hôteliers',
      icon: 'CreditCard',
      path: '/hotel/billing',
      component: () => import('@/modules/hotel/pages/HotelBilling')
    },
    {
      id: 'hotel-reports',
      name: 'Rapports',
      description: 'Taux d\'occupation et revenus',
      icon: 'BarChart2',
      path: '/hotel/reports',
      component: () => import('@/modules/hotel/pages/HotelReports')
    },
    {
      id: 'hotel-settings',
      name: 'Paramètres',
      description: 'Configuration de l\'hôtel',
      icon: 'Settings',
      path: '/hotel/settings',
      component: () => import('@/modules/hotel/pages/HotelSettings')
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
    },
    {
      id: 'pharmacy-pos',
      name: 'Point de Vente',
      description: 'Caisse & Ventes comptoir',
      icon: 'ShoppingCart',
      path: '/pharmacy/sales',
      component: () => import('@/modules/pharmacy/pages/POS')
    },
    {
      id: 'pharmacy-inventory',
      name: 'Stock & Lots',
      description: 'Médicaments & Lots',
      icon: 'Pill',
      path: '/pharmacy/inventory',
      component: () => import('@/modules/pharmacy/pages/Inventory')
    },
    {
      id: 'pharmacy-customers',
      name: 'Clients & Assurances',
      description: 'Conventions & Mutuelles',
      icon: 'Users',
      path: '/pharmacy/customers',
      component: () => import('@/modules/pharmacy/pages/Customers')
    },
    {
      id: 'pharmacy-credits',
      name: 'Ventes à Crédit',
      description: 'Échéanciers & Relances',
      icon: 'CreditCard',
      path: '/pharmacy/credits',
      component: () => import('@/modules/pharmacy/pages/Credits')
    },
    {
      id: 'pharmacy-prescriptions',
      name: 'Ordonnances',
      description: 'Scan & Saisie d\'ordonnances',
      icon: 'ClipboardList',
      path: '/pharmacy/prescriptions',
      component: () => import('@/modules/pharmacy/pages/Prescriptions')
    },
    {
      id: 'pharmacy-procurement',
      name: 'Approvisionnement',
      description: 'Commandes fournisseurs',
      icon: 'Truck',
      path: '/pharmacy/procurement',
      component: () => import('@/modules/pharmacy/pages/Procurement')
    },
    {
      id: 'pharmacy-caisse',
      name: 'Gestion de Caisse',
      description: 'Ouverture, fermeture & dépenses',
      icon: 'Receipt',
      path: '/pharmacy/caisse',
      component: () => import('@/modules/pharmacy/pages/Caisse')
    },
    {
      id: 'pharmacy-accounting',
      name: 'Comptabilité',
      description: 'Grand Livre & Balance OHADA',
      icon: 'Landmark',
      path: '/pharmacy/accounting',
      component: () => import('@/modules/pharmacy/pages/Accounting')
    },
    {
      id: 'pharmacy-documents',
      name: 'Gestion Documentaire',
      description: 'Devis & Factures',
      icon: 'FileText',
      path: '/pharmacy/documents',
      component: () => import('@/modules/pharmacy/pages/Documents')
    },
    {
      id: 'pharmacy-promotions',
      name: 'Promotions',
      description: 'Offres et réductions sur produits',
      icon: 'Tag',
      path: '/pharmacy/promotions',
      component: () => import('@/modules/pharmacy/pages/Promotions')
    },
    {
      id: 'pharmacy-returns',
      name: 'Retours & Avoirs',
      description: 'Gestion des retours produits',
      icon: 'RotateCcw',
      path: '/pharmacy/returns',
      component: () => import('@/modules/pharmacy/pages/Returns')
    },
    {
      id: 'pharmacy-transfers',
      name: 'Transferts',
      description: 'Mouvements inter-sites',
      icon: 'ArrowRightLeft',
      path: '/pharmacy/transfers',
      component: () => import('@/modules/pharmacy/pages/Transfers')
    },
    {
      id: 'pharmacy-physical-inv',
      name: 'Inventaires Physiques',
      description: 'Comptages et rapprochements de stock',
      icon: 'ClipboardCheck',
      path: '/pharmacy/physical-inventories',
      component: () => import('@/modules/pharmacy/pages/PhysicalInventories')
    },
    {
      id: 'pharmacy-reports',
      name: 'Rapports',
      description: 'Statistiques de ventes et stock',
      icon: 'BarChart2',
      path: '/pharmacy/reports',
      component: () => import('@/modules/pharmacy/pages/Reports')
    },
    {
      id: 'pharmacy-settings',
      name: 'Paramètres',
      description: 'Configuration de la pharmacie',
      icon: 'Settings',
      path: '/pharmacy/settings',
      component: () => import('@/modules/pharmacy/pages/Settings')
    },
    {
      id: 'pharmacy-expiry',
      name: 'Alertes Péremption',
      description: 'Surveillance des dates de péremption des lots',
      icon: 'AlertTriangle',
      path: '/pharmacy/expiry-alerts',
      component: () => import('@/modules/pharmacy/pages/ExpiryAlerts')
    },
    {
      id: 'pharmacy-eprescription',
      name: 'Ordonnance Électronique',
      description: 'Réception et dispensation dématérialisée',
      icon: 'ShieldCheck',
      path: '/pharmacy/e-prescription',
      component: () => import('@/modules/pharmacy/pages/ElectronicPrescription')
    },
    {
      id: 'pharmacy-narcotics',
      name: 'Registre Stupéfiants',
      description: 'Suivi réglementaire des produits classés',
      icon: 'ShieldAlert',
      path: '/pharmacy/narcotics',
      component: () => import('@/modules/pharmacy/pages/NarcoticsRegister')
    },
    {
      id: 'pharmacy-multi',
      name: 'Multi-Officines',
      description: 'Vue consolidée du réseau de pharmacies',
      icon: 'Globe',
      path: '/pharmacy/multi-pharmacy',
      component: () => import('@/modules/pharmacy/pages/MultiPharmacy')
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
    },
    {
      id: 'enterprise-hr',
      name: 'Ressources Humaines',
      description: 'Gestion RH spécifique Entreprise',
      icon: 'Users',
      path: '/enterprise/hr',
      component: () => import('@/modules/enterprise/pages/EnterpriseHR')
    },
    {
      id: 'enterprise-accounting',
      name: 'Comptabilité',
      description: 'Suivi comptable & OHADA',
      icon: 'Landmark',
      path: '/enterprise/accounting',
      component: () => import('@/modules/enterprise/pages/EnterpriseAccounting')
    },
    {
      id: 'enterprise-invoicing',
      name: 'Facturation & Devis',
      description: 'Gestion des factures clients et devis',
      icon: 'FileText',
      path: '/enterprise/invoicing',
      component: () => import('@/modules/enterprise/pages/EnterpriseInvoicing')
    },
    {
      id: 'enterprise-timetracking',
      name: 'Suivi du Temps',
      description: 'Feuilles de temps et chronométrage',
      icon: 'Clock',
      path: '/enterprise/time-tracking',
      component: () => import('@/modules/enterprise/pages/TimeTracking')
    },
    {
      id: 'enterprise-documents',
      name: 'Gestion Documentaire',
      description: 'Contrats, livrables et fichiers',
      icon: 'FolderOpen',
      path: '/enterprise/documents',
      component: () => import('@/modules/enterprise/pages/DocumentVault')
    },
    {
      id: 'enterprise-reports',
      name: 'Rapports & KPIs',
      description: 'Rentabilité et marges projets',
      icon: 'BarChart3',
      path: '/enterprise/reports',
      component: () => import('@/modules/enterprise/pages/EnterpriseReports')
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
