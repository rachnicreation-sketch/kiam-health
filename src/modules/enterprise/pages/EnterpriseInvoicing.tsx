import { useState } from "react";
import {
  FileText, Plus, Search, Filter, Download, CheckCircle2,
  AlertCircle, DollarSign, Clock, CreditCard, Send, X, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Invoice {
  id: string;
  client: string;
  project: string;
  amount: number;
  date: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  type: "invoice" | "quote";
}

const MOCK_INVOICES: Invoice[] = [
  { id: "FAC-2026-001", client: "TotalEnergies Sénégal", project: "Audit SI TotalEnergies", amount: 4500000, date: "2026-07-01", dueDate: "2026-07-31", status: "sent", type: "invoice" },
  { id: "FAC-2026-002", client: "Sonatel", project: "CRM Sonatel", amount: 7200000, date: "2026-07-03", dueDate: "2026-08-03", status: "paid", type: "invoice" },
  { id: "DEV-2026-003", client: "Client A", project: "App Mobile Client A", amount: 3500000, date: "2026-07-05", dueDate: "2026-07-20", status: "draft", type: "quote" },
  { id: "FAC-2026-004", client: "Orange Mali", project: "Support Infrastructure", amount: 1800000, date: "2026-06-01", dueDate: "2026-07-01", status: "overdue", type: "invoice" },
];

const statusCfg = {
  draft:   { label: "Brouillon", color: "bg-slate-100 text-slate-600 border-slate-200" },
  sent:    { label: "Envoyé", color: "bg-blue-100 text-blue-700 border-blue-200" },
  paid:    { label: "Payé", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  overdue: { label: "En retard", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function EnterpriseInvoicing() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Invoice[]>(MOCK_INVOICES);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ client: "", project: "", amount: "", type: "invoice", description: "" });

  const handleAdd = () => {
    if (!form.client || !form.amount) return;
    const prefix = form.type === "invoice" ? "FAC" : "DEV";
    const newDoc: Invoice = {
      id: `${prefix}-2026-00${docs.length + 1}`,
      client: form.client,
      project: form.project || "Général",
      amount: Number(form.amount),
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString().split("T")[0],
      status: "draft",
      type: form.type as "invoice" | "quote",
    };
    setDocs([newDoc, ...docs]);
    setIsNewOpen(false);
    setForm({ client: "", project: "", amount: "", type: "invoice", description: "" });
    toast({ title: form.type === "invoice" ? "Facture créée" : "Devis créé" });
  };

  const markPaid = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "paid" } : d));
    toast({ title: "Document marqué comme payé" });
  };

  const filtered = docs.filter(d => {
    const matchSearch = d.client.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || d.type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    totalPaid: docs.filter(d => d.type === "invoice" && d.status === "paid").reduce((s, d) => s + d.amount, 0),
    totalPending: docs.filter(d => d.type === "invoice" && d.status === "sent").reduce((s, d) => s + d.amount, 0),
    totalOverdue: docs.filter(d => d.type === "invoice" && d.status === "overdue").reduce((s, d) => s + d.amount, 0),
    totalQuotes: docs.filter(d => d.type === "quote").reduce((s, d) => s + d.amount, 0),
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <FileText className="h-7 w-7 text-indigo-600" /> Facturation & Devis
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gérer les devis commerciaux et les factures clients.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="h-4 w-4" /> Nouveau document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer une facture ou un devis</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Type de document</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Facture client</SelectItem>
                      <SelectItem value="quote">Devis commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Client</Label>
                  <Input className="mt-1" placeholder="Nom du client" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Projet associé</Label>
                  <Input className="mt-1" placeholder="Nom du projet" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Montant (CFA)</Label>
                  <Input className="mt-1" type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description / Notes</Label>
                  <Textarea className="mt-1" placeholder="Détails de la prestation..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAdd}>
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Payé ce mois" value={fmt(stats.totalPaid)} icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="En attente" value={fmt(stats.totalPending)} icon={Clock} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="En retard" value={fmt(stats.totalOverdue)} change="Relance urgente" changeType="negative" icon={AlertCircle} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Devis en cours" value={fmt(stats.totalQuotes)} icon={FileText} iconClassName="bg-indigo-100 text-indigo-600" />
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Rechercher client, numéro..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="invoice">Factures</SelectItem>
                <SelectItem value="quote">Devis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(doc => {
              const cfg = statusCfg[doc.status] || { label: doc.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
              return (
                <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{doc.id}</p>
                      <Badge className={`text-[10px] h-4 px-1.5 border ${cfg.color}`}>{cfg.label}</Badge>
                      <Badge variant="outline" className="text-[10px] h-4">{doc.type === "invoice" ? "Facture" : "Devis"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.client} · Projet : {doc.project}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="font-black text-sm text-indigo-700">{fmt(doc.amount)}</p>
                    <div className="flex gap-2">
                      {doc.status !== "paid" && doc.type === "invoice" && (
                        <Button size="xs" variant="outline" className="text-xs h-7" onClick={() => markPaid(doc.id)}>
                          Marquer Payé
                        </Button>
                      )}
                      <Button size="xs" variant="ghost" className="h-7 text-xs gap-1">
                        <ArrowUpRight className="h-3 w-3" /> PDF
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
