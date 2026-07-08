import { useState } from "react";
import {
  Package, Search, Plus, Filter, ArrowRightLeft,
  CheckCircle2, AlertCircle, TrendingUp, Download, Landmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";

interface Warehouse {
  id: string;
  name: string;
  location: string;
  totalValue: number;
  itemsCount: number;
}

interface Transfer {
  id: string;
  from: string;
  to: string;
  product: string;
  qty: number;
  date: string;
  status: "pending" | "completed";
}

const MOCK_WAREHOUSES: Warehouse[] = [
  { id: "W001", name: "Dépôt Central Dakar", location: "Zone Industrielle", totalValue: 85000000, itemsCount: 420 },
  { id: "W002", name: "Dépôt Abidjan Port", location: "Zone Portuaire", totalValue: 42000000, itemsCount: 180 },
];

const MOCK_TRANSFERS: Transfer[] = [
  { id: "TR-001", from: "Dépôt Central Dakar", to: "Dépôt Abidjan Port", product: "Ordinateur Portable Kiam Book", qty: 10, date: "2026-07-06", status: "completed" },
  { id: "TR-002", from: "Dépôt Central Dakar", to: "Dépôt Abidjan Port", product: "Souris Sans Fil Ergonomique", qty: 50, date: "2026-07-07", status: "pending" },
];

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function MultiWarehouse() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [transfers, setTransfers] = useState<Transfer[]>(MOCK_TRANSFERS);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [form, setForm] = useState({ from: "W001", to: "W002", product: "", qty: "" });

  const handleAddTransfer = () => {
    if (!form.product || !form.qty) return;
    const newTr: Transfer = {
      id: `TR-${String(transfers.length + 1).padStart(3, "0")}`,
      from: warehouses.find(w => w.id === form.from)?.name || "",
      to: warehouses.find(w => w.id === form.to)?.name || "",
      product: form.product,
      qty: Number(form.qty),
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setTransfers([newTr, ...transfers]);
    setIsTransferOpen(false);
    setForm({ from: "W001", to: "W002", product: "", qty: "" });
    toast({ title: "Transfert inter-dépôts programmé" });
  };

  const completeTransfer = (id: string) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: "completed" } : t));
    toast({ title: "Transfert réceptionné", description: "Les stocks des dépôts ont été ajustés." });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Package className="h-7 w-7 text-purple-600" /> Multi-Dépôts & Logistique
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Valorisation des stocks par dépôt et gestion des transferts inter-entrepôts.</p>
        </div>
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-200">
              <ArrowRightLeft className="h-4 w-4" /> Nouveau Transfert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer un transfert de stock</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Source</Label>
                  <Select value={form.from} onValueChange={v => setForm({ ...form, from: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destination</Label>
                  <Select value={form.to} onValueChange={v => setForm({ ...form, to: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Produit</Label>
                <Input className="mt-1" placeholder="Nom ou référence produit" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Quantité</Label>
                <Input className="mt-1" type="number" placeholder="0" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAddTransfer}>
                Lancer le transfert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Entrepôts" value={String(warehouses.length)} icon={Package} iconClassName="bg-purple-100 text-purple-600" />
        <StatCard title="Valeur globale stock" value={fmt(warehouses.reduce((s, w) => s + w.totalValue, 0))} icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Transferts en cours" value={String(transfers.filter(t => t.status === "pending").length)} icon={Clock} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Articles référencés" value="600" icon={Package} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <Tabs defaultValue="warehouses">
        <TabsList className="bg-slate-50 border border-slate-200">
          <TabsTrigger value="warehouses">Dépôts Physiques</TabsTrigger>
          <TabsTrigger value="transfers">Historique Transferts</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map(w => (
            <Card key={w.id} className="border-none shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-base">{w.name}</h3>
                  <p className="text-xs text-muted-foreground">{w.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <p className="text-lg font-black text-slate-800">{w.itemsCount}</p>
                    <p className="text-[10px] text-muted-foreground">Articles</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <p className="text-sm font-black text-purple-800">{fmt(w.totalValue)}</p>
                    <p className="text-[10px] text-muted-foreground">Valeur</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-6 py-3">Produit</th>
                      <th className="px-6 py-3">Source</th>
                      <th className="px-6 py-3">Destination</th>
                      <th className="px-6 py-3 text-right">Quantité</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transfers.map(tr => (
                      <tr key={tr.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold">{tr.product}</td>
                        <td className="px-6 py-4 text-xs">{tr.from}</td>
                        <td className="px-6 py-4 text-xs">{tr.to}</td>
                        <td className="px-6 py-4 text-right">{tr.qty}</td>
                        <td className="px-6 py-4 text-xs">{tr.date}</td>
                        <td className="px-6 py-4">
                          <Badge className={`text-[10px] ${tr.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                            {tr.status === "completed" ? "Terminé" : "En cours"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {tr.status === "pending" && (
                            <Button size="xs" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7" onClick={() => completeTransfer(tr.id)}>
                              Réceptionner
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
