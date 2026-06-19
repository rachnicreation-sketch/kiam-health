import { useState, useEffect } from "react";
import { 
  Truck, Plus, Search, Layers, DollarSign, Package, 
  Download, FileText, CheckCircle, Clock 
} from "lucide-react";
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

export default function Procurement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [docs, setDocs] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [orderForm, setOrderForm] = useState({
    supplier_id: "", payment_method: "Cash", notes: "",
    items: [
      { medication_id: "", quantity: "10", price_buy: "500", price_sell: "750", batch_number: "LOT-A1", expiry_date: "" }
    ]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsData, meds, custs] = await Promise.all([
        apiRequest("pharmacy.php?action=list_docs&type=purchase_order"),
        apiRequest("pharmacy.php?action=list_medications"),
        apiRequest("pharmacy.php?action=list_suppliers")
      ]);
      setDocs(docsData);
      setMedications(meds);
      setCustomers(custs);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les approvisionnements." });
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = orderForm.items[0];
    if (!orderForm.supplier_id || !item.medication_id || !item.expiry_date || !item.batch_number) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir les informations obligatoires." });
      return;
    }

    try {
      const med = medications.find(m => m.id === item.medication_id);
      const totalHT = parseFloat(item.price_buy) * parseInt(item.quantity);
      const totalTTC = totalHT * 1.18; // standard 18% VAT

      // 1. Create Purchase document
      await apiRequest("pharmacy.php?action=save_doc", {
        method: "POST",
        body: JSON.stringify({
          type: "purchase_order",
          supplier_id: orderForm.supplier_id,
          total_ht: totalHT,
          tax_rate: 18.0,
          total_ttc: totalTTC,
          status: "delivered",
          payment_method: orderForm.payment_method,
          notes: `Entrée stock approvisionnement. Lot ${item.batch_number} - Exp ${item.expiry_date}. ${orderForm.notes}`,
          items: [{
            medication_id: item.medication_id,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.price_buy),
            total_price: totalHT
          }]
        })
      });

      // 2. Create batch
      await apiRequest("pharmacy.php?action=save_batch", {
        method: "POST",
        body: JSON.stringify({
          medication_id: item.medication_id,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          quantity: parseInt(item.quantity),
          price_buy: parseFloat(item.price_buy),
          supplier: "Fournisseur"
        })
      });

      // 3. Update medication details if sell price changed
      await apiRequest("pharmacy.php?action=save_medication", {
        method: "POST",
        body: JSON.stringify({
          id: item.medication_id,
          name: med.name,
          category: med.category,
          unit: med.unit,
          price: parseFloat(item.price_sell),
          price_buy: parseFloat(item.price_buy),
          stock: parseInt(med.stock) // save_medication requires stock, keep parent same (save_batch increments)
        })
      });

      toast({ title: "Approvisionnement réussi", description: "Le lot a été réceptionné et les prix mis à jour." });
      setIsAddOpen(false);
      loadData();
      // Reset
      setOrderForm({
        supplier_id: "", payment_method: "Cash", notes: "",
        items: [{ medication_id: "", quantity: "10", price_buy: "500", price_sell: "750", batch_number: "LOT-A1", expiry_date: "" }]
      });
    } catch (ex: any) {
      toast({ variant: "destructive", title: "Erreur", description: ex.message });
    }
  };

  const handleAutoSuggest = async () => {
    try {
      const lowMeds = await apiRequest("pharmacy.php?action=low_stock_meds");
      if (!lowMeds || lowMeds.length === 0) {
        toast({ title: "Aucune action", description: "Aucun produit n'est en dessous de son seuil d'alerte." });
        return;
      }
      
      const supplierId = customers[0]?.id || "";
      if (!supplierId) {
        toast({ variant: "destructive", title: "Erreur", description: "Aucun fournisseur enregistré." });
        return;
      }

      const items = lowMeds.map((m: any) => {
        const qtyNeeded = Math.max(1, (m.stock_max || 50) - m.stock);
        return {
          medication_id: m.id,
          quantity: qtyNeeded,
          unit_price: m.price_buy || 0,
          total_price: (m.price_buy || 0) * qtyNeeded
        };
      });

      const totalHT = items.reduce((acc: number, it: any) => acc + it.total_price, 0);

      await apiRequest("pharmacy.php?action=save_doc", {
        method: "POST",
        body: JSON.stringify({
          type: "purchase_order",
          supplier_id: supplierId,
          total_ht: totalHT,
          tax_rate: 18.0,
          total_ttc: totalHT * 1.18,
          status: "pending",
          payment_method: "Virement",
          notes: "Commande générée automatiquement selon les seuils d'alerte.",
          items: items
        })
      });

      toast({ title: "Commande Générée", description: `${items.length} produits ajoutés au bon de commande.` });
      loadData();
    } catch (ex: any) {
      toast({ variant: "destructive", title: "Erreur", description: ex.message });
    }
  };

  const filteredDocs = docs.filter(d => 
    d.doc_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.customer_name && d.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Approvisionnement & Achats</h1>
          <p className="text-xs text-muted-foreground">Commandes d'achats fournisseurs, saisie des prix d'achats/ventes, et affectation des lots.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAutoSuggest} variant="outline" className="text-slate-700 font-bold gap-2 text-xs h-9">
            <Layers className="h-4 w-4 text-amber-500" /> Suggérer Commande Auto
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs h-9">
            <Plus className="h-4 w-4" /> Passer Commande d'Achat
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher par numéro de commande..." 
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
                <TableHead>Numéro de Commande</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Prix HT</TableHead>
                <TableHead>Prix TTC (TVA 18%)</TableHead>
                <TableHead>Méthode Paiement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Date Réception</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map(d => (
                <TableRow key={d.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-xs font-bold">{d.doc_number}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-800">{d.customer_name || "Fournisseur Général"}</TableCell>
                  <TableCell className="text-xs font-mono">{Number(d.total_ht).toLocaleString()} CFA</TableCell>
                  <TableCell className="text-xs font-mono font-bold text-emerald-700">{Number(d.total_ttc).toLocaleString()} CFA</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline">{d.payment_method || "Cash"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">LIVRÉ & PRÉPARÉ</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 italic">Aucune commande enregistrée.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG: ADD PROCUREMENT */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Enregistrer un Approvisionnement Fournisseur</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Sélectionner Fournisseur *</Label>
                <Select required value={orderForm.supplier_id} onValueChange={v => setOrderForm({...orderForm, supplier_id: v})}>
                  <SelectTrigger className="h-9 text-xs bg-white"><SelectValue placeholder="Choisir fournisseur" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mode de Règlement *</Label>
                <Select value={orderForm.payment_method} onValueChange={v => setOrderForm({...orderForm, payment_method: v})}>
                  <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash / Espèces</SelectItem>
                    <SelectItem value="Crédit">Crédit fournisseur</SelectItem>
                    <SelectItem value="Virement">Virement bancaire</SelectItem>
                    <SelectItem value="Chèque">Chèque</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 border p-3 rounded-lg bg-slate-50">
              <Label className="text-xs font-bold text-slate-700">Détails de l'article reçu :</Label>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px]">Médicament *</Label>
                  <Select required value={orderForm.items[0].medication_id} onValueChange={v => {
                    const newItems = [...orderForm.items];
                    newItems[0].medication_id = v;
                    setOrderForm({...orderForm, items: newItems});
                  }}>
                    <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="Produit" /></SelectTrigger>
                    <SelectContent>
                      {medications.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Quantité reçue *</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    required 
                    value={orderForm.items[0].quantity} 
                    onChange={e => {
                      const newItems = [...orderForm.items];
                      newItems[0].quantity = e.target.value;
                      setOrderForm({...orderForm, items: newItems});
                    }}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Numéro de Lot *</Label>
                  <Input 
                    required 
                    value={orderForm.items[0].batch_number} 
                    onChange={e => {
                      const newItems = [...orderForm.items];
                      newItems[0].batch_number = e.target.value;
                      setOrderForm({...orderForm, items: newItems});
                    }}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Date d'expiration *</Label>
                  <Input 
                    type="date" 
                    required 
                    value={orderForm.items[0].expiry_date} 
                    onChange={e => {
                      const newItems = [...orderForm.items];
                      newItems[0].expiry_date = e.target.value;
                      setOrderForm({...orderForm, items: newItems});
                    }}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Prix d'achat unitaire (CFA) *</Label>
                  <Input 
                    type="number" 
                    required 
                    value={orderForm.items[0].price_buy} 
                    onChange={e => {
                      const newItems = [...orderForm.items];
                      newItems[0].price_buy = e.target.value;
                      setOrderForm({...orderForm, items: newItems});
                    }}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Nouveau prix vente Détail (CFA) *</Label>
                  <Input 
                    type="number" 
                    required 
                    value={orderForm.items[0].price_sell} 
                    onChange={e => {
                      const newItems = [...orderForm.items];
                      newItems[0].price_sell = e.target.value;
                      setOrderForm({...orderForm, items: newItems});
                    }}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Remarques</Label>
              <Input value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})} className="h-9 text-xs" />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
              Confirmer l'Approvisionnement
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
