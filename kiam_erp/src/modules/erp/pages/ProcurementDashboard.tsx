import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Truck, FileText, CreditCard, AlertTriangle,
  TrendingUp, Package, CheckCircle2, Clock, ChevronRight,
  ArrowRight, BarChart3, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:              { label: "Brouillon",    color: "bg-slate-100 text-slate-600" },
  sent:               { label: "Envoyé",       color: "bg-blue-100 text-blue-700" },
  confirmed:          { label: "Confirmé",     color: "bg-emerald-100 text-emerald-700" },
  partially_received: { label: "Partiel",      color: "bg-amber-100 text-amber-700" },
  received:           { label: "Reçu",         color: "bg-teal-100 text-teal-700" },
  cancelled:          { label: "Annulé",       color: "bg-rose-100 text-rose-700" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

export default function ProcurementDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDash(); }, [user]);

  const loadDash = async () => {
    if (!user?.clinicId) return;
    try {
      const data = await api.procurement.dashboard(user.clinicId);
      setDash(data);
    } catch (e) { /* graceful */ } finally { setLoading(false); }
  };

  const kpis = [
    {
      label: "Demandes en attente",
      value: dash.pending_requests ?? 0,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-200",
      path: "/erp/purchase-requests",
    },
    {
      label: "Commandes ouvertes",
      value: dash.open_orders ?? 0,
      icon: ShoppingCart,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      path: "/erp/purchase-orders",
    },
    {
      label: "Réceptions à valider",
      value: dash.pending_receipts ?? 0,
      icon: Package,
      color: "text-teal-500",
      bg: "bg-teal-50",
      border: "border-teal-200",
      path: "/erp/goods-receipts",
    },
    {
      label: "Factures en attente",
      value: dash.pending_invoices ?? 0,
      icon: FileText,
      color: "text-rose-500",
      bg: "bg-rose-50",
      border: "border-rose-200",
      path: "/erp/supplier-invoices",
    },
  ];

  const quickActions = [
    { label: "Nouvelle Demande", icon: Plus, path: "/erp/purchase-requests", color: "bg-amber-500 hover:bg-amber-600" },
    { label: "Nouveau Bon de Commande", icon: ShoppingCart, path: "/erp/purchase-orders", color: "bg-indigo-600 hover:bg-indigo-700" },
    { label: "Enregistrer Livraison", icon: Truck, path: "/erp/goods-receipts", color: "bg-teal-600 hover:bg-teal-700" },
    { label: "Payer une Facture", icon: CreditCard, path: "/erp/supplier-payments", color: "bg-emerald-600 hover:bg-emerald-700" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            Tableau de Bord Approvisionnement
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cycle complet : Demande → Commande → Livraison → Paiement
          </p>
        </div>
        <Button
          onClick={() => navigate("/erp/suppliers")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg shadow-indigo-200 h-11 px-6 rounded-xl"
        >
          <Truck className="h-4 w-4" /> Fournisseurs
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card
            key={i}
            onClick={() => navigate(k.path)}
            className={`border ${k.border} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 bg-white`}
          >
            <CardContent className="p-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{k.label}</p>
                <p className="text-4xl font-black text-slate-900">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                  Voir détails <ChevronRight className="h-3 w-3" />
                </p>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-6 w-6 ${k.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Debt + Quick Actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Debt */}
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-400">Dette Fournisseurs</p>
                <p className="text-2xl font-black text-rose-700">{fmt(dash.total_debt ?? 0)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs"
              onClick={() => navigate("/erp/supplier-payments")}
            >
              Gérer les paiements <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {quickActions.map((qa, i) => (
            <button
              key={i}
              onClick={() => navigate(qa.path)}
              className={`${qa.color} text-white p-4 rounded-2xl flex items-center gap-3 font-bold text-sm transition-all hover:scale-[1.02] shadow-md text-left`}
            >
              <qa.icon className="h-5 w-5 shrink-0" />
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-50 border-b px-6 py-4 flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">
              Commandes Récentes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={() => navigate("/erp/purchase-orders")}>
              Tout voir <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(dash.recent_orders ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <ShoppingCart className="h-12 w-12 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest">Aucune commande</p>
              </div>
            ) : (dash.recent_orders ?? []).map((po: any) => (
              <div key={po.id} className="flex items-center justify-between px-6 py-3.5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-black text-slate-800">{po.order_number}</p>
                  <p className="text-xs text-slate-400 font-medium">{po.supplier_name ?? "Fournisseur inconnu"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-slate-700">{fmt(po.total_ttc)}</p>
                  <Badge className={`text-[10px] font-black px-2 py-0.5 border-none ${STATUS_CONFIG[po.status]?.color ?? "bg-slate-100"}`}>
                    {STATUS_CONFIG[po.status]?.label ?? po.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Alertes Stock Faible
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-amber-600" onClick={() => navigate("/erp/inventory")}>
              Voir stocks <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(dash.low_stock ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-300" />
                <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Tous les stocks sont OK</p>
              </div>
            ) : (dash.low_stock ?? []).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-6 py-3.5 border-b border-amber-50 hover:bg-amber-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-rose-600">{item.stock}</p>
                  <p className="text-[10px] text-slate-400">seuil: {item.threshold}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
