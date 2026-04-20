import { 
  Briefcase, 
  Users, 
  Target, 
  CheckSquare, 
  LineChart, 
  Zap, 
  Clock, 
  BarChart3, 
  DollarSign,
  TrendingUp,
  FileText,
  MessageSquare
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

const corporateData = [
  { month: "Jan", revenue: 2500000, expenses: 1800000 },
  { month: "Feb", revenue: 3200000, expenses: 2100000 },
  { month: "Mar", revenue: 2800000, expenses: 1900000 },
  { month: "Apr", revenue: 4100000, expenses: 2500000 },
  { month: "May", revenue: 5500000, expenses: 3100000 },
  { month: "Jun", revenue: 7800000, expenses: 4200000 },
];

export default function EnterpriseDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { label: "Nouveau Projet", icon: Target, color: "bg-indigo-600", url: "/enterprise/projects" },
    { label: "Ajouter Client", icon: Users, color: "bg-blue-500", url: "/enterprise/crm" },
    { label: "Nouvelle Tâche", icon: CheckSquare, color: "bg-emerald-500", url: "/enterprise/tasks" },
    { label: "Note de Frais", icon: FileText, color: "bg-orange-500", url: "/enterprise/finances" },
    { label: "Réunion / Meet", icon: MessageSquare, color: "bg-purple-600", url: "/enterprise/meetings" },
    { label: "Rapports RH", icon: Briefcase, color: "bg-rose-500", url: "/enterprise/hr" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Kiam Enterprise Console
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm italic">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Gestion de l'Entreprise — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
           <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
             <TrendingUp className="h-4 w-4" />
             Rapport Trimestriel
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clients Actifs"
          value="84"
          change="+12% ce mois"
          changeType="positive"
          icon={Users}
          className="border-none shadow-md"
        />
        <StatCard
          title="Projets en cours"
          value="15"
          change="3 terminés"
          changeType="neutral"
          icon={Target}
          iconClassName="bg-blue-100 text-blue-600"
          className="border-none shadow-md"
        />
        <StatCard
          title="Tasks Pending"
          value="42"
          change="Haute priorité"
          changeType="negative"
          icon={CheckSquare}
          iconClassName="bg-orange-100 text-orange-600"
          className="border-none shadow-md"
        />
        <StatCard
          title="Trésorerie"
          value="18.5M CFA"
          change="+5.2% profit"
          changeType="positive"
          icon={DollarSign}
          iconClassName="bg-emerald-100 text-emerald-600"
          className="border-none shadow-md"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 px-6 border-b">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-indigo-600">
            <Zap className="h-4 w-4 text-amber-500" />
            Outils de Management
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
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Évolution Financière (CA vs Charges)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={corporateData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenus" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} name="Charges" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              Tâches Prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
             {[
               { name: "Finaliser Audit Q1", priority: "Urgent", due: "Demain" },
               { name: "Meeting Client 'Total'", priority: "Haute", due: "14:00" },
               { name: "Renouvèlement Licences", priority: "Basse", due: "2 jours" },
               { name: "Update RH / Paie", priority: "Urgent", due: "Lundi" }
             ].map((t, i) => (
               <div key={i} className="flex items-center gap-3 border-b border-muted/30 pb-3 last:border-0 last:pb-0">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.priority === 'Urgent' ? 'bg-rose-500 animate-pulse' : 'bg-indigo-400'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.due}</p>
                  </div>
                  <Badge variant={t.priority === 'Urgent' ? 'destructive' : 'outline'} className="text-[8px] h-4">
                    {t.priority}
                  </Badge>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
