import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart, Plus, Search, ArrowLeft, Trash2,
  Send, CheckCircle2, XCircle, Package, Eye
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

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft:              { label: "Brouillon",  cls: "bg-slate-100 text-slate-600 border-slate-200" },
  sent:               { label: "Envoyé",     cls: "bg-blue-100 text-blue-700 border-blue-200" },
  confirmed:          { label: "Confirmé",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  partially_received: { label: "Partiel",    cls: "bg-amber-100 text-amber-700 border-amber-200" },
  received:           { label: "Reçu ✓",    cls: "bg-teal-100 text-teal-700 border-teal-200" },
  cancelled:          { label: "Annulé",     cls: "bg-rose-100 text-rose-600 border-rose-200" },
};

const EMPTY_LINE = { 
  product_name: "", 
  quantity: 1, 
  unit: "unité", 
  unit_price: 0,
  brand: "",
  model: "",
  reference: "",
  color: "",
  pieces_count: 1
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);
}

export default function PurchaseOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "", expected_date: "", tax_rate: 0, notes: "",
    items: [{ ...EMPTY_LINE }],
  });

  useEffect(() => { loadData(); }, [user, filterStatus]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setLoading(true);
    try {
      const [pos, sups] = await Promise.all([
        api.procurement.poList(user.clinicId, filterStatus),
        api.procurement.suppliers(user.clinicId),
      ]);
      setOrders(pos);
      setSuppliers(sups);
    } catch { toast({ variant: "destructive", title: "Erreur de chargement" }); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.supplier_id || form.items.some(i => !i.product_name)) {
      toast({ variant: "destructive", title: "Fournisseur et produits obligatoires" });
      return;
    }
    try {
      const res = await api.procurement.poCreate({ ...form, clinicId: user!.clinicId });
      toast({ title: `Bon de commande ${res.number} créé !` });
      setIsCreateOpen(false);
      setForm({ supplier_id: "", expected_date: "", tax_rate: 0, notes: "", items: [{ ...EMPTY_LINE }] });
      loadData();
    } catch (e: any) { toast({ variant: "destructive", title: e.message }); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.procurement.poUpdateStatus({ id, status, clinicId: user!.clinicId });
      toast({ title: "Statut mis à jour" });
      loadData();
    } catch { toast({ variant: "destructive", title: "Erreur" }); }
  };

  const openView = async (po: any) => {
    try {
      const detail = await api.procurement.poGet(user!.clinicId, po.id);
      setViewOrder(detail);
      setIsViewOpen(true);
    } catch { toast({ variant: "destructive", title: "Erreur" }); }
  };

  const addLine = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  const updateLine = (i: number, field: string, val: any) =>
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  const removeLine = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const lineTotal = (l: typeof EMPTY_LINE) => l.quantity * l.unit_price;
  const ht = form.items.reduce((s, l) => s + lineTotal(l), 0);
  const ttc = ht * (1 + (form.tax_rate || 0) / 100);

  const filtered = orders.filter(o =>
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  const nextStatuses: Record<string, { label: string; value: string; cls: string }[]> = {
    draft:    [{ label: "Envoyer",   value: "sent",      cls: "bg-blue-600 hover:bg-blue-700 text-white" },
               { label: "Annuler",   value: "cancelled", cls: "bg-rose-100 text-rose-600 hover:bg-rose-200" }],
    sent:     [{ label: "Confirmer", value: "confirmed", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
               { label: "Annuler",   value: "cancelled", cls: "bg-rose-100 text-rose-600 hover:bg-rose-200" }],
    confirmed:[{ label: "+ Réception",value: "received", cls: "bg-teal-600 hover:bg-teal-700 text-white" }],
  };

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
              <ShoppingCart className="h-7 w-7 text-indigo-600" /> Bons de Commande
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Commandes fournisseurs et caractéristiques détaillées des produits.</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-lg h-11 px-6 rounded-xl">
              <Plus className="h-4 w-4" /> Nouveau BC
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-[2rem] border-none bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Nouveau Bon de Commande</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fournisseur *</Label>
                  <Select value={form.supplier_id} onValueChange={v => setForm(f => ({ ...f, supplier_id: v }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Date de livraison prévue</Label>
                  <Input type="date" className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.expected_date} onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))} />
                </div>
              </div>

              {/* Advanced Items Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Lignes de commande & Caractéristiques *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine} className="text-xs gap-1 rounded-lg">
                    <Plus className="h-3.5 w-3.5" /> Ajouter
                  </Button>
                </div>

                {form.items.map((line, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-3 relative border border-slate-100">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-5 space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Produit/Article</Label>
                        <Input className="h-10 rounded-lg bg-white border-slate-200 text-sm" placeholder="Nom..." value={line.product_name} onChange={e => updateLine(i, "product_name", e.target.value)} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Quantité</Label>
                        <Input type="number" min="1" className="h-10 rounded-lg bg-white border-slate-200 text-sm text-center" value={line.quantity} onChange={e => updateLine(i, "quantity", +e.target.value)} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Unité</Label>
                        <Input className="h-10 rounded-lg bg-white border-slate-200 text-sm" placeholder="sac, kg..." value={line.unit} onChange={e => updateLine(i, "unit", e.target.value)} />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Prix unitaire d'achat</Label>
                        <Input type="number" className="h-10 rounded-lg bg-white border-slate-200 text-sm text-right" value={line.unit_price} onChange={e => updateLine(i, "unit_price", +e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3 pt-2 border-t border-dashed border-slate-200">
                      <div>
                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Marque</Label>
                        <Input className="h-8 rounded-lg bg-white text-xs" placeholder="Marque..." value={line.brand} onChange={e => updateLine(i, "brand", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Modèle</Label>
                        <Input className="h-8 rounded-lg bg-white text-xs" placeholder="Modèle..." value={line.model} onChange={e => updateLine(i, "model", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Référence</Label>
                        <Input className="h-8 rounded-lg bg-white text-xs" placeholder="Ref..." value={line.reference} onChange={e => updateLine(i, "reference", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Couleur</Label>
                        <Input className="h-8 rounded-lg bg-white text-xs" placeholder="Couleur..." value={line.color} onChange={e => updateLine(i, "color", e.target.value)} />
                      </div>
                      <div className="relative">
                        <Label className="text-[9px] font-bold text-slate-500 uppercase">Pièces / unité</Label>
                        <div className="flex items-center">
                          <Input type="number" className="h-8 rounded-lg bg-white text-xs w-full pr-8" value={line.pieces_count} onChange={e => updateLine(i, "pieces_count", +e.target.value)} />
                          {form.items.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-rose-500 absolute right-0 bottom-0" onClick={() => removeLine(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-indigo-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total HT</span>
                  <span className="font-black text-slate-800">{fmt(ht)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-slate-500 font-medium">TVA (%)</Label>
                  <Input type="number" min="0" max="100" className="h-8 w-20 rounded-lg bg-white border-slate-200 text-sm text-right" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: +e.target.value }))} />
                </div>
                <div className="flex justify-between border-t border-indigo-200 pt-2 mt-2">
                  <span className="font-black text-indigo-700">Total TTC</span>
                  <span className="font-black text-indigo-700 text-lg">{fmt(ttc)}</span>
                </div>
              </div>
              <Textarea className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={2} placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black text-white rounded-2xl" onClick={handleCreate}>
                CRÉER LE BON DE COMMANDE
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-10 h-10 rounded-xl bg-white border-slate-200" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["", "draft", "sent", "confirmed", "received", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-slate-900 text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
            {s === "" ? "Tous" : STATUS_CFG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100">
                {["N° Commande", "Fournisseur", "Articles", "Total TTC", "Livraison", "Statut", "Actions"].map(h => (
                  <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <ShoppingCart className="h-12 w-12 mx-auto opacity-20 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-30">Aucun bon de commande</p>
                </TableCell></TableRow>
              ) : filtered.map(po => (
                <TableRow key={po.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="px-5 py-4 font-black text-slate-800">{po.order_number}</TableCell>
                  <TableCell className="text-sm font-semibold text-slate-600">{po.supplier_name ?? "—"}</TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">{po.item_count}</TableCell>
                  <TableCell className="font-black text-slate-800">{fmt(po.total_ttc)}</TableCell>
                  <TableCell className="text-xs text-slate-400">{po.expected_date ? new Date(po.expected_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-black border ${STATUS_CFG[po.status]?.cls}`}>
                      {STATUS_CFG[po.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => openView(po)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(nextStatuses[po.status] ?? []).map(ns => (
                        <Button key={ns.value} size="sm" onClick={() => handleStatus(po.id, ns.value)} className={`h-8 rounded-lg font-bold text-xs px-3 ${ns.cls}`}>
                          {ns.label}
                        </Button>
                      ))}
                      {po.status === "confirmed" && (
                        <Button size="sm" onClick={() => navigate("/erp/goods-receipts")} className="h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3">
                          <Package className="h-3.5 w-3.5 mr-1" /> Réception
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

      {/* View Detail Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg rounded-[2rem] border-none bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{viewOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fournisseur</p><p className="font-black">{viewOrder.supplier_name}</p></div>
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Statut</p><Badge className={`text-[10px] border ${STATUS_CFG[viewOrder.status]?.cls}`}>{STATUS_CFG[viewOrder.status]?.label}</Badge></div>
              </div>
              <div className="space-y-2">
                {(viewOrder.items ?? []).map((it: any, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-bold text-slate-800 uppercase">{it.product_name}</p>
                      <p className="text-xs text-slate-400">{it.quantity} {it.unit} × {fmt(it.unit_price)}</p>
                      {(it.brand || it.model || it.reference || it.color) && (
                        <p className="text-[10px] text-indigo-500 font-medium mt-1">
                          {it.brand && `Marque: ${it.brand} | `}
                          {it.model && `Modèle: ${it.model} | `}
                          {it.reference && `Ref: ${it.reference} | `}
                          {it.color && `Couleur: ${it.color}`}
                        </p>
                      )}
                    </div>
                    <p className="font-black text-slate-700 text-right mt-2">{fmt(it.total_price)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-indigo-50 rounded-2xl p-4 text-sm flex justify-between items-center">
                <span className="font-black text-indigo-700">Total TTC</span>
                <span className="font-black text-indigo-700 text-xl">{fmt(viewOrder.total_ttc)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
