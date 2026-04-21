import { 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  Clock,
  Calendar,
  MessageSquare,
  Award,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeacherDashboardProps {
  stats: any;
  user: any;
}

export function TeacherDashboard({ stats, user }: TeacherDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Espace Enseignant
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Bon retour, {user?.name}. Gérez vos classes et vos évaluations.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-sky-200" onClick={() => navigate('/school/attendance')}>
            <ClipboardCheck className="w-4 h-4" /> Faire l'appel
          </Button>
          <Button variant="outline" className="font-bold gap-2 border-slate-200 shadow-sm" onClick={() => navigate('/school/grades')}>
            <Award className="w-4 h-4" /> Saisir Notes
          </Button>
          <Button variant="outline" className="font-bold gap-2 border-slate-200 shadow-sm" onClick={() => navigate('/school/schedule')}>
            <Calendar className="w-4 h-4" /> Emploi du Temps
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mes Élèves" value="42" icon={Users} className="bg-white" />
        <StatCard title="Heures Cours / Sem." value="18h" icon={Clock} className="bg-white" />
        <StatCard title="Moyenne Classe" value="13.5" changeType="positive" icon={TrendingUp} className="bg-white" />
        <StatCard title="Messages" value="5" icon={MessageSquare} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Cours du jour</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">08:00</div>
                   <div>
                      <p className="text-sm font-bold">Mathématiques</p>
                      <p className="text-[10px] text-muted-foreground">Classe: 3ème A • Salle 102</p>
                   </div>
                </div>
                <Badge>En cours</Badge>
             </div>
             <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold">10:30</div>
                   <div>
                      <p className="text-sm font-bold">Physiques</p>
                      <p className="text-[10px] text-muted-foreground">Classe: Seconde S • Salle 204</p>
                   </div>
                </div>
                <Badge variant="outline">À venir</Badge>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Prochaines Évaluations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y">
                <div className="p-4 flex justify-between items-center">
                   <div>
                      <p className="text-sm font-bold">Devoir Surveillé n°2</p>
                      <p className="text-[10px] text-slate-400">Classe: 4ème B • Lu 22 Oct.</p>
                   </div>
                   <Button variant="ghost" size="sm" className="text-primary font-bold text-xs uppercase">Préparer</Button>
                </div>
                <div className="p-4 flex justify-between items-center">
                   <div>
                      <p className="text-sm font-bold">Interrogation Surprise</p>
                      <p className="text-[10px] text-slate-400">Classe: 6ème A • Jeu 25 Oct.</p>
                   </div>
                   <Button variant="ghost" size="sm" className="text-primary font-bold text-xs uppercase">Préparer</Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

