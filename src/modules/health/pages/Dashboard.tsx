import { useState, useEffect } from "react";
import { 
  Users, 
  Stethoscope, 
  BedDouble, 
  Receipt, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Activity,
  PlusCircle,
  FileText,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  Zap,
  Microscope,
  Coins
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { Patient, Appointment, Consultation } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

const weeklyData = [
  { day: "Lun", consultations: 45, admissions: 12 },
  { day: "Mar", consultations: 52, admissions: 8 },
  { day: "Mer", consultations: 38, admissions: 15 },
  { day: "Jeu", consultations: 61, admissions: 10 },
  { day: "Ven", consultations: 55, admissions: 14 },
  { day: "Sam", consultations: 30, admissions: 6 },
  { day: "Dim", consultations: 18, admissions: 4 },
];

export default function Dashboard() {
  const { user, clinic } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.clinicId) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.stats.get(user.clinicId);
      setStats(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les statistiques." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats && isLoading) {
    return <div className="flex items-center justify-center h-screen italic text-muted-foreground">Chargement du tableau de bord...</div>;
  }

  const patients = stats?.recentPatients || [];
  const appointments = stats?.upcomingAppointments || [];
  const consToday = stats?.consultationsToday || 0;
  const totalPatients = stats?.totalPatients || 0;
  const hospitalizedCount = stats?.hospitalizedCount || 0;
  const revenueToday = stats?.revenueToday || 0;

  const quickActions = [
    { label: "Nouveau Patient", icon: UserPlus, color: "bg-blue-500", url: "/patients" },
    { label: "Nouvelle Consult.", icon: Stethoscope, color: "bg-orange-500", url: "/consultations" },
    { label: "Nouveau RDV", icon: Calendar, color: "bg-emerald-500", url: "/appointments" },
    { label: "Admission Hosp.", icon: BedDouble, color: "bg-rose-500", url: "/hospitalization" },
    { label: "Encaisser Facture", icon: Coins, color: "bg-purple-600", url: "/billing" },
    { label: "Résultats Labo", icon: Microscope, color: "bg-cyan-600", url: "/laboratory" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm italic">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
            {clinic?.name || 'Établissement médical'} — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2" onClick={() => navigate('/reports')}>
             <Activity className="h-4 w-4" />
             Rapports
           </Button>
           <Button size="sm" className="flex items-center gap-2" onClick={() => navigate('/consultations')}>
             <PlusCircle className="h-4 w-4" />
             Consultation Rapide
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={String(totalPatients)}
          change="Total enregistrés"
          changeType="positive"
          icon={Users}
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer"
          onClick={() => navigate('/patients')}
        />
        <StatCard
          title="Consultations"
          value={String(consToday)}
          change="Aujourd'hui"
          changeType={consToday > 0 ? "positive" : "neutral"}
          icon={Stethoscope}
          iconClassName="bg-primary/10 text-primary"
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer"
          onClick={() => navigate('/consultations')}
        />
        <StatCard
          title="Hospitalisés"
          value={String(hospitalizedCount)}
          change="En cours"
          changeType="neutral"
          icon={BedDouble}
          iconClassName="bg-rose-100 text-rose-600"
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer"
          onClick={() => navigate('/hospitalization')}
        />
        <StatCard
          title="Recettes"
          value={`${Number(revenueToday).toLocaleString()} CFA`}
          change="Aujourd'hui"
          changeType="positive"
          icon={Receipt}
          iconClassName="bg-emerald-100 text-emerald-600"
          className="border-none shadow-md hover:translate-y-[-2px] transition-transform cursor-pointer"
          onClick={() => navigate('/billing')}
        />
      </div>

      {/* Quick Actions - NEW */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 px-6 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
            <Zap className="h-4 w-4 text-orange-500" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.url)}
                className="relative flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 group transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${action.color}`}></div>
                <div className={`${action.color} text-white p-3.5 rounded-2xl mb-3 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-center text-slate-600 leading-tight group-hover:text-slate-900 transition-colors px-1 relative z-10">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                Activité des Consultations
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary font-bold">Rapport annuel →</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="consultations" 
                  stroke="#1A56DB" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCons)" 
                  name="Consultations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Next/Right column: Vitals Alerts or Notifications */}
        <div className="flex flex-col gap-6">
            <Card className="border-none shadow-md bg-primary text-primary-foreground overflow-hidden relative">
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-2xl"></div>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-80">Gardes du jour</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-3">
                  {stats?.dailyGuards?.length > 0 ? (
                    stats.dailyGuards.map((g: any) => (
                      <div key={g.id} className="flex items-center gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                          {g.doctor_name?.[0]}{g.doctor_name?.split(' ')?.[1]?.[0] || ''}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{g.doctor_name}</p>
                          <p className="text-[10px] opacity-70 italic">{g.shift_type || 'Service'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] italic opacity-70">Aucune garde planifiée</p>
                  )}
                </div>
                <Button variant="ghost" onClick={() => navigate('/planning')} className="w-full mt-4 h-8 text-[11px] text-white hover:bg-white/10 font-bold uppercase tracking-wider">
                  Planning complet →
                </Button>
              </CardContent>
           </Card>

           <Card className="border-none shadow-md bg-white flex-1">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Prochains RDV
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 {appointments.length === 0 ? (
                   <p className="text-center py-4 text-xs italic text-muted-foreground">Aucun rendez-vous</p>
                 ) : (
                   appointments.slice(0, 3).map(a => (
                     <div key={a.id} className="flex items-center gap-3 border-b border-muted/30 pb-3 last:border-0 last:pb-0 group cursor-pointer">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold leading-none uppercase">{new Date().toLocaleDateString('fr-FR', { month: 'short' })}</span>
                          <span className="text-lg font-extrabold leading-none">{new Date().getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold group-hover:text-primary transition-colors">{a.patient || (a as any).patient_name || 'Patient inconnu'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{(a.time || (a as any).appointment_time || '').substring(0, 5)} — {a.doctor || (a as any).doctor_name || 'Dr'}</p>
                        </div>
                     </div>
                   ))
                 )}
              </CardContent>
              {stats?.vitalsAlerts?.length > 0 && (
                <div className="p-4 border-t bg-rose-50/50">
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-3 w-3" /> Alertes Vitales
                  </p>
                  <div className="space-y-2">
                    {stats.vitalsAlerts.slice(0, 2).map((v: any) => (
                      <div key={v.id} className="bg-white p-2 rounded-lg border border-rose-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold">{v.patient_name}</span>
                        <Badge className="h-4 text-[9px] bg-rose-500">{v.temp}°C</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </Card>
        </div>
      </div>

      {/* Footer Row: Recent Patients */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Derniers Patients Enregistrés
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/patients')} className="text-primary font-bold text-xs uppercase">Tout voir →</Button>
        </CardHeader>
        <CardContent className="p-0">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-y md:divide-y-0">
              {patients.slice(0, 4).map((p) => (
                <div 
                  key={p.id} 
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-center gap-3"
                  onClick={() => navigate(`/patients/${p.id}`)}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 font-bold ${p.gender === 'F' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    {p.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate leading-none mb-1">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{p.id}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Badge variant="outline" className="h-4 text-[9px] px-1 font-mono">{p.bloodGroup || (p as any).blood_group || '?'}</Badge>
                      <span className="text-[10px] text-muted-foreground">{p.city}</span>
                    </div>
                  </div>
                </div>
              ))}
              {patients.length === 0 && <div className="col-span-4 p-8 text-center text-muted-foreground italic">Aucun patient enregistré</div>}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
