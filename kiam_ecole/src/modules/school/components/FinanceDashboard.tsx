import { 
  Receipt, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  AlertTriangle,
  CreditCard
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FinanceDashboard({ stats }: { stats: any; user: any }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            Tableau de Bord Finance
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion des encaissements et suivi de la trésorerie scolaire.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl">
            <CreditCard className="w-4 h-4" /> Nouvel Encaissement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Recettes (Mois)" value="4.2M CFA" change="+8%" changeType="positive" icon={ArrowUpRight} />
        <StatCard title="Paiements Scolarité" value="85%" change="Taux de recouvrement" changeType="neutral" icon={Receipt} iconClassName="bg-sky-100 text-sky-600" />
        <StatCard title="Restes à Recouvrer" value="1.25M CFA" change="Critique" changeType="negative" icon={AlertTriangle} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Charges & Salaires" value="2.8M CFA" change="Prévu" changeType="neutral" icon={ArrowDownRight} iconClassName="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Derniers Paiements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">#</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Élève ID: ST-00{i}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tranche 1 • Scolarité</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">+125.000 CFA</p>
                    <p className="text-[10px] text-slate-400">Aujourd'hui, 09:4{i}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full h-12 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600">
              Consulter tout l'historique
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Élèves Débiteurs</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[
              { name: "Mabiala Jean", amount: "75.000", level: "3ème" },
              { name: "Okombi Sarah", amount: "120.000", level: "6ème" },
              { name: "Ngouabi Moise", amount: "45.000", level: "4ème" },
            ].map((debtor, idx) => (
              <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-black uppercase tracking-wide">{debtor.name}</span>
                  <Badge className="bg-rose-500 border-none text-[10px]">{debtor.level}</Badge>
                </div>
                <div className="text-xl font-black text-rose-400">{debtor.amount} CFA</div>
              </div>
            ))}
            <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl mt-4">
              Générer Relances
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
