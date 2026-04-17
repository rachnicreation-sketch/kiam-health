import { useState, useEffect } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  CloudSun, 
  Moon, 
  Plus, 
  X,
  UserPlus,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { User, GuardShift, ShiftQuart } from "@/lib/mock-data";
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

const QUARTS: { id: ShiftQuart; label: string; time: string; icon: any; color: string }[] = [
  { id: 'morning', label: 'Matin', time: '08h–14h', icon: Sun, color: 'text-orange-500 bg-orange-50' },
  { id: 'afternoon', label: 'Après-midi', time: '14h–20h', icon: CloudSun, color: 'text-blue-500 bg-blue-50' },
  { id: 'night', label: 'Nuit', time: '20h–08h', icon: Moon, color: 'text-indigo-600 bg-indigo-50' },
];

export default function GuardPlanning() {
  const { user, can } = useAuth();
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [searchTerm, setSearchTerm] = useState("");
  
  const [guards, setGuards] = useState<GuardShift[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection for adding
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedQuart, setSelectedQuart] = useState<ShiftQuart>("morning");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [guardsData, usersData] = await Promise.all([
        api.guards.list(user.clinicId),
        api.users.list(user.clinicId)
      ]);
      
      setGuards(guardsData.map((g: any) => ({
        ...g,
        date: g.guard_date
      })));
      setStaff(usersData.filter((u: User) => u.role !== 'saas_admin'));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger le planning." });
    } finally {
      setIsLoading(false);
    }
  };

  const weekDays = viewMode === 'week' 
    ? Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i))
    : viewMode === 'day'
    ? [currentWeekStart]
    : eachDayOfInterval({ start: startOfMonth(currentWeekStart), end: endOfMonth(currentWeekStart) });

  const filteredStaff = staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddGuard = async () => {
    if (!selectedStaffId || !selectedDate || !user?.clinicId) return;

    try {
      await api.guards.create({
        clinicId: user.clinicId,
        userId: selectedStaffId,
        date: selectedDate,
        quart: selectedQuart
      });

      loadData();
      setIsAddDialogOpen(false);
      toast({ title: "Garde assignée", description: "Le planning a été mis à jour." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const removeGuard = async (id: string) => {
    try {
      await api.guards.delete(id);
      loadData();
      toast({ title: "Garde supprimée", description: "L'assignation a été retirée du planning." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const getGuardsFor = (date: Date, quartId: ShiftQuart) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return guards.filter(g => {
      const matchDate = g.date === dateStr && g.quart === quartId;
      if (!matchDate) return false;
      if (searchTerm) {
        const staffMember = staff.find(s => s.id === g.userId);
        return staffMember?.name.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });
  };

  const handleAutoRotate = () => {
    if (!user?.clinicId || staff.length === 0) return;
    
    toast({ title: "Rotation Auto.", description: "La rotation automatique via API sera prochainement supportée en batch." });
  };

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentWeekStart(addDays(currentWeekStart, -1));
    else if (viewMode === 'week') setCurrentWeekStart(addDays(currentWeekStart, -7));
    else setCurrentWeekStart(addMonths(currentWeekStart, -1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentWeekStart(addDays(currentWeekStart, 1));
    else if (viewMode === 'week') setCurrentWeekStart(addDays(currentWeekStart, 7));
    else setCurrentWeekStart(addMonths(currentWeekStart, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Planning des gardes
          </h1>
          <p className="text-muted-foreground text-sm">Organisation des rotations de l'établissement</p>
        </div>

        <div className="flex items-center gap-2 bg-background border rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2 min-w-[120px] text-center">
            {viewMode === 'day' ? format(currentWeekStart, 'PP', { locale: fr }) :
             viewMode === 'week' ? `Semaine du ${format(currentWeekStart, 'dd MMM', { locale: fr })}` :
             format(currentWeekStart, 'MMMM yyyy', { locale: fr })}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
           <div className="bg-muted p-1 rounded-lg flex gap-1">
              <Button variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('day')} className="h-7 text-xs">Jour</Button>
              <Button variant={viewMode === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('week')} className="h-7 text-xs">Semaine</Button>
              <Button variant={viewMode === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('month')} className="h-7 text-xs">Mois</Button>
           </div>
           {can('planning', 'write') && (
             <Button onClick={handleAutoRotate} variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                <CloudSun className="h-4 w-4" /> 
                <span className="hidden sm:inline">Rotation Auto.</span>
             </Button>
           )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par personnel..." 
              className="pl-10 h-9" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2 text-xs text-muted-foreground items-center">
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-orange-500"></div> Matin</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-500"></div> Après-midi</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-indigo-600"></div> Nuit</div>
         </div>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-4 text-left font-semibold text-sm w-32">Quart</th>
                {weekDays.map((day) => (
                  <th key={day.toString()} className={`p-4 text-center border-l min-w-[140px] ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                    <div className="text-xs uppercase text-muted-foreground font-bold">{format(day, 'EEE', { locale: fr })}</div>
                    <div className={`text-lg font-bold mt-1 ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                      {format(day, 'dd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUARTS.map((quart) => (
                <tr key={quart.id} className="border-b last:border-0">
                  <td className="p-4 bg-muted/20">
                    <div className="flex flex-col items-center justify-center text-center space-y-1">
                      <quart.icon className={`h-5 w-5 ${quart.color.split(' ')[0]}`} />
                      <span className="text-xs font-bold uppercase">{quart.label}</span>
                      <span className="text-[10px] text-muted-foreground">{quart.time}</span>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const assigned = getGuardsFor(day, quart.id);
                    return (
                      <td key={day.toString()} className={`p-2 border-l vertical-top h-32 ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}>
                        <div className="space-y-2 h-full flex flex-col">
                          {assigned.map((g) => {
                            const staffMember = staff.find(s => s.id === g.userId);
                            return (
                              <div key={g.id} className={`group flex items-center justify-between p-2 rounded-md border text-xs font-medium shadow-sm transition-all hover:shadow-md ${quart.color}`}>
                                <span className="truncate">{staffMember?.name || 'Inconnu'}</span>
                                {can('planning', 'write') && (
                                  <button onClick={() => removeGuard(g.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          
                          {can('planning', 'write') && (
                            <Button 
                              variant="ghost" 
                              className="mt-auto w-full h-8 border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary opacity-40 hover:opacity-100"
                              onClick={() => {
                                setSelectedDate(format(day, 'yyyy-MM-dd'));
                                setSelectedQuart(quart.id);
                                setIsAddDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              <span className="text-[10px]">Assigner</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner une garde</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Membre du personnel</label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un membre" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs text-muted-foreground">Date</label>
                 <div className="p-2 border rounded-md mt-1 bg-muted/50 text-sm font-medium">
                   {selectedDate ? format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr }) : ''}
                 </div>
               </div>
               <div>
                 <label className="text-xs text-muted-foreground">Quart</label>
                 <div className="p-2 border rounded-md mt-1 bg-muted/50 text-sm font-medium">
                   {QUARTS.find(q => q.id === selectedQuart)?.label}
                 </div>
               </div>
            </div>
            <Button className="w-full" onClick={handleAddGuard}>Valider l'assignation</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
