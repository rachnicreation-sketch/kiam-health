import { useState } from "react";
import {
  GitPullRequest, Search, Plus, Star, Phone, Mail, Award,
  Users, CheckCircle2, AlertCircle, Clock, ChevronRight,
  TrendingUp, BarChart3, Settings, Play, Target
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

interface Opportunity {
  id: string;
  name: string;
  client: string;
  amount: number;
  stage: "prospect" | "qualification" | "proposal" | "won" | "lost";
  lastContact: string;
  probability: number; // percentage
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: "OPP-001", name: "Licences ERP - Sonatel", client: "Sonatel", amount: 15000000, stage: "proposal", lastContact: "2026-07-06", probability: 70 },
  { id: "OPP-002", name: "Support Annuel Infrastructure", client: "Orange Mali", amount: 5000000, stage: "qualification", lastContact: "2026-07-07", probability: 40 },
  { id: "OPP-003", name: "Intégration CRM sur-mesure", client: "CFAO Motors", amount: 8500000, stage: "prospect", lastContact: "2026-07-04", probability: 20 },
  { id: "OPP-004", name: "Formation Modules Financiers", client: "BCEAO", amount: 3000000, stage: "won", lastContact: "2026-07-01", probability: 100 },
];

const stageCfg = {
  prospect:      { label: "Prospect", color: "bg-slate-100 text-slate-700" },
  qualification: { label: "Qualification", color: "bg-blue-100 text-blue-700" },
  proposal:      { label: "Proposition", color: "bg-amber-100 text-amber-700" },
  won:           { label: "Gagné", color: "bg-emerald-100 text-emerald-700" },
  lost:          { label: "Perdu", color: "bg-rose-100 text-rose-700" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function CRMPipeline() {
  const { toast } = useToast();
  const [opps, setOpps] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", amount: "", stage: "prospect", probability: "20" });

  const handleAdd = () => {
    if (!form.name || !form.amount) return;
    const item: Opportunity = {
      id: `OPP-${String(opps.length + 1).padStart(3, "0")}`,
      name: form.name,
      client: form.client || "Client Inconnu",
      amount: Number(form.amount),
      stage: form.stage as Opportunity["stage"],
      lastContact: new Date().toISOString().split("T")[0],
      probability: Number(form.probability),
    };
    setOpps([...opps, item]);
    setIsNewOpen(false);
    setForm({ name: "", client: "", amount: "", stage: "prospect", probability: "20" });
    toast({ title: "Opportunité ajoutée au pipeline" });
  };

  const updateStage = (id: string, stage: Opportunity["stage"]) => {
    setOpps(prev => prev.map(o => {
      if (o.id !== id) return o;
      let prob = o.probability;
      if (stage === "won") prob = 100;
      if (stage === "lost") prob = 0;
      return { ...o, stage, probability: prob };
    }));
    toast({ title: "Pipeline mis à jour" });
  };

  const pipelineValue = opps.filter(o => o.stage !== "lost" && o.stage !== "won").reduce((s, o) => s + o.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Target className="h-7 w-7 text-purple-600" /> CRM & Pipeline Commercial
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Suivi des opportunités, des relances prospects et du prévisionnel de ventes.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-200">
              <Plus className="h-4 w-4" /> Nouvelle Opportunité
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une opportunité</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Intitulé de l'affaire</Label>
                <Input className="mt-1" placeholder="Ex: Contrat de support" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Client / Compte</Label>
                <Input className="mt-1" placeholder="Nom de l'entreprise" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Montant estimé (CFA)</Label>
                  <Input className="mt-1" type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Étape de vente</Label>
                  <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="qualification">Qualification</SelectItem>
                      <SelectItem value="proposal">Proposition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAdd}>
                Enregistrer l'opportunité
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Valeur du Pipeline" value={fmt(pipelineValue)} icon={TrendingUp} iconClassName="bg-purple-100 text-purple-600" />
        <StatCard title="Affaires Gagnées (Mois)" value={fmt(opps.filter(o => o.stage === "won").reduce((s, o) => s + o.amount, 0))} icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Taux de conversion" value="65%" change="+5% vs trimestre précédent" changeType="positive" icon={Award} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Opportunités actives" value={String(opps.filter(o => o.stage !== "lost" && o.stage !== "won").length)} icon={Users} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Simple CRM Board Columns */}
        {(["prospect", "qualification", "proposal"] as const).map(col => (
          <Card key={col} className="border-none bg-slate-50 shadow-sm min-h-[300px]">
            <CardHeader className="pb-2 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-700">{stageCfg[col].label}</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {opps.filter(o => o.stage === col).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {opps.filter(o => o.stage === col).map(opp => (
                <div key={opp.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 space-y-2 hover:shadow-md transition-all">
                  <div>
                    <h4 className="font-bold text-xs leading-snug">{opp.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{opp.client}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-purple-700">{fmt(opp.amount)}</span>
                    <Badge variant="outline" className="text-[8px]">{opp.probability}% prob.</Badge>
                  </div>
                  <div className="flex gap-1 pt-1 justify-end">
                    <Button size="xs" variant="outline" className="text-[9px] h-6 px-1.5" onClick={() => updateStage(opp.id, "won")}>Gagné</Button>
                    <Button size="xs" variant="outline" className="text-[9px] h-6 px-1.5 text-rose-600 hover:bg-rose-50 border-rose-100" onClick={() => updateStage(opp.id, "lost")}>Perdu</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
