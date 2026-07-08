import { ShoppingCart, TrendingUp, DollarSign, Users, Package, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const kpis = [
  { title: "Ventes du jour", value: "485 000 FCFA", sub: "23 transactions", icon: <DollarSign className="h-5 w-5" />, color: "text-green-600 bg-green-50" },
  { title: "Articles vendus", value: "142", sub: "Références différentes", icon: <Package className="h-5 w-5" />, color: "text-blue-600 bg-blue-50" },
  { title: "Clients servis", value: "38", sub: "Aujourd'hui", icon: <Users className="h-5 w-5" />, color: "text-purple-600 bg-purple-50" },
  { title: "Ticket moyen", value: "12 763 FCFA", sub: "Par client", icon: <TrendingUp className="h-5 w-5" />, color: "text-orange-600 bg-orange-50" },
];

const recentSales = [
  { id: "V001", client: "Client comptant", items: 3, total: "15 500", time: "13:22", method: "Espèces" },
  { id: "V002", client: "Marie Dupont", items: 1, total: "8 000", time: "12:45", method: "Mobile Money" },
  { id: "V003", client: "Client comptant", items: 5, total: "42 300", time: "11:30", method: "Espèces" },
  { id: "V004", client: "Jean Makolo", items: 2, total: "21 000", time: "10:15", method: "Carte" },
];

export default function CaisseDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord — Caisse</h1>
          <p className="text-slate-500 text-sm">Activité commerciale du jour</p>
        </div>
        <Button className="gap-2"><ShoppingCart className="h-4 w-4" /> Nouvelle Vente</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>{kpi.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{kpi.title}</p>
                  <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                  <p className="text-xs text-slate-400">{kpi.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Dernières Ventes</h2>
          <Button variant="link" size="sm" className="text-blue-600">Voir tout</Button>
        </div>
        <div className="divide-y divide-slate-100">
          {recentSales.map(s => (
            <div key={s.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="font-medium text-slate-800">{s.client}</p>
                <p className="text-xs text-slate-400">{s.items} article(s) · {s.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{s.method}</Badge>
                <span className="font-bold text-slate-900">{s.total} F</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
