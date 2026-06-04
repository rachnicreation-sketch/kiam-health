import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { Sun, Moon, MessageSquare, LogOut, Grid, ChevronDown, Menu, Zap, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Module } from "@/lib/permissions";
import { getTheme } from "@/lib/tenant-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavigationItem {
  title: string;
  url: string;
  module?: Module;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const healthMenus: NavigationGroup[] = [
  {
    label: "Soins & Patients",
    items: [
      { title: "Tableau de bord", url: "/dashboard", module: "dashboard" },
      { title: "Patients", url: "/patients", module: "patients" },
      { title: "Consultations", url: "/consultations", module: "consultations" },
      { title: "Rendez-vous", url: "/appointments", module: "appointments" },
      { title: "Hospitalisation", url: "/hospitalization", module: "hospitalization" },
    ]
  },
  {
    label: "Services Cliniques",
    items: [
      { title: "Laboratoire", url: "/laboratory", module: "laboratory" },
      { title: "Pharmacie", url: "/pharmacy", module: "pharmacy" },
      { title: "Facturation", url: "/billing", module: "billing" },
      { title: "Comptabilité", url: "/accounting", module: "accounting" },
    ]
  },
  {
    label: "Configuration & RH",
    items: [
      { title: "Planning des gardes", url: "/planning", module: "planning" },
      { title: "Ressources Humaines", url: "/hr", module: "hr" },
      { title: "Tarification & Actes", url: "/catalogs", module: "catalogs" },
      { title: "Établissements", url: "/facilities", module: "facilities" },
      { title: "Paramètres", url: "/settings", module: "settings" },
    ]
  }
];

const erpMenus: NavigationGroup[] = [
  {
    label: "🏠 Accueil ERP",
    items: [
      { title: "Tous les modules", url: "/erp", module: "erp" },
      { title: "Tableau de bord ERP", url: "/erp/dashboard", module: "erp" },
    ]
  },
  {
    label: "Ventes & Caisse",
    items: [
      { title: "Caisse Express (POS)", url: "/erp/pos", module: "erp" },
      { title: "Documents Commerciaux", url: "/erp/commercial-docs", module: "erp" },
      { title: "Clôture de Caisse", url: "/erp/closing", module: "erp" },
    ]
  },
  {
    label: "Stock & Inventaire",
    items: [
      { title: "Gestion des Stocks", url: "/erp/inventory", module: "erp" },
      { title: "Inventaires Physiques", url: "/erp/physical-inventories", module: "erp" },
    ]
  },
  {
    label: "Approvisionnement",
    items: [
      { title: "Dashboard Achat", url: "/erp/procurement", module: "erp" },
      { title: "Demandes d'Achat", url: "/erp/purchase-requests", module: "erp" },
      { title: "Bons de Commande", url: "/erp/purchase-orders", module: "erp" },
      { title: "Réceptions Livraisons", url: "/erp/goods-receipts", module: "erp" },
    ]
  },
  {
    label: "Fournisseurs & Finance",
    items: [
      { title: "Annuaire Fournisseurs", url: "/erp/suppliers", module: "erp" },
      { title: "Factures Fournisseurs", url: "/erp/supplier-invoices", module: "erp" },
      { title: "Paiements Fournisseurs", url: "/erp/supplier-payments", module: "erp" },
      { title: "Comptabilité OHADA", url: "/erp/accounting", module: "erp" },
    ]
  },
  {
    label: "CRM & Analyse",
    items: [
      { title: "Gestion Clients", url: "/erp/customers", module: "erp" },
      { title: "Suivi Dépenses", url: "/erp/expenses", module: "erp" },
      { title: "Rapports & Bilans", url: "/erp/reports", module: "erp" },
      { title: "Journal des Transactions", url: "/erp/transactions", module: "erp" },
    ]
  },
  {
    label: "👥 Ressources Humaines",
    items: [
      { title: "Gestion du Personnel", url: "/erp/hr", module: "erp_hr" },
      { title: "Bulletins de Paie", url: "/erp/hr", module: "erp_hr" },
      { title: "CNSS & Déclarations", url: "/erp/hr", module: "erp_hr" },
    ]
  }
];


