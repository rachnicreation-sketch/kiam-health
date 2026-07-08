import { useState } from "react";
import { ArrowUp, ArrowDown, RefreshCw, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const movements = [
  { id: "1", type: "in", article: "Rame A4", qty: 100, ref: "BL-2026-001", date: "2026-07-01 09:12", by: "admin" },
  { id: "2", type: "out", article: "Cartouche HP", qty: 2, ref: "SOT-2026-010", date: "2026-07-01 11:30", by: "admin" },
  { id: "3", type: "adjustment", article: "Stylos Bic", qty: -5, ref: "INV-2026-003", date: "2026-06-30 15:00", by: "admin" },
  { id: "4", type: "in", article: "Chemises plastiques", qty: 200, ref: "BL-2026-002", date: "2026-06-29 08:45", by: "admin" },
];

const typeConfig = {
  in: { label: "Entrée", icon: <ArrowUp className="h-3.5 w-3.5" />, cls: "bg-green-100 text-green-700" },
  out: { label: "Sortie", icon: <ArrowDown className="h-3.5 w-3.5" />, cls: "bg-red-100 text-red-700" },
  adjustment: { label: "Ajustement", icon: <RefreshCw className="h-3.5 w-3.5" />, cls: "bg-orange-100 text-orange-700" },
};

export default function GesMovements() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = movements.filter(m => {
    const matchSearch = m.article.toLowerCase().includes(search.toLowerCase()) || m.ref.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || m.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mouvements de Stock</h1>
          <p className="text-slate-500 text-sm">Historique des entrées, sorties et ajustements</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nouveau Mouvement</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="in">Entrées</SelectItem>
                <SelectItem value="out">Sorties</SelectItem>
                <SelectItem value="adjustment">Ajustements</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {filtered.map(m => {
              const cfg = typeConfig[m.type as keyof typeof typeConfig];
              return (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`${cfg.cls} gap-1`}>{cfg.icon}{cfg.label}</Badge>
                    <div>
                      <p className="font-medium text-slate-800">{m.article}</p>
                      <p className="text-xs text-slate-400">Réf: {m.ref} · {m.date} · par {m.by}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${m.qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.qty > 0 ? '+' : ''}{m.qty}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
