import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, ShoppingCart, Package, Truck, Users, FileText,
  CreditCard, BarChart3, DollarSign, ClipboardList, PackageCheck,
  Receipt, Search, Star, Grid3x3, Zap, TrendingUp, Store,
  ShieldCheck, BookOpen, Warehouse, Wallet
} from "lucide-react";

interface ErpApp {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  url: string;
  gradient: string;
  color: string;
  category: string;
  isNew?: boolean;
  isFavorite?: boolean;
}

const erpApps: ErpApp[] = [
  // ── Ventes ─────────────────────────────────────────────
  {
    id: "pos",
    title: "Point de Vente",
    subtitle: "Caisse & Ventes comptoir",
    icon: ShoppingCart,
    url: "/erp/pos",
    gradient: "from-violet-600 to-purple-700",
    color: "shadow-violet-500/30",
    category: "Ventes",
    isFavorite: true,
  },
  {
    id: "customers",
    title: "Clients & CRM",
    subtitle: "Gestion de la clientèle",
    icon: Users,
    url: "/erp/customers",
    gradient: "from-blue-500 to-cyan-600",
    color: "shadow-blue-500/30",
    category: "Ventes",
  },
  {
    id: "register-closing",
    title: "Clôture de Caisse",
    subtitle: "Fin de journée & rapport",
    icon: DollarSign,
    url: "/erp/closing",
    gradient: "from-emerald-500 to-teal-600",
    color: "shadow-emerald-500/30",
    category: "Ventes",
  },
  {
    id: "com-docs",
    title: "Doc. Commerciaux",
    subtitle: "Devis, Bons & Suivi",
    icon: FileText,
    url: "/erp/commercial-docs",
    gradient: "from-pink-500 to-rose-600",
    color: "shadow-pink-500/30",
    category: "Ventes",
    isNew: true,
  },

  // ── Inventaire ─────────────────────────────────────────
  {
    id: "inventory",
    title: "Gestion des Stocks",
    subtitle: "Inventaire & articles",
    icon: Package,
    url: "/erp/inventory",
    gradient: "from-amber-500 to-orange-600",
    color: "shadow-amber-500/30",
    category: "Inventaire",
    isFavorite: true,
  },
  {
    id: "physical-inventory",
    title: "Inventaire Physique",
    subtitle: "Écarts de stock & pertes",
    icon: ClipboardList,
    url: "/erp/physical-inventories",
    gradient: "from-teal-500 to-emerald-600",
    color: "shadow-teal-500/30",
    category: "Inventaire",
    isNew: true,
  },

  // ── Approvisionnement ──────────────────────────────────
  {
    id: "procurement",
    title: "Dashboard Achats",
    subtitle: "KPIs & tableau de bord",
    icon: LayoutDashboard,
    url: "/erp/procurement",
    gradient: "from-indigo-500 to-blue-700",
    color: "shadow-indigo-500/30",
    category: "Approvisionnement",
  },
  {
    id: "purchase-requests",
    title: "Demandes d'Achat",
    subtitle: "Besoins internes",
    icon: ClipboardList,
    url: "/erp/purchase-requests",
    gradient: "from-sky-500 to-blue-600",
    color: "shadow-sky-500/30",
    category: "Approvisionnement",
  },
  {
    id: "purchase-orders",
    title: "Bons de Commande",
    subtitle: "Commandes fournisseurs",
    icon: FileText,
    url: "/erp/purchase-orders",
    gradient: "from-cyan-500 to-teal-600",
    color: "shadow-cyan-500/30",
    category: "Approvisionnement",
    isFavorite: true,
  },
  {
    id: "goods-receipts",
    title: "Réceptions",
    subtitle: "Livraisons & réceptions",
    icon: PackageCheck,
    url: "/erp/goods-receipts",
    gradient: "from-lime-500 to-green-600",
    color: "shadow-lime-500/30",
    category: "Approvisionnement",
  },

  // ── Fournisseurs & Finance ─────────────────────────────
  {
    id: "suppliers",
    title: "Fournisseurs",
    subtitle: "Annuaire & partenaires",
    icon: Truck,
    url: "/erp/suppliers",
    gradient: "from-rose-500 to-pink-600",
    color: "shadow-rose-500/30",
    category: "Finance",
    isFavorite: true,
  },
  {
    id: "supplier-invoices",
    title: "Factures Fournisseurs",
    subtitle: "Contrôle & validation",
    icon: Receipt,
    url: "/erp/supplier-invoices",
    gradient: "from-fuchsia-500 to-purple-600",
    color: "shadow-fuchsia-500/30",
    category: "Finance",
  },
  {
    id: "supplier-payments",
    title: "Paiements",
    subtitle: "Règlements & soldes",
    icon: CreditCard,
    url: "/erp/supplier-payments",
    gradient: "from-emerald-600 to-green-700",
    color: "shadow-emerald-600/30",
    category: "Finance",
  },
  {
    id: "ohada-accounting",
    title: "Comptabilité OHADA",
    subtitle: "Journaux, Bilan & Grand livre",
    icon: BookOpen,
    url: "/erp/accounting",
    gradient: "from-indigo-600 to-violet-800",
    color: "shadow-indigo-600/30",
    category: "Finance",
    isNew: true,
    isFavorite: true,
  },
  {
    id: "expenses",
    title: "Dépenses",
    subtitle: "Charges & coûts",
    icon: TrendingUp,
    url: "/erp/expenses",
    gradient: "from-orange-500 to-red-600",
    color: "shadow-orange-500/30",
    category: "Finance",
  },

  // ── Analyse ────────────────────────────────────────────
  {
    id: "reports",
    title: "Rapports & Bilans",
    subtitle: "Analyses & synthèses",
    icon: BarChart3,
    url: "/erp/reports",
    gradient: "from-slate-500 to-slate-700",
    color: "shadow-slate-500/30",
    category: "Analyse",
  },
  {
    id: "transactions",
    title: "Journal Transactions",
    subtitle: "Historique des opérations",
    icon: BookOpen,
    url: "/erp/transactions",
    gradient: "from-zinc-600 to-slate-700",
    color: "shadow-zinc-500/30",
    category: "Analyse",
  },
];

