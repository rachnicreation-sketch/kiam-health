import {
  LayoutDashboard,
  Users,
  Stethoscope,
  BedDouble,
  FlaskConical,
  Pill,
  Receipt,
  UserCog,
  Calendar,
  Building2,
  Settings,
  LogOut,
  ServerCog,
  BarChart3,
  LineChart,
  ClipboardList,
  MessageSquare,
  Hotel,
  GraduationCap,
  Store,
  Briefcase,
  ShoppingCart,
  Warehouse,
  Truck,
  RotateCcw,
  BookOpen,
  UserCheck,
  Target,
  CheckSquare,
  FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Module } from "@/lib/permissions";
import { api } from "@/lib/api-service";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

interface SidebarItem {
  title: string;
  url: string;
  icon: any;
  module: Module; 
}

// ========================
// KIAM HEALTH (🏥)
// ========================
const healthMainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard, module: 'dashboard' },
  { title: "Patients", url: "/patients", icon: Users, module: 'patients' },
  { title: "Consultations", url: "/consultations", icon: Stethoscope, module: 'consultations' },
  { title: "Rendez-vous", url: "/appointments", icon: Calendar, module: 'appointments' },
  { title: "Hospitalisation", url: "/hospitalization", icon: BedDouble, module: 'hospitalization' },
  { title: "Rapports & Stats", url: "/reports", icon: LineChart, module: 'reports' },
  { title: "Messagerie", url: "/messages", icon: MessageSquare, module: 'dashboard' },
];

const healthServiceItems: SidebarItem[] = [
  { title: "Laboratoire", url: "/laboratory", icon: FlaskConical, module: 'laboratory' },
  { title: "Pharmacie", url: "/pharmacy", icon: Pill, module: 'pharmacy' },
  { title: "Facturation", url: "/billing", icon: Receipt, module: 'billing' },
  { title: "Comptabilité", url: "/accounting", icon: BarChart3, module: 'accounting' },
];

const healthAdminItems: SidebarItem[] = [
  { title: "Planning des gardes", url: "/planning", icon: Calendar, module: 'planning' },
  { title: "Ressources humaines", url: "/hr", icon: UserCog, module: 'hr' },
  { title: "Tarification & Actes", url: "/catalogs", icon: ClipboardList, module: 'catalogs' },
  { title: "Établissements", url: "/facilities", icon: Building2, module: 'facilities' },
  { title: "Paramètres", url: "/settings", icon: Settings, module: 'settings' },
];

// ========================
// KIAM HOTEL (🏨)
// ========================
const hotelMainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/hotel/dashboard", icon: LayoutDashboard, module: 'hotel' },
  { title: "Réservations", url: "/hotel/reservations", icon: Calendar, module: 'hotel' },
  { title: "Chambres", url: "/hotel/rooms", icon: BedDouble, module: 'hotel' },
  { title: "Clients", url: "/hotel/guests", icon: Users, module: 'hotel' },
  { title: "Facturation", url: "/hotel/billing", icon: Receipt, module: 'hotel' },
];

// ========================
// KIAM SCHOOL (🏫)
// ========================
const schoolMainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/school/dashboard", icon: LayoutDashboard, module: 'school' },
  { title: "Étudiants", url: "/school/students", icon: UserCheck, module: 'school' },
  { title: "Classes / Salles", url: "/school/classes", icon: Building2, module: 'school' },
  { title: "Résultats & Notes", url: "/school/grades", icon: ClipboardList, module: 'school' },
  { title: "Emploi du temps", url: "/school/schedule", icon: Calendar, module: 'school' },
  { title: "Scolarité (Paiements)", url: "/school/payments", icon: Receipt, module: 'school' },
];

