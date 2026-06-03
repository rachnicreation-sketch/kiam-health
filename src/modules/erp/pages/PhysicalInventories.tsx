import { useState, useEffect } from "react";
import { 
  ClipboardList, Search, Plus, Play, CheckCircle, 
  Trash2, FileText, ArrowLeft, RefreshCw, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PhysicalInventories() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [inventories, setInventories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // New inventory state
  const [notes, setNotes] = useState("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, prodData] = await Promise.all([
        api.erp.physicalInventories(user!.clinicId),
        api.inventory.list(user!.clinicId)
      ]);
      setInventories(invData);
      setProducts(prodData);
      // Initialize items for new inventory
      setInventoryItems(prodData.map(p => ({
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        qty_theoretical: Number(p.stock),
        qty_real: Number(p.stock),
        reason: 'error',
        notes: ''
      })));
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les inventaires." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        clinicId: user!.clinicId,
        notes,
        created_by: user!.name || 'Admin',
        items: inventoryItems
      };
      const res = await api.erp.physicalInventoryCreate(payload);
      toast({ title: "Fiche d'inventaire créée", description: `Numéro: ${res.number}` });
      setIsOpen(false);
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Création échouée." });
    }
  };

  const handleValidate = async (id: string) => {
    if (!confirm("Valider définitivement cet inventaire ? Les stocks physiques seront ajustés et les écarts comptabilisés.")) return;
    try {
      await api.erp.physicalInventoryValidate({ clinicId: user!.clinicId, id });
      toast({ title: "Inventaire validé", description: "Les stocks ont été ajustés." });
      setDetailsOpen(false);
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la validation." });
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.erp.physicalInventoryGet(user!.clinicId, id);
      setSelectedInv(res);
      setDetailsOpen(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de lire le détail." });
    }
  };

  const updateRealQty = (prodId: string, val: string) => {
    setInventoryItems(prev => prev.map(item => {
      if (item.product_id === prodId) {
        return { ...item, qty_real: val === '' ? 0 : Number(val) };
      }
      return item;
    }));
  };

  const updateReason = (prodId: string, reason: string) => {
    setInventoryItems(prev => prev.map(item => {
      if (item.product_id === prodId) {
        return { ...item, reason };
      }
      return item;
    }));
  };

  const updateItemNotes = (prodId: string, notes: string) => {
    setInventoryItems(prev => prev.map(item => {
      if (item.product_id === prodId) {
        return { ...item, notes };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-emerald-600" /> Inventaires Physiques
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Réconciliation périodique des stocks, calcul des écarts et pertes de marchandises.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white shadow-lg h-11 px-6 rounded-xl border-none">
                <Plus className="w-4 h-4" /> Faire un Inventaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-white rounded-[2rem] p-8 border-none flex flex-col h-[85vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Nouvel Inventaire Physique</DialogTitle>
                <DialogDescription>Saisissez les quantités réelles observées en magasin.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-4 flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Notes générales</Label>
                  <Input placeholder="Notes (ex: Inventaire mensuel mai)..." value={notes} onChange={e=>setNotes(e.target.value)} className="h-11 rounded-xl" />
                </div>

                <Table className="mt-4">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400">Produit</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400">Stock Théorique</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 w-28">Physique Réel</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 w-44">Motif Écart</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400">Justification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map(item => {
                      const discrepancy = item.qty_real - item.qty_theoretical;
                      return (
                        <TableRow key={item.product_id} className="hover:bg-slate-50/50">
                          <TableCell className="py-2">
                            <p className="text-xs font-black text-slate-800 uppercase">{item.name}</p>
                            <p className="text-[9px] font-mono text-slate-400">{item.sku}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-500">{item.qty_theoretical} {item.unit}</TableCell>
                          <TableCell className="py-2">
                            <Input 
                              type="number" 
                              value={item.qty_real}
                              onChange={e => updateRealQty(item.product_id, e.target.value)}
                              className="h-10 rounded-lg font-mono text-xs text-center border-slate-200" 
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            {discrepancy !== 0 && (
                              <Select value={item.reason} onValueChange={val=>updateReason(item.product_id, val)}>
                                <SelectTrigger className="h-10 rounded-lg text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                  <SelectItem value="error">Erreur Saisie</SelectItem>
                                  <SelectItem value="theft">Vol</SelectItem>
                                  <SelectItem value="damage">Casse/Détérioré</SelectItem>
                                  <SelectItem value="loss">Perte Inconnue</SelectItem>
                                  <SelectItem value="expired">Périmé</SelectItem>
                                  <SelectItem value="other">Autre motif</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            {discrepancy !== 0 && (
                              <Input 
                                placeholder="Précisez..." 
                                value={item.notes}
                                onChange={e => updateItemNotes(item.product_id, e.target.value)}
                                className="h-10 rounded-lg text-xs" 
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="border-t pt-4">
                <Button variant="ghost" onClick={()=>setIsOpen(false)} className="font-bold rounded-xl">Annuler</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-xl border-none" onClick={handleCreate}>ENREGISTRER L'INVENTAIRE</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Grid */}
      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Numéro</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date de création</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsable</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 uppercase tracking-widest font-black opacity-35">Aucun inventaire</TableCell>
                </TableRow>
              ) : (
                inventories.map(inv => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/50">
                    <TableCell className="p-6 font-mono font-black text-xs text-slate-700">{inv.inventory_number}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-800">{inv.created_by}</TableCell>
                    <TableCell className="text-xs text-slate-500 truncate max-w-[200px]">{inv.notes || '-'}</TableCell>
                    <TableCell>
                      <Badge className={inv.status === 'validated' ? 'bg-emerald-100 text-emerald-600 border-none font-bold text-[9px] uppercase' : 'bg-amber-100 text-amber-600 border-none font-bold text-[9px] uppercase'}>
                        {inv.status === 'validated' ? 'Validé & Appliqué' : 'Brouillon'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right p-6">
                      <Button variant="ghost" size="sm" className="font-bold text-indigo-600 text-xs rounded-xl" onClick={()=>handleViewDetails(inv.id)}>Voir détails</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Sheet Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl bg-white rounded-[2rem] p-8 border-none flex flex-col h-[75vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Fiche d'Inventaire #{selectedInv?.inventory_number}</DialogTitle>
            <CardDescription>Visualisation des écarts de comptage et régularisations.</CardDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 pr-2">
            {selectedInv?.status === 'draft' && (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Inventaire en cours de préparation</h4>
                  <p className="text-[10px] mt-0.5">Cet inventaire n'a pas encore été validé. Cliquez sur valider pour régulariser les stocks.</p>
                </div>
              </div>
            )}

            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Produit</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Théorique</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Réel Constaté</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Écart</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInv?.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-3">
                      <p className="text-xs font-black text-slate-800 uppercase">{item.product_name}</p>
                      <p className="text-[9px] font-mono text-slate-400">{item.sku}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{item.qty_theoretical} {item.unit}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{item.qty_real} {item.unit}</TableCell>
                    <TableCell className={`text-right font-mono text-xs font-black ${Number(item.qty_discrepancy) < 0 ? 'text-rose-600' : Number(item.qty_discrepancy) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {Number(item.qty_discrepancy) > 0 ? '+' : ''}{item.qty_discrepancy}
                    </TableCell>
                    <TableCell>
                      {Number(item.qty_discrepancy) !== 0 ? (
                        <div className="flex flex-col">
                          <Badge className="bg-rose-50 text-rose-700 font-bold uppercase text-[8px] border-none w-fit">{item.reason}</Badge>
                          {item.notes && <span className="text-[9px] text-slate-400 mt-0.5">{item.notes}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Conforme</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={()=>setDetailsOpen(false)} className="font-bold rounded-xl">Fermer</Button>
            {selectedInv?.status === 'draft' && (
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 rounded-xl border-none" onClick={()=>handleValidate(selectedInv.id)}>APPROUVER & VALIDER LES ÉCARTS</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
