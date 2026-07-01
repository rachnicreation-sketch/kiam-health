import { 
  BookOpen, 
  Award, 
  Clock,
  Calendar,
  FileText,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudentDashboardProps {
  stats: any;
  user: any;
}

export function StudentDashboard({ stats, user }: StudentDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-sky-600" /> Mon Espace Étudiant
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Bonjour {user?.name}. Consulte tes notes et ton emploi du temps.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-sky-600 hover:bg-sky-700 font-bold gap-2" onClick={() => navigate('/school/grades')}>
            <FileText className="w-4 h-4" /> Voir Bulletin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Moyenne Générale" value="14.25" changeType="positive" icon={Award} className="bg-white" />
        <StatCard title="Absences" value="2" changeType="negative" icon={Clock} className="bg-white" />
        <StatCard title="Prochains Devoirs" value="3" icon={Calendar} className="bg-white" />
        <StatCard title="Rang" value="5 / 32" icon={TrendingUp} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Dernières Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y">
                <div className="p-4 flex justify-between items-center">
                   <div>
                      <p className="text-sm font-bold text-slate-900">Mathématiques</p>
                      <p className="text-[10px] text-slate-400">Interro de Cours • 18 Oct.</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-emerald-600">17/20</span>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                   </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                   <div>
                      <p className="text-sm font-bold text-slate-900">Français</p>
                      <p className="text-[10px] text-slate-400">Rédaction • 15 Oct.</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-slate-700">13.5/20</span>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Emploi du Temps (Aujourd'hui)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             <div className="flex gap-4 p-3 border-l-4 border-sky-500 bg-sky-50/50">
                <div className="text-xs font-bold text-sky-700 w-16">08h - 10h</div>
                <div>
                  <p className="text-sm font-bold">Histoire-Géo</p>
                  <p className="text-[10px] text-slate-500">Mme. NGOUABI • Salle 301</p>
                </div>
             </div>
             <div className="flex gap-4 p-3 border-l-4 border-slate-300 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-500 w-16">10h - 12h</div>
                <div>
                  <p className="text-sm font-bold">Anglais</p>
                  <p className="text-[10px] text-slate-500">Mr. SMITH • Salle 105</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