// ========================
// KIAM ERP / SHOP (🏪)
// ========================
const erpMainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/erp/dashboard", icon: LayoutDashboard, module: 'erp' },
  { title: "Ventes / POS", url: "/erp/sales", icon: ShoppingCart, module: 'erp' },
  { title: "Stock Produits", url: "/erp/inventory", icon: Warehouse, module: 'erp' },
  { title: "Fournisseurs", url: "/erp/suppliers", icon: Truck, module: 'erp' },
  { title: "Facturation", url: "/erp/billing", icon: Receipt, module: 'erp' },
  { title: "Retours / SAV", url: "/erp/returns", icon: RotateCcw, module: 'erp' },
];

// ========================
// KIAM PHARMACY (💊)
// ========================
const pharmacyMainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/pharmacy/dashboard", icon: LayoutDashboard, module: 'pharmacy' },
  { title: "Ventes Comptoir", url: "/pharmacy/sales", icon: ShoppingCart, module: 'pharmacy' },
  { title: "Ordonnances", url: "/pharmacy/prescriptions", icon: ClipboardList, module: 'pharmacy' },
  { title: "Stock Médicaments", url: "/pharmacy/inventory", icon: Pill, module: 'pharmacy' },
  { title: "Clients Fidélité", url: "/pharmacy/customers", icon: Users, module: 'pharmacy' },
  { title: "Fermeture / Caisse", url: "/pharmacy/daily-report", icon: Receipt, module: 'pharmacy' },
];

// ========================
// KIAM ENTERPRISE / MANAGEMENT (🏢)
// ========================
const enterpriseMainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/enterprise/dashboard", icon: LayoutDashboard, module: 'enterprise' },
  { title: "Projets & Suivi", url: "/enterprise/projects", icon: Target, module: 'enterprise' },
  { title: "CRM Clients", url: "/enterprise/crm", icon: Users, module: 'enterprise' },
  { title: "Gestion des Tâches", url: "/enterprise/tasks", icon: CheckSquare, module: 'enterprise' },
  { title: "Finance & Frais", url: "/enterprise/finances", icon: BarChart3, module: 'enterprise' },
  { title: "Rapports & Docs", url: "/enterprise/reports", icon: FileText, module: 'enterprise' },
];

// ========================
// CORE SAAS ITEMS
// ========================
const saasItems: SidebarItem[] = [
  { title: "Cockpit Business", url: "/saas/dashboard", icon: LayoutDashboard, module: 'saas' },
  { title: "Clients & Locataires", url: "/saas/tenants", icon: Building2, module: 'saas' },
  { title: "Plans & Revenus", url: "/saas/billing", icon: Receipt, module: 'saas' },
  { title: "Modules Add-ons", url: "/saas/modules", icon: ServerCog, module: 'saas' },
  { title: "Communications", url: "/saas/marketing", icon: MessageSquare, module: 'saas' },
  { title: "Utilisateurs", url: "/saas/users", icon: Users, module: 'saas' },
  { title: "Paramètres", url: "/saas/settings", icon: Settings, module: 'saas' },
];

