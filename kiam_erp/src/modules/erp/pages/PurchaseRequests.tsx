import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Plus, Search, ArrowLeft, CheckCircle2,
  XCircle, ShoppingCart, AlertTriangle, Trash2, ChevronDown
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
  pending:   { label: "En attente",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  approved:  { label: "Validée",     cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected:  { label: "Rejetée",     cls: "bg-rose-100 text-rose-700 border-rose-200" },
  converted: { label: "Convertie",   cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};

const URGENCY_CFG: Record<string, { label: string; cls: string }> = {
  low:    { label: "Basse",  cls: "bg-slate-100 text-slate-600" },
  medium: { label: "Moyenne", cls: "bg-amber-100 text-amber-700" },
  high:   { label: "Haute",  cls: "bg-rose-100 text-rose-600" },
};

const EMPTY_LINE = { product_name: "", quantity: 1, unit: "unité", estimated_price: 0, justification: "" };

export default function PurchaseRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [form, setForm] = useState({
    requested_by: user?.name ?? "",
    department: "",
    urgency: "medium",
    notes: "",
    items: [{ ...EMPTY_LINE }],
  });

  const [convertForm, setConvertForm] = useState({ supplier_id: "", expected_date: "", tax_rate: 0, notes: "" });

  useEffect(() => { loadData(); }, [user, filterStatus]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setLoading(true);
    try {
      const [reqs, sups] = await Promise.all([
        api.procurement.prList(user.clinicId, filterStatus),
        api.procurement.suppliers(user.clinicId),
      ]);
      setRequests(reqs);
      setSuppliers(sups);
    } catch { toast({ variant: "destructive", title: "Erreur de chargement" }); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.department || form.items.some(i => !i.product_name)) {
      toast({ variant: "destructive", title: "Veuillez remplir tous les champs obligatoires" });
      return;
    }
    try {
      await api.procurement.prCreate({ ...form, clinicId: user!.clinicId });
      toast({ title: "Demande créée avec succès" });
      setIsCreateOpen(false);
      setForm({ requested_by: user?.name ?? "", department: "", urgency: "medium", notes: "", items: [{ ...EMPTY_LINE }] });
      loadData();
    } catch { toast({ variant: "destructive", title: "Erreur lors de la création" }); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.procurement.prUpdateStatus({ id, clinicId: user!.clinicId, status });
      toast({ title: status === "approved" ? "Demande validée" : "Demande rejetée" });
      loadData();
    } catch { toast({ variant: "destructive", title: "Erreur" }); }
  };

  const handleConvert = async () => {
    if (!convertForm.supplier_id) { toast({ variant: "destructive", title: "Sélectionnez un fournisseur" }); return; }
    try {
      const res = await api.procurement.prToPo({ ...convertForm, request_id: selectedPR.id, clinicId: user!.clinicId });
      toast({ title: `Bon de commande ${res.po_number} créé !` });
      setIsConvertOpen(false);
      loadData();
    } catch (e: any) { toast({ variant: "destructive", title: e.message }); }
  };

  const addLine = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  const updateLine = (i: number, field: string, val: any) =>
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });
  const removeLine = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const filtered = requests.filter(r =>
    r.request_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.department?.toLowerCase().includes(search.toLowerCase())
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
              <ClipboardList className="h-7 w-7 text-amber-500" /> Demandes d'Achat
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gérez et suivez les demandes d'approvisionnement</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2 shadow-lg h-11 px-6 rounded-xl">
              <Plus className="h-4 w-4" /> Nouvelle Demande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] border-none bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Nouvelle Demande d'Achat</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Demandeur</Label>
                  <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.requested_by} onChange={e => setForm(f => ({ ...f, requested_by: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Service *</Label>
                  <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" placeholder="Ex: Stock, Caisse..." value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Urgence</Label>
                <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Basse</SelectItem>
                    <SelectItem value="medium">🟡 Moyenne</SelectItem>
                    <SelectItem value="high">🔴 Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lines */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Produits demandés *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine} className="text-xs gap-1 rounded-lg">
                    <Plus className="h-3.5 w-3.5" /> Ajouter ligne
                  </Button>
                </div>
                {form.items.map((line, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Produit *</Label>
                        <Input className="h-10 rounded-lg bg-white border-slate-200 text-sm" placeholder="Nom du produit" value={line.product_name} onChange={e => updateLine(i, "product_name", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Qté</Label>
                        <Input type="number" min="1" className="h-10 rounded-lg bg-white border-slate-200 text-sm" value={line.quantity} onChange={e => updateLine(i, "quantity", +e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unité</Label>
                        <Input className="h-10 rounded-lg bg-white border-slate-200 text-sm" value={line.unit} onChange={e => updateLine(i, "unit", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prix estimé</Label>
                        <Input type="number" className="h-10 rounded-lg bg-white border-slate-200 text-sm" value={line.estimated_price} onChange={e => updateLine(i, "estimated_price", +e.target.value)} />
                      </div>
                      <div className="flex items-end">
                        {form.items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-rose-500" onClick={() => removeLine(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Input className="h-10 rounded-lg bg-white border-slate-200 text-sm" placeholder="Justification (optionnel)" value={line.justification} onChange={e => updateLine(i, "justification", e.target.value)} />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Notes</Label>
                <Textarea className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 font-black text-white rounded-2xl" onClick={handleCreate}>
                CRÉER LA DEMANDE
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
        {["", "pending", "approved", "rejected", "converted"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-slate-900 text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
            {s === "" ? "Toutes" : STATUS_CFG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100">
                {["Réf.", "Service", "Urgence", "Articles", "Statut", "Date", "Actions"].map(h => (
                  <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16">
                  <ClipboardList className="h-12 w-12 mx-auto opacity-20 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-30">Aucune demande</p>
                </TableCell></TableRow>
              ) : filtered.map(pr => (
                <TableRow key={pr.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="px-5 py-4 font-black text-slate-800">{pr.request_number}</TableCell>
                  <TableCell className="text-sm font-semibold text-slate-600">{pr.department}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-black border-none ${URGENCY_CFG[pr.urgency]?.cls}`}>
                      {URGENCY_CFG[pr.urgency]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-700">{pr.item_count} article(s)</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-black border ${STATUS_CFG[pr.status]?.cls}`}>
                      {STATUS_CFG[pr.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(pr.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="px-5">
                    <div className="flex items-center gap-1">
                      {pr.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleStatus(pr.id, "approved")} className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1 px-3">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleStatus(pr.id, "rejected")} className="h-8 rounded-lg text-rose-500 hover:text-rose-600 text-xs gap-1 px-3">
                            <XCircle className="h-3.5 w-3.5" /> Rejeter
                          </Button>
                        </>
                      )}
                      {pr.status === "approved" && (
                        <Button size="sm" onClick={() => { setSelectedPR(pr); setIsConvertOpen(true); }} className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1 px-3">
                          <ShoppingCart className="h-3.5 w-3.5" /> → Commande
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

      {/* Convert to PO Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Convertir en Bon de Commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-indigo-50 rounded-2xl p-4 text-sm text-indigo-700 font-medium">
              Demande <strong>{selectedPR?.request_number}</strong> — {selectedPR?.item_count} article(s)
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fournisseur *</Label>
              <Select value={convertForm.supplier_id} onValueChange={v => setConvertForm(f => ({ ...f, supplier_id: v }))}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Sélectionner un fournisseur..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Date prévue</Label>
                <Input type="date" className="h-11 rounded-xl bg-slate-50 border-slate-200" value={convertForm.expected_date} onChange={e => setConvertForm(f => ({ ...f, expected_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">TVA (%)</Label>
                <Input type="number" min="0" max="100" className="h-11 rounded-xl bg-slate-50 border-slate-200" value={convertForm.tax_rate} onChange={e => setConvertForm(f => ({ ...f, tax_rate: +e.target.value }))} />
              </div>
            </div>
            <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black text-white rounded-2xl" onClick={handleConvert}>
              CRÉER LE BON DE COMMANDE
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
