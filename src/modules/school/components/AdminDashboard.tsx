import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  TrendingUp, 
  AlertCircle,
  Plus,
  UserPlus,
  Calendar,
  ArrowUpRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart as ReBarChart, Bar as ReBar, XAxis as ReXAxis, YAxis as ReYAxis, CartesianGrid as ReCartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface AdminDashboardProps {
  stats: any;
  onAddStudent: () => void;
}

export function SchoolAdminDashboard({ stats, onAddStudent }: AdminDashboardProps) {
  const navigate = useNavigate();

  const enrollmentData = stats.distribution || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-sky-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            Cockpit de Direction
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion stratégique et pilotage académique de l'établissement.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onAddStudent} className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-sky-200 h-11 px-6 rounded-xl">
            <UserPlus className="w-4 h-4" /> Inscrire un Élève
          </Button>
          <Button variant="outline" className="bg-white font-bold gap-2 border-slate-200 h-11 px-6 rounded-xl" onClick={() => navigate('/school/classes')}>
            <Plus className="w-4 h-4" /> Nouvelle Classe
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Élèves" value={stats.total_students || "0"} change="Inscrits" changeType="neutral" icon={Users} className="bg-white border-none shadow-sm" />
        <StatCard title="Classes actives" value={stats.classes_count || "0"} change="Organisation" changeType="neutral" icon={BookOpen} iconClassName="bg-indigo-100 text-indigo-600" className="bg-white border-none shadow-sm" />
        <StatCard title="Enseignants" value="42" change="Corps professoral" changeType="neutral" icon={ClipboardCheck} iconClassName="bg-sky-100 text-sky-600" className="bg-white border-none shadow-sm" />
        <StatCard title="Inscriptions" value="12" change="Cette semaine" changeType="positive" icon={UserPlus} iconClassName="bg-emerald-100 text-emerald-600" className="bg-white border-none shadow-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Flux des Effectifs</CardTitle>
                <CardDescription className="mt-1">Répartition des élèves par niveau d'étude</CardDescription>
              </div>
              <Badge className="bg-sky-100 text-sky-600 border-none px-4 py-1 font-bold">2025-2026</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={`school-chart-${enrollmentData.length}`} data={enrollmentData}>
                  <defs>
                    <linearGradient id="schoolChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <ReXAxis dataKey="class_level" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <ReYAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <ReTooltip
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#schoolChart)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
            <CardHeader className="bg-slate-50/50 border-b p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Alertes Direction</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100 transition-all hover:scale-[1.02]">
                <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-900 uppercase tracking-wide">Paiements en attente</p>
                  <p className="text-sm font-black text-rose-700">12 dossiers critiques</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 transition-all hover:scale-[1.02]">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">Conseil de Classe</p>
                  <p className="text-sm font-black text-amber-700">Vendredi 25 Oct.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-sky-600 text-white overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-6">
              <h3 className="text-lg font-black leading-tight mb-2">Inscriptions Récentes</h3>
              <div className="space-y-3 mt-4">
                {(stats.recent_enrollments || []).map((enroll: any) => (
                  <div key={enroll.id} className="flex items-center justify-between p-2 bg-white/10 rounded-xl">
                    <div>
                      <p className="text-xs font-bold">{enroll.name}</p>
                      <p className="text-[10px] opacity-60">{enroll.class}</p>
                    </div>
                    <Badge className="bg-white/20 text-[9px] font-black uppercase">Actif</Badge>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4 text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold gap-2">
                Voir tous les étudiants <ArrowUpRight className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
