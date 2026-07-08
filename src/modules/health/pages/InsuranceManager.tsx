import { useState } from "react";
import {
  Shield, CheckCircle2, AlertCircle, FileText, Plus, Search, Filter,
  Building, CreditCard, ChevronRight, Download, DollarSign, Landmark
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

interface Agreement {
  id: string;
  name: string;
  code: string;
  coverageRate: number; // e.g., 80 for 80%
  status: "active" | "inactive";
  contactEmail: string;
}

interface Claim {
  id: string;
  patientName: string;
  agreementName: string;
  totalAmount: number;
  coveredAmount: number;
  patientAmount: number;
  date: string;
  status: "pending" | "transmitted" | "paid" | "rejected";
}

const MOCK_AGREEMENTS: Agreement[] = [
  { id: "AG001", name: "IPM Senelec", code: "IPM-SEN", coverageRate: 80, status: "active", contactEmail: "ipm@senelec.sn" },
  { id: "AG002", name: "Allianz Santé", code: "ALZ-SAN", coverageRate: 90, status: "active", contactEmail: "sante@allianz.sn" },
  { id: "AG003", name: "ASCOMA", code: "ASC-01", coverageRate: 70, status: "active", contactEmail: "medical@ascoma.sn" },
];

const MOCK_CLAIMS: Claim[] = [
  { id: "CLM-001", patientName: "Abdoulaye Ndiaye", agreementName: "IPM Senelec", totalAmount: 45000, coveredAmount: 36000, patientAmount: 9000, date: "2026-07-06", status: "transmitted" },
  { id: "CLM-002", patientName: "Fatou Kiné Sow", agreementName: "Allianz Santé", totalAmount: 120000, coveredAmount: 108000, patientAmount: 12000, date: "2026-07-07", status: "pending" },
  { id: "CLM-003", patientName: "Ousmane Diallo", agreementName: "ASCOMA", totalAmount: 35000, coveredAmount: 24500, patientAmount: 10500, date: "2026-07-05", status: "paid" },
];

const claimStatusCfg = {
  pending:     { label: "À transmettre", color: "bg-slate-100 text-slate-600 border-slate-200" },
  transmitted: { label: "Télétransmis", color: "bg-blue-100 text-blue-700 border-blue-200" },
  paid:        { label: "Remboursé", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected:    { label: "Rejeté", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function InsuranceManager() {
  const { toast } = useToast();
  const [agreements, setAgreements] = useState<Agreement[]>(MOCK_AGREEMENTS);
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [search, setSearch] = useState("");
  const [isNewAgreementOpen, setIsNewAgreementOpen] = useState(false);
  const [newAg, setNewAg] = useState({ name: "", code: "", coverageRate: "80", contactEmail: "" });

  const handleAddAgreement = () => {
    if (!newAg.name || !newAg.code) return;
    const item: Agreement = {
      id: `AG${String(agreements.length + 1).padStart(3, "0")}`,
      name: newAg.name,
      code: newAg.code,
      coverageRate: Number(newAg.coverageRate),
      status: "active",
      contactEmail: newAg.contactEmail,
    };
    setAgreements([...agreements, item]);
    setIsNewAgreementOpen(false);
    setNewAg({ name: "", code: "", coverageRate: "80", contactEmail: "" });
    toast({ title: "Convention d'assurance ajoutée" });
  };

  const transmitClaim = (id: string) => {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: "transmitted" } : c));
    toast({ title: "Demande télétransmise à l'assureur" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Shield className="h-7 w-7 text-sky-600" /> Assurances & Tiers-Payant
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion des conventions partenaires, taux de couverture et télétransmissions.</p>
        </div>
        <Dialog open={isNewAgreementOpen} onOpenChange={setIsNewAgreementOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Nouvelle Convention
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une convention d'assurance</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nom du partenaire</Label>
                <Input className="mt-1" placeholder="Ex: AXA Assurances" value={newAg.name} onChange={e => setNewAg({ ...newAg, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Code Interne</Label>
                  <Input className="mt-1" placeholder="AXA-01" value={newAg.code} onChange={e => setNewAg({ ...newAg, code: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Taux couverture (%)</Label>
                  <Input className="mt-1" type="number" placeholder="80" value={newAg.coverageRate} onChange={e => setNewAg({ ...newAg, coverageRate: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email contact facturation</Label>
                <Input className="mt-1" type="email" placeholder="contact@assurance.sn" value={newAg.contactEmail} onChange={e => setNewAg({ ...newAg, contactEmail: e.target.value })} />
              </div>
              <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white" onClick={handleAddAgreement}>
                Enregistrer la convention
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Conventions Actives" value={String(agreements.length)} icon={Building} iconClassName="bg-sky-100 text-sky-600" />
        <StatCard title="En attente de paiement" value={fmt(claims.filter(c => c.status === "transmitted").reduce((s, c) => s + c.coveredAmount, 0))} icon={Clock} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Total Remboursé" value={fmt(claims.filter(c => c.status === "paid").reduce((s, c) => s + c.coveredAmount, 0))} icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Télétransmissions du jour" value="12" icon={Send} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <Tabs defaultValue="claims">
        <TabsList className="bg-slate-50 border border-slate-200">
          <TabsTrigger value="claims">Feuilles de Soins & Factures Tiers-Payant</TabsTrigger>
          <TabsTrigger value="agreements">Assureurs Partenaires</TabsTrigger>
        </TabsList>

        <TabsContent value="claims" className="mt-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-6 py-3">Assureur</th>
                      <th className="px-6 py-3 text-right">Montant Total</th>
                      <th className="px-6 py-3 text-right">Part Assureur</th>
                      <th className="px-6 py-3 text-right">Part Patient</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {claims.map(claim => {
                      const cfg = claimStatusCfg[claim.status];
                      return (
                        <tr key={claim.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold">{claim.patientName}</td>
                          <td className="px-6 py-4">{claim.agreementName}</td>
                          <td className="px-6 py-4 text-right">{fmt(claim.totalAmount)}</td>
                          <td className="px-6 py-4 text-right text-sky-700 font-semibold">{fmt(claim.coveredAmount)}</td>
                          <td className="px-6 py-4 text-right text-slate-600">{fmt(claim.patientAmount)}</td>
                          <td className="px-6 py-4">
                            <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {claim.status === "pending" && (
                              <Button size="xs" className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-7 gap-1" onClick={() => transmitClaim(claim.id)}>
                                <Send className="h-3 w-3" /> Télétransmettre
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agreements" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {agreements.map(ag => (
            <Card key={ag.id} className="border-none shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base">{ag.name}</h3>
                    <p className="text-xs text-muted-foreground">Code : {ag.code}</p>
                  </div>
                  <Badge variant="outline" className="text-sky-700 bg-sky-50 border-sky-200">{ag.coverageRate}% Prise en charge</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Contact : {ag.contactEmail}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
