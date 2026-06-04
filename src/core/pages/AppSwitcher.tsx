import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { Module } from "@/lib/permissions";
import {
  Stethoscope,
  Store,
  GraduationCap,
  Hotel,
  Pill,
  Briefcase,
  ServerCog,
  CreditCard,
  Shield,
  Settings,
  Search,
  LogOut,
  User,
  Building2,
  Grid,
  LayoutDashboard,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  url: string;
  module: Module;
  bgClass: string;
  description: string;
}

export default function AppSwitcher() {
  const navigate = useNavigate();
  const { user, clinic, logout, can } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModules, setActiveModules] = useState<string[] | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Define all available apps in the Kiam ecosystem
  const allApps: AppItem[] = [
    {
      id: "health",
      title: "Santé & Clinique",
      icon: Stethoscope,
      url: "/dashboard",
      module: "dashboard",
      bgClass: "bg-gradient-to-br from-teal-500 to-emerald-600 hover:shadow-teal-500/20",
      description: "Dossiers patients, consultations et hospitalisations"
    },
    {
      id: "erp",
      title: "Boutique & ERP",
      icon: Store,
      url: "/erp/dashboard",
      module: "erp",
      bgClass: "bg-gradient-to-br from-purple-500 to-indigo-600 hover:shadow-purple-500/20",
      description: "Point de vente (POS), stocks et commerce"
    },
    {
      id: "school",
      title: "École & Scolarité",
      icon: GraduationCap,
      url: "/school/dashboard",
      module: "school",
      bgClass: "bg-gradient-to-br from-sky-500 to-blue-600 hover:shadow-sky-500/20",
      description: "Elèves, classes, notes et scolarité"
    },
    {
      id: "hotel",
      title: "Hôtellerie",
      icon: Hotel,
      url: "/hotel/dashboard",
      module: "hotel",
      bgClass: "bg-gradient-to-br from-amber-500 to-orange-600 hover:shadow-amber-500/20",
      description: "Chambres, réservations et séjours"
    },
    {
      id: "pharmacy",
      title: "Pharmacie & Officine",
      icon: Pill,
      url: "/pharmacy/dashboard",
      module: "pharmacy",
      bgClass: "bg-gradient-to-br from-rose-500 to-pink-600 hover:shadow-rose-500/20",
      description: "Ventes comptoir et stock de médicaments"
    },
    {
      id: "enterprise",
      title: "Projets & CRM",
      icon: Briefcase,
      url: "/enterprise/dashboard",
      module: "enterprise",
      bgClass: "bg-gradient-to-br from-cyan-500 to-blue-500 hover:shadow-cyan-500/20",
      description: "Gestion de projets, tâches et CRM clients"
    },
    {
      id: "hr",
      title: "Ressources Humaines",
      icon: Users,
      url: "/hr",
      module: "hr",
      bgClass: "bg-gradient-to-br from-pink-500 to-rose-600 hover:shadow-pink-500/20",
      description: "Personnel, fiches de paie, CNSS et coût employeur"
    },
    {
      id: "saas",
      title: "Cockpit Master",
      icon: ServerCog,
      url: "/saas/dashboard",
      module: "saas",
      bgClass: "bg-gradient-to-br from-slate-700 to-slate-900 hover:shadow-slate-700/20",
      description: "Administration de la plateforme SaaS et locataires"
    },
    {
      id: "subscription",
      title: "Mon Abonnement",
      icon: CreditCard,
      url: "/subscription",
      module: "dashboard", // accessible to all clinic members
      bgClass: "bg-gradient-to-br from-indigo-600 to-violet-700 hover:shadow-indigo-600/20",
      description: "Gérer la facturation et l'abonnement Kiam"
    },
    {
      id: "audit",
      title: "Journal d'Audit",
      icon: Shield,
      url: "/logs",
      module: "saas", // limited to admin scopes
      bgClass: "bg-gradient-to-br from-emerald-600 to-teal-700 hover:shadow-emerald-600/20",
      description: "Historique des actions de sécurité et logs"
    },
    {
      id: "settings",
      title: "Configuration",
      icon: Settings,
      url: "/settings",
      module: "settings",
      bgClass: "bg-gradient-to-br from-gray-500 to-slate-600 hover:shadow-gray-500/20",
      description: "Paramètres généraux de l'établissement"
    }
  ];

  // Load active modules for the current tenant
  useEffect(() => {
    const tenantId = clinic?.id || user?.clinicId;
    if (!tenantId) {
      setActiveModules(null);
      return;
    }

    api.saas.modules(tenantId)
      .then((data: any) => {
        if (data && Array.isArray(data)) {
          setActiveModules(data.map((m: any) => m.module_name || m.name || m.id));
        } else if (data && data.modules && Array.isArray(data.modules)) {
          setActiveModules(data.modules.map((m: any) => m.module_name || m.name || m.id));
        } else {
          setActiveModules([]);
        }
      })
      .catch(() => {
        // Fallback to empty if fails
        setActiveModules([]);
      });
  }, [clinic?.id, user?.clinicId]);

  // Handle keyboard shortcut to autofocus search on load or keypress
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search if user starts typing letters, unless they are already in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeModuleSet = new Set(activeModules ?? []);

  // Filter apps based on tenant active modules & user permissions
  const visibleApps = allApps.filter((app) => {
    // 1. Check user permission
    if (!can(app.module)) return false;

    // 2. Check if active for tenant
    if (activeModules !== null) {
      // SaaS admin can see saas tools always
      if (user?.role === 'saas_admin') {
        return app.id === 'saas' || app.id === 'audit';
      }
      
      // Don't hide settings or subscription or audit for general layout
      if (app.id === 'settings' || app.id === 'subscription') return true;

      // Special check for erp vs shop
      const isEnabled = activeModuleSet.has(app.id) || (app.id === 'erp' && activeModuleSet.has('shop'));
      if (!isEnabled) return false;
    }

    return true;
  });

  // Filter apps based on search query
  const filteredApps = visibleApps.filter((app) =>
    app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Enter key to launch the first filtered app
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredApps.length > 0) {
      navigate(filteredApps[0].url);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-indigo-950/20 text-white flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-slate-950/20 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/images/logo-kiam.png" alt="KIAM Logo" className="h-9 w-9 object-contain bg-white rounded-xl p-0.5" onError={(e) => {
            (e.target as HTMLImageElement).src = "/kiam/public/images/logo-kiam.png";
          }} />
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            KIAM<span className="text-indigo-400 font-medium">SaaS</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              const sectorHome: Record<string, string> = {
                health:     '/dashboard',
                hotel:      '/hotel/dashboard',
                school:     '/school/dashboard',
                erp:        '/erp',
                shop:       '/erp',
                pharmacy:   '/pharmacy/dashboard',
                enterprise: '/enterprise/dashboard',
              };
              const target = user?.role === 'saas_admin' ? '/saas/dashboard' : (sectorHome[user?.sector || ''] || '/dashboard');
              navigate(target);
            }}
            className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 rounded-xl px-4.5 py-1.5 h-9 text-xs font-bold"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Tableau de Bord</span>
          </Button>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl">
            <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold leading-none">{user?.name || "Collaborateur"}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {clinic?.name || "Etablissement"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white border border-white/5"
            title="Déconnexion"
          >
            <LogOut className="h-4.5 w-4.5" />
          </Button>
        </div>
      </header>

      {/* Main Switcher Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-6xl mx-auto w-full">
        {/* Search Bar */}
        <div className="w-full max-w-xl mb-12 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher une application..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-slate-950/40 border border-white/10 rounded-2xl py-4.5 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 backdrop-blur-md transition-all text-lg font-medium shadow-2xl"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold bg-white/10 px-2 py-1 rounded text-slate-400">
              Appuyez sur Entrée
            </span>
          )}
        </div>

        {/* Grid of Apps */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => navigate(app.url)}
                  className="group flex flex-col items-center text-center p-5 rounded-3xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white ${app.bgClass} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-2 shadow-black/10`}>
                    <Icon className="h-8 w-8 stroke-[1.8]" />
                  </div>
                  <span className="mt-4 font-bold text-sm text-slate-200 group-hover:text-white tracking-wide transition-colors">
                    {app.title}
                  </span>
                  <span className="mt-1 text-[10px] text-slate-500 group-hover:text-slate-400 font-medium max-w-[120px] leading-tight">
                    {app.description}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 font-medium italic">
            Aucun module trouvé pour "{searchQuery}"
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
        Développé par{" "}
        <a
          href="https://www.rxservices-cg.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-indigo-400 font-semibold"
        >
          RX services
        </a>{" "}
        • Kiam SaaS Platform v2.0
      </footer>
    </div>
  );
}
