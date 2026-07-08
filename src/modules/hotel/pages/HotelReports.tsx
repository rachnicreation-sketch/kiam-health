import { Download, TrendingUp, BedDouble, Users, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stats = [
  { label: "CA du mois", value: "8 450 000 FCFA", trend: "+12%" },
  { label: "Séjours ce mois", value: "47", trend: "+5%" },
  { label: "Taux d'occupation", value: "68%", trend: "+3%" },
  { label: "Durée moyenne séjour", value: "2.4 nuits", trend: "" },
];

const monthly = [
  { month: "Jan", revenue: "5 200 000", nights: 31, occ: 55 },
  { month: "Fév", revenue: "4 800 000", nights: 28, occ: 48 },
  { month: "Mar", revenue: "6 100 000", nights: 35, occ: 62 },
  { month: "Avr", revenue: "7 300 000", nights: 42, occ: 70 },
  { month: "Mai", revenue: "8 100 000", nights: 48, occ: 74 },
  { month: "Jun", revenue: "7 900 000", nights: 45, occ: 72 },
];

export default function HotelReports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports Hôtel</h1>
          <p className="text-slate-500 text-sm">Analyse des performances et de l'occupation</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exporter</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i}><CardContent className="pt-6">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
            {s.trend && <p className={`text-xs font-medium mt-1 ${s.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{s.trend}</p>}
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-blue-600" /> Evolution mensuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monthly.map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 w-8">{m.month}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${m.occ}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-16 text-right">{m.occ}% occupé</span>
                <span className="text-sm font-bold text-slate-800 w-36 text-right">{m.revenue} F</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
