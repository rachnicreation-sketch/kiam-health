import { useState } from "react";
import {
  Globe, Search, Plus, Filter, ArrowRightLeft, CheckCircle2,
  AlertCircle, DollarSign, Clock, Building2, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/hooks/use-toast";

interface PharmacySite {
  id: string;
  name: string;
  location: string;
  stockValue: number;
  salesToday: number;
}

const MOCK_SITES: PharmacySite[] = [
  { id: "PH-001", name: "Pharmacie Principale Kiam", location: "Plateau, Dakar", stockValue: 45000000, salesToday: 1850000 },
  { id: "PH-002", name: "Pharmacie Kiam Almadies", location: "Almadies, Dakar", stockValue: 28000000, salesToday: 950000 },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function MultiPharmacy() {
  const { toast } = useToast();
  const [sites] = useState<PharmacySite[]>(MOCK_SITES);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Globe className="h-7 w-7 text-emerald-600" /> Multi-Officines
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Vue consolidée du réseau de pharmacies, transferts de stocks inter-officines et CA consolidé.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Officines du réseau" value={String(sites.length)} icon={Building2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Stock global" value={fmt(sites.reduce((s, x) => s + x.stockValue, 0))} icon={Package} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="CA consolidé (Jour)" value={fmt(sites.reduce((s, x) => s + x.salesToday, 0))} icon={DollarSign} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Transferts en cours" value="1" icon={ArrowRightLeft} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map(site => (
          <Card key={site.id} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base">{site.name}</h3>
                  <p className="text-xs text-muted-foreground">{site.location}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">En ligne</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <p className="font-bold text-slate-800">{fmt(site.stockValue)}</p>
                  <p className="text-muted-foreground">Valeur Stock</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg">
                  <p className="font-bold text-emerald-800">{fmt(site.salesToday)}</p>
                  <p className="text-muted-foreground">Ventes aujourd'hui</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs gap-1"
                  onClick={() => toast({ title: "Accès officine", description: `Reconnexion au tableau de bord local de ${site.name}.` })}>
                  <Building2 className="w-3.5 h-3.5" /> Gérer cette officine
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
