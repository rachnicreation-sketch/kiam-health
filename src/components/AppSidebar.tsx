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
  FileText,
  ClipboardCheck,
  PlayCircle,
  Zap,
  Box,
  History,
  Shield,
  ShieldAlert,
  Activity,
  Award,
  CreditCard,
  Wallet,
  TrendingDown
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
  { title: "Tableau de bord", url: "/hotel", icon: LayoutDashboard, module: 'hotel' },
  { title: "Plan des Chambres", url: "/hotel/rooms", icon: BedDouble, module: 'hotel' },
  { title: "Réservations & Séjours", url: "/hotel/bookings", icon: Calendar, module: 'hotel' },
  { title: "Clients", url: "/hotel/guests", icon: Users, module: 'hotel' },
  { title: "Facturation", url: "/hotel/billing", icon: Receipt, module: 'hotel' },
];

// ========================
// KIAM SCHOOL (🏫)
// ========================
const schoolDirectionItems: SidebarItem[] = [
  { title: "Dashboard Stratégique", url: "/school/dashboard", icon: LayoutDashboard, module: 'school' },
  { title: "Statistiques Globales", url: "/school/reports", icon: LineChart, module: 'school' },
  { title: "Bulletins Consolidés", url: "/school/bulletins", icon: FileText, module: 'school' },
  { title: "Gestion Financière", url: "/school/payments", icon: Receipt, module: 'school' },
  { title: "Paramètres Ecole", url: "/school/settings", icon: Settings, module: 'school' },
];

const schoolAdminItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/school/dashboard", icon: LayoutDashboard, module: 'school' },
  { title: "Registre Élèves", url: "/school/students", icon: UserCheck, module: 'school' },
  { title: "Classes & Salles", url: "/school/classes", icon: Building2, module: 'school' },
  { title: "Planning & Emploi du temps", url: "/school/schedule", icon: Calendar, module: 'school' },
  { title: "Personnel Enseignant", url: "/school/teachers", icon: UserCog, module: 'school' },
];

const schoolFinanceItems: SidebarItem[] = [
  { title: "Suivi Paiements", url: "/school/payments", icon: Receipt, module: 'school' },
  { title: "Facturation Scolarité", url: "/school/billing", icon: FileText, module: 'school' },
  { title: "Caisse & Dépenses", url: "/school/accounting", icon: BarChart3, module: 'school' },
];

const schoolScolariteItems: SidebarItem[] = [
  { title: "Bulletins de Notes", url: "/school/bulletins", icon: FileText, module: 'school' },
  { title: "Saisie des Evaluations", url: "/school/grades", icon: ClipboardList, module: 'school' },
  { title: "Registre de Présences", url: "/school/attendance", icon: ClipboardCheck, module: 'school' },
  { title: "Emploi du temps", url: "/school/schedule", icon: Calendar, module: 'school' },
];

const schoolTeacherItems: SidebarItem[] = [
  { title: "Mes Classes", url: "/school/classes", icon: Building2, module: 'school' },
  { title: "Saisie des Notes", url: "/school/grades", icon: Award, module: 'school' },
  { title: "Appel / Présences", url: "/school/attendance", icon: ClipboardCheck, module: 'school' },
  { title: "Mon Emploi du temps", url: "/school/schedule", icon: Calendar, module: 'school' },
  { title: "Supports de cours", url: "/school/learning", icon: PlayCircle, module: 'school' },
];

