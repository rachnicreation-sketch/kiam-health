import { useState, useEffect } from "react";
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Beaker,
  TestTube2,
  AlertCircle,
  Download,
  Printer
} from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Patient, LabTest, User, Clinic, LabService } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreview } from "@/components/DocumentPreview";
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
import { api } from "@/lib/api-service";
import { Label } from "@/components/ui/label";
export default function Laboratory() {
  const { user, clinic, can } = useAuth();
  const { toast } = useToast();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<Partial<LabTest>>({
    patientId: "",
    doctorId: "",
    testName: "Hémogramme Complet (NFS)",
    category: "Hématologie",
  });

  const [resultForm, setResultForm] = useState({
    result: "",
    unit: "",
    normativeValue: ""
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [testsData, patsData, docsData, servicesData] = await Promise.all([
        api.lab.tests(user.clinicId),
        api.patients.list(user.clinicId),
        api.users.list(user.clinicId),
        api.lab.services(user.clinicId)
      ]);
      
      setTests(testsData);
      setPatients(patsData);
      setDoctors(docsData.filter((u: any) => u.role === 'doctor'));
      setLabServices(servicesData);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des données échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTest = async () => {
    if (!form.patientId || !form.doctorId || !form.testName || !user?.clinicId) {
       toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires." });
       return;
    }

    try {
      // 1. Créer le test labo
      const response = await api.lab.createTest({
        ...form,
        clinicId: user.clinicId,
        status: 'pending'
      });

      if (response.status === 'success') {
        // 2. Facturation Automatique
        const labSvc = labServices.find(l => l.testName === form.testName);
        const price = labSvc ? Number(labSvc.price) : 5000;

        await api.invoices.create({
          clinicId: user.clinicId,
          patientId: form.patientId,
          items: [{ description: `Laboratoire: ${form.testName}`, amount: price }],
          total: price,
          status: 'pending'
        });

        toast({ title: "Examen prescrit", description: "Analyse envoyée et facture générée." });
        loadData();
        setIsAddDialogOpen(false);
        setForm({ patientId: "", doctorId: "", testName: "Hémogramme Complet (NFS)", category: "Hématologie" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleOpenResultDialog = (test: LabTest) => {
    setSelectedTest(test);
    setResultForm({
      result: test.result || "",
      unit: test.unit || "",
      normativeValue: test.normativeValue || ""
    });
    setIsResultDialogOpen(true);
  };

  const handleSaveResult = async () => {
    if (!selectedTest || !resultForm.result) return;

    try {
      await api.lab.updateTest({
        id: selectedTest.id,
        result: resultForm.result,
        unit: resultForm.unit,
        normativeValue: resultForm.normativeValue
      });

      toast({ title: "Résultats enregistrés", description: "L'examen a été validé." });
      loadData();
      setIsResultDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const filteredTests = tests.filter(t => {
    const patient = patients.find(p => p.id === t.patientId);
    return t.testName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const testCategories = ["Hématologie", "Biochimie", "Immunologie", "Parasitologie", "Microbiologie", "Sérologie"];

  const commonTests = [
    { name: "Hémogramme Complet (NFS)", cat: "Hématologie" },
    { name: "Glycémie à jeun", cat: "Biochimie" },
    { name: "Test Paludisme (GE/TDR)", cat: "Parasitologie" },
    { name: "Widal & Félix", cat: "Sérologie" },
    { name: "Créatinine sanguine", cat: "Biochimie" },
    { name: "Examen des urines (ECBU)", cat: "Microbiologie" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Laboratoire & Analyses
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des prélèvements et résultats biologiques</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            if (tests.length === 0) {
              toast({ variant: "destructive", title: "Export impossible", description: "Il n'y a aucune donnée à exporter." });
              return;
            }
            exportToCSV(tests, "Journal_Laboratoire");
          }}>
             <Download className="h-4 w-4" />
             Exporter
          </Button>
          {can('laboratory', 'write') && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Demande d'Examen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nouvelle prescription d'analyse</DialogTitle>
                <CardDescription>Remplissez les détails pour lancer le prélèvement</CardDescription>
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
                  <Label>Médecin Prescripteur *</Label>
                  <Select value={form.doctorId} onValueChange={v => setForm({...form, doctorId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le médecin" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>Dr {d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Examen / Analyse *</Label>
                  <Select 
                     value={form.testName} 
                     onValueChange={v => {
                       const ls = labServices.find(l => l.testName === v);
                       if (ls) {
                         setForm({
                           ...form, 
                           testName: ls.testName, 
                           category: ls.category
                         });
                         // Auto-set the normative values if they exist in catalog
                         setResultForm(prev => ({
                           ...prev,
                           unit: ls.unit || "",
                           normativeValue: ls.normativeValue || ""
                         }));
                       } else {
                         setForm({...form, testName: v});
                       }
                     }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {labServices.map(ls => (
                        <SelectItem key={ls.id} value={ls.testName}>{ls.testName}</SelectItem>
                      ))}
                      <SelectItem value="Autre">Autre examen...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.testName === "Autre" && (
                  <div className="space-y-2">
                    <Label>Nom de l'examen</Label>
                    <Input placeholder="Saisir le nom de l'examen" onChange={e => setForm({...form, testName: e.target.value})} />
                  </div>
                )}
                <Button className="w-full" onClick={handleCreateTest}>Lancer la demande</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
     </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-amber-50/50">
          <CardHeader className="py-4 pb-0">
             <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600 flex justify-between">
                <span>En attente</span>
                <Clock className="h-4 w-4" />
             </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
             <div className="text-2xl font-black">{tests.filter(t => t.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="py-4 pb-0">
             <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600 flex justify-between">
                <span>Terminés (24h)</span>
                <CheckCircle2 className="h-4 w-4" />
             </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
             <div className="text-2xl font-black">{tests.filter(t => t.status === 'completed').length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="py-4 pb-0">
             <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600 flex justify-between">
                <span>Total Examens</span>
                <TestTube2 className="h-4 w-4" />
             </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
             <div className="text-2xl font-black">{tests.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par patient ou examen..." 
              className="pl-10 h-10 bg-white" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Examen</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic text-sm">
                    Aucun examen trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredTests.map((t) => {
                  const patient = patients.find(p => p.id === t.patientId);
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-bold text-xs uppercase">{patient?.name} {patient?.firstName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{patient?.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{t.testName}</div>
                        <div className="text-[10px] text-primary">{t.category}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className={t.status === 'completed' ? 'bg-emerald-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none'}>
                          {t.status === 'completed' ? 'Validé' : 'À faire'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {t.status === 'pending' ? (
                          can('laboratory', 'write') ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs text-primary gap-1"
                              onClick={() => handleOpenResultDialog(t)}
                            >
                              <Beaker className="h-3.5 w-3.5" /> Saisir Résultats
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground italic">En attente labo</Badge>
                          )
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary"
                              onClick={() => {
                                setSelectedTest(t);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DocumentPreview 
        type="lab" 
        isOpen={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
        data={selectedTest} 
        clinic={clinic} 
        patient={patients.find(p => p.id === selectedTest?.patientId) || null} 
      />

      {/* Result Entry Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saisie des Résultats Biologiques</DialogTitle>
            <CardDescription>{selectedTest?.testName} - {patients.find(p => p.id === selectedTest?.patientId)?.name}</CardDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Résultat *</Label>
                <Input value={resultForm.result} onChange={e => setResultForm({...resultForm, result: e.target.value})} placeholder="Ex: 12.5" />
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Input value={resultForm.unit} onChange={e => setResultForm({...resultForm, unit: e.target.value})} placeholder="Ex: g/dL" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valeurs de Référence (Normes)</Label>
              <Input value={resultForm.normativeValue} onChange={e => setResultForm({...resultForm, normativeValue: e.target.value})} placeholder="Ex: 11.5 - 15.0" />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-md flex gap-3 text-xs text-blue-700 border border-blue-100">
               <AlertCircle className="h-4 w-4 shrink-0" />
               <p>La validation de ces résultats les rendra visibles immédiatement au médecin prescripteur.</p>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSaveResult} className="bg-emerald-600 hover:bg-emerald-700">Valider & Signer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
