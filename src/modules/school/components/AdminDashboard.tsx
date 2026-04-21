import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  TrendingUp, 
  AlertCircle,
  Plus,
  UserPlus,
  Calendar
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-sky-600" /> Cockpit Direction
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion globale de l'établissement et indicateurs clés.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-sky-600 hover:bg-sky-700 font-bold gap-2" onClick={onAddStudent}>
            <UserPlus className="w-4 h-4" /> Inscrire un Élève
          </Button>
          <Button variant="outline" className="font-bold gap-2" onClick={() => navigate('/school/classes')}>
            <Plus className="w-4 h-4" /> Nouvelle Classe
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Élèves" value={stats.total_students || "0"} icon={Users} className="bg-white" />
        <StatCard title="Classes Actives" value={stats.classes_count || "0"} change="En cours" changeType="positive" icon={BookOpen} iconClassName="bg-emerald-100 text-emerald-600" className="bg-white" />
        <StatCard title="Présence Jour" value={`${stats.today_attendance || 0}%`} change="Moyenne" changeType="neutral" icon={ClipboardCheck} iconClassName="bg-sky-100 text-sky-600" className="bg-white" />
        <StatCard title="Revenus Mensuels" value={`${Number(stats.revenue || 0).toLocaleString()} CFA`} change="+12%" changeType="positive" icon={TrendingUp} iconClassName="bg-indigo-100 text-indigo-600" className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Flux des Effectifs</CardTitle>
                <CardDescription>Croissance des inscriptions par niveau</CardDescription>
              </div>
              <Badge className="bg-edu-gradient text-white border-none px-4 py-1">Direct</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats.distribution || []}>
                      <defs>
                        <linearGradient id="colorEdu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <ReXAxis dataKey="class_level" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <ReYAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <ReTooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorEdu)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Alertes Administratives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             <div className="flex gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                   <p className="text-xs font-bold text-rose-900">12 Impayés détectés</p>
                   <p className="text-[10px] text-rose-700">Relance automatique prévue demain.</p>
                </div>
             </div>
             <div className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                   <p className="text-xs font-bold text-amber-900">Conseil de classe</p>
                   <p className="text-[10px] text-amber-700">Prévu le 25 Octobre à 14h00.</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
