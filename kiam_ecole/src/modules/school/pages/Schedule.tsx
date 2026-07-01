import { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { DUMMY_SCHEDULE, DUMMY_CLASSES } from "@/lib/mock-data";

export default function Schedule() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [form, setForm] = useState({
    class_id: "",
    subject: "",
    teacher_name: "",
    room: "",
    day: "Lundi",
    start_time: "08:00",
    end_time: "09:00",
    color: "bg-indigo-50 border-indigo-100 text-indigo-700"
  });

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  const colors = [
    { name: "Indigo", class: "bg-indigo-50 border-indigo-100 text-indigo-700" },
    { name: "Emerald", class: "bg-emerald-50 border-emerald-100 text-emerald-700" },
    { name: "Rose", class: "bg-rose-50 border-rose-100 text-rose-700" },
    { name: "Amber", class: "bg-amber-50 border-amber-100 text-amber-700" },
    { name: "Sky", class: "bg-sky-50 border-sky-100 text-sky-700" },
    { name: "Violet", class: "bg-violet-50 border-violet-100 text-violet-700" },
  ];

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user, selectedClass]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classData, scheduleData] = await Promise.all([
        api.school.classes(user!.clinicId!),
        api.school.schedule(user!.clinicId!, selectedClass)
      ]);
      setClasses(classData);
      setSchedule(scheduleData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger l'emploi du temps." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.school.addSchedule({ ...form, clinicId: user.clinicId });
      toast({ title: "Cours ajouté", description: "L'emploi du temps a été mis à jour." });
      setIsAddOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'enregistrement." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce cours ?")) return;
    try {
      await api.school.deleteSchedule(id);
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la suppression." });
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-indigo-200">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Emploi du Temps
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Planification hebdomadaire des cours et activités pédagogiques.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px] h-11 border-none bg-white shadow-sm rounded-xl font-bold">
               <SelectValue placeholder="Filtrer par classe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
               <SelectItem value="all" className="font-bold">Toutes les classes</SelectItem>
               {classes.map(c => (
                 <SelectItem key={c.id} value={c.id} className="font-medium">{c.name}</SelectItem>
               ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-indigo-200 h-11 px-6 rounded-xl">
                 <Plus className="w-4 h-4" /> Nouveau Cours
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <Plus className="text-sky-600" /> Ajouter un Cours
                </DialogTitle>
                <CardDescription className="font-medium">Programmez une nouvelle séance</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Classe *</Label>
                       <Select value={form.class_id} onValueChange={v => setForm({...form, class_id: v})}>
                         <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Jour *</Label>
                       <Select value={form.day} onValueChange={v => setForm({...form, day: v})}>
                         <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Matière *</Label>
                    <Input placeholder="ex: Mathématiques" className="rounded-xl border-slate-200" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Professeur</Label>
                    <Input placeholder="Nom de l'enseignant" className="rounded-xl border-slate-200" value={form.teacher_name} onChange={e => setForm({...form, teacher_name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Début</Label>
                       <Select value={form.start_time} onValueChange={v => setForm({...form, start_time: v})}>
                         <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                         <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fin</Label>
                       <Select value={form.end_time} onValueChange={v => setForm({...form, end_time: v})}>
                         <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                         <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                       </Select>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Couleur d'affichage</Label>
                    <div className="flex gap-2 flex-wrap">
                       {colors.map(c => (
                         <button 
                           key={c.name}
                           className={`h-8 w-8 rounded-full border-2 ${c.class.split(' ')[0]} ${form.color === c.class ? 'border-slate-900 shadow-md scale-110' : 'border-transparent opacity-60'}`}
                           onClick={() => setForm({...form, color: c.class})}
                         />
                       ))}
                    </div>
                 </div>
                 <Button className="w-full bg-edu-gradient text-white h-12 rounded-xl font-bold mt-4" onClick={handleAdd}>Valider la programmation</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
         <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
               <div className="grid grid-cols-[100px_repeat(6,1fr)] border-b bg-slate-50/50">
                  <div className="p-6"></div>
                  {days.map(day => (
                    <div key={day} className="p-6 text-center font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 border-l border-slate-100">{day}</div>
                  ))}
               </div>
               
               <div className="divide-y divide-slate-100 relative">
                  {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-[100px_repeat(6,1fr)] min-h-[120px]">
                       <div className="p-6 text-xs font-black text-slate-400 flex items-center justify-center border-r border-slate-100 bg-slate-50/30">{hour}</div>
                       {days.map(day => {
                          const slot = schedule.find(s => s.day === day && s.start_time === hour);
                          const cls = classes.find(c => c.id === slot?.class_id);
                          
                          return (
                            <div key={`${day}-${hour}`} className="p-2 border-l border-slate-100 relative group hover:bg-slate-50/50 transition-colors">
                               {slot && (
                                 <div className={`h-full w-full p-3 rounded-[1.2rem] border shadow-sm group-hover:shadow-md transition-all flex flex-col justify-between ${slot.color}`}>
                                    <div>
                                      <div className="flex justify-between items-start">
                                         <div className="text-[10px] font-black uppercase tracking-wider mb-1">{slot.subject}</div>
                                         <button onClick={() => handleDelete(slot.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:scale-125 transition-all"><Trash className="h-3 w-3" /></button>
                                      </div>
                                      <div className="flex items-center gap-2 text-[9px] opacity-80 font-bold">
                                         <User className="h-3 w-3" /> {slot.teacher_name}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                       <Badge variant="outline" className="text-[8px] font-black uppercase bg-white/40 border-none px-2">{cls?.name || '...'}</Badge>
                                       <div className="text-[8px] font-bold opacity-60 flex items-center gap-1">
                                          <Clock className="h-3 w-3" /> {slot.start_time} - {slot.end_time}
                                       </div>
                                    </div>
                                 </div>
                               )}
                            </div>
                          );
                       })}
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </Card>
    </div>
  );
}
