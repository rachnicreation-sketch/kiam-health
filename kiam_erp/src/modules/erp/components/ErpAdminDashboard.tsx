import { 
  TrendingUp, 
  Package, 
  Users, 
  AlertCircle,
  Plus,
  Box,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface ErpAdminDashboardProps {
  stats: any;
}

const data = [
  { name: 'Lun', value: 400000 },
  { name: 'Mar', value: 300000 },
  { name: 'Mer', value: 600000 },
  { name: 'Jeu', value: 800000 },
  { name: 'Ven', value: 500000 },
  { name: 'Sam', value: 900000 },
  { name: 'Dim', value: 1200000 },
];

export function ErpAdminDashboard({ stats }: ErpAdminDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-600" /> Pilotage Commercial
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Vision globale des performances et stocks du magasin.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white shadow-lg shadow-emerald-200" onClick={() => navigate('/erp/pos')}>
            <ShoppingCart className="w-4 h-4" /> Ouvrir Caisse
          </Button>
          <Button variant="outline" className="font-bold gap-2 border-slate-200" onClick={() => navigate('/erp/inventory')}>
            <Package className="w-4 h-4" /> Gérer Stock
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Chiffre d'Affaires" value={`${Number(stats.today_revenue || 0).toLocaleString()} CFA`} change="+15%" icon={TrendingUp} className="bg-white" />
        <StatCard title="Produits en Stock" value={stats.total_items || 0} icon={Box} className="bg-white" />
        <StatCard title="Alertes Stock" value={stats.low_stock || 0} change="Action requise" changeType="negative" icon={AlertCircle} className="bg-white" />
        <StatCard title="Commandes (Jour)" value="18" change="+5" icon={ShoppingCart} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Flux des Ventes</CardTitle>
                <CardDescription>Volume transactionnel hebdomadaire</CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-none px-4 py-1 font-bold">En direct</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
             <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Alertes du Jour</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-1">
                <div className="flex items-center justify-between">
                   <p className="text-xs font-black text-rose-900 uppercase">Stock Faible</p>
                   <ArrowDownRight className="h-4 w-4 text-rose-600" />
                </div>
                <p className="text-[10px] text-rose-700">Le stock de Ciment 50kg est sous le seuil critique (4 sacs).</p>
             </div>
             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-1">
                <div className="flex items-center justify-between">
                   <p className="text-xs font-black text-amber-900 uppercase">Paiement En Attente</p>
                   <ArrowUpRight className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-[10px] text-amber-700">Facture #TR-402 non soldée par Client ETS MARION.</p>
             </div>
             <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50">
                Voir toutes les alertes
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
