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
  FlaskConical,
  Receipt
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

const pharmacyData = [
  { day: "Lun", sales: 250000, prescriptions: 35 },
  { day: "Mar", sales: 320000, prescriptions: 42 },
  { day: "Mer", sales: 280000, prescriptions: 28 },
  { day: "Jeu", sales: 410000, prescriptions: 51 },
  { day: "Ven", sales: 550000, prescriptions: 64 },
  { day: "Sam", sales: 780000, prescriptions: 45 },
  { day: "Dim", sales: 400000, prescriptions: 20 },
];

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { label: "Nouvelle Vente", icon: ShoppingCart, color: "bg-emerald-600", url: "/pharmacy/sales" },
    { label: "Ordonnance", icon: ClipboardList, color: "bg-blue-500", url: "/pharmacy/prescriptions" },
    { label: "Stock Médicaments", icon: Pill, color: "bg-purple-600", url: "/pharmacy/inventory" },
    { label: "Alertes Péremption", icon: AlertCircle, color: "bg-rose-500", url: "/pharmacy/alerts" },
    { label: "Commandes Labo", icon: FlaskConical, color: "bg-cyan-600", url: "/pharmacy/orders" },
    { label: "Fidélité Client", icon: Users, color: "bg-orange-500", url: "/pharmacy/customers" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground text-emerald-700">
            Kiam Pharmacy
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm italic">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Gestion Officinale — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
           <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2" onClick={() => navigate('/pharmacy/sales')}>
             <PlusCircle className="h-4 w-4" />
             Vente Rapide (Comptoir)
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventes du Jour"
          value="452 000 CFA"
          change="+8% vs hier"
          changeType="positive"
          icon={TrendingUp}
          className="border-none shadow-md"
        />
        <StatCard
          title="Ordonnances Actives"
          value="34"
          change="Prêtes à servir"
          changeType="neutral"
          icon={ClipboardList}
          iconClassName="bg-blue-100 text-blue-600"
          className="border-none shadow-md"
        />
        <StatCard
          title="Médicaments en Stock"
          value="2,140"
          change="8 alertes"
          changeType="negative"
          icon={Pill}
          iconClassName="bg-emerald-100 text-emerald-600"
          className="border-none shadow-md"
        />
        <StatCard
          title="Clients Visités"
          value="62"
          change="Aujourd'hui"
          changeType="positive"
          icon={Users}
          iconClassName="bg-purple-100 text-purple-600"
          className="border-none shadow-md"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 px-6 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-emerald-600">
            <Zap className="h-4 w-4 text-orange-500" />
            Services Pharmacie
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.url)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-transparent hover:border-muted group transition-all"
              >
                <div className={`${action.color} text-white p-3 rounded-2xl mb-3 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-center text-muted-foreground leading-tight group-hover:text-foreground transition-colors px-1">
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
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <Activity className="h-4 w-4 text-emerald-500" />
              Volume de Prescription Semainier
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={pharmacyData}>
                <defs>
                  <linearGradient id="colorPharma" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} />
                <Tooltip />
                <Area type="monotone" dataKey="prescriptions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPharma)" name="Ordonnances" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-4 w-4" />
              Alertes de Stock Majeures
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
             {[
               { name: "Paracétamol 500mg", stock: 2 },
               { name: "Amoxicilline Caps", stock: 0 },
               { name: "Sirop Toux Enfant", stock: 5 },
               { name: "Insuline Basale", stock: 1 }
             ].map((m, i) => (
               <div key={i} className="flex items-center gap-3 border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">Quantité: {m.stock} unités restantes</p>
                  </div>
                  <Badge variant={m.stock === 0 ? "destructive" : "outline"} className="text-[9px]">
                    {m.stock === 0 ? 'RUPTURE' : 'CRITIQUE'}
                  </Badge>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
