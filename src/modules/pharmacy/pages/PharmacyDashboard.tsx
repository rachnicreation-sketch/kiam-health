import { useState, useEffect } from "react";
import { 
  Pill, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Activity, 
  Zap, 
  ClipboardList, 
  PlusCircle,
  AlertCircle,
  Clock,
  Receipt,
  Truck,
  Landmark,
  FileText,
  CreditCard
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-service";

const fmt = (n: any) => Number(n || 0).toLocaleString("fr-FR");

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [expiringLots, setExpiringLots] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsData, meds, expData, reportData] = await Promise.all([
        apiRequest("pharmacy.php?action=stats"),
        apiRequest("pharmacy.php?action=list_medications"),
        apiRequest("pharmacy.php?action=expiring_batches"),
        apiRequest("pharmacy.php?action=sales_report&period=week"),
      ]);
      setStats(statsData);
      setAlerts(meds.filter((m: any) => m.stock <= m.threshold).slice(0, 4));
      setExpiringLots(expData || []);

      // Build chart from real daily data (last 7 days, fill missing days with 0)
      const days: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("fr-FR", { weekday: "short" });
        const found = (reportData?.daily || []).find((r: any) => r.day === key);
        days.push({ day: label, sales: parseFloat(found?.total_ttc || 0), invoices: parseInt(found?.nb_invoices || 0) });
      }
      setChartData(days);
    } catch (e) {
      console.error(e);
    }
  };

  const quickActions = [
    { label: "Nouvelle Vente", icon: ShoppingCart, color: "bg-emerald-600", url: "/pharmacy/sales" },
    { label: "Ordonnances", icon: ClipboardList, color: "bg-blue-500", url: "/pharmacy/prescriptions" },
    { label: "Stocks & Lots", icon: Pill, color: "bg-purple-600", url: "/pharmacy/inventory" },
    { label: "Clients & Mutuelles", icon: Users, color: "bg-orange-500", url: "/pharmacy/customers" },
    { label: "Ventes à Crédit", icon: CreditCard, color: "bg-rose-500", url: "/pharmacy/credits" },
    { label: "Approvisionnement", icon: Truck, color: "bg-cyan-600", url: "/pharmacy/procurement" },
    { label: "Gestion Caisse", icon: Receipt, color: "bg-slate-600", url: "/pharmacy/caisse" },
    { label: "Comptabilité", icon: Landmark, color: "bg-amber-600", url: "/pharmacy/accounting" },
    { label: "Rapports & Stats", icon: TrendingUp, color: "bg-teal-600", url: "/pharmacy/reports" },
    { label: "Devis & Factures", icon: FileText, color: "bg-indigo-600", url: "/pharmacy/documents" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-emerald-800">
            Kiam Officine — Gestion Pharmacie
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm italic">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Espace d'administration commerciale et de facturation officinale.
          </p>
        </div>
        <div className="flex gap-2">
           <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 text-white font-bold" onClick={() => navigate('/pharmacy/sales')}>
             <PlusCircle className="h-4 w-4" />
             Vente Comptoir (POS)
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventes du Jour"
          value={`${Number(stats?.sales_today || 0).toLocaleString()} CFA`}
          change="Revenus comptoir"
          changeType="positive"
          icon={TrendingUp}
          className="border-none shadow-md bg-white"
        />
        <StatCard
          title="Marge Brute du Jour"
          value={`${Number(stats?.margin_today || 0).toLocaleString()} CFA`}
          change="Bénéfice estimé"
          changeType="positive"
          icon={Zap}
          iconClassName="bg-amber-100 text-amber-600"
          className="border-none shadow-md bg-white"
        />
        <StatCard
          title="Créances Clients"
          value={`${Number(stats?.debts || 0).toLocaleString()} CFA`}
          change="Dettes clients & assurances"
          changeType={stats?.debts > 0 ? "negative" : "neutral"}
          icon={CreditCard}
          iconClassName="bg-rose-100 text-rose-600"
          className="border-none shadow-md bg-white"
        />
        <StatCard
          title="Alertes de Stock"
          value={String(stats?.low_stock || 0)}
          change="Références en rupture ou bas stock"
          changeType={stats?.low_stock > 0 ? "negative" : "positive"}
          icon={Pill}
          iconClassName="bg-emerald-100 text-emerald-600"
          className="border-none shadow-md bg-white"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 px-6 border-b">
          <CardTitle className="text-xs font-bold flex items-center gap-2 text-emerald-700 uppercase tracking-widest">
            <Zap className="h-4 w-4 text-orange-500 animate-bounce" />
            Raccourcis de Gestion
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.url)}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-transparent hover:bg-slate-50 hover:border-slate-100 group transition-all"
              >
                <div className={`${action.color} text-white p-2.5 rounded-2xl mb-2 shadow-lg shadow-black/5 group-hover:scale-105 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-center text-slate-500 leading-tight group-hover:text-slate-800 transition-colors">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-500" />
              Volume de Ventes Récent
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} CFA`, "Ventes TTC"]}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Ruptures de Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {alerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Aucun produit en rupture critique.</p>
              ) : (
                alerts.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                      <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">En stock: {m.stock} {m.unit}</p>
                      </div>
                      <Badge variant={m.stock === 0 ? "destructive" : "outline"} className="text-[9px] font-bold">
                        {m.stock === 0 ? 'RUPTURE' : 'BAS'}
                      </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Lots Expirant (&lt; 90 Jours)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {expiringLots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Aucun lot à péremption imminente.</p>
              ) : (
                expiringLots.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                      <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{l.medication_name}</p>
                        <p className="text-[10px] text-muted-foreground">Lot: {l.batch_number} - Reste: {l.remaining_qty}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-bold border-amber-200 text-amber-700 bg-amber-50">
                        {new Date(l.expiry_date).toLocaleDateString()}
                      </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
