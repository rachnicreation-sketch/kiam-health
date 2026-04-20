import { useState, useEffect } from "react";
import { 
  Stethoscope, 
  FlaskConical, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { MedicalAct, LabService } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

export default function Catalogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [acts, setActs] = useState<MedicalAct[]>([]);
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActDialogOpen, setIsActDialogOpen] = useState(false);
  const [isLabDialogOpen, setIsLabDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [actForm, setActForm] = useState({
    name: "",
    category: "Consultation",
    price: ""
  });

  const [labForm, setLabForm] = useState({
    testName: "",
    category: "Biochimie",
    price: "",
    unit: "",
    normativeValue: ""
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
      const [actsData, labData] = await Promise.all([
        api.catalogs.listActs(user.clinicId),
        api.catalogs.listLab(user.clinicId)
      ]);
      setActs(actsData);
      setLabServices(labData);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les catalogues." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAct = async () => {
    if (!user?.clinicId) return;

    try {
      await api.catalogs.saveAct({
        ...actForm,
        id: editingItem?.id,
        clinicId: user.clinicId,
        price: Number(actForm.price)
      });

      toast({ title: "Succès", description: "Acte enregistré avec succès." });
      setIsActDialogOpen(false);
      setEditingItem(null);
      setActForm({ name: "", category: "Consultation", price: "" });
      loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleSaveLab = async () => {
    if (!user?.clinicId) return;

    try {
      await api.catalogs.saveLab({
        ...labForm,
        id: editingItem?.id,
        clinicId: user.clinicId,
        price: Number(labForm.price)
      });

      toast({ title: "Succès", description: "Analyse enregistrée avec succès." });
      setIsLabDialogOpen(false);
      setEditingItem(null);
      setLabForm({ testName: "", category: "Biochimie", price: "", unit: "", normativeValue: "" });
      loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const deleteAct = async (id: string) => {
    try {
      await api.catalogs.delete(id, 'act');
      loadData();
      toast({ title: "Supprimé", description: "L'acte a été retiré du catalogue." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const deleteLab = async (id: string) => {
    try {
      await api.catalogs.delete(id, 'lab');
      loadData();
      toast({ title: "Supprimé", description: "L'analyse a été retirée du catalogue." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const openEditAct = (act: MedicalAct) => {
    setEditingItem(act);
    setActForm({ name: act.name, category: act.category, price: act.price.toString() });
    setIsActDialogOpen(true);
  };

  const openEditLab = (lab: LabService) => {
    setEditingItem(lab);
    setLabForm({ 
      testName: lab.testName, 
      category: lab.category, 
      price: lab.price.toString(),
      unit: lab.unit || "",
      normativeValue: lab.normativeValue || ""
    });
    setIsLabDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Catalogues des Tarifs</h1>
          <p className="text-muted-foreground text-sm">Gérez les prix des actes médicaux et des analyses de laboratoire.</p>
        </div>
      </div>

      <Tabs defaultValue="acts" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="acts" className="gap-2">
            <Stethoscope className="h-4 w-4" /> Actes Médicaux
          </TabsTrigger>
          <TabsTrigger value="lab" className="gap-2">
            <FlaskConical className="h-4 w-4" /> Analyses Labo
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par nom..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <TabsContent value="acts" className="m-0">
            <Button className="gap-2" onClick={() => {
              setEditingItem(null);
              setActForm({ name: "", category: "Consultation", price: "" });
              setIsActDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" /> Nouvel Acte
            </Button>
          </TabsContent>
          <TabsContent value="lab" className="m-0">
            <Button className="gap-2" onClick={() => {
              setEditingItem(null);
              setLabForm({ testName: "", category: "Biochimie", price: "", unit: "", normativeValue: "" });
              setIsLabDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" /> Nouvelle Analyse
            </Button>
          </TabsContent>
        </div>

        <TabsContent value="acts">
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px]">Nom de l'Acte</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Catégorie</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Tarif (CFA)</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acts.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="font-bold">{act.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{act.category}</TableCell>
                    <TableCell className="font-mono font-bold">{act.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEditAct(act)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAct(act.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {acts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Aucun acte défini.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="lab">
          <Card className="border-none shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px]">Analyse</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Spécification</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Tarif (CFA)</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labServices.filter(l => l.testName.toLowerCase().includes(searchTerm.toLowerCase())).map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-bold">{lab.testName}</TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">{lab.category}</div>
                      <div className="text-[10px] italic">{lab.normativeValue} {lab.unit}</div>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{lab.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEditLab(lab)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLab(lab.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {labServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Aucune analyse définie.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Acte */}
      <Dialog open={isActDialogOpen} onOpenChange={setIsActDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier l'Acte" : "Ajouter un Nouvel Acte"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de l'Acte</Label>
              <Input value={actForm.name} onChange={e => setActForm({...actForm, name: e.target.value})} placeholder="ex: Consultation Cardiologie" />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={actForm.category} onValueChange={v => setActForm({...actForm, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Soins">Soins & Infirmerie</SelectItem>
                  <SelectItem value="Maternité">Maternité</SelectItem>
                  <SelectItem value="Chirurgie">Chirurgie</SelectItem>
                  <SelectItem value="Radiologie">Radiologie / Imagerie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prix (CFA)</Label>
              <div className="relative">
                <Input type="number" value={actForm.price} onChange={e => setActForm({...actForm, price: e.target.value})} className="pl-8" />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveAct}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Lab */}
      <Dialog open={isLabDialogOpen} onOpenChange={setIsLabDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier l'Analyse" : "Nouvelle Analyse"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Nom de l'Analyse</Label>
              <Input value={labForm.testName} onChange={e => setLabForm({...labForm, testName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={labForm.category} onValueChange={v => setLabForm({...labForm, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Biochimie">Biochimie</SelectItem>
                  <SelectItem value="Hématologie">Hématologie</SelectItem>
                  <SelectItem value="Sérologie">Sérologie</SelectItem>
                  <SelectItem value="Parasitologie">Parasitologie</SelectItem>
                  <SelectItem value="Bactériologie">Bactériologie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prix (CFA)</Label>
              <Input type="number" value={labForm.price} onChange={e => setLabForm({...labForm, price: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Unité</Label>
              <Input value={labForm.unit} onChange={e => setLabForm({...labForm, unit: e.target.value})} placeholder="ex: g/dL" />
            </div>
            <div className="space-y-2">
              <Label>Valeur Normative</Label>
              <Input value={labForm.normativeValue} onChange={e => setLabForm({...labForm, normativeValue: e.target.value})} placeholder="ex: 12-16" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveLab}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
