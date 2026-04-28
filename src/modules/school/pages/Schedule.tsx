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

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { DUMMY_SCHEDULE, DUMMY_CLASSES } from "@/lib/mock-data";

export default function Schedule() {
  const { user, isPresentationMode } = useAuth();
  const [selectedClass, setSelectedClass] = useState("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  useEffect(() => {
    if (isPresentationMode) {
      setSchedule(DUMMY_SCHEDULE);
      setClasses(DUMMY_CLASSES);
    } else {
      // Real API load would go here
      setSchedule([]);
    }
  }, [user, isPresentationMode]);

  const filteredSchedule = selectedClass === "all" 
    ? schedule 
    : schedule.filter(s => s.class === selectedClass);

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
                 <SelectItem key={c.id} value={c.name} className="font-medium">{c.name}</SelectItem>
               ))}
            </SelectContent>
          </Select>
          <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-indigo-200 h-11 px-6 rounded-xl">
             <Plus className="w-4 h-4" /> Nouveau Cours
          </Button>
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
                          // Find course that STARTS at this hour
                          const slot = filteredSchedule.find(s => s.day === day && s.start === hour);
                          
                          // Check if this cell is part of an ONGOING course (duration > 1h)
                          // For simplicity in this demo, we just render if it starts here.
                          // Real logic would calculate rowSpan.
                          
                          return (
                            <div key={`${day}-${hour}`} className="p-3 border-l border-slate-100 relative group hover:bg-slate-50/50 transition-colors">
                               {slot && (
                                 <div className={`h-full w-full p-4 rounded-[1.5rem] border shadow-sm group-hover:shadow-md transition-all flex flex-col justify-between ${slot.color || 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                                    <div>
                                      <div className="text-[11px] font-black uppercase tracking-wider mb-2">{slot.subject}</div>
                                      <div className="flex items-center gap-2 text-[10px] opacity-80 font-bold mb-1">
                                         <User className="h-3.5 w-3.5" /> {slot.teacher}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] opacity-70 font-medium">
                                         <MapPin className="h-3.5 w-3.5" /> {slot.room}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                       <Badge variant="outline" className="text-[9px] font-black uppercase bg-white/50 border-none px-2">{slot.class}</Badge>
                                       <div className="text-[9px] font-bold opacity-60 flex items-center gap-1">
                                          <Clock className="h-3 w-3" /> {slot.start} - {slot.end}
                                       </div>
                                    </div>
                                 </div>
                               )}
                               {!slot && (
                                 <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white shadow-sm text-slate-300 hover:text-indigo-600">
                                      <Plus className="h-4 w-4" />
                                    </Button>
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