const hotelMenus: NavigationGroup[] = [
  {
    label: "Opérations",
    items: [
      { title: "Tableau de bord", url: "/hotel/dashboard", module: "hotel" },
      { title: "Plan des Chambres", url: "/hotel/rooms", module: "hotel" },
      { title: "Réservations & Séjours", url: "/hotel/bookings", module: "hotel" },
    ]
  },
  {
    label: "Clients & Facturation",
    items: [
      { title: "Registre Clients", url: "/hotel/guests", module: "hotel" },
      { title: "Facturation", url: "/hotel/billing", module: "hotel" },
    ]
  }
];

const pharmacyMenus: NavigationGroup[] = [
  {
    label: "Ventes & Ordonnances",
    items: [
      { title: "Tableau de bord", url: "/pharmacy/dashboard", module: "pharmacy" },
      { title: "Ventes Comptoir", url: "/pharmacy/sales", module: "pharmacy" },
      { title: "Ordonnances", url: "/pharmacy/prescriptions", module: "pharmacy" },
    ]
  },
  {
    label: "Stocks & Fermeture",
    items: [
      { title: "Stock Médicaments", url: "/pharmacy/inventory", module: "pharmacy" },
      { title: "Clients Fidélité", url: "/pharmacy/customers", module: "pharmacy" },
      { title: "Fermeture / Caisse", url: "/pharmacy/daily-report", module: "pharmacy" },
    ]
  }
];

const enterpriseMenus: NavigationGroup[] = [
  {
    label: "Projets & CRM",
    items: [
      { title: "Tableau de bord", url: "/enterprise/dashboard", module: "enterprise" },
      { title: "Projets & Suivi", url: "/enterprise/projects", module: "enterprise" },
      { title: "CRM Clients", url: "/enterprise/crm", module: "enterprise" },
      { title: "Gestion des Tâches", url: "/enterprise/tasks", module: "enterprise" },
    ]
  },
  {
    label: "Finances & Rapports",
    items: [
      { title: "Finance & Frais", url: "/enterprise/finances", module: "enterprise" },
      { title: "Rapports & Docs", url: "/enterprise/reports", module: "enterprise" },
    ]
  }
];

const saasMenus: NavigationGroup[] = [
  {
    label: "Cockpit",
    items: [
      { title: "Cockpit Business", url: "/saas/dashboard", module: "saas" },
      { title: "Clients & Locataires", url: "/saas/tenants", module: "saas" },
      { title: "Plans & Revenus", url: "/saas/billing", module: "saas" },
    ]
  },
  {
    label: "Extensions & Support",
    items: [
      { title: "Modules Add-ons", url: "/saas/modules", module: "saas" },
      { title: "Communications", url: "/saas/marketing", module: "saas" },
      { title: "Support Client", url: "/saas/support", module: "saas" },
    ]
  },
  {
    label: "Contrôle & Sécurité",
    items: [
      { title: "Audit & Sécurité", url: "/saas/security", module: "saas" },
      { title: "Santé Système", url: "/saas/health", module: "saas" },
      { title: "IA Insights", url: "/saas/ai", module: "saas" },
      { title: "Utilisateurs Master", url: "/saas/users", module: "saas" },
      { title: "Paramètres SaaS", url: "/saas/settings", module: "saas" },
    ]
  }
];

