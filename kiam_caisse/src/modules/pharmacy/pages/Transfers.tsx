import { useState, useEffect } from "react";
import {
  ArrowRightLeft, Plus, Truck, PackageCheck, XCircle, Clock, Search, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

interface TransferItem {
  medication_id: string;
  medication_name?: string;
  batch_id?: string;
  quantity: number;
}

export default function Transfers() {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [fromLoc, setFromLoc] = useState("");
  const [toLoc, setToLoc] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TransferItem[]>([]);
  const [searchMed, setSearchMed] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tr, meds] = await Promise.all([
        apiRequest("pharmacy.php?action=list_transfers"),
        apiRequest("pharmacy.php?action=list_medications")
      ]);
      setTransfers(tr || []);
      setMedications(meds || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addItem = (med: any) => {
    if (items.find(i => i.medication_id === med.id)) return;
    setItems([...items, { medication_id: med.id, medication_name: med.name, quantity: 1 }]);
    setSearchMed("");
  };

  const updateQty = (idx: number, qty: number) => {
    const copy = [...items];
    copy[idx].quantity = qty;
    setItems(copy);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!fromLoc || !toLoc || items.length === 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Remplissez source, destination et au moins un article." });
      return;
    }
    try {
      await apiRequest("pharmacy.php?action=save_transfer", {
        method: "POST",
        body: JSON.stringify({ from_location: fromLoc, to_location: toLoc, notes, items })
      });
      toast({ title: "✅ Transfert créé" });
      setShowDialog(false);
      setItems([]);
      setFromLoc("");
      setToLoc("");
      setNotes("");
      loadAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const labels: Record<string, string> = {
      in_transit: "Expédier ce transfert ?",
      received: "Confirmer la réception ?",
      cancelled: "Annuler ce transfert ?"
    };
    if (!confirm(labels[status] || "Confirmer ?")) return;
    try {
      await apiRequest("pharmacy.php?action=update_transfer_status", {
        method: "POST",
        body: JSON.stringify({ id, status })
      });
      toast({ title: "✅ Statut mis à jour" });
      loadAll();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case "pending": return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case "in_transit": return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Truck className="w-3 h-3 mr-1" /> En transit</Badge>;
      case "received": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300"><PackageCheck className="w-3 h-3 mr-1" /> Reçu</Badge>;
      case "cancelled": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Annulé</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const filteredMeds = searchMed.length > 1
    ? medications.filter(m => m.name.toLowerCase().includes(searchMed.toLowerCase())).slice(0, 8)
    : [];

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ArrowRightLeft className="h-5 w-5 text-emerald-600" /> Transferts de Stock
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Déplacez des produits entre magasins, rayons ou succursales.</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nouveau Transfert
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "En attente", count: transfers.filter(t => t.status === "pending").length, color: "amber" },
          { label: "En transit", count: transfers.filter(t => t.status === "in_transit").length, color: "blue" },
          { label: "Reçus", count: transfers.filter(t => t.status === "received").length, color: "emerald" },
          { label: "Total", count: transfers.length, color: "slate" },
        ].map(c => (
          <Card key={c.label} className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold text-${c.color}-600`}>{c.count}</p>
              <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Demandé par</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Aucun transfert</TableCell></TableRow>
              ) : transfers.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.from_location}</TableCell>
                  <TableCell className="font-medium">{t.to_location}</TableCell>
                  <TableCell className="text-xs text-slate-500">{t.items?.length || 0} produit(s)</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell className="text-xs">{t.requested_by}</TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {t.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600 border-blue-300" onClick={() => handleStatusChange(t.id, "in_transit")}>
                            <Send className="w-3 h-3 mr-1" /> Expédier
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300" onClick={() => handleStatusChange(t.id, "cancelled")}>
                            <XCircle className="w-3 h-3 mr-1" />
                          </Button>
                        </>
                      )}
                      {t.status === "in_transit" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-300" onClick={() => handleStatusChange(t.id, "received")}>
                          <PackageCheck className="w-3 h-3 mr-1" /> Réceptionner
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouveau Transfert de Stock</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source *</Label>
                <Input value={fromLoc} onChange={e => setFromLoc(e.target.value)} placeholder="Ex: Magasin Principal" />
              </div>
              <div className="space-y-2">
                <Label>Destination *</Label>
                <Input value={toLoc} onChange={e => setToLoc(e.target.value)} placeholder="Ex: Rayon Pédiatrie" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Informations complémentaires..." />
            </div>

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
                        <span className="text-slate-400">Stock: {m.stock || m.batch_stock || 0}</span>
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
                    <TableHead className="w-24">Quantité</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm">{item.medication_name}</TableCell>
                      <TableCell>
                        <Input type="number" min={1} value={item.quantity} onChange={e => updateQty(idx, parseInt(e.target.value) || 1)} className="h-8 text-sm w-20" />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(idx)}>
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Créer le Transfert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
