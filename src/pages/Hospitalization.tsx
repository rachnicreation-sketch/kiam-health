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
  Calendar,
  Settings2
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
import { History, MoveRight } from "lucide-react";
import { api } from "@/lib/api-service";

export default function Hospitalization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<Partial<Admission>>({
    patientId: "",
    bedId: "",
    reason: ""
  });

  // Bed configuration state
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [bedForm, setBedForm] = useState<Partial<Bed>>({
    ward: "", room: "", bedNum: ""
  });

  // Transfer state
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({ admissionId: "", newBedId: "" });

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [bedsData, patientsData, admissionsData, transfersData] = await Promise.all([
        api.hospitalization.beds(user.clinicId),
        api.patients.list(user.clinicId),
        api.hospitalization.admissions(user.clinicId),
        api.hospitalization.transfers(user.clinicId)
      ]);
      
      setBeds(bedsData);
      setPatients(patientsData);
      // Reformater les champs date des admissions si nécessaire
      setAdmissions(admissionsData.map((a: any) => ({
        ...a,
        dateIn: a.date_in,
        dateOut: a.date_out
      })));
      setTransfers(transfersData.map((t: any) => ({
        ...t,
        oldBed: t.old_bed_info,
        newBed: t.new_bed_info,
        date: t.transfer_date
      })));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des données hospitalières échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdmission = async () => {
    if (!form.patientId || !form.bedId || !form.reason || !user?.clinicId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs." });
      return;
    }

    try {
      await api.hospitalization.createAdmission({
        clinicId: user.clinicId,
        patientId: form.patientId,
        bedId: form.bedId,
        reason: form.reason,
        dateIn: new Date().toISOString()
      });

      toast({ title: "Patient admis", description: "Le dossier d'hospitalisation a été créé avec succès." });
      loadData();
      setIsAddDialogOpen(false);
      setForm({ patientId: "", bedId: "", reason: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleDischarge = async (admission: Admission) => {
    if (!user?.clinicId) return;
    try {
      await api.hospitalization.discharge({
        id: admission.id,
        bedId: admission.bedId
      });

      toast({ title: "Sortie validée", description: "Le lit a été libéré." });
      loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleTransfer = (admission: Admission) => {
    setTransferForm({ admissionId: admission.id, newBedId: "" });
    setIsTransferDialogOpen(true);
  };

  const confirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.admissionId || !transferForm.newBedId || !user?.clinicId) return;

    const admissionToTransfer = admissions.find(a => a.id === transferForm.admissionId);
    if(!admissionToTransfer) return;

    const oldBed = beds.find(b => b.id === admissionToTransfer.bedId);
    const newBed = beds.find(b => b.id === transferForm.newBedId);
    
    try {
      await api.hospitalization.transfer({
        clinicId: user.clinicId,
        admissionId: admissionToTransfer.id,
        patientId: admissionToTransfer.patientId,
        oldBedId: admissionToTransfer.bedId,
        newBedId: transferForm.newBedId,
        oldBedInfo: `${oldBed?.ward} - Ch. ${oldBed?.room} / Lit ${oldBed?.bedNum}`,
        newBedInfo: `${newBed?.ward} - Ch. ${newBed?.room} / Lit ${newBed?.bedNum}`
      });

      toast({ title: "Transfert réussi", description: "Le patient a été muté vers un autre lit." });
      loadData();
      setIsTransferDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.clinicId || !bedForm.ward || !bedForm.room || !bedForm.bedNum) return;

    try {
      await api.hospitalization.createBed({
        clinicId: user.clinicId,
        ward: bedForm.ward,
        room: bedForm.room,
        bedNum: bedForm.bedNum,
        status: 'available'
      });

      toast({ title: "Configuration à jour", description: "Le lit a été ajouté au service." });
      loadData();
      setIsAddBedOpen(false);
      setBedForm({ ward: "", room: "", bedNum: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
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

          {/* Transfer Dialog */}
          <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transférer le Patient</DialogTitle>
                <CardDescription>Choisissez le nouveau lit de destination</CardDescription>
              </DialogHeader>
              <form onSubmit={confirmTransfer} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nouveau Lit disponible *</Label>
                  <Select required value={transferForm.newBedId} onValueChange={v => setTransferForm({...transferForm, newBedId: v})}>
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
                <Button type="submit" className="w-full">Confirmer le Transfert</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="beds" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50 p-1">
          <TabsTrigger value="beds">Gestion des Lits</TabsTrigger>
          <TabsTrigger value="active">Admissions Actives</TabsTrigger>
          <TabsTrigger value="transfers">Historique Transferts</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="transfers" className="pt-4">
           <Card className="border-none shadow-md overflow-hidden">
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-muted/10">
                       <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Ancien Emplacement</TableHead>
                          <TableHead></TableHead>
                          <TableHead>Nouveau Emplacement</TableHead>
                          <TableHead className="text-right">Date & Heure</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {transfers.length === 0 ? (
                         <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">Aucun transfert enregistré</TableCell></TableRow>
                       ) : transfers.map(t => {
                          const patient = patients.find(p => p.id === t.patientId);
                          return (
                            <TableRow key={t.id}>
                               <TableCell>
                                  <div className="font-bold text-xs uppercase">{patient?.name} {patient?.firstName}</div>
                                  <div className="text-[10px] text-muted-foreground">{patient?.id}</div>
                               </TableCell>
                               <TableCell><Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-[10px]">{t.oldBed}</Badge></TableCell>
                               <TableCell><MoveRight className="h-4 w-4 text-muted-foreground/30"/></TableCell>
                               <TableCell><Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 font-mono text-[10px] border-indigo-100">{t.newBed}</Badge></TableCell>
                               <TableCell className="text-right text-xs text-muted-foreground">{new Date(t.date).toLocaleString('fr-FR')}</TableCell>
                            </TableRow>
                          )
                       })}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>

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
                          <TableCell className="text-right flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => handleTransfer(adm)}
                            >
                              <Building2 className="h-3.5 w-3.5 mr-1" /> Transfert
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleDischarge(adm)}
                            >
                              <DoorOpen className="h-3.5 w-3.5 mr-1" /> Sortie
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

        <TabsContent value="config" className="pt-4 space-y-4">
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Settings2 className="h-5 w-5"/> Infrastructure Hospitalière</h2>
              <Dialog open={isAddBedOpen} onOpenChange={setIsAddBedOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4" /> Ajouter un Lit</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Paramétrer l'infrastructure</DialogTitle>
                    <CardDescription>Ajoutez de nouvelles unités à votre établissement.</CardDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBed} className="space-y-4 pt-4">
                    <div className="space-y-2">
                       <Label>Nom du Service (Pavillon)</Label>
                       <Input required placeholder="Ex: Maternité, Pédiatrie, Réanimation..." value={bedForm.ward} onChange={e => setBedForm({...bedForm, ward: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>N° de Chambre</Label>
                          <Input required placeholder="101, B2..." value={bedForm.room} onChange={e => setBedForm({...bedForm, room: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <Label>N° du Lit</Label>
                          <Input required placeholder="1, 2..." value={bedForm.bedNum} onChange={e => setBedForm({...bedForm, bedNum: e.target.value})} />
                       </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg flex items-start gap-2 mt-2">
                       <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                       <p className="text-xs text-muted-foreground">Créer un lit dans un service qui n'existe pas encore va automatiquement créer le service dans le système.</p>
                    </div>
                    <Button type="submit" className="w-full">Valider la création</Button>
                  </form>
                </DialogContent>
              </Dialog>
           </div>

           <Card>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-muted/10">
                       <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Capacité Initiale</TableHead>
                          <TableHead>Occupation</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {wards.length === 0 ? (
                         <TableRow><TableCell colSpan={3} className="text-center py-8">Aucun service défini</TableCell></TableRow>
                       ) : wards.map(ward => {
                          const wardBeds = beds.filter(b => b.ward === ward);
                          const occupied = wardBeds.filter(b => b.status === 'occupied').length;
                          const percent = Math.round((occupied / wardBeds.length) * 100);
                          return (
                            <TableRow key={ward}>
                               <TableCell className="font-bold">{ward}</TableCell>
                               <TableCell>{wardBeds.length} Lit(s)</TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-48">
                                       <div className={`h-full ${percent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <span className="text-xs font-mono">{percent}%</span>
                                 </div>
                               </TableCell>
                            </TableRow>
                          )
                       })}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
