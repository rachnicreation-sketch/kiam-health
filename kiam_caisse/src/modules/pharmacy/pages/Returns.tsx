import { useState, useEffect } from "react";
import {
  RotateCcw, Plus, CheckCircle, XCircle, Clock, Package, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

interface ReturnItem {
  medication_id: string;
  medication_name?: string;
  batch_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  reason: string;
}

export default function Returns() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog
  const [showDialog, setShowDialog] = useState(false);
  const [returnType, setReturnType] = useState<"customer" | "supplier">("customer");
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("credit_note");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [searchMed, setSearchMed] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ret, meds, cust] = await Promise.all([
        apiRequest("pharmacy.php?action=list_returns"),
        apiRequest("pharmacy.php?action=list_medications"),
        apiRequest("pharmacy.php?action=list_customers")
      ]);
      setReturns(ret || []);
      setMedications(meds || []);
      setCustomers(cust || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addItem = (med: any) => {
    if (items.find(i => i.medication_id === med.id)) return;
    setItems([...items, {
      medication_id: med.id,
      medication_name: med.name,
      quantity: 1,
      unit_price: parseFloat(med.price) || 0,
      total_price: parseFloat(med.price) || 0,
      reason: ""
    }]);
    setSearchMed("");
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const copy = [...items];
    (copy[idx] as any)[field] = val;
    if (field === "quantity" || field === "unit_price") {
      copy[idx].total_price = copy[idx].quantity * copy[idx].unit_price;
    }
    setItems(copy);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (items.length === 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Ajoutez au moins un article." });
      return;
    }
    try {
      await apiRequest("pharmacy.php?action=save_return", {
        method: "POST",
        body: JSON.stringify({
          type: returnType,
          customer_id: returnType === "customer" ? selectedCustomer : undefined,
          reason, refund_method: refundMethod, items
        })
      });
      toast({ title: "✅ Retour enregistré" });
      setShowDialog(false);
      setItems([]);
      setReason("");
      loadAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleValidate = async (id: string, decision: string) => {
    try {
      await apiRequest("pharmacy.php?action=validate_return", {
        method: "POST",
        body: JSON.stringify({ id, decision })
      });
      toast({ title: decision === "validated" ? "✅ Retour validé, stock réintégré" : "❌ Retour refusé" });
      loadAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "pending": return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case "validated": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><CheckCircle className="w-3 h-3 mr-1" /> Validé</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Refusé</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  const filteredMeds = searchMed.length > 1
    ? medications.filter(m => m.name.toLowerCase().includes(searchMed.toLowerCase())).slice(0, 8)
    : [];

  const totalReturn = items.reduce((s, i) => s + i.total_price, 0);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <RotateCcw className="h-5 w-5 text-emerald-600" /> Retours & Avoirs
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Gestion des retours clients et fournisseurs avec réintégration du stock.</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nouveau Retour
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client / Fournisseur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Aucun retour enregistré</TableCell></TableRow>
              ) : returns.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={r.type === "customer" ? "border-blue-300 text-blue-700" : "border-purple-300 text-purple-700"}>
                      {r.type === "customer" ? "Client" : "Fournisseur"}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.customer_name || r.supplier_name || "—"}</TableCell>
                  <TableCell className="font-bold">{parseFloat(r.total_amount).toLocaleString()} CFA</TableCell>
                  <TableCell>{statusBadge(r.status)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 h-7 text-xs" onClick={() => handleValidate(r.id, "validated")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Valider
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 h-7 text-xs" onClick={() => handleValidate(r.id, "rejected")}>
                          <XCircle className="w-3 h-3 mr-1" /> Refuser
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Dialog Nouveau Retour ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouveau Retour</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de Retour</Label>
                <Select value={returnType} onValueChange={(v: any) => setReturnType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Retour Client</SelectItem>
                    <SelectItem value="supplier">Retour Fournisseur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode de Remboursement</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_note">Avoir</SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="exchange">Échange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {returnType === "customer" && (
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motif global du retour</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Produit périmé, erreur de commande..." rows={2} />
            </div>

            {/* Recherche Médicaments */}
            <div className="space-y-2">
              <Label>Ajouter des articles</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={searchMed} onChange={e => setSearchMed(e.target.value)} placeholder="Rechercher un médicament..." className="pl-9" />
                {filteredMeds.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 max-h-48 overflow-y-auto">
                    {filteredMeds.map(m => (
                      <div key={m.id} className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm flex justify-between" onClick={() => addItem(m)}>
                        <span>{m.name}</span>
                        <span className="text-slate-400">{parseFloat(m.price).toLocaleString()} CFA</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="w-20">Qté</TableHead>
                    <TableHead className="w-28">P.U.</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm">{item.medication_name}</TableCell>
                      <TableCell><Input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="h-8 text-sm w-16" /></TableCell>
                      <TableCell><Input type="number" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className="h-8 text-sm w-24" /></TableCell>
                      <TableCell className="font-bold text-sm">{item.total_price.toLocaleString()}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}><XCircle className="w-4 h-4 text-red-500" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="text-right font-bold text-lg text-emerald-700">
              Total Retour : {totalReturn.toLocaleString()} CFA
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Enregistrer le Retour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
