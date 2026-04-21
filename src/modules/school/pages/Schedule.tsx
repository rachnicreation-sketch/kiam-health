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

export default function Schedule() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState("all");
  const [classes, setClasses] = useState<any[]>([]);
  
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  // Mock data for initial view
  const scheduleData = [
    { day: "Lundi", start: "08:00", end: "10:00", subject: "Mathématiques", teacher: "M. Koua", room: "S-101", class: "6ème A" },
    { day: "Lundi", start: "10:00", end: "12:00", subject: "Physique", teacher: "Mme. Traore", room: "Labo 1", class: "6ème A" },
    { day: "Mardi", start: "08:00", end: "09:00", subject: "Anglais", teacher: "Mr. Smith", room: "S-202", class: "6ème A" },
    { day: "Mercredi", start: "14:00", end: "16:00", subject: "EPS", teacher: "M. Diallo", room: "Gymnase", class: "6ème A" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" /> Emploi du Temps
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Planification hebdomadaire des cours et activités.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px] h-10 border-slate-200">
               <SelectValue placeholder="Filtrer par classe" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">Toutes les classes</SelectItem>
               <SelectItem value="6ème A">6ème A</SelectItem>
               <SelectItem value="5ème B">5ème B</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-indigo-200">
             <Plus className="w-4 h-4" /> Ajouter un cours
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
         <div className="overflow-x-auto">
            <div className="min-w-[800px]">
               <div className="grid grid-cols-[100px_repeat(6,1fr)] border-b bg-slate-50/50">
                  <div className="p-4"></div>
                  {days.map(day => (
                    <div key={day} className="p-4 text-center font-black text-[10px] uppercase tracking-widest text-slate-500 border-l">{day}</div>
                  ))}
               </div>
               
               <div className="divide-y relative">
                  {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-[100px_repeat(6,1fr)] min-h-[100px]">
                       <div className="p-4 text-xs font-bold text-slate-400 flex items-center justify-center">{hour}</div>
                       {days.map(day => {
                          const slot = scheduleData.find(s => s.day === day && s.start === hour);
                          return (
                            <div key={`${day}-${hour}`} className="p-2 border-l relative group">
                               {slot && (
                                 <div className="h-full w-full p-3 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm group-hover:shadow-md transition-all">
                                    <div className="text-[10px] font-black text-indigo-600 uppercase mb-1">{slot.subject}</div>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1">
                                       <User className="h-3 w-3" /> {slot.teacher}
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                       <MapPin className="h-3 w-3" /> {slot.room}
                                    </div>
                                    <Badge variant="secondary" className="absolute top-2 right-2 text-[8px] bg-white text-slate-400 px-1 py-0">{slot.class}</Badge>
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
