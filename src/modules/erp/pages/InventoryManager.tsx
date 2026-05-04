import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Warehouse, 
  AlertCircle,
  Package,
  History,
  ArrowLeft,
  Trash2,
  Edit2,
  Barcode
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function InventoryManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentValue, setAdjustmentValue] = useState("0");
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "Général",
    sku: "",
    stock: "0",
    price_buy: "0",
    price_sell: "0",
    unit: "unité",
    threshold: "5"
  });

  const generateBarcode = () => {
    // Generate a random 13-digit barcode (EAN-13 style)
    const prefix = "200"; // Local/Instore prefix
    const randomPart = Math.floor(Math.random() * 899999999) + 100000000;
    const barcode = `${prefix}${randomPart}`;
    setFormData(prev => ({ ...prev, sku: barcode }));
    toast({ title: "Code-barres généré", description: barcode });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.inventory.list(user.clinicId);
      setInventory(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger l'inventaire." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    try {
      if (formData.id) {
        await api.inventory.update({ ...formData, clinicId: user.clinicId });
        toast({ title: "Produit mis à jour", description: `${formData.name} a été modifié.` });
      } else {
        await api.inventory.add({ 
          ...formData, 
          sku: formData.sku || `SKU-${Date.now()}`,
          clinicId: user.clinicId 
        });
        toast({ title: "Produit ajouté", description: `${formData.name} est enregistré.` });
      }
      setIsAddOpen(false);
      loadData();
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'enregistrement." });
    }
  };

  const handleAdjustStock = async () => {
    try {
      await api.inventory.adjust({
        id: selectedProduct.id,
        adjustment: parseInt(adjustmentValue),
        clinicId: user.clinicId
      });
      toast({ title: "Stock mis à jour", description: `Le stock de ${selectedProduct.name} a été modifié.` });
      setIsAdjustOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'ajustement." });
    }
  };

  const openAdjust = (product: any) => {
    setSelectedProduct(product);
    setAdjustmentValue("0");
    setIsAdjustOpen(true);
  };

  const resetForm = () => {
    setFormData({ id: "", name: "", category: "Général", sku: "", stock: "0", price_buy: "0", price_sell: "0", unit: "unité", threshold: "5" });
  };

  const handleEdit = (product: any) => {
    setFormData({
      id: product.id,
      name: product.name,
      category: product.category,
      sku: product.sku,
      stock: product.stock.toString(),
      price_buy: product.price_buy.toString(),
      price_sell: product.price_sell.toString(),
      unit: product.unit,
      threshold: product.threshold.toString()
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
    try {
      await api.inventory.delete(id);
      toast({ title: "Produit supprimé", description: "Le produit a été retiré du stock." });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la suppression." });
    }
  };

  const handlePrintLabel = (product: any) => {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Étiquette - ${product.name}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; text-align: center; padding: 20px; }
            .label { border: 2px solid black; padding: 15px; display: inline-block; width: 280px; }
            .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; text-transform: uppercase; }
            .sku { font-size: 24px; font-weight: black; margin: 10px 0; letter-spacing: 5px; }
            .price { font-size: 20px; font-weight: bold; margin-top: 5px; }
            .barcode-sim { height: 40px; background: repeating-linear-gradient(90deg, black, black 2px, white 2px, white 4px); margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${product.name}</div>
            <div class="barcode-sim"></div>
            <div class="sku">${product.sku}</div>
            <div class="price">${Number(product.price_sell).toLocaleString()} CFA</div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
  };


  const filtered = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 border-none flex items-center gap-3">
              <Warehouse className="h-8 w-8 text-emerald-600" /> Gestion des Stocks
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium border-none italic-none">Contrôle complet de l'inventaire et des approvisionnements.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white shadow-lg shadow-emerald-200 h-11 px-6 rounded-xl border-none">
                <Plus className="w-4 h-4" /> Nouvel Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white rounded-[2.5rem] p-8 border-none italic-none">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black border-none">{formData.id ? "Modifier l'Article" : "Ajouter au Stock Global"}</DialogTitle>
                <CardDescription className="italic-none border-none">Remplissez les détails techniques du produit.</CardDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 pt-6 italic-none border-none">
                  <div className="col-span-2 space-y-2 border-none">
                     <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Désignation *</Label>
                     <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Nom du produit..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="col-span-2 space-y-2 border-none">
                     <div className="flex items-center justify-between">
                       <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Code-Barres (SKU)</Label>
                       <Button variant="ghost" size="sm" onClick={generateBarcode} className="h-6 text-[10px] uppercase font-bold text-emerald-600 gap-1"><Barcode className="w-3 h-3"/> Générer Code</Button>
                     </div>
                     <Input className="h-12 rounded-xl bg-slate-50 border-none font-mono" placeholder="Scannez ou saisissez..." value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                 <div className="space-y-2 border-none">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Catégorie</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Ex: Matériaux, Électro..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                 </div>
                 <div className="space-y-2 border-none">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Unité</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Sac, KG, Unité..." value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                 </div>
                 <div className="space-y-2 border-none">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Prix Achat</Label>
                    <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.price_buy} onChange={e => setFormData({...formData, price_buy: e.target.value})} />
                 </div>
                 <div className="space-y-2 border-none">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Prix Vente</Label>
                    <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.price_sell} onChange={e => setFormData({...formData, price_sell: e.target.value})} />
                 </div>
                 <div className="space-y-2 border-none">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Stock Initial</Label>
                    <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                 </div>
                 <div className="space-y-2 border-none">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 border-none">Seuil d'Alerte</Label>
                    <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.threshold} onChange={e => setFormData({...formData, threshold: e.target.value})} />
                 </div>
               </div>
               <div className="pt-6 border-none italic-none">
                  <Button className="w-full h-14 bg-emerald-600 font-black text-white rounded-2xl border-none shadow-xl shadow-emerald-100" onClick={handleAddOrUpdate}>
                     {formData.id ? "METTRE À JOUR" : "ENREGISTRER L'ARTICLE"}
                  </Button>
               </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
         <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="relative w-80">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                     <Input 
                        placeholder="Rechercher matricule, nom..." 
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <Button variant="outline" className="rounded-xl border-slate-200 gap-2 font-bold h-11"><Filter className="h-4 w-4" /> Filtres</Button>
               </div>
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                     <span className="text-[10px] font-black uppercase text-slate-400">Alerte</span>
                  </div>
               </div>
            </div>
         </CardHeader>
         <CardContent className="p-0 border-none">
            <Table className="border-none">
               <TableHeader className="bg-slate-50/50 border-none">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Produit</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Actuel</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Prix Vente</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right p-6">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody className="border-none">
                  {filtered.length === 0 ? (
                     <TableRow className="hover:bg-transparent border-none">
                        <TableCell colSpan={6} className="h-64 text-center border-none">
                           <div className="flex flex-col items-center justify-center opacity-20 border-none italic-none">
                              <Package className="h-16 w-16 mb-4" />
                              <p className="font-black text-lg uppercase tracking-widest">STOCK VIDE OU AUCUN RÉSULTAT</p>
                           </div>
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((item) => (
                        <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100 italic-none">
                           <TableCell className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                    <Package className="h-6 w-6 text-slate-400" />
                                 </div>
                                 <div className="border-none">
                                    <p className="text-sm font-black text-slate-900 uppercase border-none leading-none mb-1">{item.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-wider border-none leading-none">{item.sku}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] uppercase font-black px-2 py-0">{item.category}</Badge>
                           </TableCell>
                           <TableCell>
                              <div className="font-mono text-sm font-black text-slate-700">
                                 {item.stock} <span className="text-[10px] text-slate-400 uppercase font-bold">{item.unit}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right">
                              <div className="font-mono text-sm font-black text-emerald-600">
                                 {Number(item.price_sell).toLocaleString()} <span className="text-[9px]">CFA</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              {Number(item.stock) <= Number(item.threshold) ? (
                                 <Badge className="bg-rose-100 text-rose-600 border-none text-[9px] uppercase font-black flex items-center gap-1 w-fit animate-pulse">
                                    <AlertCircle className="h-3 w-3" /> Alerte
                                 </Badge>
                              ) : (
                                 <Badge className="bg-emerald-100 text-emerald-600 border-none text-[9px] uppercase font-black flex items-center gap-1 w-fit">
                                    Normal
                                 </Badge>
                              )}
                           </TableCell>
                           <TableCell className="text-right p-6">
                              <div className="flex justify-end gap-2 border-none">
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Approvisionner" onClick={() => openAdjust(item)}>
                                    <Plus className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleEdit(item)}>
                                    <Edit2 className="h-4 w-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </CardContent>
         <CardFooter className="p-6 border-t bg-slate-50/50 italic-none">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} PRODUITS RÉPERTORIÉS</p>
          </CardFooter>
      </Card>

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md bg-white rounded-[2rem] p-8 border-none">
           <DialogHeader>
              <DialogTitle className="text-2xl font-black">Approvisionnement</DialogTitle>
              <CardDescription>Ajouter ou retirer du stock pour {selectedProduct?.name}</CardDescription>
           </DialogHeader>
           <div className="space-y-4 pt-6">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500 uppercase">Stock Actuel</span>
                 <span className="text-lg font-black">{selectedProduct?.stock} {selectedProduct?.unit}</span>
              </div>
              <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase text-slate-500">Quantité à ajouter (+ ou -)</Label>
                 <Input 
                   type="number" 
                   className="h-14 rounded-xl bg-slate-50 border-none text-xl font-black text-center" 
                   value={adjustmentValue} 
                   onChange={e => setAdjustmentValue(e.target.value)} 
                 />
              </div>
           </div>
           <div className="pt-6">
              <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 font-black text-white rounded-2xl border-none shadow-xl shadow-indigo-100" onClick={handleAdjustStock}>
                 VALIDER L'AJUSTEMENT
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
