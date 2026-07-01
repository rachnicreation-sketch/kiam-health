import { 
  ClipboardList, 
  Award, 
  FileCheck, 
  Settings2,
  BookOpen,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function ScolariteDashboard({ stats }: { stats: any; user: any }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            Tableau de Bord Scolarité
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion académique, évaluations et certification des résultats.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 rounded-xl" onClick={() => navigate('/school/bulletins')}>
            <FileCheck className="w-4 h-4" /> Publier les Bulletins
          </Button>
          <Button variant="outline" className="border-slate-200 font-bold gap-2 rounded-xl">
            <Settings2 className="w-4 h-4" /> Coefficients
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Notes Saisies" value="92%" change="Trimestre 1" changeType="positive" icon={Award} />
        <StatCard title="Bulletins Prêts" value="145" change="En attente: 28" changeType="neutral" icon={FileCheck} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Matières Actives" value="14" change="Configuration OK" changeType="positive" icon={BookOpen} iconClassName="bg-sky-100 text-sky-600" />
        <StatCard title="Alertes Notes" value="3" change="Incohérences" changeType="negative" icon={AlertCircle} iconClassName="bg-rose-100 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Statut de Saisie par Classe</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[
                { class: "Terminale C", progress: 100, status: "Terminé" },
                { class: "3ème A", progress: 85, status: "En cours" },
                { class: "6ème B", progress: 95, status: "En cours" },
                { class: "CM2", progress: 100, status: "Terminé" },
              ].map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs">{idx+1}</div>
                    <span className="font-black text-slate-700">{item.class}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                    <Badge className={item.progress === 100 ? "bg-emerald-500" : "bg-amber-500"}>{item.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Notes d'Anglais validées</p>
                    <p className="text-xs text-slate-500">Classe de 3ème A • Il y a 10 min</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1"><History className="h-4 w-4 text-indigo-500" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Mise à jour coefficients</p>
                    <p className="text-xs text-slate-500">Cycle Lycée • Il y a 2h</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1"><AlertCircle className="h-4 w-4 text-rose-500" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Correction de note demandée</p>
                    <p className="text-xs text-slate-500">M. Traoré • Physique • 4ème</p>
                  </div>
                </div>
             </div>
             <Button className="w-full mt-8 bg-slate-900 text-white font-bold rounded-xl h-12">
               Lancer les calculs de moyennes
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
