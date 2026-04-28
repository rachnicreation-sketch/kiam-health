import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, DollarSign, TrendingUp, AlertTriangle, UserMinus, 
  CheckCircle, Server, Activity, Zap, CreditCard, Clock, Globe, Shield, RefreshCw, BarChart2,
  Building2, ArrowRight, ArrowUpRight, ArrowDownRight, Plus, Blocks, PieChart as PieChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { api } from "@/lib/api-service";

export default function SaaSAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const statsData = await api.saas.stats();
      const tenantsData = await api.saas.tenants();
      const ticketsData = await api.saas.tickets();
      setStats(statsData);
      setTenants(tenantsData || []);
      setTickets(ticketsData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const revenueData = stats?.growthData?.length ? stats.growthData : [
    { name: 'Jan', value: 0 }, { name: 'Fév', value: 0 }
  ];

  const moduleDistribution = stats?.modulesUsage || [
    { name: 'Kiam Health', value: 40, color: '#3b82f6' },
    { name: 'Kiam Hotel', value: 20, color: '#8b5cf6' },
    { name: 'Kiam School', value: 25, color: '#10b981' },
    { name: 'Kiam ERP', value: 15, color: '#f59e0b' },
  ];

  const recentClients = tenants.slice(0, 5);

  const quickActions = [
    { label: "Locataires", icon: Building2, color: "bg-blue-500", url: "/saas/tenants" },
    { label: "Facturation", icon: CreditCard, color: "bg-emerald-500", url: "/saas/billing" },
    { label: "Modules", icon: Blocks, color: "bg-purple-500", url: "/saas/modules" },
  ];

  if (loading && !stats) {
    return <div className="flex h-full items-center justify-center text-muted-foreground italic">Chargement du Cockpit Master...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/50 p-2 sm:p-6 min-h-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-600" /> Cockpit Master KIAM
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm italic mt-1">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
            Supervision globale — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsAnalyticsOpen(true)} className="hidden sm:flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Analytics
          </Button>
          <Button size="sm" onClick={() => navigate('/saas/tenants')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau Locataire
          </Button>
        </div>
      </div>

      {/* ROW 1: PRIMARY KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients (Locataires)"
          value={String(stats?.totalTenants || 0)}
          change={`${stats?.activeTenants || 0} actifs`}
          changeType="neutral"
          icon={Building2}
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer !bg-white"
          onClick={() => navigate('/saas/tenants')}
        />
        <StatCard
          title="Revenu MRR"
          value={`${Number(stats?.totalMRR || 0).toLocaleString()} CFA`}
          change="Revenus mensuels"
          changeType="positive"
          icon={DollarSign}
          iconClassName="bg-emerald-100 text-emerald-600"
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer !bg-white"
          onClick={() => navigate('/saas/billing')}
        />
        <StatCard
          title="Tickets Support"
          value={String(stats?.openTickets || 0)}
          change="Ouverts"
          changeType={stats?.openTickets > 0 ? "negative" : "neutral"}
          icon={AlertTriangle}
          iconClassName="bg-amber-100 text-amber-600"
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer !bg-white"
        />
        <StatCard
          title="Performance"
          value="98.5%"
          change="Uptime"
          changeType="positive"
          icon={Activity}
          iconClassName="bg-blue-100 text-blue-600"
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer !bg-white"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 px-6 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
            <Zap className="h-4 w-4 text-orange-500" />
            Accès Rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-4 overflow-x-auto hide-scrollbar">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.url)}
                className="flex items-center gap-3 p-3 sm:px-6 sm:py-4 rounded-xl border border-transparent hover:border-muted bg-slate-50 hover:bg-slate-100 group transition-all shrink-0"
              >
                <div className={`${action.color} text-white p-2.5 rounded-xl shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-700">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REVENUE GROWTH */}
        <Card className="lg:col-span-2 border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Croissance des revenus (6 mois)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} dy={10} />
                <YAxis hide />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ALERTS MODULE */}
        <Card className="border-none shadow-md bg-white flex flex-col">
          <CardHeader className="py-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Alertes Système
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs font-bold text-primary" onClick={() => setIsAlertsOpen(true)}>Tout voir</Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="space-y-4">
              {tickets.length > 0 ? tickets.slice(0, 3).map((ticket, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${ticket.status === 'open' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`h-2 w-2 rounded-full mt-1.5 ${ticket.status === 'open' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                  <div>
                    <p className={`text-xs font-bold ${ticket.status === 'open' ? 'text-rose-700' : 'text-slate-700'}`}>{ticket.subject}</p>
                    <p className="text-[10px] text-muted-foreground">{ticket.tenant_name} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground italic text-xs">Aucune alerte en cours</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM ROW: RECENT CLIENTS & MODULE DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT SEC */}
        <Card className="border-none shadow-md bg-white lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b py-4">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Clients Récents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-muted/30">
                {recentClients.length > 0 ? recentClients.map((client) => (
                  <div key={client.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => navigate(`/saas/tenants/${client.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {client.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{client.name || 'Sans Nom'}</p>
                        <p className="text-xs text-muted-foreground">{client.admin_email || 'Sans contact'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="font-mono text-[10px]">{client.plan_name || 'Basic'}</Badge>
                      <Badge variant="outline" className={`border-0 ${client.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {client.subscription_status}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
                    </div>
                  </div>
                )) : <div className="p-8 text-center text-muted-foreground italic text-sm">Aucun client trouvé.</div>}
             </div>
          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card className="border-none shadow-md bg-white flex flex-col">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-purple-500" />
              Parts des Modules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center items-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={moduleDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {moduleDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2 mt-4">
              {moduleDistribution.map((mod: any, i: number) => (
                 <div key={i} className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: mod.color}} />
                     <span className="text-slate-600 font-medium">{mod.name}</span>
                   </div>
                   <span className="font-bold text-slate-900">{mod.value}%</span>
                 </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* DIALOG ALERTS */}
      <Dialog open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="text-rose-500" /> Logs Systèmes & Alertes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <p className="font-bold text-sm text-rose-700">Surcharge DB Mineure</p>
              <p className="text-xs text-rose-600/80">Pic à 92% détecté sur le cluster MySQL.</p>
              <p className="text-[10px] text-rose-500 mt-2 font-mono">15/06/2026 - 14:32:00</p>
            </div>
             <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="font-bold text-sm text-amber-700">Mise à jour SSL</p>
              <p className="text-xs text-amber-600/80">Certificats Let's Encrypt expiring in 4 days.</p>
              <p className="text-[10px] text-amber-500 mt-2 font-mono">15/06/2026 - 08:12:00</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG ANALYTICS */}
      <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BarChart2 className="text-blue-500" /> Analytics Détaillés</DialogTitle>
          </DialogHeader>
          <div className="p-4 mt-2">
             <p className="text-slate-500 text-sm italic mb-4">Le rapport complet de la plateforme est en cours de création. Voici un résumé instantané :</p>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border p-4 rounded-xl">
                  <p className="text-xs text-slate-500 font-bold uppercase">Volume de requêtes</p>
                  <p className="text-2xl font-black mt-1">1.2M <span className="text-xs font-normal">/ mois</span></p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                  <p className="text-xs text-emerald-600 font-bold uppercase">Nouveaux revenus</p>
                  <p className="text-2xl font-black mt-1">+125k <span className="text-xs font-normal">CFA</span></p>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
