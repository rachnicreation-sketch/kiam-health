import { useState } from "react";
import { Zap, Brain, TrendingUp, Sparkles, PieChart, ArrowRight, Lightbulb, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

const data = [
  { name: 'Lun', health: 4000, erp: 2400, school: 2400 },
  { name: 'Mar', health: 3000, erp: 1398, school: 2210 },
  { name: 'Mer', health: 2000, erp: 9800, school: 2290 },
  { name: 'Jeu', health: 2780, erp: 3908, school: 2000 },
  { name: 'Ven', health: 1890, erp: 4800, school: 2181 },
  { name: 'Sam', health: 2390, erp: 3800, school: 2500 },
  { name: 'Dim', health: 3490, erp: 4300, school: 2100 },
];

export default function SaaSAI() {
  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-500" /> KIAM IA Insights
            </h1>
            <p className="text-slate-500 mt-1">Analyse prédictive et optimisation intelligente de votre écosystème SaaS.</p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold shadow-lg shadow-amber-200">
             <Brain className="w-4 h-4 mr-2" /> Générer un rapport IA
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-8 mt-4">
        
        {/* INSIGHTS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none shadow-xl shadow-blue-100 relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 w-12 h-12 text-white/20 animate-pulse" />
              <div className="space-y-4 relative z-10">
                 <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase">Opportunité</Badge>
                 <h3 className="text-xl font-bold leading-tight">Expansion du Secteur Santé</h3>
                 <p className="text-sm text-blue-100/80 font-medium">L'IA détecte une croissance de +15% des inscriptions de cliniques privées en Afrique Centrale ce trimestre.</p>
                 <Button variant="ghost" className="p-0 text-white hover:bg-transparent flex items-center gap-2 font-bold group">
                    Voir la stratégie <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                 </Button>
              </div>
           </Card>

           <Card className="p-8 rounded-[2.5rem] bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prédiction Revenus</p>
                    <p className="text-2xl font-black text-slate-900">+12% <span className="text-xs font-normal">prévus en Juillet</span></p>
                 </div>
              </div>
              <div className="h-32 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                       <Area type="monotone" dataKey="health" stroke="#f59e0b" fill="#fef3c7" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white border-none shadow-xl shadow-black/10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-white/10 rounded-2xl text-white">
                    <Lightbulb className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-lg">Suggestion de Prix</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                 Le plan "Enterprise" est sous-évalué de 20k CFA par rapport au volume de données traité par vos 5 plus gros clients.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12">Ajuster les tarifs</Button>
           </Card>
        </div>

        {/* ANALYTICS CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <Card className="lg:col-span-8 bg-white border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" /> Utilisation par Module (IA Track)
                 </h3>
                 <div className="flex gap-2">
                    <Badge className="bg-blue-50 text-blue-600 border-none">Temps Réel</Badge>
                 </div>
              </div>
              <div className="h-72 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                       <YAxis hide />
                       <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                       <Bar dataKey="health" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="erp" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="school" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           <Card className="lg:col-span-4 bg-white border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-2">
                 <PieChart className="w-5 h-5 text-purple-600" /> Taux de Churn Prévu
              </h3>
              <div className="flex-1 flex flex-col justify-center items-center">
                 <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className="absolute inset-0 border-[16px] border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-[16px] border-emerald-500 rounded-full" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0)', rotate: '-45deg'}} />
                    <div className="text-center">
                       <p className="text-4xl font-black text-slate-900">2.1%</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Excellent</p>
                    </div>
                 </div>
                 <div className="mt-8 space-y-3 w-full">
                    <p className="text-xs text-slate-500 text-center italic">L'IA suggère que la stabilité est due à l'excellente performance du module Health.</p>
                 </div>
              </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
