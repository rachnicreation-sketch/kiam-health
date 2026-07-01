import { 
  ShoppingCart, 
  History, 
  AlertCircle,
  Plus,
  CreditCard,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ErpPosDashboardProps {
  stats: any;
  user: any;
}

export function ErpPosDashboard({ stats, user }: ErpPosDashboardProps) {
  const navigate = useNavigate();

  const recentTransactions = [
    { id: "TX-901", items: "3 articles", amount: "12,500 CFA", time: "Il y a 10 min", method: "Cash" },
    { id: "TX-902", items: "1 article", amount: "4,200 CFA", time: "Il y a 25 min", method: "OM/Momo" },
    { id: "TX-903", items: "5 articles", amount: "45,000 CFA", time: "Il y a 1h", method: "Card" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" /> Espace Caisse
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Session active pour {user?.name}. Encaissement rapide.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold h-12 gap-2 text-white shadow-xl shadow-emerald-100 rounded-2xl px-8" onClick={() => navigate('/erp/pos')}>
            <ShoppingCart className="w-5 h-5" /> NOUVELLE VENTE (POS)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mes Ventes (Jour)" value={`${Number(stats.today_revenue || 0).toLocaleString()} CFA`} change="Objectif: 1M" icon={CreditCard} className="bg-white" />
        <StatCard title="Transactions" value="12" icon={History} className="bg-white" />
        <StatCard title="Articles Vendus" value="48" icon={ShoppingCart} className="bg-white" />
        <StatCard title="Alertes Stock" value={stats.low_stock || 0} change="Signaler" changeType="negative" icon={AlertCircle} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
             <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Mes Dernières Transactions</CardTitle>
                <Button variant="ghost" className="text-xs font-bold text-sky-600" onClick={() => navigate('/erp/transactions')}>Voir tout</Button>
             </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y">
                {recentTransactions.map((tx) => (
                   <div key={tx.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-emerald-600" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900">{tx.id}</p>
                            <p className="text-xs text-slate-500">{tx.items} • {tx.method}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-emerald-600 mb-1">{tx.amount}</p>
                         <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{tx.time}</p>
                      </div>
                   </div>
                ))}
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden rounded-[2.5rem] relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Zap className="h-32 w-32" />
          </div>
          <CardHeader className="p-8 pb-4">
             <CardTitle className="text-xl font-black">Mode Rapide</CardTitle>
             <CardDescription className="text-slate-400">Scanner ou entrer le matricule du produit</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
             <div className="space-y-4">
                <div className="h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center px-4 gap-3 focus-within:ring-2 ring-emerald-500 transition-all">
                   <Plus className="h-5 w-5 text-emerald-400" />
                   <input 
                      type="text" 
                      placeholder="SKU / Code Barre..." 
                      className="bg-transparent border-none outline-none text-white w-full font-mono placeholder:text-slate-600"
                   />
                </div>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-950/20">
                   AJOUTER AU PANIER
                </Button>
             </div>
             <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Raccourci Clavier: F2</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
