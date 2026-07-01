import { 
  ClipboardList, 
  Users, 
  Calendar, 
  Phone,
  Search,
  FileText,
  UserPlus
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SecretariatDashboardProps {
  stats: any;
  user: any;
  onAddStudent: () => void;
}

export function SecretariatDashboard({ stats, user, onAddStudent }: SecretariatDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-sky-600" /> Secrétariat & Accueil
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion des dossiers, inscriptions et communication.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-sky-600 hover:bg-sky-700 font-bold gap-2" onClick={onAddStudent}>
            <UserPlus className="w-4 h-4" /> Nouvelle Inscription
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Inscriptions (Mois)" value="24" icon={UserPlus} className="bg-white" />
        <StatCard title="Dossiers Complets" value="85%" icon={FileText} className="bg-white" />
        <StatCard title="RDV Parents" value="5" icon={Phone} className="bg-white" />
        <StatCard title="Alertes Admin" value="3" icon={Search} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Communication Rapide (SMS)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
             <div className="space-y-4">
                <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-500">Destinataires</Label>
                   <Select defaultValue="all">
                      <SelectTrigger className="h-10 border-slate-200">
                         <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="all">Tous les parents</SelectItem>
                         <SelectItem value="6a">Parents 6ème A</SelectItem>
                         <SelectItem value="deb">Parents Débiteurs</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-xs font-bold text-slate-500">Message Type</Label>
                   <Select defaultValue="abs">
                      <SelectTrigger className="h-10 border-slate-200">
                         <SelectValue placeholder="Modèle..." />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="abs">Alerte Absence</SelectItem>
                         <SelectItem value="rev">Rappel Frais</SelectItem>
                         <SelectItem value="rdv">Invitation RDV</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <Button className="w-full bg-edu-gradient text-white font-bold h-12 rounded-2xl shadow-lg shadow-indigo-200 gap-2">
                   <Phone className="w-4 h-4" /> Diffuser l'alerte SMS
                </Button>
                <p className="text-[10px] text-center text-slate-400 italic">Plateforme SMS Kiam connectée (Simulé).</p>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Dernières Inscriptions</CardTitle>
              <Badge className="bg-sky-100 text-sky-600 border-none px-3">24 Nouvelles</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
             <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-600">MN</div>
                      <div>
                         <p className="text-xs font-black">Marie NGOUABI</p>
                         <p className="text-[10px] text-slate-500">Inscrite le 19 Oct. 2023</p>
                      </div>
                   </div>
                   <Badge variant="outline" className="border-slate-200">6ème A</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">MJ</div>
                      <div>
                         <p className="text-xs font-black">Jean MABIALA</p>
                         <p className="text-[10px] text-slate-500">Inscrite le 18 Oct. 2023</p>
                      </div>
                   </div>
                   <Badge variant="outline" className="border-slate-200">3ème B</Badge>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
