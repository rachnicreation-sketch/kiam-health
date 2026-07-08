import { useState } from "react";
import {
  Activity, BarChart3, TrendingUp, Users, Calendar, Shield,
  Plus, Search, Filter, Download, ArrowUpRight, CheckCircle2,
  ChevronRight, AlertCircle, Landmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line
} from "recharts";

const patholData = [
  { name: "Paludisme", cas: 145 },
  { name: "Hypertension", cas: 89 },
  { name: "Diabète", cas: 64 },
  { name: "Gastro-entérite", cas: 120 },
  { name: "Infections resp.", cas: 180 },
];

const trendData = [
  { month: "Jan", Paludisme: 90, Grippe: 45 },
  { month: "Fév", Paludisme: 85, Grippe: 60 },
  { month: "Mar", Paludisme: 110, Grippe: 50 },
  { month: "Avr", Paludisme: 130, Grippe: 35 },
  { month: "Mai", Paludisme: 160, Grippe: 25 },
  { month: "Jun", Paludisme: 145, Grippe: 30 },
];

export default function EpidemioStats() {
  const { toast } = useToast();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Activity className="h-7 w-7 text-sky-600" /> Statistiques Épidémiologiques
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Surveillance des pathologies fréquentes et tableaux de bord de santé publique multisites.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Données actualisées" })}>
          <Download className="h-4 w-4" /> Exporter le rapport ministériel
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Cas signalés (ce mois)" value="598" change="+12% vs mois dernier" changeType="negative" icon={Activity} iconClassName="bg-sky-100 text-sky-600" />
        <StatCard title="Pathologie majeure" value="Inf. resp." change="30% du volume total" changeType="neutral" icon={AlertCircle} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Taux de guérison" value="94.5%" changeType="positive" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Alertes sanitaires" value="0" change="Aucun foyer détecté" changeType="positive" icon={Shield} iconClassName="bg-blue-100 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Répartition des pathologies fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={patholData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold", fill: "#9499AE" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9499AE" }} />
                <Tooltip />
                <Bar dataKey="cas" name="Nombre de cas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Évolution des tendances</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9499AE" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9499AE" }} />
                <Tooltip />
                <Line type="monotone" dataKey="Paludisme" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Grippe" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
