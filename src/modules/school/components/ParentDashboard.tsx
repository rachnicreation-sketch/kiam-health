import { 
  Users, 
  Award, 
  Clock,
  CreditCard,
  Bell,
  MessageCircle,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ParentDashboardProps {
  stats: any;
  user: any;
}

export function ParentDashboard({ stats, user }: ParentDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" /> Espace Parent
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Bienvenue, M/Mme {user?.name}. Suivez la scolarité de votre enfant.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2" onClick={() => navigate('/school/payments')}>
            <CreditCard className="w-4 h-4" /> Régler Scolarité
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Enfant(s) Inscrit(s)" value="1" icon={Users} className="bg-white" />
        <StatCard title="Dernière Moyenne" value="14.5" changeType="positive" icon={Award} className="bg-white" />
        <StatCard title="Présence" value="98%" changeType="positive" icon={Clock} className="bg-white" />
        <StatCard title="Solde Scolarité" value="45.000 CFA" change="À régler" changeType="negative" icon={CreditCard} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Alertes & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             <div className="flex gap-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <Bell className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                   <p className="text-xs font-bold text-indigo-900">Nouvelle note enregistrée</p>
                   <p className="text-[10px] text-indigo-700">Votre enfant a reçu 17/20 en Mathématiques.</p>
                </div>
             </div>
             <div className="flex gap-3 p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                <Clock className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                   <p className="text-xs font-bold text-rose-900">Retard signalé</p>
                   <p className="text-[10px] text-rose-700">Retard de 15 min le 19 Octobre à 08h15.</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Contact Direction / Professeurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
             <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">PK</div>
                   <div>
                      <p className="text-sm font-bold">Mr. Paul KOUA</p>
                      <p className="text-[10px] text-slate-500">Professeur de Français</p>
                   </div>
                </div>
                <MessageCircle className="h-5 w-5 text-indigo-500" />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
