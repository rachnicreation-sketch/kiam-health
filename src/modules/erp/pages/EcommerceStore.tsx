import { useState } from "react";
import {
  ShoppingBag, Search, Plus, Filter, Globe, Eye,
  RefreshCw, CheckCircle2, AlertCircle, Trash2, ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface WebProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: "published" | "draft" | "out_of_stock";
  salesCount: number;
}

const MOCK_PRODUCTS: WebProduct[] = [
  { id: "WP001", name: "Ordinateur Portable Kiam Book", price: 450000, stock: 15, status: "published", salesCount: 42 },
  { id: "WP002", name: "Souris Sans Fil Ergonomique", price: 15000, stock: 120, status: "published", salesCount: 150 },
  { id: "WP003", name: "Clavier Mécanique Rétro-éclairé", price: 35000, stock: 0, status: "out_of_stock", salesCount: 78 },
  { id: "WP004", name: "Écran PC 27 Pouces 4K", price: 180000, stock: 8, status: "draft", salesCount: 0 },
];

const statusCfg = {
  published:    { label: "En ligne", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  draft:        { label: "Brouillon", color: "bg-slate-100 text-slate-500 border-slate-200" },
  out_of_stock: { label: "Rupture", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function EcommerceStore() {
  const { toast } = useToast();
  const [products, setProducts] = useState<WebProduct[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");

  const toggleStatus = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next: WebProduct["status"] = p.status === "published" ? "draft" : "published";
      return { ...p, status: next };
    }));
    toast({ title: "Statut de publication mis à jour" });
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Globe className="h-7 w-7 text-purple-600" /> Boutique E-Commerce
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gérer le catalogue d'articles synchronisé avec votre stock physique en ligne.</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-200"
          onClick={() => toast({ title: "Bientôt disponible", description: "L'ouverture de la boutique publique sera disponible prochainement." })}>
          <ArrowUpRight className="h-4 w-4" /> Voir le site public
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Articles E-commerce" value={String(products.length)} icon={ShoppingBag} iconClassName="bg-purple-100 text-purple-600" />
        <StatCard title="Ventes en ligne (Mois)" value="24" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="CA E-Commerce" value="1.8M CFA" icon={ShoppingBag} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Visites uniques" value="1 248" change="+12% ce mois" changeType="positive" icon={Globe} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un produit en ligne..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(p => {
              const cfg = statusCfg[p.status];
              return (
                <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      <Badge className={`text-[10px] h-4 border ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Prix : {fmt(p.price)} · Stock Kiam : {p.stock} unités</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-4 hidden sm:block">
                      <p className="font-bold text-xs">{p.salesCount} ventes</p>
                      <p className="text-[10px] text-muted-foreground">en ligne</p>
                    </div>
                    <Button size="xs" variant="outline" className="h-7 text-xs" onClick={() => toggleStatus(p.id)}>
                      {p.status === "published" ? "Désactiver" : "Mettre en ligne"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
