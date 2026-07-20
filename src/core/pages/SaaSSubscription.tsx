import { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Zap, Shield, ArrowRight, Clock, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api-service";
import { toast } from "sonner";

export default function SaaSSubscription() {
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [planRes, plansRes, invsRes] = await Promise.all([
        apiRequest("tenant_billing.php?action=current_plan"),
        fetch("/kiam/api/public_plans.php").then(r => r.json()),
        apiRequest("tenant_billing.php?action=my_invoices")
      ]);
      setCurrentPlan(planRes.plan);
      if (plansRes.status === 'success') {
        setAvailablePlans(plansRes.plans.filter((p: any) => p.is_active));
      }
      setInvoices(invsRes.invoices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      await apiRequest("subscribe.php", {
        method: "POST",
        body: JSON.stringify({ plan_id: planId, billing_frequency: 'monthly' })
      });
      toast.success("Demande de changement de forfait enregistrée !");
      loadData();
    } catch (e) {
      toast.error("Erreur lors du changement de forfait.");
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement de votre abonnement...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 px-8 py-6 mb-8">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600" /> Mon Abonnement Kiam
        </h1>
        <p className="text-slate-500 mt-1">Gérez votre offre, consultez vos factures et optimisez vos ressources.</p>
      </div>

      <div className="max-w-7xl mx-auto px-8 space-y-8">
        {/* CURRENT PLAN HERO */}
        <Card className="p-8 rounded-[2rem] bg-indigo-600 text-white border-none shadow-2xl shadow-indigo-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <Badge className="bg-white/20 text-white border-none font-black text-xs uppercase tracking-widest">Plan Actuel</Badge>
            <h2 className="text-5xl font-black">{currentPlan?.plan_name || 'Version d\'essai'}</h2>
            <div className="flex items-center gap-4 text-indigo-100 font-medium">
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Jusqu'à {currentPlan?.max_users} utilisateurs</span>
              <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Modules: {currentPlan?.modules_included}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Prochain Paiement</p>
            <h3 className="text-3xl font-black">25 000 CFA</h3>
            <p className="text-indigo-200 text-xs mt-1">Prévu le 12 Juin 2026</p>
          </div>
        </Card>

        {/* UPGRADE SECTION */}
        <div>
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tighter">
            🚀 Booster votre activité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <Card key={plan.id} className={`p-6 rounded-[2rem] bg-white border-2 transition-all ${plan.id === currentPlan?.plan_id ? 'border-indigo-600 shadow-xl' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-xl uppercase">{plan.name}</h4>
                  {plan.id === currentPlan?.plan_id && <Badge className="bg-indigo-600">Actuel</Badge>}
                </div>
                <div className="text-3xl font-black text-slate-900 mb-6">
                  {Number(plan.price).toLocaleString()} <span className="text-xs font-normal text-slate-400">CFA / mois</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle className="w-4 h-4 text-emerald-500" /> {plan.max_users} Utilisateurs</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle className="w-4 h-4 text-emerald-500" /> Accès {plan.modules_included}</li>
                </ul>
                <Button 
                  disabled={plan.id === currentPlan?.plan_id}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full rounded-xl font-bold h-12 ${plan.id === currentPlan?.plan_id ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                >
                  {plan.id === currentPlan?.plan_id ? 'Votre plan' : 'Choisir ce plan'}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* INVOICES */}
        <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Historique des Factures
            </h3>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600">Tout télécharger</Button>
          </div>
          <div className="divide-y divide-slate-50">
            {invoices.length > 0 ? invoices.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Facture de {new Date(inv.payment_date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{inv.plan_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-black text-slate-900 text-sm">{Number(inv.amount).toLocaleString()} CFA</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] uppercase font-black">Payé</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400 italic">Aucune facture disponible.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
