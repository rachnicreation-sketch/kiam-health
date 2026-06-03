import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  ClipboardList, 
  Search, 
  Bell, 
  Plus, 
  Zap,
  Star,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ModulePlaceholderProps {
  title?: string;
}

export function ModulePlaceholder({ title }: ModulePlaceholderProps) {
  const pageTitle = title || "Module en expansion";

  return (
    <div className="min-h-[80vh] flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* HEADER DYNAMIQUE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            <Zap className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{pageTitle}</h1>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
              <Activity className="h-3 w-3 text-emerald-500" /> Espace de travail intelligent
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-10 h-12 w-64 bg-slate-50 border-none rounded-2xl" placeholder="Rechercher..." />
          </div>
          <Button className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* LEFT COLUMN: PRODUCTIVITY TOOLS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* WELCOME BANNER */}
          <Card className="p-10 rounded-[3rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <Star className="absolute top-10 right-10 w-20 h-20 text-white/10 rotate-12" />
            <div className="relative z-10 space-y-4">
              <Badge className="bg-white/20 text-white border-none px-4 py-1 rounded-full font-black text-[10px] tracking-[0.2em] uppercase">Phase Alpha Connectée</Badge>
              <h2 className="text-4xl font-black leading-tight max-w-md">L'IA prépare vos données pour <span className="text-indigo-200 underline decoration-indigo-300">ce module.</span></h2>
              <p className="text-indigo-100/80 font-medium max-w-lg leading-relaxed">
                Pendant que nous finalisons les outils spécifiques de cette section, utilisez cet espace pour organiser vos tâches et consulter vos indicateurs transversaux.
              </p>
              <div className="pt-6 flex gap-4">
                 <Button className="bg-white text-indigo-700 font-black rounded-2xl h-12 px-8 hover:bg-slate-50">Démarrer une tâche</Button>
                 <Button variant="ghost" className="text-white font-bold hover:bg-white/10 rounded-2xl h-12">Consulter la doc</Button>
              </div>
            </div>
          </Card>

          {/* ACTIVITY FEED (MOCKED) */}
          <Card className="bg-white border-none rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-slate-400" /> Activité Récente du Locataire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {[
                  { user: "Admin", action: "Connexion au système", time: "Il y a 5 min", type: "auth" },
                  { user: "Système", action: "Sauvegarde Cloud effectuée", time: "Il y a 12 min", type: "system" },
                  { user: "Support", action: "Ticket #1240 fermé", time: "Il y a 45 min", type: "support" },
                ].map((item, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-5">
                       <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Clock className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="font-bold text-slate-800">{item.action}</p>
                          <p className="text-xs text-slate-400 font-medium">Par {item.user} • {item.time}</p>
                       </div>
                    </div>
                    <Badge variant="outline" className="rounded-lg text-[9px] uppercase font-black border-slate-200">Suivi</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: CALENDAR & NOTIFICATIONS */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="bg-white border-none rounded-[2.5rem] p-8 shadow-sm text-center">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6">
                 <Calendar className="h-7 w-7" />
              </div>
              <h3 className="font-black text-xl mb-2">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</h3>
              <p className="text-slate-400 text-sm font-medium">Aucun événement prévu dans ce module aujourd'hui.</p>
              <Button className="w-full mt-8 bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-2xl font-bold h-12">
                 Ajouter au calendrier
              </Button>
           </Card>

           <Card className="bg-slate-900 text-white border-none rounded-[2.5rem] p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-black text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" /> Notifications
                 </h3>
                 <Badge className="bg-amber-500 text-white border-none">2 New</Badge>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aujourd'hui</p>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                       <p className="text-sm font-medium">L'activation du module {title} est en cours de déploiement final.</p>
                    </div>
                 </div>
              </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
