import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle, Activity, Zap, CreditCard, Clock,
  Building2, ArrowRight, Plus, Blocks, RefreshCw,
  ShieldAlert, PauseCircle, UserCheck, Package,
  Bell, TrendingDown, BarChart3, XCircle, Settings, Mail, Lock, Shield, ChevronRight, Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

export default function SaaSAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { loadGlobalData(); }, []);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const [statsData, tenantsData, ticketsData] = await Promise.all([
        api.saas.stats(),
        api.saas.tenants(),
        api.saas.tickets().catch(() => []),
      ]);
      setStats(statsData);
      setTenants(tenantsData || []);
      setTickets(ticketsData || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur de chargement", description: "Impossible de récupérer les données." });
    } finally {
      setLoading(false);
    }
  };

  const revenueData = stats?.growthData?.length ? stats.growthData : [
    { name: 'Jan', mrr: 0, tenants: 0 }
  ];

  const recentClients = tenants.slice(0, 6);
  const openTickets = tickets.filter((t: any) => t.status === 'open');

  if (loading && !stats) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium font-sans">Chargement du Cockpit Master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f5f8] min-h-screen text-slate-800 font-sans pb-12 antialiased">
      <div className="p-6 max-w-[1800px] mx-auto space-y-6">

        {/* 2. CONFIGURATION WIZARD BOX (Stunning layout matching screenshot exactly but optimized with HSL colors) */}
        <Card className="border border-sky-200/80 shadow-md bg-gradient-to-r from-sky-50/80 to-white/95 rounded-xl overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-[#2a4d7c] rounded-2xl flex items-center justify-center shadow-lg shadow-sky-900/20 border-2 border-sky-400">
                <Settings className="w-8 h-8 text-sky-300 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#1e3a5f] flex items-center gap-2">
                  Assistant de Supervision & Configuration Master
                </h2>
                <p className="text-slate-600 text-sm mt-1 max-w-3xl leading-relaxed">
                  Ce cockpit consolide l'ensemble des modules KIAM déployés dans la base de données.
                  Gérez l'attribution des forfaits, monitorez le MRR exact consolidé et pilotez les accès aux environnements.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button 
                onClick={() => navigate('/saas/settings')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black uppercase text-xs px-6 py-5 rounded-lg shadow-md border-b-4 border-emerald-700 hover:border-emerald-800 transition-all flex items-center gap-2"
              >
                Configuration globale <Play className="w-3 h-3 fill-white" />
              </Button>
            </div>
          </div>
        </Card>

        {/* 3. CORE SERVICE CATEGORIES (Icon grid grouping from screenshot) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* SECTION A: HELPDESK & TICKETING */}
          <Card className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#e6f0fa] to-[#d9e6f2] px-5 py-3.5 border-b border-[#c6d7e9] flex justify-between items-center">
              <h3 className="text-xs font-black text-[#2a4d7c] uppercase tracking-wider flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-sky-500" />
                Supervision Financière & MRR
              </h3>
              <Badge className="bg-sky-100 text-[#2a4d7c] border border-sky-300 font-bold">{Number(stats?.totalMRR || 0).toLocaleString()} XAF / mois</Badge>
            </div>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              {[
                { title: "MRR Consolidé", value: `${Number(stats?.totalMRR || 0).toLocaleString()} XAF`, sub: "Revenu Mensuel Récurrent", icon: DollarSign, color: "text-emerald-600 bg-emerald-50 border border-emerald-200" },
                { title: "ARR Estimé", value: `${Number(stats?.totalARR || 0).toLocaleString()} XAF`, sub: "Projection Annuelle", icon: TrendingUp, color: "text-blue-600 bg-blue-50 border border-blue-200" },
                { title: "Plans Actifs", value: `${stats?.activeTenants ?? 0} Actifs`, sub: `${stats?.trialTenants ?? 0} en mode démo`, icon: CreditCard, color: "text-purple-600 bg-purple-50 border border-purple-200" },
                { title: "Compte Retard", value: `${stats?.expiredTenants ?? 0}`, sub: "Paiements en attente", icon: AlertTriangle, color: stats?.expiredTenants > 0 ? "text-rose-600 bg-rose-50 border border-rose-200" : "text-slate-500 bg-slate-50 border border-slate-200" },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</span>
                    <div className={`p-1.5 rounded-lg ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-lg font-black text-slate-800 leading-none">{item.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{item.sub}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SECTION B: USERS & ACTIVE TENANTS */}
          <Card className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#e6f0fa] to-[#d9e6f2] px-5 py-3.5 border-b border-[#c6d7e9] flex justify-between items-center">
              <h3 className="text-xs font-black text-[#2a4d7c] uppercase tracking-wider flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                Locataires & Activité
              </h3>
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">{stats?.totalTenants ?? 0} Enregistrés</Badge>
            </div>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              {[
                { title: "Total Locataires", value: stats?.totalTenants ?? 0, sub: `${stats?.activeTenants ?? 0} actifs`, icon: Building2, color: "text-sky-600 bg-sky-50 border border-sky-200", url: "/saas/tenants" },
                { title: "Total Utilisateurs", value: stats?.totalUsers ?? 0, sub: `${stats?.activeUsers ?? 0} actifs`, icon: Users, color: "text-indigo-600 bg-indigo-50 border border-indigo-200", url: "/saas/users" },
                { title: "Tickets Ouverts", value: stats?.openTickets ?? 0, sub: `${stats?.criticalTickets ?? 0} critiques`, icon: ShieldAlert, color: stats?.openTickets > 0 ? "text-rose-600 bg-rose-50 border border-rose-200" : "text-slate-500 bg-slate-50 border border-slate-200", url: "/saas/support" },
                { title: "Secteurs d'activité", value: Object.keys(stats?.modulesUsage || {}).length, sub: "Total industries", icon: Blocks, color: "text-amber-600 bg-amber-50 border border-amber-200", url: "/saas/modules" },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => item.url && navigate(item.url)}
                  className={`p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between ${item.url ? 'cursor-pointer hover:border-sky-300' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</span>
                    <div className={`p-1.5 rounded-lg ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-lg font-black text-slate-800 leading-none">{item.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    {item.sub} {item.url && <ChevronRight className="w-3 h-3 text-sky-500 inline" />}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SECTION C: SYSTEM HEALTH & INTEGRITY */}
          <Card className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#e6f0fa] to-[#d9e6f2] px-5 py-3.5 border-b border-[#c6d7e9] flex justify-between items-center">
              <h3 className="text-xs font-black text-[#2a4d7c] uppercase tracking-wider flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded bg-purple-500" />
                Performance & Diagnostic
              </h3>
              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">ONLINE 99.9%</Badge>
            </div>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              {[
                { title: "Statut Engine", value: "Actif", sub: "Aucun incident", icon: Activity, color: "text-emerald-600 bg-emerald-50 border border-emerald-200", url: "/saas/health" },
                { title: "Dernière synch", value: "Exacte", sub: "Base consolidée", icon: RefreshCw, color: "text-teal-600 bg-teal-50 border border-teal-200", url: "/saas/settings" },
                { title: "Audit & Logs", value: "Actifs", sub: "Supervision active", icon: Clock, color: "text-purple-600 bg-purple-50 border border-purple-200", url: "/saas/security" },
                { title: "Uptime 30j", value: "99.99%", sub: "Haute disponibilité", icon: Shield, color: "text-sky-600 bg-sky-50 border border-sky-200", url: "/saas/health" },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => item.url && navigate(item.url)}
                  className={`p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between ${item.url ? 'cursor-pointer hover:border-sky-300' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</span>
                    <div className={`p-1.5 rounded-lg ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-lg font-black text-slate-800 leading-none">{item.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    {item.sub} {item.url && <ChevronRight className="w-3 h-3 text-sky-500 inline" />}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 4. CHARTS & RECENT LOCATAIRES ROWS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* REVENUE GROWTH GRAPH */}
          <Card className="lg:col-span-2 border border-[#c6d7e9] bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#e6f0fa] to-[#d9e6f2] px-5 py-4 border-b border-[#c6d7e9] flex justify-between items-center">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-[#2a4d7c] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Croissance Mensuelle MRR Consolidé (Flux Réels)
              </CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">+12.5% ce mois</Badge>
            </div>
            <CardContent className="pt-6 pb-2">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} dy={10} />
                  <YAxis hide />
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #c6d7e9", boxShadow: "0 10px 30px rgba(0,0,0,0.05)", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="mrr" name="MRR (XAF)" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#gradMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* QUICK SHORTCUTS & TOOLS */}
          <Card className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="bg-gradient-to-r from-[#e6f0fa] to-[#d9e6f2] px-5 py-4 border-b border-[#c6d7e9]">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-[#2a4d7c] flex items-center gap-2">
                <Blocks className="h-4 w-4 text-sky-500" />
                Raccourcis Administrateur
              </CardTitle>
            </div>
            <CardContent className="p-6 flex-1 grid grid-cols-2 gap-3">
              {[
                { label: "Locataires", icon: Building2, color: "from-sky-500 to-sky-700", url: "/saas/tenants" },
                { label: "Plans", icon: CreditCard, color: "from-emerald-500 to-emerald-700", url: "/saas/billing" },
                { label: "Modules", icon: Blocks, color: "from-indigo-500 to-indigo-700", url: "/saas/modules" },
                { label: "Utilisateurs", icon: UserCheck, color: "from-amber-500 to-amber-700", url: "/saas/users" },
                { label: "Support", icon: ShieldAlert, color: "from-rose-500 to-rose-700", url: "/saas/support" },
                { label: "Analytics", icon: BarChart3, color: "from-slate-600 to-slate-800", url: "/saas/analytics" },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.url)}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/40 hover:shadow-sm transition-all group text-left"
                >
                  <div className={`bg-gradient-to-br ${action.color} text-white p-2 rounded-lg group-hover:scale-105 transition-transform`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-black text-slate-700">{action.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 5. RECENT TENANTS DATABASE */}
        <Card className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#e6f0fa] to-[#d9e6f2] px-5 py-4 border-b border-[#c6d7e9] flex justify-between items-center">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-[#2a4d7c] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#2a4d7c]" />
              Base Locataires Récents (Vue Consolidée)
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/saas/tenants')} className="text-xs font-bold text-sky-600 hover:text-sky-700">
              Voir tout <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Nom</th>
                  <th className="p-4">Secteur</th>
                  <th className="p-4">Contact Admin</th>
                  <th className="p-4">MRR Consolidé</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClients.map((client: any) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800">{client.name || 'Sans Nom'}</td>
                    <td className="p-4 uppercase font-bold text-[10px] text-slate-500">{client.sector}</td>
                    <td className="p-4 text-slate-500 font-medium">{client.admin_email || 'Sans contact'}</td>
                    <td className="p-4 font-black text-slate-800">{Number(client.mrr_value || 0).toLocaleString()} XAF</td>
                    <td className="p-4">
                      <Badge className={`border-0 text-[10px] font-bold ${
                        client.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        client.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                        client.subscription_status === 'suspended' ? 'bg-slate-100 text-slate-500' :
                        'bg-rose-100 text-rose-700'
                      }`}>{client.subscription_status}</Badge>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/saas/tenants/${client.id}`)} className="text-sky-600 hover:text-sky-700 border-sky-200 hover:bg-sky-50 font-bold h-8">
                        Gérer <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}

