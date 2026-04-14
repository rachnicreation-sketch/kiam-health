import { useState, useEffect } from "react";
import { Pill, Plus, Search, AlertTriangle, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Medication } from "@/lib/mock-data";

export default function Pharmacy() {
  const { user, can } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // New med form
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    loadMeds();
  }, [user]);

  const loadMeds = () => {
    const allMeds: Medication[] = JSON.parse(localStorage.getItem('kiam_medications') || '[]');
    if (user?.clinicId) {
      setMedications(allMeds.filter(m => m.clinicId === user.clinicId));
    }
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newStock || !user?.clinicId) return;

    const allMeds: Medication[] = JSON.parse(localStorage.getItem('kiam_medications') || '[]');
    const newMed: Medication = {
      id: `M${user.clinicId.slice(1)}-${Date.now().toString().slice(-4)}`,
      clinicId: user.clinicId,
      name: newName,
      category: newCat,
      stock: parseInt(newStock),
      unit: 'unite',
      threshold: 10,
      price: `${newPrice} FCFA`
    };

    const updatedMeds = [...allMeds, newMed];
    localStorage.setItem('kiam_medications', JSON.stringify(updatedMeds));
    setMedications(updatedMeds.filter(m => m.clinicId === user.clinicId));
    
    setIsAddDialogOpen(false);
    resetForm();
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

        {can('pharmacy', 'write') && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau médicament
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
                    <TableCell className="hidden lg:table-cell text-right font-mono text-xs">{m.price}</TableCell>
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
    </div>
  );
}
