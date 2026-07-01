/**
 * tenant-themes.ts
 * Palettes de couleurs et identité visuelle par secteur KIAM.
 * Chaque tenant doit être visuellement identifiable au premier coup d'œil.
 */

export interface TenantTheme {
  /** Nom affiché dans le header */
  label: string;
  /** Emoji/icône du secteur */
  emoji: string;
  /** Couleur primaire (hex) — utilisée pour accents, boutons */
  primary: string;
  /** Couleur secondaire (hex) */
  secondary: string;
  /** Couleur du header (CSS gradient ou couleur solide) */
  headerBg: string;
  /** Couleur de la bordure basse du header */
  headerBorder: string;
  /** Couleur du texte du badge secteur dans le header */
  badgeBg: string;
  badgeText: string;
  /** Couleur de la sidebar */
  sidebarBg: string;
  /** Couleur du texte actif dans la sidebar */
  sidebarActiveText: string;
  /** Classe CSS gradient pour les titres de pages */
  gradientClass: string;
  /** Couleur utilisée pour les KPI cards */
  kpiAccent: string;
}

export const TENANT_THEMES: Record<string, TenantTheme> = {
  health: {
    label: "Santé & Clinique",
    emoji: "🏥",
    primary: "#0d9488",        // teal-600
    secondary: "#0891b2",      // cyan-600
    headerBg: "linear-gradient(135deg, #0f4c5c 0%, #0d6b6e 50%, #0d9488 100%)",
    headerBorder: "#14b8a6",   // teal-400
    badgeBg: "#14b8a6",
    badgeText: "#003333",
    sidebarBg: "#0a2e30",
    sidebarActiveText: "#5eead4",
    gradientClass: "from-teal-600 to-cyan-500",
    kpiAccent: "#0d9488",
  },
  erp: {
    label: "Commerce & ERP",
    emoji: "🏪",
    primary: "#059669",        // emerald-600
    secondary: "#0d9488",      // teal-600
    headerBg: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    headerBorder: "#10b981",   // emerald-400
    badgeBg: "#10b981",
    badgeText: "#022c22",
    sidebarBg: "#022c22",
    sidebarActiveText: "#6ee7b7",
    gradientClass: "from-emerald-600 to-teal-500",
    kpiAccent: "#059669",
  },
  shop: {
    label: "Commerce & ERP",
    emoji: "🏪",
    primary: "#059669",
    secondary: "#0d9488",
    headerBg: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    headerBorder: "#10b981",
    badgeBg: "#10b981",
    badgeText: "#022c22",
    sidebarBg: "#022c22",
    sidebarActiveText: "#6ee7b7",
    gradientClass: "from-emerald-600 to-teal-500",
    kpiAccent: "#059669",
  },
  school: {
    label: "École & Scolarité",
    emoji: "🏫",
    primary: "#0284c7",        // sky-600
    secondary: "#4f46e5",      // indigo-600
    headerBg: "linear-gradient(135deg, #0c1a4e 0%, #1e3a8a 50%, #1d4ed8 100%)",
    headerBorder: "#3b82f6",   // blue-500
    badgeBg: "#3b82f6",
    badgeText: "#eff6ff",
    sidebarBg: "#0c1a4e",
    sidebarActiveText: "#93c5fd",
    gradientClass: "from-sky-600 to-blue-500",
    kpiAccent: "#0284c7",
  },
  hotel: {
    label: "Hôtellerie",
    emoji: "🏨",
    primary: "#d97706",        // amber-600
    secondary: "#b45309",      // amber-700
    headerBg: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)",
    headerBorder: "#f59e0b",   // amber-400
    badgeBg: "#f59e0b",
    badgeText: "#451a03",
    sidebarBg: "#1c0a00",
    sidebarActiveText: "#fcd34d",
    gradientClass: "from-amber-600 to-yellow-500",
    kpiAccent: "#d97706",
  },
  pharmacy: {
    label: "Pharmacie & Officine",
    emoji: "💊",
    primary: "#e11d48",        // rose-600
    secondary: "#9333ea",      // purple-600
    headerBg: "linear-gradient(135deg, #4a0519 0%, #881337 50%, #be123c 100%)",
    headerBorder: "#fb7185",   // rose-400
    badgeBg: "#fb7185",
    badgeText: "#fff1f2",
    sidebarBg: "#1f0010",
    sidebarActiveText: "#fda4af",
    gradientClass: "from-rose-600 to-pink-500",
    kpiAccent: "#e11d48",
  },
  enterprise: {
    label: "Projets & CRM",
    emoji: "🏢",
    primary: "#4f46e5",        // indigo-600
    secondary: "#7c3aed",      // violet-600
    headerBg: "linear-gradient(135deg, #1e0c4e 0%, #2e1065 50%, #4c1d95 100%)",
    headerBorder: "#818cf8",   // indigo-400
    badgeBg: "#818cf8",
    badgeText: "#1e1b4b",
    sidebarBg: "#0e0628",
    sidebarActiveText: "#a5b4fc",
    gradientClass: "from-indigo-600 to-violet-500",
    kpiAccent: "#4f46e5",
  },
  saas: {
    label: "Cockpit Master",
    emoji: "⚡",
    primary: "#475569",        // slate-600
    secondary: "#0284c7",      // sky-600
    headerBg: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)",
    headerBorder: "#38bdf8",   // sky-400
    badgeBg: "#38bdf8",
    badgeText: "#0c1a2e",
    sidebarBg: "#020617",
    sidebarActiveText: "#7dd3fc",
    gradientClass: "from-slate-600 to-sky-500",
    kpiAccent: "#0284c7",
  },
};

/**
 * Retourne le thème du secteur courant (avec fallback sur health).
 */
export function getTheme(sector: string | undefined | null): TenantTheme {
  return TENANT_THEMES[sector ?? 'health'] ?? TENANT_THEMES['health'];
}

/**
 * Modules autorisés par secteur — source de vérité pour le cloisonnement frontend.
 * Un module listé ici est EXCLU des autres secteurs.
 */
export const SECTOR_EXCLUSIVE_MODULES: Record<string, string[]> = {
  health: [
    'dashboard', 'patients', 'consultations', 'appointments',
    'hospitalization', 'laboratory', 'planning', 'catalogs', 'facilities',
  ],
  erp: [
    'erp',
  ],
  shop: [
    'erp',
  ],
  school: [
    'school',
  ],
  hotel: [
    'hotel',
  ],
  pharmacy: [
    'pharmacy',
  ],
  enterprise: [
    'enterprise',
  ],
};

/**
 * Modules communs accessibles à tous les secteurs (si permission de rôle).
 */
export const COMMON_MODULES = ['hr', 'billing', 'accounting', 'reports', 'settings', 'saas'];

/**
 * Vérifie si un module est autorisé pour un secteur donné.
 */
export function isModuleAllowedForSector(module: string, sector: string): boolean {
  // Modules communs → toujours autorisés
  if (COMMON_MODULES.includes(module)) return true;

  // Modules exclusifs du secteur courant → autorisés
  const ownModules = SECTOR_EXCLUSIVE_MODULES[sector] ?? [];
  if (ownModules.includes(module)) return true;

  // Modules exclusifs d'un autre secteur → BLOQUÉS
  for (const [sec, mods] of Object.entries(SECTOR_EXCLUSIVE_MODULES)) {
    if (sec !== sector && mods.includes(module)) return false;
  }

  return true;
}