const getSchoolMenus = (role: string): NavigationGroup[] => {
  if (role === 'school_direction') {
    return [
      {
        label: "Direction",
        items: [
          { title: "Dashboard Stratégique", url: "/school/dashboard" },
          { title: "Statistiques Globales", url: "/school/reports" },
          { title: "Bulletins Consolidés", url: "/school/bulletins" },
          { title: "Gestion Financière", url: "/school/payments" },
          { title: "Paramètres Ecole", url: "/school/settings" },
        ]
      }
    ];
  }
  if (role === 'school_admin') {
    return [
      {
        label: "Administration",
        items: [
          { title: "Tableau de bord", url: "/school/dashboard" },
          { title: "Registre Élèves", url: "/school/students" },
          { title: "Classes & Salles", url: "/school/classes" },
          { title: "Planning & Emploi du temps", url: "/school/schedule" },
          { title: "Personnel Enseignant", url: "/school/teachers" },
          { title: "Ressources Humaines", url: "/school/hr" },
        ]
      }
    ];
  }
  if (role === 'school_finance') {
    return [
      {
        label: "Finances",
        items: [
          { title: "Suivi Paiements", url: "/school/payments" },
          { title: "Facturation Scolarité", url: "/school/billing" },
          { title: "Caisse & Dépenses", url: "/school/accounting" },
        ]
      }
    ];
  }
  if (role === 'school_scolarite') {
    return [
      {
        label: "Scolarité",
        items: [
          { title: "Bulletins de Notes", url: "/school/bulletins" },
          { title: "Saisie des Evaluations", url: "/school/grades" },
          { title: "Registre de Présences", url: "/school/attendance" },
          { title: "Emploi du temps", url: "/school/schedule" },
        ]
      }
    ];
  }
  if (role === 'school_teacher') {
    return [
      {
        label: "Enseignant",
        items: [
          { title: "Mes Classes", url: "/school/classes" },
          { title: "Saisie des Notes", url: "/school/grades" },
          { title: "Appel / Présences", url: "/school/attendance" },
          { title: "Mon Emploi du temps", url: "/school/schedule" },
          { title: "Supports de cours", url: "/school/learning" },
        ]
      }
    ];
  }
  return [];
};

const appsInfo: Record<string, { title: string; color: string }> = {
  health: { title: "Santé & Clinique", color: "text-teal-500" },
  erp: { title: "Boutique & ERP", color: "text-purple-500" },
  school: { title: "École & Scolarité", color: "text-sky-500" },
  hotel: { title: "Hôtellerie", color: "text-amber-500" },
  pharmacy: { title: "Pharmacie & Officine", color: "text-rose-500" },
  enterprise: { title: "Projets & CRM", color: "text-cyan-500" },
  saas: { title: "Cockpit Master", color: "text-slate-400" },
  hr: { title: "Ressources Humaines", color: "text-pink-500" },
  subscription: { title: "Mon Abonnement", color: "text-indigo-500" },
  logs: { title: "Journal d'Audit", color: "text-emerald-500" }
};

