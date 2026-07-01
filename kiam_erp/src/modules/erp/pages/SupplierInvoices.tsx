import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search, ArrowLeft, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  validated: { label: "Validée",     cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected:  { label: "Rejetée",     cls: "bg-rose-100 text-rose-600 border-rose-200" },
  paid:      { label: "Payée ✓",    cls: "bg-teal-100 text-teal-700 border-teal-200" },
  partial:   { label: "Part. payée", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function SupplierInvoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "", order_id: "", receipt_id: "",
    invoice_number: "", amount_ht: 0, tax_amount: 0, due_date: "", notes: "",
  });
  const total_ttc = (form.amount_ht || 0) + (form.tax_amount || 0);

  useEffect(() => { loadData(); }, [user, filterStatus]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setLoading(true);
    try {
      const [invs, sups, pos, grs] = await Promise.all([
        api.procurement.invList(user.clinicId, filterStatus),
        api.procurement.suppliers(user.clinicId),
        api.procurement.poList(user.clinicId),
        api.procurement.grList(user.clinicId),
      ]);
      setInvoices(invs);
      setSuppliers(sups);
      setOrders(pos);
      setReceipts(grs);
    } catch { toast({ variant: "destructive", title: "Erreur de chargement" }); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.supplier_id || !form.invoice_number) {
      toast({ variant: "destructive", title: "Fournisseur et numéro de facture obligatoires" });
      return;
    }
    try {
      await api.procurement.invCreate({ ...form, total_ttc, clinicId: user!.clinicId });
      toast({ title: "Facture enregistrée" });
      setIsCreateOpen(false);
      setForm({ supplier_id: "", order_id: "", receipt_id: "", invoice_number: "", amount_ht: 0, tax_amount: 0, due_date: "", notes: "" });
      loadData();
    } catch (e: any) { toast({ variant: "destructive", title: e.message }); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.procurement.invUpdateStatus({ id, status, clinicId: user!.clinicId });
      toast({ title: status === "validated" ? "Facture validée" : "Facture rejetée" });
      loadData();
    } catch { toast({ variant: "destructive", title: "Erreur" }); }
  };

  const filtered = invoices.filter(i =>
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Triangular verification check
  const triCheck = (inv: any) => {
    const hasOrder = !!inv.order_id;
    const hasReceipt = !!inv.receipt_id;
    return { hasOrder, hasReceipt, complete: hasOrder && hasReceipt };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/erp/procurement")} className="rounded-2xl bg-white shadow-sm border">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <FileText className="h-7 w-7 text-rose-500" /> Factures Fournisseurs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Rapprochement triangulaire : BC + BR + Facture</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-500 hover:bg-rose-600 text-white font-bold gap-2 shadow-lg h-11 px-6 rounded-xl">
              <Plus className="h-4 w-4" /> Nouvelle Facture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[2rem] border-none bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Enregistrer une Facture Fournisseur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fournisseur *</Label>
                  <Select value={form.supplier_id} onValueChange={v => setForm(f => ({ ...f, supplier_id: v }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">N° Facture *</Label>
                  <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" placeholder="FACT-2026-001" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
                </div>
              </div>
              {/* Triangular links */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bon de Commande</Label>
                  <Select value={form.order_id} onValueChange={v => setForm(f => ({ ...f, order_id: v }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Lier un BC..." /></SelectTrigger>
                    <SelectContent>{orders.map(o => <SelectItem key={o.id} value={o.id}>{o.order_number}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bon de Réception</Label>
                  <Select value={form.receipt_id} onValueChange={v => setForm(f => ({ ...f, receipt_id: v }))}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Lier un BR..." /></SelectTrigger>
                    <SelectContent>{receipts.map(r => <SelectItem key={r.id} value={r.id}>{r.receipt_number}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {/* Triangular check indicator */}
              <div className="flex gap-3">
                {[
                  { label: "BC lié", ok: !!form.order_id },
                  { label: "BR lié", ok: !!form.receipt_id },
                  { label: "Montant saisi", ok: form.amount_ht > 0 },
                ].map(c => (
                  <div key={c.label} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {c.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />}
                    {c.label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Montant HT</Label>
                  <Input type="number" className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.amount_ht} onChange={e => setForm(f => ({ ...f, amount_ht: +e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Taxes / TVA</Label>
                  <Input type="number" className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.tax_amount} onChange={e => setForm(f => ({ ...f, tax_amount: +e.target.value }))} />
                </div>
              </div>
              <div className="bg-rose-50 rounded-2xl p-4 flex justify-between items-center">
                <span className="font-black text-rose-700">Total TTC</span>
                <span className="font-black text-rose-700 text-xl">{fmt(total_ttc)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Échéance</Label>
                  <Input type="date" className="h-11 rounded-xl bg-slate-50 border-slate-200" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <Textarea className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={2} placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full h-12 bg-rose-500 hover:bg-rose-600 font-black text-white rounded-2xl" onClick={handleCreate}>
                ENREGISTRER LA FACTURE
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-10 h-10 rounded-xl bg-white border-slate-200" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["", "pending", "validated", "rejected", "paid", "partial"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-slate-900 text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
            {s === "" ? "Toutes" : STATUS_CFG[s]?.label ?? s}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100">
                {["N° Facture", "Fournisseur", "Vérification ▲", "Montant TTC", "Payé", "Reste dû", "Échéance", "Statut", "Actions"].map(h => (
                  <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-16">
                  <FileText className="h-12 w-12 mx-auto opacity-20 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-30">Aucune facture</p>
                </TableCell></TableRow>
              ) : filtered.map(inv => {
                const tri = triCheck(inv);
                const due = (inv.total_ttc || 0) - (inv.paid_amount || 0);
                return (
                  <TableRow key={inv.id} className="border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="px-4 py-4 font-black text-slate-800">{inv.invoice_number}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-600">{inv.supplier_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${tri.hasOrder ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>BC</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${tri.hasReceipt ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>BR</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-slate-800">{fmt(inv.total_ttc)}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{fmt(inv.paid_amount)}</TableCell>
                    <TableCell className={`font-black ${due > 0 ? "text-rose-600" : "text-slate-400"}`}>{fmt(due)}</TableCell>
                    <TableCell className="text-xs text-slate-400">{inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-black border ${STATUS_CFG[inv.status]?.cls}`}>{STATUS_CFG[inv.status]?.label}</Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex gap-1.5">
                        {inv.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleStatus(inv.id, "validated")} className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1 px-2.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleStatus(inv.id, "rejected")} className="h-8 rounded-lg text-rose-500 text-xs gap-1 px-2.5">
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {["validated", "partial"].includes(inv.status) && (
                          <Button size="sm" onClick={() => navigate("/erp/supplier-payments")} className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1 px-2.5">
                            <CreditCard className="h-3.5 w-3.5" /> Payer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
