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

export default function Classes() {
  const { user } = useAuth();
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
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
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
        body: JSON.stringify({ ...classForm, clinicId: user.clinicId })
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-emerald-600" /> Gestion des Classes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Organisation des salles et des niveaux scolaires.</p>
        </div>
        <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2">
              <Plus className="w-4 h-4" /> Nouvelle Classe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une Classe</DialogTitle>
              <CardDescription>Configurez une nouvelle section pédagogique</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nom de la Classe *</Label>
                <Input placeholder="ex: 6ème A, Terminale C" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Niveau Scolaire</Label>
                <Input placeholder="ex: 6ème, Lycée" value={classForm.level} onChange={e => setClassForm({...classForm, level: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Salle / Localisation</Label>
                <Input placeholder="ex: B-102" value={classForm.room_number} onChange={e => setClassForm({...classForm, room_number: e.target.value})} />
              </div>
              <Button className="w-full bg-emerald-600" onClick={handleAddClass}>Enregistrer la classe</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.length === 0 ? (
           <Card className="md:col-span-3 border-dashed bg-slate-50/50">
             <CardContent className="h-60 flex flex-col items-center justify-center text-slate-400 italic">
                <Building2 className="h-12 w-12 mb-2 opacity-20" />
                <p>Aucune classe enregistrée pour le moment.</p>
             </CardContent>
           </Card>
        ) : (
          classes.map(cls => (
            <Card key={cls.id} className="border-none shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden group">
              <CardHeader className="bg-slate-50 border-b p-4 relative">
                <div className="flex justify-between items-start">
                   <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black">
                      {cls.name[0]}
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-slate-900"><MoreVertical className="w-4 h-4" /></Button>
                </div>
                <div className="mt-3">
                   <CardTitle className="text-lg font-black text-slate-900">{cls.name}</CardTitle>
                   <CardDescription className="text-xs uppercase font-bold text-emerald-600">{cls.level}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500"><Users className="h-4 w-4" /> Effectif</div>
                    <span className="font-bold text-slate-900">-- élèves</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500"><UserCog className="h-4 w-4" /> Prof. Principal</div>
                    <span className="font-medium text-slate-700 text-xs">{cls.teacher_name || 'Non assigné'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500"><BookOpen className="h-4 w-4" /> Salle</div>
                    <Badge variant="outline" className="text-[10px] uppercase">{cls.room_number || 'TBD'}</Badge>
                 </div>
                 <Button variant="ghost" className="w-full h-9 text-[10px] uppercase font-black text-emerald-600 border border-emerald-50 mt-2">Voir la liste d'appel</Button>
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
    return response.json();
}
