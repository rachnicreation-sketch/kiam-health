import { useState } from "react";
import {
  FileText, Search, Plus, Filter, CheckCircle2,
  AlertCircle, DollarSign, Clock, ArrowRight, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface EPrescription {
  id: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  medications: string[];
  date: string;
  status: "pending" | "dispensed";
}

const MOCK_PRESCRIPTIONS: EPrescription[] = [
  { id: "E-PRES-001", patientName: "Awa Ndiaye", doctorName: "Dr. Seydou Diallo", clinicName: "Clinique Kiam Health", medications: ["Paracétamol 500mg ×3/jour", "Amoxicilline 1g ×2/jour"], date: "2026-07-07", status: "pending" },
  { id: "E-PRES-002", patientName: "Ibrahima Sow", doctorName: "Dr. Fatou Cissé", clinicName: "Cabinet Médical Kiam", medications: ["Spasfon ×3/jour"], date: "2026-07-06", status: "dispensed" },
];

export default function ElectronicPrescription() {
  const [prescriptions, setPrescriptions] = useState<EPrescription[]>(MOCK_PRESCRIPTIONS);
  const [search, setSearch] = useState("");

  const dispensePrescription = (id: string) => {
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: "dispensed" } : p));
    alert("Ordonnance délivrée. Les stocks de la pharmacie ont été mis à jour.");
  };

  const filtered = prescriptions.filter(p => p.patientName.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-emerald-600" /> Ordonnance Électronique
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Réception et dispensation d'ordonnances dématérialisées transmises par les médecins du réseau Kiam Health.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ordonnances reçues" value={String(prescriptions.length)} icon={ShieldCheck} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="En attente" value={String(prescriptions.filter(p => p.status === "pending").length)} icon={Clock} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Délivrées" value={String(prescriptions.filter(p => p.status === "dispensed").length)} icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Médecins connectés" value="5" icon={ShieldCheck} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher patient, numéro d'ordonnance..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filtered.map(p => (
          <Card key={p.id} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base">{p.patientName}</h3>
                  <Badge variant="outline">{p.id}</Badge>
                  <Badge className={`text-[10px] ${p.status === "dispensed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                    {p.status === "dispensed" ? "Délivrée" : "À préparer"}
                  </Badge>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-bold text-slate-700">Traitements prescrits :</p>
                  {p.medications.map((med, idx) => (
                    <p key={idx} className="text-slate-600 font-semibold">• {med}</p>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Prescrit par : {p.doctorName} ({p.clinicName})</span>
                  <span>Date : {p.date}</span>
                </div>
              </div>
              <div className="shrink-0 flex gap-2">
                {p.status === "pending" && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => dispensePrescription(p.id)}>
                    Délivrer le traitement <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
