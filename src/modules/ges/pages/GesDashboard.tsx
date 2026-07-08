import { useState, useEffect } from "react";
import { Package, TrendingUp, AlertTriangle, BarChart3, ArrowUpDown, Truck, ClipboardList, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface KpiCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

export default function GesDashboard() {
  const [kpis] = useState<KpiCard[]>([
    { title: "Valeur du Stock", value: "2 450 000 FCFA", subtitle: "Stocks actifs valorisés", icon: <Package className="h-6 w-6" />, color: "text-blue-600" },
    { title: "Articles en Stock", value: "1 247", subtitle: "Références actives", icon: <ClipboardList className="h-6 w-6" />, color: "text-green-600" },
    { title: "Alertes Stock Faible", value: "23", subtitle: "Sous le seuil minimum", icon: <AlertTriangle className="h-6 w-6" />, color: "text-orange-500" },
    { title: "Mouvements ce mois", value: "342", subtitle: "Entrées et sorties", icon: <ArrowUpDown className="h-6 w-6" />, color: "text-purple-600" },
  ]);

  const recentMovements = [
    { id: "1", type: "Entrée", article: "Cartouche HP 305", qty: 50, date: "2026-07-01", status: "Validé" },
    { id: "2", type: "Sortie", article: "Rame de papier A4", qty: 10, date: "2026-07-01", status: "Validé" },
    { id: "3", type: "Ajustement", article: "Stylos Bic", qty: -5, date: "2026-06-30", status: "Validé" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord — Gestion des Stocks</h1>
          <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de votre inventaire</p>
        </div>
        <Button className="gap-2"><Package className="h-4 w-4" /> Nouveau Mouvement</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-100 ${kpi.color}`}>{kpi.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{kpi.title}</p>
                  <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                  <p className="text-xs text-slate-400">{kpi.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-blue-600" />
            Mouvements Récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentMovements.map(m => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">{m.article}</p>
                  <p className="text-xs text-slate-400">{m.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${m.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.qty > 0 ? '+' : ''}{m.qty}
                  </span>
                  <Badge variant="outline" className={
                    m.type === 'Entrée' ? 'border-green-300 text-green-700' :
                    m.type === 'Sortie' ? 'border-red-300 text-red-700' :
                    'border-orange-300 text-orange-700'
                  }>{m.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
