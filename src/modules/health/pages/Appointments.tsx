import { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  Search, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  CalendarCheck2,
  Phone,
  MoreVertical,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/export-utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Patient, User as UserType, Appointment } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { api } from "@/lib/api-service";

export default function Appointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<Partial<Appointment>>({
    patientId: "",
    doctorId: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    time: "09:00",
    type: "Consultation Générale"
  });

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [appsData, patsData, usersData] = await Promise.all([
        api.appointments.list(user.clinicId),
        api.patients.list(user.clinicId),
        api.users.list(user.clinicId)
      ]);
      setAppointments(appsData);
      setPatients(patsData);
      setDoctors(usersData.filter((u: any) => u.role === 'doctor'));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les rendez-vous." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!form.patientId || !form.doctorId || !form.date || !form.time || !user?.clinicId) {
       toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs." });
       return;
    }

    try {
      await api.appointments.create({
        ...form,
        clinicId: user.clinicId,
        status: 'pending'
      });

      toast({ title: "Rendez-vous programmé", description: "RDV confirmé dans le système." });
      loadData();
      setIsAddDialogOpen(false);
      setForm({ patientId: "", doctorId: "", date: format(new Date(), 'yyyy-MM-dd'), time: "09:00", type: "Consultation Générale" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Appointment['status']) => {
    try {
      await api.appointments.updateStatus(id, newStatus);
      loadData();
      toast({ title: "Statut mis à jour", description: "Le statut du rendez-vous a été modifié." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const getDayAppointments = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(a => a.date === dateStr);
  };

  const selectedDayApps = getDayAppointments(selectedDate).filter(a => 
    a.patient.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.doctor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (selectedDayApps.length === 0) {
      toast({ variant: "destructive", title: "Export impossible", description: "Aucun rendez-vous pour ce jour." });
      return;
    }
    const dataToExport = selectedDayApps.map(a => ({
      Heure: a.time,
      Patient: a.patient,
      Médecin: a.doctor,
      Type: a.type,
      Statut: a.status
    }));
    exportToCSV(dataToExport, `Agenda_${format(selectedDate, 'yyyy-MM-dd')}`);
  };

  const handleExportPDF = () => {
    if (selectedDayApps.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Agenda du ${format(selectedDate, 'dd/MM/yyyy')}`, 20, 20);
    
    autoTable(doc, {
      startY: 30,
      head: [['Heure', 'Patient', 'Médecin', 'Type', 'Statut']],
      body: selectedDayApps.map(a => [a.time, a.patient, a.doctor, a.type, a.status]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Agenda_${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const appointmentTypes = ["Consultation Générale", "Suivi Post-Op", "Vaccination", "Examen Prénatal", "Visite Spécialiste", "Urgence"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="h-6 w-6 text-primary" />
            Gestion des Rendez-vous
          </h1>
          <p className="text-muted-foreground text-sm">Agenda des consultations et planification médicale</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Réserver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Plannifier une Visite</DialogTitle>
                <CardDescription>Saisissez les informations de passage du patient</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Date *</Label>
                      <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <Label>Heure *</Label>
                      <Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select value={form.patientId} onValueChange={v => setForm({...form, patientId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} {p.firstName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Médecin sollicité *</Label>
                  <Select value={form.doctorId} onValueChange={v => setForm({...form, doctorId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.specialty ? `Dr ${d.name} (${d.specialty})` : `Dr ${d.name}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type de visite</Label>
                  <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentTypes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full mt-2" onClick={handleSchedule}>Valider le rendez-vous</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Weekly Calendar Component */}
        <Card className="lg:col-span-1 border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Agenda</CardTitle>
              <div className="flex gap-1">
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                   <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{format(weekStart, 'MMMM yyyy', { locale: fr })}</p>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {weekDays.map((day, idx) => {
              const count = getDayAppointments(day).length;
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button 
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex flex-col items-start">
                    <span className={`text-[10px] uppercase font-bold ${isSelected ? 'opacity-70' : 'text-muted-foreground'}`}>{format(day, 'EEE', { locale: fr })}</span>
                    <span className="text-sm font-black">{format(day, 'dd')}</span>
                  </div>
                  {count > 0 && (
                    <Badge variant={isSelected ? "secondary" : "default"} className={`h-5 w-5 rounded-full flex items-center justify-center p-0 text-[10px] font-bold ${isSelected ? 'bg-white text-primary' : ''}`}>
                      {count}
                    </Badge>
                  )}
                  {isToday && !isSelected && <div className="h-1.5 w-1.5 rounded-full bg-primary absolute left-1"></div>}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Daily View List */}
        <Card className="lg:col-span-3 border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between border-b">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <Calendar className="h-5 w-5 text-primary" />
               </div>
               <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">RDV du {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}</CardTitle>
                  <CardDescription className="text-[11px]">{selectedDayApps.length} rendez-vous programmés</CardDescription>
               </div>
            </div>
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher patient..." 
                  className="pl-9 h-8 bg-white text-xs" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="w-[100px]">Heure</TableHead>
                  <TableHead>Patient & Médecin</TableHead>
                  <TableHead>Type / Service</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDayApps.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                        <div className="opacity-30 mb-2 font-black text-xl uppercase tracking-widest">Aucun RDV</div>
                        <p className="text-xs italic">Cliquez sur "Réserver" pour en ajouter un.</p>
                     </TableCell>
                  </TableRow>
                ) : (
                  selectedDayApps.map((app) => (
                    <TableRow key={app.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm font-bold text-primary">{app.time}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="text-xs font-black uppercase tracking-tighter flex items-center gap-1.5">
                             <User className="h-3 w-3 text-muted-foreground" /> {app.patient}
                           </span>
                           <span className="text-[10px] text-muted-foreground italic flex items-center gap-1.5">
                              <Stethoscope className="h-3 w-3" /> Dr {app.doctor}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-[9px] h-4 bg-white uppercase font-bold border-muted-foreground/20">{app.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <Badge 
                             variant={app.status === 'confirmed' ? 'default' : app.status === 'cancelled' ? 'destructive' : app.status === 'attended' ? 'secondary' : 'outline'}
                             className={`text-[9px] h-4 uppercase ${app.status === 'attended' ? 'bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100' : ''}`}
                           >
                             {app.status === 'pending' ? 'En attente' : app.status === 'confirmed' ? 'Confirmé' : app.status === 'cancelled' ? 'Annulé' : 'Arrivé'}
                           </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                            {app.status === 'pending' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleStatusUpdate(app.id, 'confirmed')}>
                                <Calendar className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {app.status !== 'attended' && app.status !== 'cancelled' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => handleStatusUpdate(app.id, 'attended')}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {app.status !== 'cancelled' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={() => handleStatusUpdate(app.id, 'cancelled')}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Stats of the month */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="border-none shadow-sm bg-white p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total ce mois</p>
            <p className="text-2xl font-black">{appointments.length}</p>
         </Card>
         <Card className="border-none shadow-sm bg-white p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Confirmés</p>
            <p className="text-2xl font-black text-blue-600">{appointments.filter(a => a.status === 'confirmed').length}</p>
         </Card>
         <Card className="border-none shadow-sm bg-white p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Arrivés</p>
            <p className="text-2xl font-black text-emerald-600">{appointments.filter(a => a.status === 'attended').length}</p>
         </Card>
         <Card className="border-none shadow-sm bg-white p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Annulés</p>
            <p className="text-2xl font-black text-rose-600">{appointments.filter(a => a.status === 'cancelled').length}</p>
         </Card>
      </div>
    </div>
  );
}