const saasInfoItems = [
  "Cockpit Business",
  "Gestion Clients",
  "Modules & Fonctionnalités",
  "Abonnements & Paiements",
  "Utilisateurs Plateforme",
  "Analytics & Reporting",
  "Communications",
  "Support Client",
  "Audit & Sécurité",
  "Performance Système",
  "Configuration",
  "IA Insights (Bêta)",
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, clinic, logout, can } = useAuth();
  const navigate = useNavigate();
  const [activeModules, setActiveModules] = useState<string[] | null>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const tenantId = clinic?.id || user?.clinicId;
    if (!tenantId) {
      setActiveModules(null);
      return;
    }

    api.saas.modules(tenantId)
      .then((data: any) => {
        if (Array.isArray(data)) {
          setActiveModules(data.map((module: any) => module.module_name || module.name || module.id));
        } else if (data.modules) {
          setActiveModules(data.modules.map((module: any) => module.module_name || module.name || module.id));
        } else {
          setActiveModules([]);
        }
      })
      .catch(() => {
        setActiveModules(null);
      });
  }, [clinic?.id, user?.clinicId]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  const activeModuleSet = new Set(activeModules ?? []);
  const isSectorEnabled = (sectorModule: string) =>
    activeModules === null ||
    activeModuleSet.has(sectorModule) ||
    (sectorModule === 'erp' && activeModuleSet.has('shop'));

  const itemBaseClasses = "flex items-center gap-3 px-3 py-3 rounded-2xl border border-transparent transition-colors text-slate-300 hover:border-slate-800 hover:bg-slate-900 hover:text-white";
  const renderItems = (items: SidebarItem[]) =>
    items
      .filter((item) => can(item.module))
      .map((item) => (
        <SidebarMenuItem key={item.title}>
          <NavLink
            to={item.url}
            end
            className={itemBaseClasses}
            activeClassName="bg-slate-900 text-white font-semibold"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuItem>
      ));

  // Determine current active sectors
  // If SaaS Admin, no sector menus except SaaS management
  // If normal user, show their sector + any other active modules (to be expanded)
  const isSaaSAdmin = user?.role === 'saas_admin';
  const currentSector = (user?.sector as any) || 'health';


  return (
    <Sidebar collapsible="icon" className="w-72 border-r border-slate-800 bg-slate-950 text-slate-100 shadow-xl">
      <SidebarHeader className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="font-bold text-lg text-white leading-none tracking-tight">
                {isSaaSAdmin ? "KIAM Master" : "KIAM SaaS"}
              </h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
                {isSaaSAdmin ? "Global Controller" : `${currentSector} Edition`}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* ========== SAAS ADMIN SECTION (ONLY FOR SUPER ADMINS) ========== */}
        {isSaaSAdmin && (
          <SidebarGroup className="animate-in slide-in-from-top-2 duration-300">
            <SidebarGroupLabel className="text-primary text-[10px] uppercase tracking-[0.2em] font-black pb-4">
              SUIVI GLOBAL
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(saasItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ========== CLIENT SECTIONS (HIDDEN FOR SUPER ADMIN) ========== */}
        {!isSaaSAdmin ? (
          <>
            {/* HEALTH SECTOR */}
            {currentSector === 'health' && (
              <div className="animate-in fade-in duration-500">
                <SidebarGroup>
                  <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                    Santé - Principal
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{renderItems(healthMainItems)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                  <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                    Services
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{renderItems(healthServiceItems)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                  <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                    Paramètres
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>{renderItems(healthAdminItems)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </div>
            )}

            {/* HOTEL SECTOR */}
            {currentSector === 'hotel' && isSectorEnabled('hotel') && (
              <SidebarGroup className="animate-in fade-in duration-500">
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                  Hôtellerie
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(hotelMainItems)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* SCHOOL SECTOR */}
            {currentSector === 'school' && isSectorEnabled('school') && (
              <SidebarGroup className="animate-in fade-in duration-500">
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                  Éducation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(schoolMainItems)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* ERP / SHOP SECTOR */}
            {(currentSector === 'shop' || currentSector === 'erp') && isSectorEnabled('erp') && (
              <SidebarGroup className="animate-in fade-in duration-500">
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                  Gestion / Commerce
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(erpMainItems)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* PHARMACY SECTOR */}
            {currentSector === 'pharmacy' && isSectorEnabled('pharmacy') && (
              <SidebarGroup className="animate-in fade-in duration-500">
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                  Officine
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(pharmacyMainItems)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* ENTERPRISE SECTOR */}
            {currentSector === 'enterprise' && isSectorEnabled('enterprise') && (
              <SidebarGroup className="animate-in fade-in duration-500">
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                  Entreprise
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(enterpriseMainItems)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        ) : null}

      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800 bg-slate-950/95">
        {isSaaSAdmin ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-3xl bg-slate-900/80 p-3 text-[11px] text-slate-300">
              {saasInfoItems.map((item) => (
                <div key={item} className="rounded-xl bg-slate-950/80 px-3 py-2 text-slate-300/90">{item}</div>
              ))}
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-3 text-[11px] leading-snug text-slate-400">
              "Le tenant 'Hôtel Palace' a augmenté son usage de 40% ce mois. Suggérer le plan Enterprise."
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Déconnexion"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Déconnexion"}
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
