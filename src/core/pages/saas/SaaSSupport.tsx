import { useState, useEffect } from "react";
import { ShieldAlert, MessageSquare, CheckCircle2, Clock, Search, Filter, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-service";

export default function SaaSSupport() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.saas.tickets();
      setTickets(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-600" /> Support Client
            </h1>
            <p className="text-slate-500 mt-1">Gérez les demandes d'assistance et les tickets techniques.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Rechercher un ticket..." 
                className="pl-10 pr-4 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 w-64 bg-white"
              />
            </div>
            <Button variant="outline" className="rounded-full font-bold border-slate-200">
              <Filter className="w-4 h-4 mr-2" /> Filtres
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* STATS SUMMARY */}
          <div className="lg:col-span-3 space-y-6">
             <Card className="p-6 rounded-[2rem] bg-rose-600 text-white shadow-xl shadow-rose-100 border-none">
                <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-1">Tickets Ouverts</p>
                <h2 className="text-5xl font-black">{tickets.filter(t => t.status === 'open').length}</h2>
                <div className="mt-4 flex items-center gap-2 text-sm text-rose-100">
                   <Clock className="w-4 h-4" /> Temps de réponse moyen: 14 min
                </div>
             </Card>

             <Card className="p-6 rounded-[2rem] bg-white border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs">Par Priorité</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Critique</span>
                      <Badge className="bg-rose-100 text-rose-700 border-none">3</Badge>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Moyenne</span>
                      <Badge className="bg-amber-100 text-amber-700 border-none">8</Badge>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">Faible</span>
                      <Badge className="bg-blue-100 text-blue-700 border-none">12</Badge>
                   </div>
                </div>
             </Card>
          </div>

          {/* TICKETS LIST */}
          <div className="lg:col-span-9">
             <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                   {tickets.length > 0 ? tickets.map((ticket) => (
                     <div key={ticket.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                        <div className="flex items-start gap-4">
                           <div className={`mt-1 h-3 w-3 rounded-full ${ticket.status === 'open' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h4 className="font-black text-slate-900 group-hover:text-rose-600 transition-colors">{ticket.subject}</h4>
                                 <Badge variant="outline" className="text-[10px] font-mono">{ticket.tenant_name}</Badge>
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-1 max-w-xl">{ticket.message}</p>
                              <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Il y a 2h</span>
                                 <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 4 messages</span>
                              </div>
                           </div>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-full hover:bg-rose-50 hover:text-rose-600">
                           Traiter <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                     </div>
                   )) : (
                     <div className="p-20 text-center text-slate-400 italic">
                        Aucun ticket de support pour le moment.
                     </div>
                   )}
                </div>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
