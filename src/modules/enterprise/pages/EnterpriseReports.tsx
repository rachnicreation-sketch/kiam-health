import { useState } from "react";
import {
  BarChart3, TrendingUp, DollarSign, Calendar, Clock, CheckCircle2,
  AlertCircle, Users, ArrowUpRight, ArrowDownRight, RefreshCw, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar
} from "recharts";

const performanceData = [
  { month: "Jan", marge: 35, prod: 82 },
  { month: "Fév", marge: 38, prod: 85 },
  { month: "Mar", marge: 36, prod: 79 },
  { month: "Avr", marge: 40, prod: 88 },
  { month: "Mai", marge: 42, prod: 91 },
  { month: "Jun", marge: 45, prod: 94 },
];

const projectRentability = [
  { name: "Audit SI Total", budget: 15000000, couts: 9200000, profit: 5800000 },
  { name: "CRM Sonatel", budget: 22000000, couts: 14800000, profit: 7200000 },
  { name: "App Mobile A", budget: 8500000, couts: 6100000, profit: 2400000 },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function EnterpriseReports() {
  const [loading, setLoading] = useState(false);

  const triggerRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-600" /> Rapports & Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Analyse de la rentabilité projet, des marges et de la charge collaborateurs.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={triggerRefresh}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Marge moyenne" value="41%" change="+2.5% ce trimestre" changeType="positive" icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Efficacité équipe" value="87%" change="Temps facturable" changeType="positive" icon={Users} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Profit consolidé" value="15.4M CFA" icon={DollarSign} iconClassName="bg-indigo-100 text-indigo-600" />
        <StatCard title="Projets rentables" value="3/3" change="100% dans le budget" changeType="positive" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Rentabilité Comparée des Projets
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectRentability}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold", fill: "#9499AE" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9499AE" }} tickFormatter={v => `${v / 1000000}M`} />
                <Tooltip formatter={v => fmt(Number(v))} />
                <Bar dataKey="budget" name="Budget" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="couts" name="Coûts réels" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Marge nette" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Analyse Trimestrielle
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9499AE" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9499AE" }} />
                <Tooltip />
                <Area type="monotone" dataKey="marge" name="Taux de marge (%)" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
                <Area type="monotone" dataKey="prod" name="Taux d'utilisation (%)" stroke="#10b981" fill="#10b981" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
