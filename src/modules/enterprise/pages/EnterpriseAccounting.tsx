import { useState } from "react";
import {
  Landmark, ArrowRightLeft, BookOpen, Calculator, FileText, CheckCircle2,
  TrendingUp, TrendingDown, DollarSign, Plus, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";

interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
}

const MOCK_ENTRIES: JournalEntry[] = [
  { id: "JRN-001", date: "2026-07-01", reference: "FAC-2026-001", description: "Vente de services d'audit - TotalEnergies", debit: 4500000, credit: 0 },
  { id: "JRN-002", date: "2026-07-01", reference: "FAC-2026-001", description: "Compte de ventes (701)", debit: 0, credit: 4500000 },
  { id: "JRN-003", date: "2026-07-03", reference: "FAC-2026-002", description: "Paiement facture Sonatel (Banque 521)", debit: 7200000, credit: 0 },
  { id: "JRN-004", date: "2026-07-03", reference: "FAC-2026-002", description: "Créance client Sonatel solde", debit: 0, credit: 7200000 },
];

const MOCK_ACCOUNTS = [
  { code: "101", name: "Capital social", balance: 50000000, type: "passif" },
  { code: "521", name: "Banques", balance: 18500000, type: "actif" },
  { code: "701", name: "Ventes de services", balance: 11700000, type: "produit" },
  { code: "601", name: "Achats de matières", balance: 3200000, type: "charge" },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function EnterpriseAccounting() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const [accounts] = useState(MOCK_ACCOUNTS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], reference: "", description: "", accountDebit: "521", accountCredit: "701", amount: "" });

  const handleAdd = () => {
    if (!form.amount || !form.description) return;
    const amt = Number(form.amount);
    const newEntryDebit: JournalEntry = {
      id: `JRN-00${entries.length + 1}`,
      date: form.date,
      reference: form.reference || "Saisie manuelle",
      description: `${form.description} (Débit Compte ${form.accountDebit})`,
      debit: amt,
      credit: 0
    };
    const newEntryCredit: JournalEntry = {
      id: `JRN-00${entries.length + 2}`,
      date: form.date,
      reference: form.reference || "Saisie manuelle",
      description: `${form.description} (Crédit Compte ${form.accountCredit})`,
      debit: 0,
      credit: amt
    };
    setEntries([...entries, newEntryDebit, newEntryCredit]);
    setIsAddOpen(false);
    setForm({ date: new Date().toISOString().split("T")[0], reference: "", description: "", accountDebit: "521", accountCredit: "701", amount: "" });
    toast({ title: "Écriture comptable enregistrée" });
  };

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Landmark className="h-7 w-7 text-indigo-600" /> Comptabilité OHADA
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Journal, Plan comptable et rapports financiers consolidés.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Passer une écriture
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle écriture de journal</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date</Label>
                  <Input className="mt-1" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Référence / N° Pièce</Label>
                  <Input className="mt-1" placeholder="FAC-..." value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Libellé de l'écriture</Label>
                <Input className="mt-1" placeholder="Ex: Paiement facture..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Compte Débit</Label>
                  <Select value={form.accountDebit} onValueChange={v => setForm({ ...form, accountDebit: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="521">521 - Banques</SelectItem>
                      <SelectItem value="101">101 - Capital social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Compte Crédit</Label>
                  <Select value={form.accountCredit} onValueChange={v => setForm({ ...form, accountCredit: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="701">701 - Ventes de services</SelectItem>
                      <SelectItem value="601">601 - Achats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Montant (CFA)</Label>
                <Input className="mt-1" type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAdd}>
                Enregistrer l'écriture
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Solde Banque" value="18.5M CFA" icon={Landmark} iconClassName="bg-indigo-100 text-indigo-600" />
        <StatCard title="Total Produits (Classe 7)" value="11.7M CFA" icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Total Charges (Classe 6)" value="3.2M CFA" icon={TrendingDown} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Résultat net (estimé)" value="+8.5M CFA" changeType="positive" icon={Calculator} iconClassName="bg-blue-100 text-blue-600" />
      </div>

      <Tabs defaultValue="journal">
        <TabsList className="bg-slate-50 border border-slate-200">
          <TabsTrigger value="journal">Journal des Écritures</TabsTrigger>
          <TabsTrigger value="accounts">Plan Comptable</TabsTrigger>
        </TabsList>
        <TabsContent value="journal" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Livre-journal général</CardTitle>
                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>Total Débit : <strong>{fmt(totalDebit)}</strong></span>
                  <span>Total Crédit : <strong>{fmt(totalCredit)}</strong></span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Référence</th>
                      <th className="px-6 py-3">Libellé / Description</th>
                      <th className="px-6 py-3 text-right">Débit</th>
                      <th className="px-6 py-3 text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-4">{entry.date}</td>
                        <td className="px-6 py-4 font-semibold">{entry.reference}</td>
                        <td className="px-6 py-4">{entry.description}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">{entry.debit > 0 ? fmt(entry.debit) : "-"}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-bold">{entry.credit > 0 ? fmt(entry.credit) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="accounts" className="mt-4 space-y-3">
          {accounts.map(acc => (
            <Card key={acc.code} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="text-xs mb-1">{acc.code}</Badge>
                  <p className="font-bold text-sm">{acc.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">{fmt(acc.balance)}</p>
                  <p className="text-xs text-muted-foreground uppercase">{acc.type}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
