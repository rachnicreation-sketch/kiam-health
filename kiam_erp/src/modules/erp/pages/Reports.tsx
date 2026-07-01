import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon,
  ArrowLeft,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user?.clinicId) return;
    const data = await api.erp.stats(user.clinicId);
    setStats(data);
  };

  const salesData = [
    { name: 'Jan', revenue: 4500000, profit: 1200000 },
    { name: 'Feb', revenue: 5200000, profit: 1400000 },
    { name: 'Mar', revenue: 3800000, profit: 900000 },
    { name: 'Apr', revenue: 6100000, profit: 1800000 },
    { name: 'May', revenue: 8500000, profit: 2500000 },
    { name: 'Jun', revenue: 12000000, profit: 4000000 },
  ];

  const categoryData = stats?.distribution?.map((d: any) => ({
    name: d.category,
    value: parseInt(d.count)
  })) || [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-indigo-600" /> Analyse & Rapports
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Statistiques détaillées de votre activité commerciale.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl border-slate-200 font-bold h-11 px-6 shadow-sm"><Calendar className="w-4 h-4 mr-2" /> Période</Button>
           <Button className="bg-slate-900 text-white rounded-xl font-bold h-11 px-6 shadow-xl"><Download className="w-4 h-4 mr-2" /> Exporter Rapport</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-xl bg-white rounded-[2rem]">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <TrendingUp className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold">+12.5%</Badge>
               </div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Revenu Total (Mensuel)</p>
               <h2 className="text-3xl font-black text-slate-900 mt-1">12,000,000 <span className="text-sm font-bold">CFA</span></h2>
            </CardContent>
         </Card>
         <Card className="border-none shadow-xl bg-white rounded-[2rem]">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                     <PieChartIcon className="h-6 w-6" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-600 border-none font-bold">+8.2%</Badge>
               </div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Marge Bénéficiaire</p>
               <h2 className="text-3xl font-black text-slate-900 mt-1">4,000,000 <span className="text-sm font-bold">CFA</span></h2>
            </CardContent>
         </Card>
         <Card className="border-none shadow-xl bg-white rounded-[2rem]">
            <CardContent className="p-8">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                     <TrendingDown className="h-6 w-6" />
                  </div>
                  <Badge className="bg-rose-100 text-rose-600 border-none font-bold">-4.1%</Badge>
               </div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Charges d'Exploitation</p>
               <h2 className="text-3xl font-black text-slate-900 mt-1">1,250,000 <span className="text-sm font-bold">CFA</span></h2>
            </CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
               <CardTitle className="text-lg font-black uppercase tracking-tight">Croissance du Chiffre d'Affaires</CardTitle>
               <CardDescription>Évolution des revenus et bénéfices sur les 6 derniers mois.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
               <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={salesData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fill="#10b981" fillOpacity={0.1} />
                        <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={4} fill="#3b82f6" fillOpacity={0.1} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
               <CardTitle className="text-lg font-black uppercase tracking-tight">Répartition par Catégorie</CardTitle>
               <CardDescription>Volume de produits par catégorie d'inventaire.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex items-center justify-center">
               <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
