import { useState, useEffect } from "react";
import { 
  Target, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  MoreVertical, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    deadline: "",
    description: "",
    budget: "0"
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("enterprise.php?action=list_projects");
      setProjects(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les projets." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name) return;
    try {
      await apiRequest("enterprise.php?action=add_project", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast({ title: "Projet créé", description: "Le nouveau projet est maintenant actif." });
      setIsAddOpen(false);
      setFormData({ name: "", deadline: "", description: "", budget: "0" });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la création." });
    }
  };

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/enterprise')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Target className="h-8 w-8 text-indigo-600" /> Portfolio Projets
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Pilotage et suivi de la performance opérationnelle.</p>
          </div>
        </div>
        <div className="flex gap-3">
           <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                 <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-indigo-100">
                    <Plus className="w-5 h-5 mr-2" /> Nouveau Projet
                 </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-8 border-none">
                 <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Lancer un Projet</DialogTitle>
                    <CardDescription>Définissez les objectifs et la deadline.</CardDescription>
                 </DialogHeader>
                 <div className="space-y-5 pt-6">
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Nom du Projet *</Label>
                       <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Ex: Refonte Site Web..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Échéance (Deadline) *</Label>
                       <Input type="date" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Budget Estimé (CFA)</Label>
                       <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                    </div>
                    <Button className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl shadow-lg mt-4" onClick={handleAdd}>CRÉER LE PROJET</Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-50">
         <Search className="h-5 w-5 text-slate-400 ml-4" />
         <Input 
           placeholder="Rechercher un projet par nom..." 
           className="border-none bg-transparent shadow-none focus-visible:ring-0 text-lg font-medium" 
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(project => (
          <Card key={project.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-4">
                 <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {project.status === 'active' ? '● En cours' : 'Terminé'}
                 </Badge>
                 <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600 rounded-full"><MoreVertical className="h-5 w-5" /></Button>
              </div>
              <CardTitle className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight">{project.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2 font-bold">
                 <Calendar className="h-4 w-4" /> Fin : {new Date(project.deadline).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                     <span className="text-slate-400">Progression</span>
                     <span className="text-indigo-600">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-3 bg-slate-100" indicatorClassName="bg-indigo-600" />
               </div>
               
               <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex -space-x-2">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black">U{i}</div>
                     ))}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                     <BarChart3 className="h-4 w-4" />
                     <span className="text-xs font-bold">12 Tasks</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 opacity-30">
             <Target className="h-20 w-20 mx-auto text-slate-300" />
             <p className="text-xl font-black uppercase tracking-widest">Aucun projet trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
