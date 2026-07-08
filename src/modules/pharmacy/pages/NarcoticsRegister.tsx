import { useState } from "react";
import {
  ShieldAlert, Search, Plus, Filter, CheckCircle2,
  AlertCircle, DollarSign, Clock, FileText, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface NarcoticEntry {
  id: string;
  date: string;
  medicationName: string;
  type: "Entrée" | "Sortie";
  qty: number;
  patientName?: string;
  prescriptionNumber?: string;
  notes: string;
}

const MOCK_REGISTER: NarcoticEntry[] = [
  { id: "NAR-001", date: "2026-07-06", medicationName: "Morphine 10mg Amp", type: "Sortie", qty: 2, patientName: "Amadou Diallo", prescriptionNumber: "E-PRES-009", notes: "Délivrance post-opératoire" },
  { id: "NAR-002", date: "2026-07-05", medicationName: "Fentanyl 50mcg Patch", type: "Entrée", qty: 50, notes: "Réception commande grossiste Laborex" },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export default function NarcoticsRegister() {
  const { toast } = useToast();
  const [register, setRegister] = useState<NarcoticEntry[]>(MOCK_REGISTER);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ medicationName: "", type: "Sortie", qty: "", patientName: "", prescriptionNumber: "", notes: "" });

  const handleAdd = () => {
    if (!form.medicationName || !form.qty) return;
    const newEntry: NarcoticEntry = {
      id: `NAR-${String(register.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      medicationName: form.medicationName,
      type: form.type as "Entrée" | "Sortie",
      qty: Number(form.qty),
      patientName: form.patientName || undefined,
      prescriptionNumber: form.prescriptionNumber || undefined,
      notes: form.notes,
    };
    setRegister([newEntry, ...register]);
    setIsAddOpen(false);
    setForm({ medicationName: "", type: "Sortie", qty: "", patientName: "", prescriptionNumber: "", notes: "" });
    toast({ title: "Mouvement enregistré au registre des stupéfiants" });
  };

  const filtered = register.filter(r => r.medicationName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-emerald-600" /> Registre des Stupéfiants
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Traçabilité réglementaire obligatoire des substances classées et stupéfiants.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Rapport généré" })}>
            <Download className="h-4 w-4" /> Exporter le Registre (PDF)
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200">
                <Plus className="h-4 w-4" /> Enregistrer Mouvement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enregistrer un mouvement de stupéfiants</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Type de mouvement</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sortie">Sortie (Dispensation)</SelectItem>
                      <SelectItem value="Entrée">Entrée (Approvisionnement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nom du produit stupéfiant</Label>
                  <Input className="mt-1" placeholder="Morphine 10mg..." value={form.medicationName} onChange={e => setForm({ ...form, medicationName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Quantité (unités)</Label>
                    <Input className="mt-1" type="number" placeholder="0" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
                  </div>
                  {form.type === "Sortie" && (
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">N° Ordonnance</Label>
                      <Input className="mt-1" placeholder="ORD-..." value={form.prescriptionNumber} onChange={e => setForm({ ...form, prescriptionNumber: e.target.value })} />
                    </div>
                  )}
                </div>
                {form.type === "Sortie" && (
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nom du patient</Label>
                    <Input className="mt-1" placeholder="Nom complet" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} />
                  </div>
                )}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Observations / Justification</Label>
                  <Input className="mt-1" placeholder="Notes complémentaires..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAdd}>
                  Valider l'écriture réglementaire
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Substances suivies" value="5" icon={ShieldAlert} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Entrées (Mois)" value="150" icon={Plus} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Sorties (Mois)" value="24" icon={CheckCircle2} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Registre conforme" value="Oui" change="Dernier contrôle DPM OK" changeType="positive" icon={ShieldAlert} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher une écriture au registre..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3">Mouvement</th>
                  <th className="px-6 py-3 text-right">Quantité</th>
                  <th className="px-6 py-3">Patient / Ordonnance</th>
                  <th className="px-6 py-3">Justification / Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-xs font-mono">{row.date}</td>
                    <td className="px-6 py-4 font-bold">{row.medicationName}</td>
                    <td className="px-6 py-4">
                      <Badge className={`text-[10px] ${row.type === "Entrée" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
                        {row.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-black">{row.qty}</td>
                    <td className="px-6 py-4 text-xs">
                      {row.patientName ? `${row.patientName} (Ref : ${row.prescriptionNumber})` : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
