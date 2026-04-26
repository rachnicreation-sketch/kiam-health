import { useState } from "react";
import { Shield, Lock, Eye, ShieldCheck, AlertCircle, FileText, Globe, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SaaSSecurity() {
  const [logs] = useState([
    { id: 1, event: "Connexion SaaS Admin", user: "admin@saas.com", ip: "192.168.1.1", date: "Il y a 5 min", status: "success" },
    { id: 2, event: "Tentative de Brute Force", user: "unknown", ip: "45.12.33.102", date: "Il y a 12 min", status: "blocked" },
    { id: 3, event: "Mise à jour Plan: Clinique Marion", user: "support@kiam.tech", ip: "192.168.1.5", date: "Il y a 45 min", status: "success" },
    { id: 4, event: "Suppression Locataire", user: "admin@saas.com", ip: "192.168.1.1", date: "Il y a 2h", status: "warning" },
  ]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" /> Audit & Sécurité
            </h1>
            <p className="text-slate-500 mt-1">Surveillance des accès, logs d'audit et pare-feu global.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">
                <Lock className="w-4 h-4 mr-2" /> Paramètres Firewall
             </Button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-8 mt-4">
        
        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score de Santé</p>
                 <p className="text-2xl font-black text-slate-900">98 / 100</p>
              </div>
           </Card>
           <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                 <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menaces bloquées</p>
                 <p className="text-2xl font-black text-slate-900">1,240 <span className="text-xs font-normal text-slate-400">/ 24h</span></p>
              </div>
           </Card>
           <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                 <Globe className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origine Principale</p>
                 <p className="text-2xl font-black text-slate-900">Europe (72%)</p>
              </div>
           </Card>
        </div>

        {/* AUDIT LOGS */}
        <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                 <FileText className="w-5 h-5 text-slate-400" /> Journaux d'Audit (Logs)
              </h3>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <input type="text" placeholder="Filtrer par IP ou Utilisateur..." className="pl-10 pr-4 py-1.5 rounded-full border border-slate-200 text-xs w-64" />
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Événement</th>
                       <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilisateur</th>
                       <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Adresse IP</th>
                       <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                       <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                       <th className="p-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="p-4">
                            <span className="font-bold text-slate-800 text-sm">{log.event}</span>
                         </td>
                         <td className="p-4 text-sm text-slate-600">{log.user}</td>
                         <td className="p-4 text-xs font-mono text-slate-500">{log.ip}</td>
                         <td className="p-4 text-xs text-slate-400">{log.date}</td>
                         <td className="p-4">
                            <Badge className={`border-none ${
                               log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                               log.status === 'blocked' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                               {log.status}
                            </Badge>
                         </td>
                         <td className="p-4 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                               <Eye className="w-4 h-4" />
                            </Button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>
    </div>
  );
}
