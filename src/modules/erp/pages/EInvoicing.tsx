import { useState } from "react";
import {
  FileText, ShieldCheck, Download, Plus, Search, Filter,
  CheckCircle2, AlertCircle, DollarSign, Send, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface FiscalInvoice {
  id: string;
  client: string;
  amount: number;
  taxAmount: number;
  fiscalStamp: string; // Tampon fiscal DGI
  date: string;
  status: "certified" | "pending";
}

const MOCK_INVOICES: FiscalInvoice[] = [
  { id: "FAC-FIS-2026-001", client: "Senelec", amount: 4500000, taxAmount: 810000, fiscalStamp: "DGI-2026-XYZ-87612", date: "2026-07-06", status: "certified" },
  { id: "FAC-FIS-2026-002", client: "Eiffage Sénégal", amount: 12500000, taxAmount: 2250000, fiscalStamp: "DGI-2026-ABC-99124", date: "2026-07-07", status: "certified" },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function EInvoicing() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<FiscalInvoice[]>(MOCK_INVOICES);
  const [search, setSearch] = useState("");

  const certifyInvoice = () => {
    toast({ title: "Facture certifiée à la DGI", description: "Tampon fiscal officiel apposé sur le PDF de facturation." });
  };

  const filtered = invoices.filter(i => i.client.toLowerCase().includes(search.toLowerCase()) || i.id.includes(search));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-purple-600" /> Facturation Électronique Légale
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Émission de factures certifiées, apposition de tampons fiscaux et export légal DGI.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Factures certifiées" value={String(invoices.length)} icon={ShieldCheck} iconClassName="bg-purple-100 text-purple-600" />
        <StatCard title="Total TVA collectée" value={fmt(invoices.reduce((s, i) => s + i.taxAmount, 0))} icon={DollarSign} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Connexion DGI" value="Active" change="Statut API OK" changeType="positive" icon={CheckCircle2} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Rejets fiscaux" value="0" icon={AlertCircle} iconClassName="bg-rose-100 text-rose-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher facture fiscale certifiée..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(inv => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{inv.id}</p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Certifié DGI</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{inv.client} · Date : {inv.date}</p>
                  <p className="text-[10px] text-purple-600 font-mono mt-1">Tampon : {inv.fiscalStamp}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-start">
                  <div className="text-right mr-4">
                    <p className="font-black text-sm text-purple-700">{fmt(inv.amount)}</p>
                    <p className="text-[10px] text-muted-foreground">TVA : {fmt(inv.taxAmount)}</p>
                  </div>
                  <Button size="xs" variant="outline" className="h-7 text-xs gap-1" onClick={certifyInvoice}>
                    <Download className="h-3 w-3" /> PDF Certifié
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
