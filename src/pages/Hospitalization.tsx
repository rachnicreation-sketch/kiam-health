import { useState, useEffect } from "react";
import { 
  BedDouble, 
  Plus, 
  Search, 
  UserPlus, 
  DoorOpen, 
  LayoutGrid, 
  List, 
  AlertCircle,
  Building2,
  Stethoscope,
  Info,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Patient, Bed, Admission } from "@/lib/mock-data";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Hospitalization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [form, setForm] = useState<Partial<Admission>>({
    patientId: "",
    bedId: "",
    reason: ""
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (!user?.clinicId) return;
    const allBeds: Bed[] = JSON.parse(localStorage.getItem('kiam_beds') || '[]');
    const allPatients: Patient[] = JSON.parse(localStorage.getItem('kiam_patients') || '[]');
    const allAdmissions: Admission[] = JSON.parse(localStorage.getItem('kiam_admissions') || '[]');
    
    setBeds(allBeds.filter(b => b.clinicId === user.clinicId));
    setPatients(allPatients.filter(p => p.clinicId === user.clinicId));
    setAdmissions(allAdmissions.filter(a => a.clinicId === user.clinicId).sort((a,b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime()));
  };

  const handleAdmission = () => {
    if (!form.patientId || !form.bedId || !form.reason || !user?.clinicId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs." });
      return;
    }

    const allAdmissions: Admission[] = JSON.parse(localStorage.getItem('kiam_admissions') || '[]');
    const allBeds: Bed[] = JSON.parse(localStorage.getItem('kiam_beds') || '[]');
    
    const newAdmission: Admission = {
      id: `ADM-${Date.now()}`,
      clinicId: user.clinicId,
      patientId: form.patientId,
      bedId: form.bedId,
      dateIn: new Date().toISOString().split('T')[0],
      dateOut: null,
      reason: form.reason,
      status: 'active'
    };

    // Update bed status
    const updatedBeds = allBeds.map(b => b.id === form.bedId ? { ...b, status: 'occupied' as const } : b);
    
    localStorage.setItem('kiam_admissions', JSON.stringify([...allAdmissions, newAdmission]));
    localStorage.setItem('kiam_beds', JSON.stringify(updatedBeds));
    
    loadData();
    setIsAddDialogOpen(false);
    toast({ title: "Patient admis", description: "Le dossier d'hospitalisation a été créé avec succès." });
    setForm({ patientId: "", bedId: "", reason: "" });
  };

  const handleDischarge = (admission: Admission) => {
    if (!user?.clinicId) return;
    const allAdmissions: Admission[] = JSON.parse(localStorage.getItem('kiam_admissions') || '[]');
    const allBeds: Bed[] = JSON.parse(localStorage.getItem('kiam_beds') || '[]');
    
    const updatedAdmissions = allAdmissions.map(a => 
      a.id === admission.id ? { ...a, status: 'discharged' as const, dateOut: new Date().toISOString().split('T')[0] } : a
    );
    
    const updatedBeds = allBeds.map(b => b.id === admission.bedId ? { ...b, status: 'available' as const } : b);
    
    localStorage.setItem('kiam_admissions', JSON.stringify(updatedAdmissions));
    localStorage.setItem('kiam_beds', JSON.stringify(updatedBeds));
    
    loadData();
    toast({ title: "Sortie validée", description: "Le lit a été libéré." });
  };

  const wards = Array.from(new Set(beds.map(b => b.ward)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BedDouble className="h-6 w-6 text-primary" />
            Hospitalisation & Lits
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des admissions et occupation des chambres</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')} className="hidden sm:inline-flex">
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Admettre un Patient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Admission</DialogTitle>
                <CardDescription>Assignez un lit disponible à un patient</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
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
                  <Label>Lit disponible *</Label>
                  <Select value={form.bedId} onValueChange={v => setForm({...form, bedId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un lit vacant" />
                    </SelectTrigger>
                    <SelectContent>
                      {beds.filter(b => b.status === 'available').map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.ward} - Chambre {b.room} (Lit {b.bedNum})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Motif d'admission</Label>
                  <Input 
                    placeholder="Ex: Surveillance post-opératoire, Observation..." 
                    value={form.reason}
                    onChange={e => setForm({...form, reason: e.target.value})}
                  />
                </div>
                <Button className="w-full" onClick={handleAdmission}>Enregistrer l'admission</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="beds" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="beds">Gestion des Lits</TabsTrigger>
          <TabsTrigger value="active">Admissions Actives</TabsTrigger>
        </TabsList>

        <TabsContent value="beds" className="space-y-6 pt-4">
           {wards.length === 0 ? (
             <div className="text-center py-20 bg-muted/20 rounded-lg">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground">Aucun lit n'est configuré pour cet établissement.</p>
             </div>
           ) : (
             wards.map(wardName => {
               const wardBeds = beds.filter(b => b.ward === wardName);
               return (
                 <div key={wardName} className="space-y-3">
                   <div className="flex items-center gap-2 border-b pb-2">
                     <Stethoscope className="h-4 w-4 text-primary" />
                     <h3 className="font-bold text-sm uppercase tracking-wider">{wardName}</h3>
                     <Badge variant="outline" className="text-[10px] ml-2">{wardBeds.length} Lits</Badge>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {wardBeds.map(bed => {
                       const activeAdmission = admissions.find(a => a.bedId === bed.id && a.status === 'active');
                       const patient = activeAdmission ? patients.find(p => p.id === activeAdmission.patientId) : null;
                       
                       return (
                         <Card key={bed.id} className={`border-none shadow-sm relative overflow-hidden group transition-all duration-300 ${bed.status === 'occupied' ? 'bg-amber-50 ring-1 ring-amber-100' : 'bg-emerald-50 ring-1 ring-emerald-100'}`}>
                           <CardContent className="p-3">
                             <div className="flex justify-between items-start mb-2">
                               <p className="font-mono text-[10px] font-bold opacity-50">CH.{bed.room}</p>
                               <Badge variant={bed.status === 'occupied' ? 'default' : 'outline'} className={`text-[8px] h-3 px-1 border-none ${bed.status === 'occupied' ? 'bg-amber-600' : 'text-emerald-600 bg-white'}`}>
                                 {bed.status === 'occupied' ? 'OCCUPÉ' : 'LIBRE'}
                               </Badge>
                             </div>
                             
                             <div className="flex flex-col items-center py-2">
                               <BedDouble className={`h-8 w-8 mb-2 ${bed.status === 'occupied' ? 'text-amber-600' : 'text-emerald-600 opacity-40'}`} />
                               <p className="text-[11px] font-black uppercase text-center">Lit {bed.bedNum}</p>
                             </div>

                             {bed.status === 'occupied' && (
                               <div className="mt-2 pt-2 border-t border-amber-100 flex flex-col items-center">
                                 <p className="text-[9px] font-bold truncate w-full text-center uppercase tracking-tighter">{patient?.name}</p>
                                 <p className="text-[8px] text-muted-foreground">Depuis {activeAdmission?.dateIn}</p>
                               </div>
                             )}
                             
                             {bed.status === 'occupied' && (
                               <div className="absolute inset-0 bg-amber-600/90 hidden group-hover:flex flex-col items-center justify-center p-2 text-white">
                                  <p className="text-[10px] font-bold mb-2">Libérer le lit ?</p>
                                  <Button size="sm" variant="secondary" className="h-7 text-[10px] px-2" onClick={() => handleDischarge(activeAdmission!)}>
                                    <DoorOpen className="h-3 w-3 mr-1" /> Sortie
                                  </Button>
                               </div>
                             )}
                           </CardContent>
                         </Card>
                       );
                     })}
                   </div>
                 </div>
               );
             })
           )}
        </TabsContent>

        <TabsContent value="active" className="pt-4">
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Service / Lit</TableHead>
                    <TableHead>Date Entrée</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admissions.filter(a => a.status === 'active').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic text-sm">
                        Aucun patient hospitalisé actuellement
                      </TableCell>
                    </TableRow>
                  ) : (
                    admissions.filter(a => a.status === 'active').map((adm) => {
                      const patient = patients.find(p => p.id === adm.patientId);
                      const bed = beds.find(b => b.id === adm.bedId);
                      return (
                        <TableRow key={adm.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="font-bold text-xs uppercase">{patient?.name} {patient?.firstName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{patient?.id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-xs">{bed?.ward}</div>
                            <div className="text-[10px] text-primary">Ch. {bed?.room} / Lit {bed?.bedNum}</div>
                          </TableCell>
                          <TableCell className="text-xs">
                             <div className="flex items-center gap-1.5 font-medium">
                               <Calendar className="h-3 w-3 text-muted-foreground" /> {adm.dateIn}
                             </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs max-w-[200px] truncate italic text-muted-foreground">{adm.reason}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDischarge(adm)}
                            >
                              <DoorOpen className="h-3.5 w-3.5 mr-1" /> Fin de séjour
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
