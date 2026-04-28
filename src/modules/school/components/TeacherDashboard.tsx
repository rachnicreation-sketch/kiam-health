import { 
  Award, 
  Calendar, 
  Users, 
  PlayCircle,
  Clock,
  ChevronRight,
  Plus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function TeacherDashboard({ stats, user }: { stats: any; user: any }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Users className="w-6 h-6 text-white" />
            </div>
            Espace Enseignant — M. {user?.name || "Professeur"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion de vos classes, saisie des notes et suivi pédagogique.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 rounded-xl" onClick={() => navigate('/school/grades')}>
            <Award className="w-4 h-4" /> Saisir des Notes
          </Button>
          <Button variant="outline" className="border-slate-200 font-bold gap-2 rounded-xl" onClick={() => navigate('/school/schedule')}>
            <Calendar className="w-4 h-4" /> Emploi du Temps
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Mes Classes" value="4" change="6ème A, 3ème B..." changeType="neutral" icon={Users} />
        <StatCard title="Heures Semaine" value="18h" change="Emploi du temps" changeType="neutral" icon={Clock} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Notes à Saisir" value="28" change="Trimestre 1" changeType="negative" icon={Plus} iconClassName="bg-rose-100 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Prochains Cours</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[
                { time: "08:00 - 10:00", subject: "Mathématiques", class: "3ème B", room: "S-102" },
                { time: "10:30 - 12:30", subject: "Mathématiques", class: "6ème A", room: "S-101" },
                { time: "14:00 - 16:00", subject: "Soutien Scolaire", class: "Tle C", room: "S-001" },
              ].map((lesson, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-xs font-black text-indigo-500 uppercase">{lesson.time.split(' - ')[0]}</span>
                      <span className="text-[10px] text-slate-400 font-bold">Heure</span>
                    </div>
                    <div className="h-10 w-[2px] bg-indigo-100 rounded-full" />
                    <div>
                      <h4 className="font-black text-slate-900">{lesson.subject}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase">{lesson.class} • Salle {lesson.room}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="h-10 w-10 p-0 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-indigo-900 text-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-300">Ressources Pédagogiques</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-4">
                 <PlayCircle className="h-8 w-8 text-indigo-300" />
                 <div>
                   <p className="text-sm font-bold">Supports E-Learning</p>
                   <p className="text-[10px] opacity-60">12 documents partagés</p>
                 </div>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-4">
                 <Calendar className="h-8 w-8 text-indigo-300" />
                 <div>
                   <p className="text-sm font-bold">Cahier de Texte</p>
                   <p className="text-[10px] opacity-60">Dernière mise à jour: Hier</p>
                 </div>
              </div>
            </div>
            <Button className="w-full bg-white text-indigo-900 font-black rounded-xl h-12 shadow-xl shadow-indigo-950/20">
              Accéder au Portail Académique
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
