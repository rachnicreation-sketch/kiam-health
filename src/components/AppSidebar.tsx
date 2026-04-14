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
  ClipboardList
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Module } from "@/lib/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
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

const mainItems: SidebarItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard, module: 'dashboard' },
  { title: "Patients", url: "/patients", icon: Users, module: 'patients' },
  { title: "Consultations", url: "/consultations", icon: Stethoscope, module: 'consultations' },
  { title: "Rendez-vous", url: "/appointments", icon: Calendar, module: 'appointments' },
  { title: "Hospitalisation", url: "/hospitalization", icon: BedDouble, module: 'hospitalization' },
  { title: "Rapports & Stats", url: "/reports", icon: LineChart, module: 'reports' },
];

const serviceItems: SidebarItem[] = [
  { title: "Laboratoire", url: "/laboratory", icon: FlaskConical, module: 'laboratory' },
  { title: "Pharmacie", url: "/pharmacy", icon: Pill, module: 'pharmacy' },
  { title: "Facturation", url: "/billing", icon: Receipt, module: 'billing' },
  { title: "Comptabilité", url: "/accounting", icon: BarChart3, module: 'accounting' },
];

const adminItems: SidebarItem[] = [
  { title: "Planning des gardes", url: "/planning", icon: Calendar, module: 'planning' },
  { title: "Ressources humaines", url: "/hr", icon: UserCog, module: 'hr' },
  { title: "Tarification & Actes", url: "/catalogs", icon: ClipboardList, module: 'catalogs' },
  { title: "Établissements", url: "/facilities", icon: Building2, module: 'facilities' },
  { title: "Paramètres", url: "/settings", icon: Settings, module: 'settings' },
];

const saasItems: SidebarItem[] = [
  { title: "Gérer les cliniques", url: "/saas/dashboard", icon: ServerCog, module: 'saas' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  const renderItems = (items: SidebarItem[]) =>
    items
      .filter((item) => can(item.module))
      .map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive(item.url)}>
            <NavLink
              to={item.url}
              end
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
              activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-medium"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-lg">K</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-sidebar-primary-foreground leading-none">
                Kiam
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                {user?.role === 'saas_admin' ? "Administration SaaS" : "Gestion Hospitalière"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {user?.role === 'saas_admin' ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
              Super Admin SaaS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(saasItems)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
                Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
                Services
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(serviceItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
                Administration
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(adminItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Déconnexion</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
