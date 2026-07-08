import { useState } from "react";
import {
  Building2, TrendingUp, BedDouble, Users, Globe,
  BarChart3, ArrowUpRight, MapPin, Star, Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

interface Property {
  id: string;
  name: string;
  city: string;
  country: string;
  totalRooms: number;
  occupied: number;
  revenue: number;
  rating: number;
  status: "open" | "closed" | "renovation";
}

const PROPERTIES: Property[] = [
  { id: "p1", name: "Kiam Grand Hôtel Dakar", city: "Dakar", country: "Sénégal", totalRooms: 48, occupied: 34, revenue: 12500000, rating: 4.7, status: "open" },
  { id: "p2", name: "Kiam Boutique Abidjan", city: "Abidjan", country: "Côte d'Ivoire", totalRooms: 24, occupied: 18, revenue: 8200000, rating: 4.5, status: "open" },
  { id: "p3", name: "Kiam Résidence Douala", city: "Douala", country: "Cameroun", totalRooms: 32, occupied: 14, revenue: 4800000, rating: 4.2, status: "open" },
  { id: "p4", name: "Kiam Resort Bamako", city: "Bamako", country: "Mali", totalRooms: 20, occupied: 0, revenue: 0, rating: 0, status: "renovation" },
];

const revenueData = [
  { month: "Jan", Dakar: 9200000, Abidjan: 5800000, Douala: 3200000 },
  { month: "Fév", Dakar: 10100000, Abidjan: 6400000, Douala: 3800000 },
  { month: "Mar", Dakar: 11500000, Abidjan: 7200000, Douala: 4100000 },
  { month: "Avr", Dakar: 10800000, Abidjan: 6900000, Douala: 3900000 },
  { month: "Mai", Dakar: 12200000, Abidjan: 7800000, Douala: 4500000 },
  { month: "Jun", Dakar: 12500000, Abidjan: 8200000, Douala: 4800000 },
];

const statusCfg = {
  open:       { label: "Ouvert",     color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed:     { label: "Fermé",      color: "bg-slate-100 text-slate-500 border-slate-200" },
  renovation: { label: "Travaux",    color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function MultiProperty() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Property | null>(null);

  const openProps = PROPERTIES.filter(p => p.status === "open");
  const totalRooms = openProps.reduce((s, p) => s + p.totalRooms, 0);
  const totalOccupied = openProps.reduce((s, p) => s + p.occupied, 0);
  const totalRevenue = openProps.reduce((s, p) => s + p.revenue, 0);
  const globalOccupancy = Math.round((totalOccupied / totalRooms) * 100);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-pink-600" /> Multi-Établissements
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Vue consolidée du groupe hôtelier — {PROPERTIES.length} établissements.</p>
        </div>
        <Button className="gap-2 bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200"
          onClick={() => toast({ title: "Bientôt disponible", description: "L'ajout d'établissement sera disponible prochainement." })}>
          <Building2 className="h-4 w-4" /> Ajouter un établissement
        </Button>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Établissements actifs" value={`${openProps.length}/${PROPERTIES.length}`} icon={Building2} iconClassName="bg-pink-100 text-pink-600" />
        <StatCard title="Occupation globale" value={`${globalOccupancy}%`} change={`${totalOccupied}/${totalRooms} chambres`} changeType="positive" icon={BedDouble} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Revenu consolidé" value={fmt(totalRevenue)} change="Ce mois-ci" changeType="positive" icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Clients total" value="1 248" change="+12% vs M-1" changeType="positive" icon={Users} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      {/* Property Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROPERTIES.map(prop => {
          const occ = prop.totalRooms > 0 ? Math.round((prop.occupied / prop.totalRooms) * 100) : 0;
          const cfg = statusCfg[prop.status];
          return (
            <Card key={prop.id} className={`border-none shadow-md hover:shadow-xl transition-all cursor-pointer ${selected?.id === prop.id ? "ring-2 ring-pink-400" : ""}`}
              onClick={() => setSelected(prop === selected ? null : prop)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-base">{prop.name}</p>
                      <Badge className={`text-[10px] border ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {prop.city}, {prop.country}
                    </p>
                  </div>
                  {prop.rating > 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span className="font-black text-sm">{prop.rating}</span>
                    </div>
                  )}
                </div>

                {prop.status === "open" ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center bg-slate-50 rounded-xl p-2">
                        <p className="text-lg font-black text-slate-900">{prop.totalRooms}</p>
                        <p className="text-[10px] text-muted-foreground">Chambres</p>
                      </div>
                      <div className="text-center bg-pink-50 rounded-xl p-2">
                        <p className="text-lg font-black text-pink-700">{occ}%</p>
                        <p className="text-[10px] text-muted-foreground">Occupation</p>
                      </div>
                      <div className="text-center bg-emerald-50 rounded-xl p-2">
                        <p className="text-sm font-black text-emerald-700">{new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(prop.revenue)}</p>
                        <p className="text-[10px] text-muted-foreground">CA (CFA)</p>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{prop.occupied} occupées</span>
                        <span>{prop.totalRooms - prop.occupied} libres</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-700"
                          style={{ width: `${occ}%` }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <div className="text-center">
                      <Settings className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Établissement en {cfg.label.toLowerCase()}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs">
                    <Globe className="h-3 w-3" /> Voir détails
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <ArrowUpRight className="h-3 w-3" /> Gérer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Consolidated Revenue Chart */}
      <Card className="border-none shadow-md">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-pink-600" /> Revenus consolidés par établissement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold", fill: "#9499AE" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9499AE" }}
                tickFormatter={v => `${Math.round(v / 1000000)}M`} />
              <Tooltip formatter={(v: any) => fmt(v)} />
              <Bar dataKey="Dakar" fill="#ec4899" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Abidjan" fill="#f472b6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Douala" fill="#fda4af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
