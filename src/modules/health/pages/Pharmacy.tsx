import { useState, useEffect } from "react";
import { Pill, Plus, Search, AlertTriangle, DollarSign, Package, ShoppingCart, Download, Clock, History } from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Medication, Patient } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

export default function Pharmacy() {
  const { user, clinic, can } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDispenseDialogOpen, setIsDispenseDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // New med form
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Dispense Form
  const [dispenseForm, setDispenseForm] = useState({
     patientId: "",
     medId: "",
     quantity: 1
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
      const [medsData, patsData, salesData] = await Promise.all([
        api.pharmacy.medications(user.clinicId),
        api.patients.list(user.clinicId),
        api.pharmacy.sales(user.clinicId)
      ]);
      setMedications(medsData);
      setPatients(patsData);
      setSales(salesData);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des données pharmacie échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newStock || !user?.clinicId) return;

    try {
      await api.pharmacy.createMedication({
        clinicId: user.clinicId,
        name: newName,
        category: newCat,
        stock: parseInt(newStock),
        unit: 'unité',
        threshold: 10,
        price: parseFloat(newPrice) || 0
      });

      toast({ title: "Produit ajouté", description: "Médicament enregistré dans l'inventaire." });
      loadData();
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseForm.patientId || !dispenseForm.medId || dispenseForm.quantity < 1 || !user?.clinicId) return;

    const med = medications.find(m => m.id === dispenseForm.medId);
    if (!med) return;
    
    if (med.stock < dispenseForm.quantity) {
       toast({ variant: "destructive", title: "Stock insuffisant", description: `Il ne reste que ${med.stock} unités.` });
       return;
    }

    try {
      const unitPrice = parseFloat(med.price.toString().replace(/[^\d.]/g, '')) || 0;
      const totalCost = unitPrice * dispenseForm.quantity;

      // 1. Décrémenter le stock
      await api.pharmacy.updateMedication({
        id: med.id,
        stock_adjustment: -dispenseForm.quantity
      });

      // 2. Facturation Automatique
      await api.invoices.create({
        clinicId: user.clinicId,
        patientId: dispenseForm.patientId,
        items: [{ description: `Pharmacie: ${med.name} (x${dispenseForm.quantity})`, amount: totalCost }],
        total: totalCost,
        status: 'pending'
      });

      // 3. Journaliser la vente
      await api.pharmacy.createSale({
        clinicId: user.clinicId,
        patientId: dispenseForm.patientId,
        medicationId: med.id,
        quantity: dispenseForm.quantity,
        totalPrice: totalCost,
        author: user.name
      });

      toast({ title: "Médicament délivré", description: `Le coût (${totalCost} CFA) a été ajouté à la facture.` });
      loadData();
      setIsDispenseDialogOpen(false);
      setDispenseForm({ patientId: "", medId: "", quantity: 1 });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleExportCSV = () => {
    if (medications.length === 0) {
      toast({ variant: "destructive", title: "Export impossible", description: "Il n'y a aucun produit en stock à exporter." });
      return;
    }
    exportToCSV(medications, "Inventaire_Pharmacie");
    toast({ title: "Export réussi", description: "L'inventaire a été exporté en CSV." });
  };

  const handleExportPDF = () => {
    if (medications.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(clinic?.name || "Kiam Health", 20, 20);
    doc.setFontSize(14);
    doc.text("Inventaire de Pharmacie", 20, 30);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 36);

    autoTable(doc, {
      startY: 45,
      head: [['ID', 'Médicament', 'Catégorie', 'Stock', 'Prix']],
      body: medications.map(m => [m.id, m.name, m.category, `${m.stock} ${m.unit}`, `${m.price.toLocaleString()} CFA`]),
      theme: 'striped',
      headStyles: { fillColor: [0, 150, 136] }
    });

    doc.save(`Inventaire_Pharmacie_${new Date().getTime()}.pdf`);
    toast({ title: "Export réussi", description: "L'inventaire PDF a été généré." });
  };

  const resetForm = () => {
    setNewName("");
    setNewCat("");
    setNewStock("");
    setNewPrice("");
  };

  const lowStockCount = medications.filter((m) => m.stock <= m.threshold).length;
  const filteredMeds = medications.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const stockMovements = [
    { id: 1, med: "Paracétamol", type: "Entrée", qty: "+100", date: "2026-04-13", user: "Pharmacien A" },
    { id: 2, med: "Amoxicilline", type: "Sortie", qty: "-10", date: "2026-04-13", user: "Dr Keita" },
    { id: 3, med: "Ibuprofène", type: "Entrée", qty: "+50", date: "2026-04-12", user: "Admin" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            Pharmacie
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des stocks spécifiques à votre clinique</p>
        </div>

        <div className="flex gap-2">
            <Button className="gap-2" variant="outline" onClick={() => setIsHistoryOpen(true)}>
              <History className="h-4 w-4" />
              Historique des Ventes
            </Button>
            {can('pharmacy', 'write') && (
              <Dialog open={isDispenseDialogOpen} onOpenChange={setIsDispenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ShoppingCart className="h-4 w-4" />
                    Délivrer Médicament
                  </Button>
                </DialogTrigger>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Délivrance et Facturation Automatique</DialogTitle>
                 </DialogHeader>
                 <form onSubmit={handleDispense} className="space-y-4 pt-2">
                   <div className="space-y-2">
                     <Label>Patient *</Label>
                     <Select required value={dispenseForm.patientId} onValueChange={v => setDispenseForm({...dispenseForm, patientId: v})}>
                       <SelectTrigger><SelectValue placeholder="Choisir un patient" /></SelectTrigger>
                       <SelectContent>
                         {patients.map(p => (
                           <SelectItem key={p.id} value={p.id}>{p.name} {p.firstName}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Médicament *</Label>
                     <Select required value={dispenseForm.medId} onValueChange={v => setDispenseForm({...dispenseForm, medId: v})}>
                       <SelectTrigger><SelectValue placeholder="Boutique..." /></SelectTrigger>
                       <SelectContent>
                         {medications.filter(m => m.stock > 0).map(m => (
                           <SelectItem key={m.id} value={m.id}>{m.name} ({m.stock} en stock) - {m.price} CFA</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Quantité</Label>
                     <Input required type="number" min={1} value={dispenseForm.quantity} onChange={e => setDispenseForm({...dispenseForm, quantity: parseInt(e.target.value)})} />
                   </div>
                   <div className="bg-muted p-3 text-xs text-muted-foreground rounded bg-indigo-50 text-indigo-700 font-medium">
                     Cette opération déduira le stock et ajoutera la somme à la facture du patient au niveau de la Caisse.
                   </div>
                   <Button type="submit" className="w-full">Valider la Délivrance</Button>
                 </form>
               </DialogContent>
             </Dialog>
           )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleExportPDF}>
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
           {can('pharmacy', 'write') && (
             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
               <DialogTrigger asChild>
                 <Button className="gap-2" variant="outline">
                   <Plus className="h-4 w-4" />
                   Nouveau produit
                 </Button>
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Ajout Inventaire Pharmaceutique</DialogTitle>
                 </DialogHeader>
                 <form onSubmit={handleAddMed} className="space-y-4 pt-2">
                   <div className="space-y-2">
                     <Label htmlFor="mname">Nom du médicament</Label>
                     <div className="relative">
                       <Pill className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input id="mname" required value={newName} onChange={e => setNewName(e.target.value)} className="pl-9" placeholder="ex: Paracétamol" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="mcat">Catégorie</Label>
                     <Input id="mcat" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Antibiotique, Antalgique..." />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="mstock">Stock Initial</Label>
                       <div className="relative">
                         <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input id="mstock" type="number" required value={newStock} onChange={e => setNewStock(e.target.value)} className="pl-9" />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="mprice">Prix Unitaire (FCFA)</Label>
                       <div className="relative">
                         <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input id="mprice" type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="pl-9" />
                       </div>
                     </div>
                   </div>
                   <Button type="submit" className="w-full">Enregistrer en stock</Button>
                 </form>
               </DialogContent>
             </Dialog>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total références" value={String(medications.length)} icon={Pill} />
        <StatCard title="Rupture / Bas stock" value={String(lowStockCount)} icon={AlertTriangle} iconClassName="bg-destructive/10 text-destructive" changeType="negative" change={lowStockCount > 0 ? "Réapprovisionnement nécessaire" : "Stock optimal"} />
        <StatCard title="Valeur Stock" value="--" icon={DollarSign} iconClassName="bg-success/10 text-success" />
      </div>

      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" /> Inventaire des Produits
            </CardTitle>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-10 h-8 text-xs bg-white" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead>Médicament</TableHead>
                <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Prix Unitaire</TableHead>
                <TableHead className="text-right">État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                    Aucun produit en stock
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeds.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-bold text-xs">{m.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{m.id}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{m.category}</TableCell>
                    <TableCell className="font-bold text-sm">{m.stock} <span className="text-[10px] font-normal text-muted-foreground">{m.unit}</span></TableCell>
                    <TableCell className="hidden lg:table-cell text-right font-mono text-xs">{m.price} CFA</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={m.stock <= m.threshold ? "destructive" : "outline"} className="text-[9px] h-4">
                        {m.stock <= m.threshold ? "STOCK BAS" : "DISPONIBLE"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 border-b">
           <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
             <AlertTriangle className="h-4 w-4 text-amber-500" /> Historique des Mouvements
           </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader className="bg-muted/10">
               <TableRow>
                 <TableHead className="text-[10px] uppercase">Médicament</TableHead>
                 <TableHead className="text-[10px] uppercase">Type</TableHead>
                 <TableHead className="text-[10px] uppercase">Quantité</TableHead>
                 <TableHead className="text-[10px] uppercase">Date</TableHead>
                 <TableHead className="text-[10px] uppercase text-right">Auteur</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {stockMovements.map(sm => (
                 <TableRow key={sm.id} className="hover:bg-muted/30">
                   <TableCell className="text-xs font-bold">{sm.med}</TableCell>
                   <TableCell>
                     <Badge variant={sm.type === 'Entrée' ? 'secondary' : 'outline'} className="text-[9px] h-4">{sm.type}</Badge>
                   </TableCell>
                   <TableCell className={`text-xs font-bold font-mono ${sm.type === 'Entrée' ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {sm.qty}
                   </TableCell>
                   <TableCell className="text-xs text-muted-foreground">{sm.date}</TableCell>
                   <TableCell className="text-right text-xs text-muted-foreground italic">{sm.user}</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
        </CardContent>
      </Card>

      {/* Sales History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Journal des Ventes & Délivrances
               </DialogTitle>
               <CardDescription>Liste chronologique des médicaments servis aux patients.</CardDescription>
            </DialogHeader>
            <div className="pt-4">
               <Table>
                  <TableHeader className="bg-muted/10">
                     <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Médicament</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Total (CFA)</TableHead>
                        <TableHead className="text-right">Servi par</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {sales.length === 0 ? (
                       <TableRow><TableCell colSpan={6} className="text-center py-8">Aucune vente enregistrée.</TableCell></TableRow>
                     ) : sales.map(s => {
                        const patient = patients.find(p => p.id === s.patientId);
                        return (
                          <TableRow key={s.id} className="text-xs">
                             <TableCell className="text-muted-foreground">{new Date(s.date).toLocaleString('fr-FR')}</TableCell>
                             <TableCell className="font-bold uppercase">{patient?.name} {patient?.firstName}</TableCell>
                             <TableCell>{s.medName}</TableCell>
                             <TableCell className="text-right font-mono font-bold">x{s.quantity}</TableCell>
                             <TableCell className="text-right font-mono">{s.totalPrice.toLocaleString()}</TableCell>
                             <TableCell className="text-right italic text-muted-foreground">{s.author}</TableCell>
                          </TableRow>
                        )
                     })}
                  </TableBody>
               </Table>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