const categories = ["Tous", "Ventes", "Inventaire", "Approvisionnement", "Finance", "Analyse"];

export default function ErpHome() {
  const navigate = useNavigate();
  const { user, clinic } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(erpApps.filter(a => a.isFavorite).map(a => a.id))
  );

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = erpApps.filter(app => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "Tous" || app.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const favoriteApps = erpApps.filter(a => favorites.has(a.id));

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#0f1117]/90 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-white">Kiam ERP Pro</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {clinic?.name || "Commerce & Boutique"}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher un module..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && filtered.length > 0) navigate(filtered[0].url);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          {/* User */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
            <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user?.name || "Admin"}</p>
              <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">ERP Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Favorites row (only shown when not filtering) */}
        {!searchQuery && activeCategory === "Tous" && favoriteApps.length > 0 && (
          <section className="mb-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-5 flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> Favoris
            </h2>
            <div className="flex gap-4 flex-wrap">
              {favoriteApps.map(app => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => navigate(app.url)}
                    className="group flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.07] rounded-2xl px-4 py-3 transition-all duration-200"
                  >
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg ${app.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{app.title}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Filter */}
        {!searchQuery && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  activeCategory === cat
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:border-white/15 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Apps Grid */}
        {searchQuery && (
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-6">
            {filtered.length} module{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
            <Grid3x3 className="h-16 w-16 mb-4 opacity-30" />
            <p className="font-bold text-slate-500">Aucun module trouvé pour "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {filtered.map(app => {
              const Icon = app.icon;
              const isFav = favorites.has(app.id);
              return (
                <div key={app.id} className="relative group">
                  {/* Favorite toggle */}
                  <button
                    onClick={e => toggleFavorite(e, app.id)}
                    className={`absolute -top-1.5 -right-1.5 z-10 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                      isFav
                        ? "bg-amber-400 text-amber-900 opacity-100"
                        : "bg-slate-700 text-slate-400 hover:bg-amber-400 hover:text-amber-900"
                    }`}
                    title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Star className={`h-3 w-3 ${isFav ? "fill-current" : ""}`} />
                  </button>

                  {/* App Card */}
                  <button
                    onClick={() => navigate(app.url)}
                    className="w-full flex flex-col items-center text-center p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 group"
                  >
                    {/* Badge NEW */}
                    {app.isNew && (
                      <span className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                        Nouveau
                      </span>
                    )}

                    {/* Icon */}
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-xl ${app.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl mb-4`}>
                      <Icon className="h-8 w-8 text-white stroke-[1.7]" />
                    </div>

                    {/* Label */}
                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors leading-tight">
                      {app.title}
                    </span>
                    <span className="mt-1 text-[10px] text-slate-600 group-hover:text-slate-400 font-medium leading-tight max-w-[110px]">
                      {app.subtitle}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick stats bar at bottom */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Modules Actifs", value: erpApps.length, icon: Zap, color: "text-violet-400", bg: "bg-violet-500/10" },
            { label: "Ventes & Caisse", value: "4 apps", icon: ShoppingCart, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Appro & Achats", value: "6 apps", icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Comptabilité & Finance", value: "5 apps", icon: CreditCard, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`${s.bg} border border-white/5 rounded-2xl p-4 flex items-center gap-3`}>
                <Icon className={`h-5 w-5 ${s.color} shrink-0`} />
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{s.label}</p>
                  <p className={`text-lg font-black ${s.color} mt-0.5`}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
