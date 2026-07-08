import { Download, BarChart3, TrendingUp, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stats = [
  { label: "CA du mois", value: "3 850 000 FCFA", trend: "+8%" },
  { label: "Transactions", value: "423", trend: "+15%" },
  { label: "Ticket moyen", value: "9 100 FCFA", trend: "-2%" },
  { label: "Espèces reçues", value: "2 140 000 FCFA", trend: "" },
];

const dailySales = [
  { date: "2026-07-01", transactions: 23, total: "485 000" },
  { date: "2026-06-30", transactions: 18, total: "312 500" },
  { date: "2026-06-29", transactions: 31, total: "624 000" },
  { date: "2026-06-28", transactions: 15, total: "228 000" },
  { date: "2026-06-27", transactions: 27, total: "512 300" },
];

export default function CaisseReports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports de Caisse</h1>
          <p className="text-slate-500 text-sm">Statistiques des ventes et transactions</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
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
            {s.trend && <p className={`text-xs font-medium mt-1 ${s.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{s.trend} vs période préc.</p>}
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-blue-600" /> Ventes Journalières
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailySales.map((d, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50">
                <span className="text-sm text-slate-500 w-28">{d.date}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(d.transactions / 35) * 100}%` }} />
                </div>
                <span className="text-sm text-slate-600 w-20 text-right">{d.transactions} ventes</span>
                <span className="text-sm font-bold text-slate-900 w-32 text-right">{d.total} F</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
