import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ArrowLeft, Search, DollarSign, Building2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function SupplierPayments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [form, setForm] = useState({
    invoice_id: "", amount: 0, payment_method: "cash", reference: "", notes: "",
  });

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setLoading(true);
    try {
      const [pays, bals, invs] = await Promise.all([
        api.procurement.payList(user.clinicId),
        api.procurement.supplierBalance(user.clinicId),
        api.procurement.invList(user.clinicId, "validated"),
      ]);
      setPayments(pays);
      setBalances(bals);
      const partial = await api.procurement.invList(user.clinicId, "partial");
      setPendingInvoices([...invs, ...partial]);
    } catch { toast({ variant: "destructive", title: "Erreur de chargement" }); }
    finally { setLoading(false); }
  };

  const openPayment = (inv: any) => {
    setSelectedInvoice(inv);
    const due = (inv.total_ttc || 0) - (inv.paid_amount || 0);
    setForm(f => ({ ...f, invoice_id: inv.id, amount: due }));
    setIsPayOpen(true);
  };

  const handlePay = async () => {
    if (!form.invoice_id || form.amount <= 0) {
      toast({ variant: "destructive", title: "Montant invalide" });
      return;
    }
    try {
      const res = await api.procurement.payCreate({ ...form, clinicId: user!.clinicId });
      toast({
        title: "Paiement enregistré !",
        description: res.invoice_status === "paid" ? "Facture entièrement payée ✓" : "Paiement partiel enregistré",
      });
      setIsPayOpen(false);
      setForm({ invoice_id: "", amount: 0, payment_method: "cash", reference: "", notes: "" });
      loadData();
    } catch (e: any) { toast({ variant: "destructive", title: e.message }); }
  };

  const totalDebt = balances.reduce((s, b) => s + (b.balance_due || 0), 0);

  const filteredPayments = payments.filter(p =>
    p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  const RATING_CFG: Record<string, { label: string; cls: string }> = {
    reliable: { label: "Fiable",    cls: "bg-emerald-100 text-emerald-700" },
    average:  { label: "Moyen",     cls: "bg-amber-100 text-amber-700" },
    at_risk:  { label: "À risque",  cls: "bg-rose-100 text-rose-600" },
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/erp/procurement")} className="rounded-2xl bg-white shadow-sm border">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-indigo-600" /> Paiements Fournisseurs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi des dettes et paiements — partiel ou total</p>
        </div>
      </div>

      {/* Total Debt Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-indigo-200">
        <div>
          <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-1">Dette totale fournisseurs</p>
          <p className="text-4xl font-black">{fmt(totalDebt)}</p>
        </div>
        <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <DollarSign className="h-8 w-8" />
        </div>
      </div>

      {/* Factures à payer */}
      {pendingInvoices.length > 0 && (
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-amber-50 border-b border-amber-100 px-6 py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700">
              Factures à payer ({pendingInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pendingInvoices.map(inv => {
              const due = (inv.total_ttc || 0) - (inv.paid_amount || 0);
              return (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4 border-b border-amber-50 hover:bg-amber-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-black text-slate-800">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-400 font-medium">{inv.supplier_name}</p>
                    {inv.due_date && <p className="text-[10px] text-amber-600 font-bold mt-0.5">Échéance: {new Date(inv.due_date).toLocaleDateString("fr-FR")}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-black text-rose-600">{fmt(due)}</p>
                      <p className="text-[10px] text-slate-400">sur {fmt(inv.total_ttc)}</p>
                    </div>
                    <Button size="sm" onClick={() => openPayment(inv)} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 px-4">
                      <CreditCard className="h-3.5 w-3.5" /> Payer
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Supplier balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {balances.filter(b => b.balance_due > 0).map(b => (
          <Card key={b.id} className="border-none shadow-md bg-white rounded-[1.5rem] overflow-hidden hover:shadow-lg transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-sm">
                  {b.name?.substring(0, 2).toUpperCase()}
                </div>
                <Badge className={`text-[10px] font-black border-none ${RATING_CFG[b.rating]?.cls ?? "bg-slate-100 text-slate-600"}`}>
                  {RATING_CFG[b.rating]?.label ?? b.rating}
                </Badge>
              </div>
              <p className="font-black text-slate-800 text-sm">{b.name}</p>
              <p className="text-[10px] text-slate-400 mb-3">{b.invoice_count} facture(s)</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Facturé</span><span className="font-bold text-slate-600">{fmt(b.total_invoiced)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Payé</span><span className="font-bold text-emerald-600">{fmt(b.total_paid)}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-1 mt-1"><span className="font-black text-slate-700">Solde dû</span><span className="font-black text-rose-600">{fmt(b.balance_due)}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment History */}
      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50 border-b px-6 py-4 flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">Historique des Paiements</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input className="pl-9 h-9 rounded-xl bg-white border-slate-200 text-sm w-52" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                {["Fournisseur", "Facture", "Montant", "Méthode", "Référence", "Date"].map(h => (
                  <TableHead key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-3">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></TableCell></TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12">
                  <CreditCard className="h-10 w-10 mx-auto opacity-20 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-30">Aucun paiement</p>
                </TableCell></TableRow>
              ) : filteredPayments.map(p => (
                <TableRow key={p.id} className="border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="px-5 py-3 font-bold text-slate-800">{p.supplier_name}</TableCell>
                  <TableCell className="text-sm text-indigo-600 font-semibold">{p.invoice_number}</TableCell>
                  <TableCell className="font-black text-emerald-600">{fmt(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold capitalize">
                      {p.payment_method?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{p.reference || "—"}</TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(p.paid_at).toLocaleDateString("fr-FR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Enregistrer un Paiement</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 pt-2">
              <div className="bg-indigo-50 rounded-2xl p-4 text-sm">
                <p className="font-black text-indigo-800">{selectedInvoice.invoice_number}</p>
                <p className="text-indigo-600 font-medium">{selectedInvoice.supplier_name}</p>
                <div className="flex justify-between mt-2 pt-2 border-t border-indigo-200">
                  <span className="text-indigo-500 font-medium">Reste dû</span>
                  <span className="font-black text-rose-600">{fmt((selectedInvoice.total_ttc || 0) - (selectedInvoice.paid_amount || 0))}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Montant à payer *</Label>
                <Input type="number" min="1" className="h-12 rounded-xl bg-slate-50 border-slate-200 text-lg font-bold" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Méthode de paiement</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Espèces</SelectItem>
                    <SelectItem value="bank_transfer">🏦 Virement bancaire</SelectItem>
                    <SelectItem value="check">📄 Chèque</SelectItem>
                    <SelectItem value="mobile">📱 Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Référence / N° de transaction</Label>
                <Input className="h-11 rounded-xl bg-slate-50 border-slate-200" placeholder="Optionnel" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
              </div>
              <Textarea className="rounded-xl bg-slate-50 border-slate-200 resize-none" rows={2} placeholder="Notes (optionnel)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black text-white rounded-2xl gap-2" onClick={handlePay}>
                <CheckCircle2 className="h-5 w-5" /> CONFIRMER LE PAIEMENT
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
