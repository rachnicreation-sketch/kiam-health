import { BarChart3, TrendingUp, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const reportData = [
  { label: "Valeur totale du stock", value: "2 450 000 FCFA", trend: "+5%" },
  { label: "Entrées ce mois", value: "350 unités", trend: "+12%" },
  { label: "Sorties ce mois", value: "198 unités", trend: "-3%" },
  { label: "Taux de rotation", value: "2.8x", trend: "+0.3x" },
];

const topArticles = [
  { name: "Rame de papier A4", qty: 450, value: "1 575 000" },
  { name: "Chemises plastiques", qty: 120, value: "180 000" },
  { name: "Stylos Bic (boîte)", qty: 8, value: "20 000" },
  { name: "Cartouche HP 305", qty: 3, value: "36 000" },
];

export default function GesReports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports & Analyses</h1>
          <p className="text-slate-500 text-sm">Statistiques de votre gestion des stocks</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exporter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportData.map((r, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500">{r.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{r.value}</p>
              <p className="text-xs text-green-600 font-medium mt-1">{r.trend} vs mois dernier</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Top Articles par Valeur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topArticles.map((a, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                  <span className="font-medium text-slate-800">{a.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{a.qty} unités</span>
                  <span className="font-semibold text-slate-900">{a.value} F</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
