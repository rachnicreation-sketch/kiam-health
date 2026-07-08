import { useState } from "react";
import {
  Truck, Search, Plus, Filter, Navigation, CheckCircle2,
  AlertCircle, Users, Clock, MapPin, Bus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TransportRoute {
  id: string;
  name: string;
  driver: string;
  busNumber: string;
  capacity: number;
  studentsRegistered: number;
  status: "active" | "inactive";
}

const MOCK_ROUTES: TransportRoute[] = [
  { id: "TRP-001", name: "Circuit Nord - Almadies", driver: "M. Ndiaye", busNumber: "DK-0918-A", capacity: 40, studentsRegistered: 34, status: "active" },
  { id: "TRP-002", name: "Circuit Est - Plateau", driver: "M. Diop", busNumber: "DK-1282-B", capacity: 30, studentsRegistered: 28, status: "active" },
];

export default function SchoolTransport() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<TransportRoute[]>(MOCK_ROUTES);
  const [search, setSearch] = useState("");

  const filtered = routes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Bus className="h-7 w-7 text-amber-600" /> Transport Scolaire
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion des circuits de bus, affectation des élèves et suivi des chauffeurs.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Bus Scolaires" value={String(routes.length)} icon={Bus} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Élèves Transportés" value={String(routes.reduce((s, r) => s + r.studentsRegistered, 0))} icon={Users} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Capacité Totale" value="70" icon={Navigation} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Taux d'utilisation" value="88%" icon={CheckCircle2} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un circuit de transport..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(route => (
          <Card key={route.id} className="border-none shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base">{route.name}</h3>
                  <p className="text-xs text-muted-foreground">Véhicule : {route.busNumber}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">En service</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="font-bold">{route.driver}</p>
                  <p className="text-muted-foreground">Chauffeur</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg">
                  <p className="font-bold">{route.studentsRegistered} / {route.capacity}</p>
                  <p className="text-muted-foreground">Élèves inscrits</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs gap-1"
                onClick={() => toast({ title: "Circuit en cours", description: "Position GPS émulée : Route de Ouakam." })}>
                <Navigation className="w-3.5 h-3.5" /> Suivre le bus (GPS)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
