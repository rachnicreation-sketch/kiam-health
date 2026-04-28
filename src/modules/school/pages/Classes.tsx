import { useState, useEffect } from "react";
import { 
  Building2, 
  Plus, 
  Users, 
  UserCog, 
  MoreVertical, 
  Search,
  BookOpen
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DUMMY_CLASSES } from "@/lib/mock-data";
import { api } from "@/lib/api-service";

export default function Classes() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);

  const [classForm, setClassForm] = useState({
    name: "",
    level: "6ème",
    room_number: "",
    teacher_id: ""
  });

  useEffect(() => {
    if (isPresentationMode) {
      setClasses(DUMMY_CLASSES);
      setIsLoading(false);
    } else if (user?.clinicId) {
      loadData();
    }
  }, [user, isPresentationMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // For now, if api-service doesn't have listClasses, we use manual fetch or empty
      const data = await apiRequest("school.php?action=list_classes");
      setClasses(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des classes échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClass = async () => {
    try {
      await apiRequest("school.php?action=add_class", {
        method: "POST",
        body: JSON.stringify({ ...classForm, clinicId: user!.clinicId })
      });
      toast({ title: "Classe créée", description: `La classe ${classForm.name} a été ajoutée.` });
      setIsAddClassOpen(false);
      loadData();
      setClassForm({ name: "", level: "6ème", room_number: "", teacher_id: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la création." });
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-sky-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            Gestion des Classes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Organisation des salles et des niveaux scolaires.</p>
        </div>
        <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <DialogTrigger asChild>
            <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-sky-200 h-11 px-6 rounded-xl">
              <Plus className="w-4 h-4" /> Nouvelle Classe
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Building2 className="text-sky-600" /> Créer une Classe
              </DialogTitle>
              <CardDescription className="font-medium">Configurez une nouvelle section pédagogique</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom de la Classe *</Label>
                <Input placeholder="ex: 6ème A, Terminale C" className="rounded-xl border-slate-200 h-11" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Niveau Scolaire</Label>
                <Input placeholder="ex: 6ème, Lycée" className="rounded-xl border-slate-200 h-11" value={classForm.level} onChange={e => setClassForm({...classForm, level: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Salle / Localisation</Label>
                <Input placeholder="ex: B-102" className="rounded-xl border-slate-200 h-11" value={classForm.room_number} onChange={e => setClassForm({...classForm, room_number: e.target.value})} />
              </div>
              <Button className="w-full bg-edu-gradient text-white h-12 rounded-xl font-bold mt-4 shadow-lg shadow-sky-100" onClick={handleAddClass}>Enregistrer la classe</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
           <div className="md:col-span-3 h-60 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 italic bg-white/50">
                <Building2 className="h-12 w-12 mb-2 opacity-20" />
                <p>Aucune classe enregistrée pour le moment.</p>
           </div>
        ) : (
          classes.map(cls => (
            <Card key={cls.id} className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] group hover:translate-y-[-4px] transition-all duration-300">
              <CardHeader className="bg-slate-50/50 border-b p-6 relative">
                <div className="flex justify-between items-start">
                   <div className="h-12 w-12 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-sky-100 group-hover:scale-110 transition-transform">
                      {cls.name[0]}
                   </div>
                   <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"><MoreVertical className="w-5 h-5" /></Button>
                </div>
                <div className="mt-4">
                   <CardTitle className="text-xl font-black text-slate-900">{cls.name}</CardTitle>
                   <CardDescription className="text-xs uppercase font-bold text-sky-600 mt-1 flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                     {cls.level}
                   </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-medium"><Users className="h-4 w-4" /> Effectif</div>
                    <Badge className="bg-sky-50 text-sky-700 border-none font-bold">{cls.students_count || '--'} élèves</Badge>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-medium"><UserCog className="h-4 w-4" /> Prof. Principal</div>
                    <span className="font-bold text-slate-800 text-xs">{cls.teacher_name || 'Non assigné'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-medium"><BookOpen className="h-4 w-4" /> Localisation</div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-200 px-3 py-0.5 rounded-lg">{cls.room_number || 'TBD'}</Badge>
                 </div>
                 <div className="pt-4 border-t border-slate-50">
                    <Button variant="ghost" className="w-full h-11 text-[11px] uppercase font-black text-sky-600 bg-sky-50/50 hover:bg-sky-100 rounded-xl transition-all">Gérer les présences</Button>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Helper for manual fetch
async function apiRequest(endpoint: string, options: any = {}) {
    const token = localStorage.getItem('kiam_jwt_token');
    const response = await fetch(`/kiam/api/${endpoint}`, {
      ...options,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...options.headers }
    });
    if (!response.ok) throw new Error("API Error");
    return response.json();
}