export function AppLayout() {
  const { user, clinic, logout, isPresentationMode, stopImpersonation, can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('kiam_theme') as 'light' | 'dark') || 'light'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Thème visuel du tenant courant
  const sectorTheme = getTheme(user?.sector);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('kiam_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleExitDemo = () => {
    stopImpersonation();
    navigate('/saas/dashboard');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "AD";
    return name.substring(0, 2).toUpperCase();
  };

  const activeModule = (() => {
    const path = location.pathname;
    if (path === '/apps') return 'apps';
    if (path.startsWith('/school')) return 'school';
    if (path.startsWith('/erp')) return 'erp';
    if (path.startsWith('/hotel')) return 'hotel';
    if (path.startsWith('/enterprise')) return 'enterprise';
    if (path.startsWith('/saas')) return 'saas';
    if (
      path.startsWith('/pharmacy/dashboard') ||
      path.startsWith('/pharmacy/sales') ||
      path.startsWith('/pharmacy/prescriptions') ||
      path.startsWith('/pharmacy/inventory') ||
      path.startsWith('/pharmacy/customers') ||
      path.startsWith('/pharmacy/daily-report')
    ) {
      return 'pharmacy';
    }
    if (path.startsWith('/subscription')) return 'subscription';
    if (path.startsWith('/logs')) return 'logs';
    if (user?.role === 'saas_admin') return 'saas';
    return user?.sector || 'health';
  })();

  // If on apps selection page, render without header/wrapper
  if (activeModule === 'apps') {
    return (
      <div className="min-h-screen bg-slate-900">
        <Outlet />
      </div>
    );
  }

  // Get menus for current module
  const currentMenus: NavigationGroup[] = (() => {
    if (activeModule === 'school' || (['subscription', 'logs'].includes(activeModule) && user?.sector === 'school')) {
      return getSchoolMenus(user?.role || '');
    }
    if (activeModule === 'erp' || (['subscription', 'logs'].includes(activeModule) && (user?.sector === 'erp' || user?.sector === 'shop'))) return erpMenus;
    if (activeModule === 'hotel' || (['subscription', 'logs'].includes(activeModule) && user?.sector === 'hotel')) return hotelMenus;
    if (activeModule === 'pharmacy' || (['subscription', 'logs'].includes(activeModule) && user?.sector === 'pharmacy')) return pharmacyMenus;
    if (activeModule === 'enterprise' || (['subscription', 'logs'].includes(activeModule) && user?.sector === 'enterprise')) return enterpriseMenus;
    if (activeModule === 'saas' || (['subscription', 'logs'].includes(activeModule) && user?.role === 'saas_admin')) return saasMenus;
    if (activeModule === 'health') return healthMenus;
    
    // Dynamic sector fallback
    const sec = user?.sector || 'health';
    if (sec === 'school') return getSchoolMenus(user?.role || '');
    if (sec === 'erp' || sec === 'shop') return erpMenus;
    if (sec === 'hotel') return hotelMenus;
    if (sec === 'pharmacy') return pharmacyMenus;
    if (sec === 'enterprise') return enterpriseMenus;
    return healthMenus;
  })();

  // Filter menus based on user capabilities
  const filteredMenus = currentMenus.map(group => ({
    ...group,
    items: group.items.filter(item => !item.module || can(item.module))
  })).filter(group => group.items.length > 0);

  const appMeta = appsInfo[activeModule] || { title: "Kiam Platform", color: "text-primary" };

  const BannerPortal = isPresentationMode ? createPortal(
    <div className="fixed top-0 left-0 right-0 h-9 bg-amber-600 text-white flex items-center justify-between px-4 shadow-lg z-[9999] animate-in slide-in-from-top duration-300">
      <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em]">
        Mode Présentation — Données fictives (Sécurité Active)
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExitDemo}
        className="h-6 text-[9px] bg-white/10 hover:bg-white text-white hover:text-amber-700 border-white/20 font-black px-3 rounded-full transition-all"
      >
        QUITTER LE MODE DEMO
      </Button>
    </div>,
    document.body
  ) : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 notranslate selection:bg-primary/20">
      {BannerPortal}
      
      {/* Redesigned Unified Kiam Header — Thème dynamique par secteur */}
      <header
        className={`h-14 flex items-center justify-between border-b-2 text-slate-200 px-4 shrink-0 z-40 sticky top-0 ${isPresentationMode ? 'mt-9' : 'mt-0'} shadow-md`}
        style={{
          background: sectorTheme.headerBg,
          borderBottomColor: sectorTheme.headerBorder,
        }}
      >
        <div className="flex items-center gap-3 w-full max-w-5xl">
          {/* App Switcher Home Button with Kiam Logo */}
          <Link
            to="/apps"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Lanceur d'applications"
          >
            <img src="/kiam/public/images/logo-kiam.png" alt="KIAM Logo" className="h-7 w-7 object-contain bg-white rounded-md p-0.5" onError={(e) => {
              // fallback if public prefix not matching routing
              (e.target as HTMLImageElement).src = "/images/logo-kiam.png";
            }} />
          </Link>

          <div className="h-5 w-[1px] bg-white/15 mx-1" />

          {/* Active App Title */}
          <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 shrink-0">
            KIAM{" "}
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase"
              style={{ background: sectorTheme.badgeBg, color: sectorTheme.badgeText }}
            >
              {sectorTheme.emoji} {appMeta.title}
            </span>
          </span>

          <div className="h-5 w-[1px] bg-white/15 mx-1 hidden lg:block" />

          {/* Large Screen Dropdown Menus */}
          <nav className="hidden lg:flex items-center gap-1">
            {filteredMenus.map((group, gIdx) => (
              <DropdownMenu key={gIdx}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-[13px] font-semibold flex items-center gap-1.5 focus-visible:ring-0"
                  >
                    {group.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 mt-1.5 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl p-1 bg-white dark:bg-slate-950">
                  {group.items.map((item, iIdx) => (
                    <DropdownMenuItem
                      key={iIdx}
                      asChild
                      className="rounded-lg text-[13px] font-medium py-2 px-3 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white transition-colors cursor-pointer"
                    >
                      <Link to={item.url}>{item.title}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </nav>
        </div>

        {/* Global Controls & User profile */}
        <div className="flex items-center gap-3">
          {activeModule === 'saas' && (
            <div className="hidden xl:flex items-center gap-4 text-xs text-sky-100 font-medium mr-2">
              <span>Status: <strong className="text-emerald-400">ONLINE</strong></span>
              <span>Refresh: {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
            </div>
          )}

          <div className="hidden md:block w-48 mr-2">
            <GlobalSearch />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hover:bg-white/5 text-slate-300 hover:text-white rounded-lg"
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/messages')}
            className="h-9 w-9 hover:bg-white/5 text-slate-300 hover:text-white rounded-lg"
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </Button>

          <NotificationBell />

          <div className="h-5 w-[1px] bg-white/15 mx-1" />

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg transition-colors focus:outline-none">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-indigo-600/20">
                  {getInitials(user?.name)}
                </div>
                <span className="text-xs font-semibold text-white hidden sm:block">
                  {user?.name?.split(' ')[0] || "Admin"}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl p-1 bg-white dark:bg-slate-950">
              <div className="px-3 py-2 text-xs border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-slate-400 font-medium overflow-hidden text-ellipsis">{user?.email}</p>
                <p className="text-indigo-500 font-bold uppercase tracking-wider text-[9px] mt-1">
                  {clinic?.name || "Kiam SaaS"}
                </p>
              </div>
              <DropdownMenuItem asChild className="rounded-lg text-[13px] font-medium py-2 px-3 mt-1 cursor-pointer">
                <Link to="/subscription">Mon Abonnement</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg text-[13px] font-medium py-2 px-3 cursor-pointer">
                <Link to="/settings">Paramètres</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="rounded-lg text-[13px] font-medium py-2 px-3 text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4 shrink-0" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Burger Menu for Mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-white/5 text-slate-300 hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r-slate-200 dark:border-r-slate-800 bg-slate-950 text-white">
              <SheetHeader className="h-16 px-6 border-b border-white/5 flex items-center justify-between flex-row">
                <SheetTitle className="text-white font-black text-lg tracking-tight">
                  KIAM <span className="text-indigo-400 font-medium">SaaS</span>
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
                {/* Back to switcher link */}
                <Link
                  to="/apps"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm"
                >
                  <Grid className="h-4.5 w-4.5" />
                  Lanceur d'applications
                </Link>

                <div className="space-y-4">
                  {filteredMenus.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((item, iIdx) => (
                          <Link
                            key={iIdx}
                            to={item.url}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-semibold"
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Page Content */}
      <main className={`flex-1 overflow-auto bg-slate-50 dark:bg-slate-900`}>
        <div className={`${activeModule === 'erp' || activeModule === 'saas' ? 'p-6' : 'p-6'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

