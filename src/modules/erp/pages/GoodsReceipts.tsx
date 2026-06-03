import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PackageCheck, Plus, ArrowLeft, Search, CheckCircle2,
  Package, AlertTriangle, Truck
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function GoodsReceipts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [receipts, setReceipts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    order_id: "", received_by: "", notes: "",
    items: [] as any[],
  });

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setLoading(true);
    try {
      const [gr, pos] = await Promise.all([
        api.procurement.grList(user.clinicId),
        api.procurement.poList(user.clinicId, "confirmed"),
      ]);
      setReceipts(gr);
      setOrders(pos);
    } catch { toast({ variant: "destructive", title: "Erreur de chargement" }); }
    finally { setLoading(false); }
  };

  const handleSelectOrder = async (orderId: string) => {
    setForm(f => ({ ...f, order_id: orderId, items: [] }));
    if (!orderId) { setSelectedOrder(null); return; }
    try {
      const detail = await api.procurement.poGet(user!.clinicId, orderId);
      setSelectedOrder(detail);
      const items = (detail.items ?? []).map((it: any) => ({
        order_item_id: it.id,
        product_name: it.product_name,
        ordered_qty: it.quantity,
        received_qty: it.quantity,
        damaged_qty: 0,
        unit: it.unit,
        notes: "",
      }));
      setForm(f => ({ ...f, items }));
    } catch { toast({ variant: "destructive", title: "Erreur chargement commande" }); }
  };

  const handleCreate = async () => {
    if (!form.order_id) { toast({ variant: "destructive", title: "Sélectionnez une commande" }); return; }
    try {
      const res = await api.procurement.grCreate({ ...form, clinicId: user!.clinicId });
      toast({ title: `Bon de réception ${res.number} créé !` });
      setIsCreateOpen(false);
      setForm({ order_id: "", received_by: "", notes: "", items: [] });
      setSelectedOrder(null);
      loadData();
    } catch (e: any) { toast({ variant: "destructive", title: e.message }); }
  };

  const handleValidate = async (id: string) => {
    try {
      await api.procurement.grValidate({ id, clinicId: user!.clinicId });
      toast({ title: "Réception validée ! Stock mis à jour automatiquement.", description: "Les quantités reçues ont été ajoutées au stock." });
      loadData();
    } catch (e: any) { toast({ variant: "destructive", title: e.message }); }
  };

  const updateItem = (i: number, field: string, val: any) =>
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });

  const filtered = receipts.filter(r =>
    r.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/erp/procurement")} className="rounded-2xl bg-white shadow-sm border">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Truck className="h-7 w-7 text-teal-600" /> Réceptions de Marchandises
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enregistrez les livraisons et validez pour mettre à jour le stock
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 shadow-lg h-11 px-6 rounded-xl">
              <Plus className="h-4 w-4" /> Nouvelle Réception
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] border-none bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Enregistrer une Livraison</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              {/* Business rule notice */}
              <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-2xl p-4 text-sm text-teal-700">
                <Package className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Une réception doit obligatoirement être liée à un bon de commande confirmé.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bon de Commande *</Label>
                  <Select value={form.order_id} onValueChange={handleSelectOrder}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Sélectionner BC confirmé..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.order_number} — {o.supplier_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Réceptionné par</Label>
                  <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.received_by} onChange={e => setForm(f => ({ ...f, received_by: e.target.value }))} />
                </div>
              </div>

              {/* Line items */}
              {form.items.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Vérification des quantités</Label>
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="col-span-4">Produit</span>
                    <span className="col-span-2 text-center">Commandé</span>
                    <span className="col-span-2 text-center text-teal-600">Reçu</span>
                    <span className="col-span-2 text-center text-rose-500">Cassé</span>
                    <span className="col-span-2 text-center text-emerald-600">Net</span>
                  </div>
                  {form.items.map((line, i) => {
                    const net = Math.max(0, line.received_qty - line.damaged_qty);
                    const diff = line.received_qty - line.ordered_qty;
                    return (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-xl p-3">
                        <div className="col-span-4">
                          <p className="text-sm font-bold text-slate-800 truncate">{line.product_name}</p>
                          <p className="text-[10px] text-slate-400">{line.unit}</p>
                        </div>
                        <div className="col-span-2 text-center text-sm font-bold text-slate-500">{line.ordered_qty}</div>
                        <div className="col-span-2">
                          <Input type="number" min="0" className={`h-9 rounded-lg bg-white border text-sm text-center ${diff < 0 ? 'border-amber-300' : diff > 0 ? 'border-blue-300' : 'border-slate-200'}`}
                            value={line.received_qty} onChange={e => updateItem(i, "received_qty", +e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <Input type="number" min="0" className="h-9 rounded-lg bg-white border-rose-200 text-sm text-center"
                            value={line.damaged_qty} onChange={e => updateItem(i, "damaged_qty", +e.target.value)} />
                        </div>
                        <div className={`col-span-2 text-center text-sm font-black ${net === line.ordered_qty ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {net}
                        </div>
                      </div>
                    );
                  })}
                  {/* Écart summary */}
                  {form.items.some(it => it.received_qty !== it.ordered_qty || it.damaged_qty > 0) && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Des écarts ont été détectés. Vérifiez avant de valider.
                    </div>
                  )}
                </div>
              )}

              <Textarea className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={2} placeholder="Notes de livraison (optionnel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full h-12 bg-teal-600 hover:bg-teal-700 font-black text-white rounded-2xl" onClick={handleCreate}>
                ENREGISTRER LA RÉCEPTION
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-10 h-10 rounded-xl bg-white border-slate-200" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100">
                {["N° Réception", "Commande", "Fournisseur", "Réceptionné par", "Date", "Statut", "Actions"].map(h => (
                  <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <Truck className="h-12 w-12 mx-auto opacity-20 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-30">Aucune réception</p>
                </TableCell></TableRow>
              ) : filtered.map(gr => (
                <TableRow key={gr.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="px-5 py-4 font-black text-slate-800">{gr.receipt_number}</TableCell>
                  <TableCell className="text-sm font-semibold text-indigo-600">{gr.order_number ?? "—"}</TableCell>
                  <TableCell className="text-sm font-semibold text-slate-600">{gr.supplier_name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-slate-500">{gr.received_by ?? "—"}</TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(gr.received_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-black border ${gr.status === "validated" ? "bg-teal-100 text-teal-700 border-teal-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                      {gr.status === "validated" ? "✓ Validé" : "En attente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5">
                    {gr.status === "draft" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 px-3">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Valider & Stocker
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-none">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-black">Valider la réception ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Le stock sera mis à jour avec les quantités nettes reçues.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                            <AlertDialogAction className="rounded-xl bg-teal-600 hover:bg-teal-700" onClick={() => handleValidate(gr.id)}>
                              Confirmer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {gr.status === "validated" && (
                      <span className="text-xs text-teal-600 font-bold flex items-center gap-1">
                        <PackageCheck className="h-3.5 w-3.5" /> Stock mis à jour
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
