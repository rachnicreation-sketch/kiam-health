import { 
  BarChart3, 
  Users as UsersIcon, 
  Target, 
  Clock, 
  ShoppingBag,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface ErpManagerDashboardProps {
  stats: any;
  user: any;
}

const teamData = [
  { name: 'Caisse 1', sales: 450000 },
  { name: 'Caisse 2', sales: 320000 },
  { name: 'Caisse 3', sales: 580000 },
];

export function ErpManagerDashboard({ stats, user }: ErpManagerDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" /> Supervision Opérationnelle
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion des équipes et suivi des objectifs de vente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold gap-2 border-slate-200" onClick={() => navigate('/erp/inventory')}>
             Inventaire
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 text-white">
             Rapport du Jour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ventes (Équipe)" value={`${Number(stats.today_revenue || 0).toLocaleString()} CFA`} change="Objectif 80%" changeType="positive" icon={TrendingUp} className="bg-white" />
        <StatCard title="Employés Actifs" value="4" icon={UsersIcon} className="bg-white" />
        <StatCard title="Produits Phares" value="12" icon={ShoppingBag} className="bg-white" />
        <StatCard title="Anomalies" value="0" icon={AlertCircle} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
             <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Performance par Caisse</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-indigo-600 text-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="p-8">
             <CardTitle className="text-xl font-black">Objectifs du Jour</CardTitle>
             <p className="text-indigo-200 text-sm">Progression vers le CA cible</p>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                   <span>CA Global</span>
                   <span>75%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-white w-[75%] rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"><Target className="h-4 w-4" /></div>
                   <p className="text-xs font-bold">Ventes flash: +5% espéré</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"><Clock className="h-4 w-4" /></div>
                   <p className="text-xs font-bold">Relève caisse: 16h00</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