// ========================
// KIAM ERP / SHOP (🏪)
// ========================
const erpMainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/erp/dashboard", icon: LayoutDashboard, module: 'erp' },
  { title: "Point de Vente (POS)", url: "/erp/pos", icon: ShoppingCart, module: 'erp' },
  { title: "Gestion des Stocks", url: "/erp/inventory", icon: Box, module: 'erp' },
  { title: "Journal des Ventes", url: "/erp/transactions", icon: History, module: 'erp' },
  { title: "Clients & Fidélité", url: "/erp/customers", icon: Users, module: 'erp' },
  { title: "Fournisseurs", url: "/erp/suppliers", icon: Truck, module: 'erp' },
  { title: "Dépenses & Charges", url: "/erp/expenses", icon: TrendingDown, module: 'erp' },
  { title: "Analyse & Rapports", url: "/erp/reports", icon: BarChart3, module: 'erp' },
  { title: "Clôture de Caisse", url: "/erp/closing", icon: Lock, module: 'erp' },
  { title: "Paramètres", url: "/erp/settings", icon: Settings, module: 'erp' },
  { title: "Facturation", url: "/erp/billing", icon: Receipt, module: 'erp' },
  { title: "Retours / SAV", url: "/erp/returns", icon: RotateCcw, module: 'erp' },
  { title: "Paramètres ERP", url: "/erp/settings", icon: Settings, module: 'erp' },
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
  { title: "Support Client", url: "/saas/support", icon: ShieldAlert, module: 'saas' },
  { title: "Audit & Sécurité", url: "/saas/security", icon: Shield, module: 'saas' },
  { title: "Santé Système", url: "/saas/health", icon: Activity, module: 'saas' },
  { title: "IA Insights", url: "/saas/ai", icon: Zap, module: 'saas' },
  { title: "Utilisateurs", url: "/saas/users", icon: Users, module: 'saas' },
  { title: "Paramètres", url: "/saas/settings", icon: Settings, module: 'saas' },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        if (data && Array.isArray(data)) {
          setActiveModules(data.map((module: any) => module.module_name || module.name || module.id));
        } else if (data && data.modules && Array.isArray(data.modules)) {
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

  const itemBaseClasses = "group flex items-center gap-3 px-3 py-2.5 mx-1 mb-1 rounded-xl border border-transparent transition-all duration-300 ease-out text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-1";
  const renderItems = (items: SidebarItem[]) =>
    items
      .filter((item) => can(item.module))
      .map((item) => (
        <SidebarMenuItem key={item.title}>
          <NavLink
            to={item.url}
            end
            className={itemBaseClasses}
            activeClassName="bg-gradient-to-r from-sky-500/20 to-transparent text-sky-400 font-bold border-l-2 border-l-sky-500 !translate-x-0"
          >
            <item.icon className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
            {!collapsed && <span className="tracking-wide text-[13px]">{item.title}</span>}
          </NavLink>
        </SidebarMenuItem>
      ));

  // Determine current active sectors
  // If SaaS Admin, no sector menus except SaaS management
  // If normal user, show their sector + any other active modules (to be expanded)
  const isSaaSAdmin = user?.role === 'saas_admin';
  const currentSector = (user?.sector as any) || 'health';

  return (
    <Sidebar className="notranslate border-r-0 shadow-2xl" {...props}>
      <SidebarHeader className="h-16 border-b flex items-center px-6 bg-slate-950 notranslate">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-black text-lg">K</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-black text-white tracking-tight">Kiam</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {isSaaSAdmin ? "Global Controller" : `${currentSector} Edition`}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 bg-slate-950 notranslate">
        {/* ========== SAAS ADMIN SECTION (ONLY FOR SUPER ADMINS) ========== */}
        {isSaaSAdmin && (
          <SidebarGroup className="notranslate">
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
          <div className="notranslate">
            {/* HEALTH SECTOR */}
            {currentSector === 'health' && (
              <>
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
              </>
            )}

            {/* HOTEL SECTOR */}
            {currentSector === 'hotel' && isSectorEnabled('hotel') && (
              <SidebarGroup>
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
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                  Éducation — {user?.role === 'school_direction' ? 'Direction' : user?.role === 'school_admin' ? 'Administration' : user?.role === 'school_finance' ? 'Finance' : user?.role === 'school_scolarite' ? 'Scolarité' : 'Enseignant'}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {renderItems(
                      user?.role === 'school_direction' ? schoolDirectionItems :
                      user?.role === 'school_admin' ? schoolAdminItems :
                      user?.role === 'school_finance' ? schoolFinanceItems :
                      user?.role === 'school_scolarite' ? schoolScolariteItems :
                      user?.role === 'school_teacher' ? schoolTeacherItems :
                      schoolAdminItems // fallback
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* ERP / SHOP SECTOR */}
            {(currentSector === 'shop' || currentSector === 'erp') && isSectorEnabled('erp') && (
              <SidebarGroup>
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
              <SidebarGroup>
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
              <SidebarGroup>
                <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-wider font-bold">
                  Entreprise
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(enterpriseMainItems)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>
        ) : null}

      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800 bg-slate-950 notranslate">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Déconnexion"}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
