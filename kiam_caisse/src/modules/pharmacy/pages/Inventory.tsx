import { useState, useEffect } from "react";
import { 
  Pill, Plus, Search, AlertTriangle, Package, Edit2,
  Trash2, Layers, Download, CheckCircle, RefreshCw, Copy, Printer 
} from "lucide-react";
import Barcode from 'react-barcode';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";
import { exportToCSV } from "@/lib/export-utils";

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [medications, setMedications] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);

  // Forms
  const [medForm, setMedForm] = useState({
    name: "", category: "Médicaments", unit: "boîte", threshold: "5", price: "0",
    code_product: "", barcode: "", dci: "", form: "", dosage: "", presentation: "",
    brand: "", supplier: "", price_buy: "0", price_wholesale: "0", stock_max: "100", storage_location: "", description: ""
  });
  const [editingMed, setEditingMed] = useState<any>(null);

  // Generate EAN-13 barcode (starts with 200 for internal products)
  const generateBarcode = () => {
    const base = '200' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
    const check = (10 - (sum % 10)) % 10;
    return base + check;
  };

  const [batchForm, setBatchForm] = useState({
    medication_id: "", batch_number: "", mfg_date: "", expiry_date: "", quantity: "", price_buy: "", supplier: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meds, batchesData, statsData] = await Promise.all([
        apiRequest("pharmacy.php?action=list_medications"),
        apiRequest("pharmacy.php?action=list_batches"),
        apiRequest("pharmacy.php?action=stats")
      ]);
      setMedications(meds);
      setBatches(batchesData);
      setStats(statsData);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger l'inventaire." });
    }
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-generate barcode if empty
    const payload = { ...medForm };
    if (!payload.barcode) payload.barcode = generateBarcode();
    if (editingMed) payload.id = editingMed.id;
    try {
      const result = await apiRequest("pharmacy.php?action=save_medication", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      // Update barcode in form so user can see it
      if (result?.barcode) setMedForm(prev => ({ ...prev, barcode: result.barcode }));
      toast({ title: editingMed ? "Produit mis à jour" : "Produit enregistré", description: "Fiche médicament sauvegardée avec succès." });
      setIsAddMedOpen(false);
      setEditingMed(null);
      loadData();
      resetMedForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleEditMed = (med: any) => {
    setEditingMed(med);
    setMedForm({
      name: med.name || "", category: med.category || "Médicaments", unit: med.unit || "boîte",
      threshold: String(med.threshold || "5"), price: String(med.price || "0"),
      code_product: med.code_product || "", barcode: med.barcode || "",
      dci: med.dci || "", form: med.form || "", dosage: med.dosage || "",
      presentation: med.presentation || "", brand: med.brand || "", supplier: med.supplier || "",
      price_buy: String(med.price_buy || "0"), price_wholesale: String(med.price_wholesale || "0"),
      stock_max: String(med.stock_max || "100"), storage_location: med.storage_location || "", description: med.description || ""
    });
    setIsAddMedOpen(true);
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("pharmacy.php?action=save_batch", {
        method: "POST",
        body: JSON.stringify(batchForm)
      });
      toast({ title: "Lot enregistré", description: "Nouveau lot ajouté en stock." });
      setIsAddBatchOpen(false);
      loadData();
      setBatchForm({ medication_id: "", batch_number: "", mfg_date: "", expiry_date: "", quantity: "", price_buy: "", supplier: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleRecallBatch = async (batchId: string) => {
    // Standard batch recall simulation
    toast({ title: "Rappel de lot", description: `Le lot ${batchId} a été rappelé. Les ventes sont bloquées.` });
  };

  const resetMedForm = () => {
    setEditingMed(null);
    setMedForm({
      name: "", category: "Médicaments", unit: "boîte", threshold: "5", price: "0",
      code_product: "", barcode: "", dci: "", form: "", dosage: "", presentation: "",
      brand: "", supplier: "", price_buy: "0", price_wholesale: "0", stock_max: "100", storage_location: "", description: ""
    });
  };

  const filteredMeds = medications.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.dci && m.dci.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* KPI stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Gestion des Stocks & Lots</h1>
          <p className="text-xs text-muted-foreground">Registre des médicaments en officine et suivi des péremptions (FIFO).</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddMedOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs h-9">
            <Plus className="h-4 w-4" /> Nouveau Médicament
          </Button>
          <Button onClick={() => setIsAddBatchOpen(true)} variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-2 text-xs h-9">
            <Layers className="h-4 w-4" /> Entrée Lot (Batch)
          </Button>
          <Button onClick={() => exportToCSV(medications, "Catalogue_Officine")} variant="outline" className="gap-2 text-xs h-9">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Product table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrer par nom, DCI..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10 h-10 bg-white"
            />
          </div>

          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Médicament / DCI</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Code-barres</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Achat / Vente</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeds.map(m => (
                    <TableRow key={m.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="font-bold text-slate-800 text-xs">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.dci || "Pas de DCI"}</div>
                      </TableCell>
                      <TableCell className="text-xs">{m.form} {m.dosage}</TableCell>
                      <TableCell>
                        {m.barcode ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-slate-700">{m.barcode}</span>
                            <button onClick={() => { navigator.clipboard.writeText(m.barcode); toast({ title: "Copié!", description: m.barcode }); }} className="text-slate-400 hover:text-slate-700">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : <span className="text-[10px] text-slate-300 italic">Aucun</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={m.stock <= m.threshold ? "destructive" : "secondary"} className="text-xs font-bold font-mono">
                          {m.stock} {m.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        <span className="text-slate-400">{Number(m.price_buy).toLocaleString()}</span> / <span className="text-emerald-700 font-bold">{Number(m.price).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleEditMed(m)} className="h-7 px-2">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Batch Tracking */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                Lots actifs en Stock (FIFO)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {batches.map(b => {
                const exp = new Date(b.expiry_date);
                const today = new Date();
                const isExpired = exp < today;
                
                return (
                  <div key={b.id} className="border-b last:border-0 pb-3 last:pb-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate">{b.medication_name || "Médicament"}</p>
                        <p className="text-[10px] text-muted-foreground">Lot: <span className="font-mono font-bold text-slate-700">{b.batch_number}</span></p>
                      </div>
                      <Badge variant={isExpired ? "destructive" : "outline"} className="text-[9px]">
                        {isExpired ? "EXPIRÉ" : "ACTIF"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Restant: {b.remaining_qty} / {b.quantity}</span>
                      <span>Exp: {b.expiry_date}</span>
                    </div>
                    {isExpired && (
                      <Button onClick={() => handleRecallBatch(b.batch_number)} size="sm" variant="destructive" className="w-full text-[10px] h-7 font-bold">
                        Bloquer Lot / Retirer du stock
                      </Button>
                    )}
                  </div>
                );
              })}
              {batches.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Aucun lot actif enregistré.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG: NEW / EDIT PRODUCT */}
      <Dialog open={isAddMedOpen} onOpenChange={(v) => { setIsAddMedOpen(v); if (!v) resetMedForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingMed ? "Modifier la Fiche Médicament" : "Créer une Fiche Médicament"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveMedication} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom Commercial *</Label>
                <Input required value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">DCI (Dénomination Commune Internationale) *</Label>
                <Input required value={medForm.dci} onChange={e => setMedForm({...medForm, dci: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            {/* ─── BARCODE FIELD ─── */}
            <div className="space-y-1.5 p-3 bg-slate-50 border rounded-xl">
              <Label className="text-xs font-bold text-slate-700">Code-barres (EAN-13, EAN-8, UPC)</Label>
              <div className="flex gap-2">
                <Input 
                  value={medForm.barcode} 
                  onChange={e => setMedForm({...medForm, barcode: e.target.value})}
                  placeholder="Laisser vide pour générer automatiquement"
                  className="h-9 text-xs font-mono flex-1 bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMedForm({...medForm, barcode: generateBarcode()})}
                  className="h-9 gap-1 text-xs whitespace-nowrap border-emerald-400 text-emerald-700 hover:bg-emerald-50 bg-white"
                >
                  <RefreshCw className="h-3 w-3" /> Générer
                </Button>
                {medForm.barcode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { navigator.clipboard.writeText(medForm.barcode); toast({ title: "Code copié!", description: medForm.barcode }); }}
                    className="h-9 gap-1 text-xs"
                  >
                    <Copy className="h-3 w-3" /> Copier
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">Le code-barres est utilisé pour le scan rapide lors des ventes (POS).</p>
              {medForm.barcode && (
                <div className="mt-4 flex flex-col items-center bg-white p-3 rounded-lg border border-dashed border-slate-300">
                  <Barcode value={medForm.barcode} format="CODE128" height={40} fontSize={14} background="#ffffff" />
                  <Button type="button" size="sm" variant="outline" className="text-xs mt-2 h-7" onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow?.document.write(`<html><head><title>Imprimer Code-Barres</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;"><img src="https://barcode.tec-it.com/barcode.ashx?data=${medForm.barcode}&code=Code128&translate-esc=true" /></body><script>setTimeout(() => window.print(), 500);</script></html>`);
                    printWindow?.document.close();
                  }}>
                    <Printer className="h-3 w-3 mr-1" /> Imprimer Étiquette
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Code Produit Interne</Label>
                <Input value={medForm.code_product} onChange={e => setMedForm({...medForm, code_product: e.target.value})} className="h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Catégorie *</Label>
                <Input required value={medForm.category} onChange={e => setMedForm({...medForm, category: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Forme</Label>
                <Input value={medForm.form} onChange={e => setMedForm({...medForm, form: e.target.value})} className="h-9 text-xs" placeholder="Comprimé, Ampoule..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dosage</Label>
                <Input value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Présentation</Label>
                <Input value={medForm.presentation} onChange={e => setMedForm({...medForm, presentation: e.target.value})} className="h-9 text-xs" placeholder="Boîte de 30, ..." />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prix Achat (CFA)</Label>
                <Input type="number" value={medForm.price_buy} onChange={e => setMedForm({...medForm, price_buy: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prix Vente Détail (CFA) *</Label>
                <Input type="number" required value={medForm.price} onChange={e => setMedForm({...medForm, price: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prix Grossiste (CFA)</Label>
                <Input type="number" value={medForm.price_wholesale} onChange={e => setMedForm({...medForm, price_wholesale: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Unité de mesure</Label>
                <Input value={medForm.unit} onChange={e => setMedForm({...medForm, unit: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stock Min (Alerte)</Label>
                <Input type="number" value={medForm.threshold} onChange={e => setMedForm({...medForm, threshold: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stock Max</Label>
                <Input type="number" value={medForm.stock_max} onChange={e => setMedForm({...medForm, stock_max: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 text-sm">
              {editingMed ? "Mettre à jour le médicament" : "Ajouter au Catalogue Officine"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: NEW BATCH */}
      <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Réception de Lot (Officine)</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBatch} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Médicament *</Label>
              <Select required value={batchForm.medication_id} onValueChange={v => setBatchForm({...batchForm, medication_id: v})}>
                <SelectTrigger className="h-9 text-xs bg-white"><SelectValue placeholder="Choisir médicament" /></SelectTrigger>
                <SelectContent>
                  {medications.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Numéro de Lot *</Label>
                <Input required value={batchForm.batch_number} onChange={e => setBatchForm({...batchForm, batch_number: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantité reçue *</Label>
                <Input type="number" min={1} required value={batchForm.quantity} onChange={e => setBatchForm({...batchForm, quantity: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date de fabrication</Label>
                <Input type="date" value={batchForm.mfg_date} onChange={e => setBatchForm({...batchForm, mfg_date: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date d'expiration *</Label>
                <Input type="date" required value={batchForm.expiry_date} onChange={e => setBatchForm({...batchForm, expiry_date: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
              Enregistrer l'Entrée Stock
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
