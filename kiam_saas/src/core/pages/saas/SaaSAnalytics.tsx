import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, Users, Building2, DollarSign, PieChart as PieChartIcon,
  Calendar, Download, RefreshCw, ArrowUpRight, ArrowDownRight, Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { api } from "@/lib/api-service";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const StatBadge = ({ value, positive }: { value: string; positive: boolean }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
    {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
    {value}
  </span>
);

const revenueMonthly = [
  { name: "Jan", mrr: 120000, arr: 1440000, new_tenants: 2 },
  { name: "Fév", mrr: 145000, arr: 1740000, new_tenants: 3 },
  { name: "Mar", mrr: 175000, arr: 2100000, new_tenants: 4 },
  { name: "Avr", mrr: 210000, arr: 2520000, new_tenants: 5 },
  { name: "Mai", mrr: 245000, arr: 2940000, new_tenants: 3 },
  { name: "Juin", mrr: 280000, arr: 3360000, new_tenants: 6 },
];

const retentionData = [
  { month: "Jan", retention: 95, churn: 5 },
  { month: "Fév", retention: 96, churn: 4 },
  { month: "Mar", retention: 94, churn: 6 },
  { month: "Avr", retention: 97, churn: 3 },
  { month: "Mai", retention: 96, churn: 4 },
  { month: "Juin", retention: 98, churn: 2 },
];

const ticketTrend = [
  { day: "Lun", open: 5, closed: 8 },
  { day: "Mar", open: 3, closed: 6 },
  { day: "Mer", open: 7, closed: 4 },
  { day: "Jeu", open: 2, closed: 9 },
  { day: "Ven", open: 4, closed: 5 },
  { day: "Sam", open: 1, closed: 2 },
  { day: "Dim", open: 0, closed: 1 },
];

export default function SaaSAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.saas.stats();
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const moduleData = stats?.modulesUsageChart?.length ? stats.modulesUsageChart : [
    { name: "Santé", value: 40, color: "#3b82f6" },
    { name: "Commerce", value: 30, color: "#10b981" },
    { name: "École", value: 20, color: "#f59e0b" },
    { name: "Hôtel", value: 10, color: "#8b5cf6" },
  ];

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              Analyse des Données
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Revenus, rétention, croissance et performance opérationnelle.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Switcher */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 gap-1">
              {(["week", "month", "year"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${period === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </Button>
            <Button size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-bold text-white">
              <Download className="w-4 h-4 mr-2" /> Exporter
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1800px] mx-auto space-y-8 mt-4">

        {/* TOP KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "MRR Actuel", value: `${Number(stats?.totalMRR || 280000).toLocaleString()} XAF`,
              sub: "Revenu mensuel récurrent", badge: "+14%", pos: true, icon: DollarSign, color: "bg-emerald-100 text-emerald-600"
            },
            {
              label: "ARR Estimé", value: `${Number((stats?.totalARR || 3360000)).toLocaleString()} XAF`,
              sub: "Revenu annuel récurrent", badge: "+14%", pos: true, icon: TrendingUp, color: "bg-blue-100 text-blue-600"
            },
            {
              label: "Taux de Rétention", value: "97.8%", sub: "Moy. sur 6 mois", badge: "+2.1%", pos: true, icon: Users, color: "bg-purple-100 text-purple-600"
            },
            {
              label: "Taux de Churn", value: "2.2%", sub: "Désabonnements", badge: "-1.3%", pos: false, icon: Building2, color: "bg-rose-100 text-rose-600"
            },
          ].map(({ label, value, sub, badge, pos, icon: Icon, color }) => (
            <Card key={label} className="bg-white border-0 shadow-sm rounded-2xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
                <StatBadge value={badge} positive={pos} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</p>
              <p className="text-xs text-slate-400 font-medium">{sub}</p>
            </Card>
          ))}
        </div>

        {/* MAIN CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MRR EVOLUTION */}
          <Card className="lg:col-span-2 bg-white border-0 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Évolution MRR & Nouveaux Locataires
                </h3>
                <p className="text-xs text-slate-400 mt-1">Croissance des revenus sur 6 mois</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">+133% YTD</Badge>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueMonthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMrr2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                <Legend />
                <Area type="monotone" dataKey="mrr" name="MRR (XAF)" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradMrr2)" />
                <Bar dataKey="new_tenants" name="Nouveaux Locataires" fill="#10b981" radius={[4, 4, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* MODULE PIE */}
          <Card className="bg-white border-0 shadow-sm rounded-2xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-500" /> Adoption par Secteur
              </h3>
              <p className="text-xs text-slate-400 mt-1">Répartition des {stats?.totalTenants ?? 0} locataires</p>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={moduleData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                    {moduleData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {moduleData.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-slate-600 font-medium">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{m.count ?? '—'} clients</span>
                    <span className="font-black text-slate-900">{m.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RETENTION + TICKETS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* RETENTION CHART */}
          <Card className="bg-white border-0 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Rétention & Churn (6 mois)
              </h3>
              <Badge className="bg-blue-50 text-blue-700 border-none font-bold">Excellent</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "11px" }} />
                <Legend />
                <Line type="monotone" dataKey="retention" name="Rétention %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} />
                <Line type="monotone" dataKey="churn" name="Churn %" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: "#f43f5e" }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* TICKET TREND */}
          <Card className="bg-white border-0 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-500" /> Tickets Support (7 jours)
              </h3>
              <Badge className="bg-rose-50 text-rose-700 border-none font-bold">{stats?.openTickets ?? 0} ouverts</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketTrend} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "11px" }} />
                <Legend />
                <Bar dataKey="open" name="Ouverts" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" name="Résolus" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* PERFORMANCE TABLE */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tighter flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Performance Mensuelle Détaillée
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Mois", "MRR (XAF)", "ARR Estimé", "Nouveaux Locataires", "Croissance MRR"].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {revenueMonthly.map((row, i) => {
                  const prev = i > 0 ? revenueMonthly[i - 1].mrr : row.mrr;
                  const growth = i > 0 ? ((row.mrr - prev) / prev * 100).toFixed(1) : "—";
                  return (
                    <tr key={row.name} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{row.name} 2026</td>
                      <td className="px-6 py-4 font-black text-emerald-700">{Number(row.mrr).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{Number(row.arr).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-blue-100 text-blue-700 border-none font-bold">+{row.new_tenants}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {growth !== "—" ? (
                          <StatBadge value={`${growth}%`} positive={parseFloat(growth as string) >= 0} />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
