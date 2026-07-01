import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  AlertCircle,
  FileText,
  DollarSign,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AccountantDashboardProps {
  stats: any;
  user: any;
}

export function AccountantDashboard({ stats, user }: AccountantDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Gestion Comptable
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Contrôle des flux financiers et recouvrement.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2" onClick={() => navigate('/school/payments')}>
            <Plus className="w-4 h-4" /> Enregistrer Paiement
          </Button>
          <Button variant="outline" className="font-bold gap-2">
            <FileText className="w-4 h-4" /> Rapport Financier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Recettes Totales" value={`${Number(stats.revenue || 0).toLocaleString()} CFA`} icon={TrendingUp} className="bg-white" />
        <StatCard title="Restes à Payer" value="450.000 CFA" changeType="negative" icon={AlertCircle} className="bg-white" />
        <StatCard title="Taux de Recouvrement" value="82%" changeType="positive" icon={TrendingUp} className="bg-white" />
        <StatCard title="Paiements Jour" value="8" icon={CreditCard} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Flux de Trésorerie</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
             <p className="text-sm text-muted-foreground italic">Graphique des revenus par mois (en attente de données historiques)...</p>
             <div className="h-[200px] bg-slate-50 rounded-lg mt-4 border-2 border-dashed flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-slate-300" />
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Élèves Débiteurs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y">
                <div className="p-4 flex justify-between items-center">
                   <div>
                      <p className="text-sm font-bold">MABIALA Jean</p>
                      <p className="text-[10px] text-rose-600 font-bold">Dette: 25.000 CFA</p>
                   </div>
                   <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-xs">Relancer</Button>
                </div>
                <div className="p-4 flex justify-between items-center">
                   <div>
                      <p className="text-sm font-bold">NGOUABI Marie</p>
                      <p className="text-[10px] text-rose-600 font-bold">Dette: 15.000 CFA</p>
                   </div>
                   <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-xs">Relancer</Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

