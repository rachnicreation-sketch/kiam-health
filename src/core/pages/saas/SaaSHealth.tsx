import { useState, useEffect } from "react";
import { Activity, Server, Database, Cpu, Zap, HardDrive, RefreshCcw, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function SaaSHealth() {
  const [uptime] = useState("99.99%");
  const [latency] = useState("24ms");

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-600" /> Santé du Système
            </h1>
            <p className="text-slate-500 mt-1">État en temps réel des clusters, de la base de données et des services.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-full font-bold bg-white border-slate-200 hover:bg-slate-50">
                <RefreshCcw className="w-4 h-4 mr-2" /> Forcer le Refresh
             </Button>
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-black text-xs uppercase tracking-widest">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Tous les systèmes sont opérationnels
             </div>
          </div>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
         
         <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <Cpu className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Charge CPU (Global)</p>
            <h2 className="text-4xl font-black text-slate-900 mb-4">12%</h2>
            <Progress value={12} className="h-2 bg-slate-100" />
         </Card>

         <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <Database className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Utilisation RAM</p>
            <h2 className="text-4xl font-black text-slate-900 mb-4">4.2 <span className="text-sm font-normal">GB</span></h2>
            <Progress value={45} className="h-2 bg-slate-100" />
         </Card>

         <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <HardDrive className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Stockage Cluster</p>
            <h2 className="text-4xl font-black text-slate-900 mb-4">2.4 <span className="text-sm font-normal">TB</span></h2>
            <Progress value={68} className="h-2 bg-slate-100" />
         </Card>

         <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <Zap className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Latence API (Moy.)</p>
            <h2 className="text-4xl font-black text-emerald-600 mb-4">{latency}</h2>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Uptime: {uptime}</div>
         </Card>

         <Card className="md:col-span-2 lg:col-span-3 bg-white border-slate-200 rounded-[2rem] shadow-sm overflow-hidden p-8">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
               <Server className="w-5 h-5 text-slate-400" /> État des Services Individuels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { name: "Auth Engine", status: "online" },
                 { name: "Notification Server", status: "online" },
                 { name: "Database Cluster", status: "online" },
                 { name: "CDN / Assets", status: "online" },
                 { name: "SaaS Billing Worker", status: "online" },
                 { name: "Backup System", status: "online" },
               ].map((service, i) => (
                 <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-700 text-sm">{service.name}</span>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600">
                       <CheckCircle2 className="w-3 h-3" /> OK
                    </div>
                 </div>
               ))}
            </div>
         </Card>

         <Card className="lg:col-span-1 bg-slate-900 text-white border-none rounded-[2rem] p-8">
            <h3 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-4">Conseil Engine</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
               Le cluster de base de données a connu un pic d'utilisation à 14:00 (XAF Peak). Une montée en charge de +2 instances est recommandée pour le prochain pic de facturation.
            </p>
            <Button className="w-full mt-6 bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl">Optimiser maintenant</Button>
         </Card>

      </div>
    </div>
  );
}
