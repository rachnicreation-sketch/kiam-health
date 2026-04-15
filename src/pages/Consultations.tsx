import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Stethoscope, 
  Plus, 
  Search, 
  User, 
  Activity, 
  Pill, 
  ClipboardCheck,
  History,
  Info,
  FlaskConical,
  X
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/hooks/useAuth";
import { Patient, Consultation, User as AppUser, LabService, LabTest } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-service";

export default function Consultations() {
  const { user, can } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<AppUser[]>([]);
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Consultation Form State
  const [form, setForm] = useState<Partial<Consultation>>({
    patientId: patientIdParam || "",
    doctorId: user?.id || "",
    reason: "",
    diagnosis: "",
    prescription: "",
    notes: "",
    vitals: {
      temp: "",
      bp: "",
      weight: "",
      hr: ""
    }
  });

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
    if (patientIdParam) {
      setIsAddDialogOpen(true);
    }
  }, [user, patientIdParam]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [consData, patsData, docsData, labsData] = await Promise.all([
        api.consultations.list(user.clinicId),
        api.patients.list(user.clinicId),
        api.users.list(user.clinicId),
        api.lab.services(user.clinicId)
      ]);
      
      setConsultations(consData);
      setPatients(patsData);
      setDoctors(docsData.filter((u: any) => u.role === 'doctor'));
      setLabServices(labsData);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des données échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!form.patientId || !form.reason || !form.diagnosis || !user?.clinicId) {
      toast({
        variant: "destructive",
        title: "Champs incomplets",
        description: "Veuillez remplir au moins le patient, le motif et le diagnostic."
      });
      return;
    }

    try {
      // 1. Enregistrer la consultation
      const consResponse = await api.consultations.create({
        ...form,
        clinicId: user.clinicId,
        doctorId: form.doctorId || user.id,
        status: 'completed'
      });

      if (consResponse.status === 'success') {
        // 2. Créer les tests labo si nécessaires
        if (selectedLabTests.length > 0) {
          const labTestPromises = selectedLabTests.map(testId => {
            const service = labServices.find(s => s.id === testId);
            return api.lab.createTest({
              clinicId: user.clinicId,
              patientId: form.patientId,
              doctorId: form.doctorId || user.id,
              testName: service?.testName || "Examen",
              category: service?.category || "Général",
              status: 'pending'
            });
          });
          await Promise.all(labTestPromises);

          // 3. Facturation (Simplifiée: une seule facture pour tous les tests)
          const labItems = selectedLabTests.map(testId => {
            const service = labServices.find(s => s.id === testId);
            return { description: `Lab: ${service?.testName}`, amount: service?.price || 0 };
          });
          const total = labItems.reduce((sum, item) => sum + item.amount, 0);

          await api.invoices.create({
            clinicId: user.clinicId,
            patientId: form.patientId,
            items: labItems,
            total,
            status: 'pending'
          });
        }

        toast({
          title: "Consultation enregistrée",
          description: "Le dossier médical a été mis à jour avec succès."
        });

        loadData();
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const resetForm = () => {
    setForm({
      patientId: "",
      doctorId: user?.id || "",
      reason: "",
      diagnosis: "",
      prescription: "",
      notes: "",
      vitals: { temp: "", bp: "", weight: "", hr: "" }
    });
    setSelectedLabTests([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Module de Consultation
          </h1>
          <p className="text-muted-foreground text-sm">Prise en charge des patients et prescriptions</p>
        </div>

        {can('consultations', 'write') && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Visite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Ouvrir une nouvelle consultation
              </DialogTitle>
              <CardDescription>Saisie du diagnostic et des prescriptions médicales</CardDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Left Column: Infos & Vitals */}
              <div className="md:col-span-1 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={form.patientId} onValueChange={v => setForm({...form, patientId: v})}>
                      <SelectTrigger className="bg-muted/50 font-medium">
                        <SelectValue placeholder="Rechercher un patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} {p.firstName} ({p.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Médecin Consultant</Label>
                    <Select value={form.doctorId} onValueChange={v => setForm({...form, doctorId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un médecin" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                        {doctors.length === 0 && <SelectItem value={user?.id || "u1"}>{user?.name}</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="bg-primary/5 border-primary/10 border shadow-none">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-xs font-bold uppercase flex items-center gap-2 text-primary">
                      <Activity className="h-4 w-4" />
                      Constantes Vitales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tension (BP)</Label>
                        <Input 
                          placeholder="12/8" 
                          className="h-8 text-xs font-bold"
                          value={form.vitals?.bp}
                          onChange={e => setForm({...form, vitals: {...form.vitals, bp: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Poids (Kg)</Label>
                        <Input 
                          placeholder="70" 
                          className="h-8 text-xs font-bold"
                          value={form.vitals?.weight}
                          onChange={e => setForm({...form, vitals: {...form.vitals, weight: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Temp (°C)</Label>
                        <Input 
                          placeholder="37.5" 
                          className="h-8 text-xs font-bold"
                          value={form.vitals?.temp}
                          onChange={e => setForm({...form, vitals: {...form.vitals, temp: e.target.value}})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Pouls (Cpm)</Label>
                        <Input 
                          placeholder="72" 
                          className="h-8 text-xs font-bold"
                          value={form.vitals?.hr}
                          onChange={e => setForm({...form, vitals: {...form.vitals, hr: e.target.value}})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                   <Label className="flex items-center gap-2 text-indigo-600 font-bold">
                      <FlaskConical className="h-4 w-4" /> Examens Labo Requis
                   </Label>
                   <Select onValueChange={v => {
                      if (!selectedLabTests.includes(v)) {
                         setSelectedLabTests([...selectedLabTests, v]);
                      }
                   }}>
                      <SelectTrigger className="h-8 text-xs border-indigo-200 bg-indigo-50/30">
                         <SelectValue placeholder="Ajouter un examen..." />
                      </SelectTrigger>
                      <SelectContent>
                         {labServices.map(s => (
                           <SelectItem key={s.id} value={s.id}>{s.name} - {s.price} CFA</SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                   <div className="flex flex-wrap gap-2">
                      {selectedLabTests.map(testId => {
                         const service = labServices.find(s => s.id === testId);
                         return (
                           <Badge key={testId} variant="secondary" className="gap-1 bg-white border border-indigo-100 text-indigo-700 py-1">
                              {service?.name}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => setSelectedLabTests(selectedLabTests.filter(id => id !== testId))}
                              />
                           </Badge>
                         )
                      })}
                   </div>
                </div>
              </div>

              {/* Middle & Right Column: Form */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label>Motif de consultation *</Label>
                  <Input 
                    placeholder="Fièvre, maux de tête..." 
                    value={form.reason}
                    onChange={e => setForm({...form, reason: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label>Diagnostic *</Label>
                    <Textarea 
                      placeholder="Observation clinique..." 
                      className="h-32 bg-muted/20"
                      value={form.diagnosis}
                      onChange={e => setForm({...form, diagnosis: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-success flex items-center gap-1 font-bold">
                      <Pill className="h-3 w-3" />
                      Prescription / Traitement
                    </Label>
                    <Textarea 
                      placeholder="Médicaments, posologie..." 
                      className="h-32 border-success/30 focus-visible:ring-success"
                      value={form.prescription}
                      onChange={e => setForm({...form, prescription: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes additionnelles (Observation)</Label>
                  <Textarea 
                    placeholder="Notes internes..." 
                    className="h-20"
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleSaveConsultation} className="bg-primary px-8">
                    Enregistrer la consultation
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher une consultation..." className="pl-10 bg-white" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-white">
                <History className="h-4 w-4" />
                Historique
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {consultations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">
                Aucune consultation enregistrée
              </div>
            ) : (
              consultations.map((c) => {
                const pat = patients.find(p => p.id === c.patientId);
                const doc = doctors.find(d => d.id === c.doctorId) || { name: "Dr Externe" };
                return (
                  <div key={c.id} className="p-6 hover:bg-muted/30 transition-colors cursor-pointer group">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex flex-col items-center justify-center p-3 bg-muted/50 rounded-lg shrink-0 w-24">
                        <span className="text-xs text-muted-foreground uppercase">{new Date(c.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                        <span className="text-2xl font-bold">{new Date(c.date).getDate()}</span>
                        <span className="text-[10px] text-primary font-bold">{new Date(c.date).getFullYear()}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {pat?.name} {pat?.firstName}
                          </h3>
                          <Badge variant="outline" className="font-mono text-[10px]">{c.id}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                             <Stethoscope className="h-4 w-4 text-primary" />
                             {c.reason}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground border-l pl-4">
                             <User className="h-4 w-4" />
                             {doc.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Diagnostic</span>
                            <p className="text-sm line-clamp-2">{c.diagnosis}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-success">Prescription</span>
                            <p className="text-sm font-medium text-success line-clamp-2">{c.prescription}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end">
                         <Badge className="bg-success text-white">Terminé</Badge>
                         <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">
                           Voir le dossier →
                         </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

