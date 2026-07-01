import { useState, useEffect } from "react";
import { Activity, Server, Database, Cpu, Zap, HardDrive, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Globe, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-service";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";

const uptimeHistory = [
  { t: "00:00", val: 100 }, { t: "02:00", val: 100 }, { t: "04:00", val: 99.8 },
  { t: "06:00", val: 100 }, { t: "08:00", val: 100 }, { t: "10:00", val: 100 },
  { t: "12:00", val: 99.9 }, { t: "14:00", val: 100 }, { t: "16:00", val: 100 },
  { t: "18:00", val: 100 }, { t: "20:00", val: 99.7 }, { t: "22:00", val: 100 },
];

const responseTimeHistory = [
  { t: "00:00", ms: 18 }, { t: "02:00", ms: 14 }, { t: "04:00", ms: 22 },
  { t: "06:00", ms: 19 }, { t: "08:00", ms: 35 }, { t: "10:00", ms: 28 },
  { t: "12:00", ms: 45 }, { t: "14:00", ms: 52 }, { t: "16:00", ms: 38 },
  { t: "18:00", ms: 25 }, { t: "20:00", ms: 20 }, { t: "22:00", ms: 17 },
];

const services = [
  { name: "Auth Engine", status: "online", latency: "12ms" },
  { name: "Notification Server", status: "online", latency: "8ms" },
  { name: "Database Cluster (MySQL)", status: "online", latency: "4ms" },
  { name: "CDN / Assets", status: "online", latency: "24ms" },
  { name: "SaaS Billing Worker", status: "online", latency: "15ms" },
  { name: "Backup System", status: "online", latency: "—" },
  { name: "Email SMTP Gateway", status: "degraded", latency: "120ms" },
  { name: "Cache Redis", status: "online", latency: "2ms" },
];

const MetricCard = ({ label, value, sub, icon: Icon, iconBg, progress, progressColor }: any) => (
  <Card className="p-6 rounded-2xl bg-white border-0 shadow-sm relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-20 h-20" />
    </div>
    <div className={`inline-flex p-2 rounded-xl mb-4 ${iconBg}`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h2 className="text-3xl font-black text-slate-900 mb-3">{value}</h2>
    {sub && <p className="text-xs text-slate-500 mb-3">{sub}</p>}
    {progress !== undefined && (
      <Progress value={progress} className={`h-1.5 bg-slate-100 ${progressColor}`} />
    )}
  </Card>
);

export default function SaaSHealth() {
  const [stats, setStats] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const data = await api.saas.stats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const degradedCount = services.filter(s => s.status !== "online").length;

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              Santé du Système
            </h1>
            <p className="text-slate-500 mt-1 text-sm">État en temps réel des clusters, de la base de données et des services.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Mis à jour {lastUpdated.toLocaleTimeString()}</span>
            <Button variant="outline" className="rounded-full font-bold bg-white border-slate-200 hover:bg-slate-50" onClick={loadData} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Rafraîchir
            </Button>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-black text-xs uppercase tracking-widest ${
              degradedCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              <div className={`h-2 w-2 rounded-full animate-pulse ${degradedCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {degradedCount > 0 ? `${degradedCount} service(s) dégradé(s)` : 'Tous les systèmes opérationnels'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 mt-4">

        {/* SYSTEM METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Charge CPU" value="12%" sub="2 cœurs actifs / 8 total" icon={Cpu} iconBg="bg-blue-100 text-blue-600" progress={12} />
          <MetricCard label="Utilisation RAM" value="4.2 GB" sub="Sur 16 GB total (26%)" icon={Database} iconBg="bg-purple-100 text-purple-600" progress={26} />
          <MetricCard label="Stockage Cluster" value="2.4 TB" sub="Sur 5 TB disponible (48%)" icon={HardDrive} iconBg="bg-amber-100 text-amber-600" progress={48} />
          <MetricCard label="Latence API" value="24ms" sub={`Uptime: 99.97%`} icon={Zap} iconBg="bg-emerald-100 text-emerald-600" />
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* UPTIME CHART */}
          <Card className="bg-white border-0 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-sm">
                <Activity className="w-4 h-4 text-emerald-500" /> Uptime (24h)
              </h3>
              <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">99.97%</Badge>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={uptimeHistory}>
                <defs>
                  <linearGradient id="gradUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[99, 100]} hide />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "11px" }} />
                <Area type="monotone" dataKey="val" name="Uptime %" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradUptime)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* RESPONSE TIME CHART */}
          <Card className="bg-white border-0 shadow-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-sm">
                <Clock className="w-4 h-4 text-blue-500" /> Temps de Réponse API (24h)
              </h3>
              <Badge className="bg-blue-100 text-blue-700 border-none font-bold">Moy. 24ms</Badge>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={responseTimeHistory}>
                <defs>
                  <linearGradient id="gradResp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="t" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "11px" }} />
                <Area type="monotone" dataKey="ms" name="Latence (ms)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gradResp)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* SERVICES STATUS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" /> État des Services
              </h3>
              <span className="text-xs text-slate-400">{services.filter(s => s.status === 'online').length}/{services.length} opérationnels</span>
            </div>
            <div className="divide-y divide-slate-50">
              {services.map((service, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      service.status === 'online' ? 'bg-emerald-500' :
                      service.status === 'degraded' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse'
                    }`} />
                    <span className="font-bold text-slate-700 text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 font-mono">{service.latency}</span>
                    <Badge className={`border-none text-[10px] font-bold uppercase ${
                      service.status === 'online' ? 'bg-emerald-100 text-emerald-700' :
                      service.status === 'degraded' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {service.status === 'online' ? <><CheckCircle2 className="w-3 h-3 mr-1" />OK</> :
                       service.status === 'degraded' ? <><AlertTriangle className="w-3 h-3 mr-1" />Dégradé</> :
                       <><XCircle className="w-3 h-3 mr-1" />Hors Ligne</>}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ADVISOR CARD + QUICK STATS */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs">Conseil Système</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Le cluster de base de données a connu un pic d'utilisation à 14h00. Une montée en charge de +2 instances est recommandée pour le prochain pic de facturation mensuel.
              </p>
              <Button className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl" onClick={() => {}}>
                Optimiser maintenant
              </Button>
            </Card>

            <Card className="bg-white border-0 shadow-sm rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Métriques Globales</h3>
              <div className="space-y-4">
                {[
                  { label: "Requêtes / heure", value: "~12,400" },
                  { label: "Erreurs 5xx (24h)", value: "3" },
                  { label: "Bande passante (24h)", value: "8.2 GB" },
                  { label: "Locataires actifs (live)", value: stats?.activeTenants ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">{label}</span>
                    <span className="text-sm font-black text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
