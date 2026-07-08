import { useState } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Article {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stockQty: number;
  minStock: number;
  unitPrice: number;
  totalValue: number;
  status: "ok" | "low" | "critical";
}

const mockArticles: Article[] = [
  { id: "1", code: "ART001", name: "Rame de papier A4", category: "Fournitures", unit: "Rame", stockQty: 45, minStock: 10, unitPrice: 3500, totalValue: 157500, status: "ok" },
  { id: "2", code: "ART002", name: "Cartouche HP 305", category: "Informatique", unit: "Pièce", stockQty: 3, minStock: 5, unitPrice: 12000, totalValue: 36000, status: "critical" },
  { id: "3", code: "ART003", name: "Stylos Bic (boîte)", category: "Fournitures", unit: "Boîte", stockQty: 8, minStock: 10, unitPrice: 2500, totalValue: 20000, status: "low" },
  { id: "4", code: "ART004", name: "Chemises plastiques", category: "Fournitures", unit: "Paquet", stockQty: 120, minStock: 20, unitPrice: 1500, totalValue: 180000, status: "ok" },
];

export default function GesStock() {
  const [search, setSearch] = useState("");
  const articles = mockArticles.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig = {
    ok: { label: "OK", className: "bg-green-100 text-green-700 border-green-200" },
    low: { label: "Faible", className: "bg-orange-100 text-orange-700 border-orange-200" },
    critical: { label: "Critique", className: "bg-red-100 text-red-700 border-red-200" },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Stocks</h1>
          <p className="text-slate-500 text-sm">Articles, quantités et valorisation</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nouvel Article</Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Articles", value: mockArticles.length, color: "text-blue-600" },
          { label: "Alertes Stock Faible", value: mockArticles.filter(a => a.status === 'low').length, color: "text-orange-500" },
          { label: "Stock Critique", value: mockArticles.filter(a => a.status === 'critical').length, color: "text-red-600" },
        ].map((stat, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Rechercher un article..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filtrer</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>P.U.</TableHead>
                <TableHead>Valeur Totale</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.code}</TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.category}</TableCell>
                  <TableCell>{a.unit}</TableCell>
                  <TableCell>
                    <span className={a.status !== 'ok' ? 'font-bold text-red-600' : ''}>{a.stockQty}</span>
                  </TableCell>
                  <TableCell className="text-slate-400">{a.minStock}</TableCell>
                  <TableCell>{a.unitPrice.toLocaleString()} F</TableCell>
                  <TableCell className="font-semibold">{a.totalValue.toLocaleString()} F</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[a.status].className}>{statusConfig[a.status].label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
