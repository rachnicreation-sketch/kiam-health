import { useState } from "react";
import {
  AlertTriangle, Search, Plus, Filter, CheckCircle2,
  AlertCircle, DollarSign, Clock, ShieldAlert, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ExpiringLot {
  id: string;
  medicationName: string;
  lotNumber: string;
  expiryDate: string;
  stock: number;
  status: "critical" | "warning" | "safe";
}

const MOCK_LOTS: ExpiringLot[] = [
  { id: "LOT-001", medicationName: "Paracétamol 500mg", lotNumber: "LT-2291", expiryDate: "2026-08-15", stock: 150, status: "critical" },
  { id: "LOT-002", medicationName: "Amoxicilline 1g", lotNumber: "LT-8812", expiryDate: "2026-10-30", stock: 45, status: "warning" },
  { id: "LOT-003", medicationName: "Ibuprofène 400mg", lotNumber: "LT-4421", expiryDate: "2027-05-12", stock: 200, status: "safe" },
];

export default function ExpiryAlerts() {
  const { toast } = useState();
  const [lots, setLots] = useState<ExpiringLot[]>(MOCK_LOTS);
  const [search, setSearch] = useState("");

  const markWasted = (id: string) => {
    setLots(prev => prev.filter(l => l.id !== id));
    // Simulated toast trigger
    alert("Lot retiré du stock (Périmé / Jeté).");
  };

  const filtered = lots.filter(l => l.medicationName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-emerald-600" /> Alertes Péremption
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Surveillance des dates d'expiration des lots de médicaments en stock.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Lots critiques (<30j)" value={String(lots.filter(l => l.status === "critical").length)} icon={AlertTriangle} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Lots sous surveillance" value={String(lots.filter(l => l.status === "warning").length)} icon={AlertCircle} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Boites concernées" value="195" icon={ShieldAlert} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Statut réglementaire" value="Conforme" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un médicament ou lot..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(lot => (
              <div key={lot.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{lot.medicationName}</p>
                    <Badge variant="outline">Lot : {lot.lotNumber}</Badge>
                    <Badge className={`text-[10px] h-4 ${lot.status === "critical" ? "bg-rose-100 text-rose-700" : lot.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {lot.status === "critical" ? "Périme bientôt" : lot.status === "warning" ? "Surveillance" : "Sûr"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Date d'expiration : {lot.expiryDate} · Stock : {lot.stock} unités</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button size="xs" variant="destructive" className="h-7 text-xs bg-rose-600 hover:bg-rose-700" onClick={() => markWasted(lot.id)}>
                    Retirer du stock
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
