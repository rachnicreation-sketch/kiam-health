import { useState } from "react";
import {
  Coffee, Search, Plus, Filter, Users, CheckCircle2,
  AlertCircle, DollarSign, Clock, CreditCard, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CanteenSubscription {
  id: string;
  studentName: string;
  className: string;
  type: "Forfait Mensuel" | "Ticket unitaire";
  balance: number; // tickets restants ou statut paiement
  status: "active" | "inactive";
}

const MOCK_SUBS: CanteenSubscription[] = [
  { id: "CAN-001", studentName: "Mariama Diallo", className: "CM2-A", type: "Forfait Mensuel", balance: 0, status: "active" },
  { id: "CAN-002", studentName: "Moustapha Ndiaye", className: "6ème B", type: "Ticket unitaire", balance: 8, status: "active" },
  { id: "CAN-003", studentName: "Fatou Diome", className: "3ème A", type: "Forfait Mensuel", balance: 0, status: "inactive" },
];

export default function Canteen() {
  const { toast } = useToast();
  const [subs, setSubs] = useState<CanteenSubscription[]>(MOCK_SUBS);
  const [search, setSearch] = useState("");

  const consumeMeal = (id: string) => {
    setSubs(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (s.type === "Ticket unitaire" && s.balance <= 0) {
        toast({ variant: "destructive", title: "Solde insuffisant", description: "Le ticket n'a pas pu être débité." });
        return s;
      }
      const newBal = s.type === "Ticket unitaire" ? s.balance - 1 : 0;
      toast({ title: "Repas enregistré", description: `Bon appétit à ${s.studentName}` });
      return { ...s, balance: newBal };
    }));
  };

  const filtered = subs.filter(s => s.studentName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Coffee className="h-7 w-7 text-amber-600" /> Cantine & Restauration Scolaire
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Suivi des abonnements, badgeage au réfectoire et débits de repas.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Élèves inscrits" value={String(subs.filter(s => s.status === "active").length)} icon={Users} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Repas servis (Jour)" value="142" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Abonnements impayés" value="1" icon={AlertCircle} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Forfaits mensuels" value={String(subs.filter(s => s.type === "Forfait Mensuel").length)} icon={CreditCard} iconClassName="bg-blue-100 text-blue-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un élève inscrit à la cantine..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{s.studentName}</p>
                    <Badge variant="outline">{s.className}</Badge>
                    <Badge className={`text-[10px] h-4 ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.status === "active" ? "Actif" : "Suspendu"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Type : {s.type} {s.type === "Ticket unitaire" && `· Tickets : ${s.balance}`}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button size="xs" variant={s.status === "active" ? "default" : "outline"} className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={s.status !== "active"} onClick={() => consumeMeal(s.id)}>
                    Enregistrer Repas
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
