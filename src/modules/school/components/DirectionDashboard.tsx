import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  ShieldCheck,
  FileBarChart,
  Target
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export function DirectionDashboard({ stats }: { stats: any; user: any }) {
  const data = stats.distribution || [];
  const COLORS = ['#0ea5e9', '#6366f1', '#f43f5e', '#10b981'];

  const financialStatus = [
    { name: 'Payé', value: 75 },
    { name: 'Attente', value: 25 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            Tableau de Bord Direction
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Vue stratégique et supervision globale de l'établissement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Effectif Total" value={stats.total_students || "850"} change="+12% cette année" changeType="positive" icon={Users} />
        <StatCard title="Moyenne Générale" value="14.2" change="Stabilité" changeType="neutral" icon={Target} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Taux de Présence" value="96.5%" change="Global" changeType="positive" icon={ShieldCheck} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Performance" value="+5.2%" change="vs An dernier" changeType="positive" icon={TrendingUp} iconClassName="bg-indigo-100 text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Croissance des Effectifs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <XAxis dataKey="class_level" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fill="#6366f1" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Recouvrement Scolarité</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {financialStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-6">
              {financialStatus.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-xs font-bold text-slate-500">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
