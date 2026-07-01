import { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Clock, 
  User, 
  MoreVertical, 
  ArrowLeft,
  Calendar,
  Filter,
  CheckCircle2,
  Circle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    title: "",
    assigned_to: "",
    project_id: "",
    deadline: ""
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // For now using the stats endpoint to see if we can get list_tasks or mock it
      // I'll assume enterprise.php has list_tasks soon, or I'll add it
      const data = await apiRequest("enterprise.php?action=list_tasks");
      setTasks(data);
    } catch (error) {
      // Fallback/Mock for now if endpoint not ready
      setTasks([
        { id: '1', title: 'Audit de sécurité trimestriel', status: 'todo', assigned_to: 'Alice', deadline: '2026-05-20' },
        { id: '2', title: 'Mise à jour des serveurs', status: 'in_progress', assigned_to: 'Bob', deadline: '2026-05-15' },
        { id: '3', title: 'Rapport financier Q1', status: 'done', assigned_to: 'Charles', deadline: '2026-05-10' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.title) return;
    try {
      await apiRequest("enterprise.php?action=add_task", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast({ title: "Tâche créée", description: "La tâche a été assignée." });
      setIsAddOpen(false);
      setFormData({ title: "", assigned_to: "", project_id: "", deadline: "" });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'ajout." });
    }
  };

  const filtered = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === 'all' || t.status === filterStatus)
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
              <CheckSquare className="h-8 w-8 text-emerald-600" /> Gestion des Tâches
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Organisation quotidienne et suivi opérationnel.</p>
          </div>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-emerald-100">
               <Plus className="w-5 h-5 mr-2" /> Nouvelle Tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-8 border-none">
             <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">Assigner une Tâche</DialogTitle>
             </DialogHeader>
             <div className="space-y-5 pt-6">
                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Intitulé de la Tâche *</Label>
                   <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Faire ceci..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Assigné à</Label>
                   <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Nom du collaborateur" value={formData.assigned_to} onChange={e => setFormData({...formData, assigned_to: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Deadline</Label>
                   <Input type="date" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                </div>
                <Button className="w-full h-14 bg-emerald-600 text-white font-black rounded-2xl shadow-lg mt-4" onClick={handleAdd}>ENREGISTRER</Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
            <Search className="h-5 w-5 text-slate-400 ml-2" />
            <Input 
              placeholder="Rechercher une tâche..." 
              className="border-none bg-transparent shadow-none focus-visible:ring-0 font-medium" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-50 shadow-sm">
            {['all', 'todo', 'in_progress', 'done'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === status ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
         </div>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
         <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
               {filtered.map(task => (
                 <div key={task.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all group">
                    <div className="flex items-center gap-6">
                       <div className="shrink-0">
                          {task.status === 'done' ? (
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                          ) : task.status === 'in_progress' ? (
                            <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
                          ) : (
                            <Circle className="h-8 w-8 text-slate-200 group-hover:text-slate-400 transition-colors" />
                          )}
                       </div>
                       <div>
                          <h3 className={`text-xl font-black ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                             {task.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <User className="h-3.5 w-3.5" /> {task.assigned_to || 'Non assigné'}
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <Calendar className="h-3.5 w-3.5" /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Pas de date'}
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Badge className={`border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         task.status === 'done' ? 'bg-emerald-50 text-emerald-600' :
                         task.status === 'in_progress' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                       }`}>
                          {task.status.replace('_', ' ')}
                       </Badge>
                       <Button variant="ghost" size="icon" className="text-slate-200 hover:text-slate-500 rounded-full">
                          <MoreVertical className="h-5 w-5" />
                       </Button>
                    </div>
                 </div>
               ))}
               
               {filtered.length === 0 && (
                 <div className="py-20 text-center opacity-20 italic-none">
                    <CheckSquare className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-black uppercase tracking-widest">Aucune tâche trouvée</p>
                 </div>
               )}
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
