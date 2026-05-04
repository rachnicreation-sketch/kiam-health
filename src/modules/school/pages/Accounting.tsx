import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";

export default function Accounting() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [statsData, paymentsData] = await Promise.all([
        api.school.stats(user!.clinicId!),
        api.school.payments(user!.clinicId!)
      ]);
      setStats(statsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center text-white shadow-lg"><Wallet /></div>
          Caisse & Dépenses
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Trésorerie, dépenses de fonctionnement et salaires.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-[2xl] border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardHeader><CardTitle className="text-sm font-medium text-slate-300">Solde Caisse</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black">{stats?.revenue || 0} CFA</div></CardContent>
         </Card>
         <Card className="rounded-[2xl] border-none shadow-xl">
            <CardHeader><CardTitle className="text-sm font-medium text-slate-500 flex items-center"><ArrowUpRight className="text-emerald-500 w-4 h-4 mr-2"/> Recettes (Mois)</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-slate-800">{stats?.revenue || 0} CFA</div></CardContent>
         </Card>
         <Card className="rounded-[2xl] border-none shadow-xl">
            <CardHeader><CardTitle className="text-sm font-medium text-slate-500 flex items-center"><ArrowDownRight className="text-rose-500 w-4 h-4 mr-2"/> Dépenses (Mois)</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-slate-800">0 CFA</div></CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem] mt-6">
        <CardHeader className="bg-slate-50/50 border-b pb-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800">Historique des Transactions</h2>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-slate-200">
              + Nouvelle Transaction
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4">Montant</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-20 text-slate-400 italic">Aucune transaction</td></tr>
                ) : (
                  payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500">{payment.payment_date || '-'}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">Paiement {payment.type} ({payment.name})</td>
                      <td className="px-6 py-4"><span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-semibold">Scolarité</span></td>
                      <td className="px-6 py-4 font-black text-emerald-600">+ {payment.amount} CFA</td>
                      <td className="px-6 py-4">
                        <span className={payment.status === 'paid' ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                          {payment.status === 'paid' ? '● Encaissé' : '○ En attente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
