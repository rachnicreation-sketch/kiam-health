import { useState, useEffect } from "react";
import { CreditCard, Plus, CheckCircle, Search, TrendingUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

export default function SaaSBilling() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ id: '', name: '', description: '', price: '0', price_annual: '0', max_users: '1', modules_included: '' });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, invsData, statsData] = await Promise.all([
        api.saas.plans(),
        api.saas.invoices(),
        api.saas.stats()
      ]);
      
      if (plansData && plansData.length > 0) setPlans(plansData);
      else setPlans([
        { id: "plan_basic", name: "Basic", price: 25000, max_users: 5, modules_included: "health,school" },
        { id: "plan_pro", name: "Pro", price: 75000, max_users: 20, modules_included: "health,school,hotel" },
      ]);

      setInvoices(invsData || []);
      setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saas.savePlan({
        id: planForm.id,
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        price_annual: parseFloat(planForm.price_annual),
        max_users: parseInt(planForm.max_users),
        modules_included: planForm.modules_included
      });
      toast({ title: "Succès", description: "Le plan a été enregistré." });
      setIsPlanModalOpen(false);
      loadData();
    } catch(err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const openNewPlan = () => {
    setPlanForm({ id: '', name: '', description: '', price: '0', price_annual: '0', max_users: '1', modules_included: '' });
    setIsPlanModalOpen(true);
  };

  const openEditPlan = (plan: any) => {
    setPlanForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price),
      price_annual: String(plan.price_annual || 0),
      max_users: String(plan.max_users),
      modules_included: plan.modules_included || ''
    });
    setIsPlanModalOpen(true);
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-600" /> Plans & Facturation
            </h1>
            <p className="text-slate-500 mt-1">Gérez les offres d'abonnements réelles de votre SaaS.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full" onClick={openNewPlan}>
            <Plus className="w-4 h-4 mr-2" /> Créer un forfait
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-8 mt-4">
        
        {/* KPI SUMMARIES */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-slate-200 p-6 rounded-[2rem] flex items-center gap-6 shadow-sm">
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">MRR Global</p>
                <h2 className="text-3xl font-black text-slate-800">{Number(stats?.totalMRR || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">CFA</span></h2>
              </div>
            </Card>
            
            <Card className="bg-white border-slate-200 p-6 rounded-[2rem] flex items-center gap-6 shadow-sm">
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Locataires Actifs</p>
                <h2 className="text-3xl font-black text-slate-800">{stats?.activeTenants || 0}</h2>
              </div>
            </Card>

            <Card className="bg-white border-slate-200 p-6 rounded-[2rem] flex items-center gap-6 shadow-sm">
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Tickets Ouverts</p>
                <h2 className="text-3xl font-black text-rose-600">{stats?.pendingTickets || 0}</h2>
              </div>
            </Card>
         </div>

        {/* PLANS SECTION */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> Les Offres & Forfaits</h2>
          {loading ? (
             <div className="text-slate-500 italic">Chargement des forfaits...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan: any, i: number) => {
                 const isPopular = plan.id === 'plan_premium';
                 const isTrial = plan.id === 'plan_decouverte';
                 return (
                 <Card key={i} className={`bg-white border-2 ${isPopular ? 'border-blue-500 shadow-blue-500/10' : isTrial ? 'border-emerald-400 shadow-emerald-100' : 'border-slate-200'} p-8 rounded-[2rem] relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-md`}>
                    {isPopular && <div className="absolute top-4 right-4 bg-blue-600 text-[10px] font-bold px-2 py-1 rounded text-white uppercase tracking-widest">Populaire</div>}
                    {isTrial && <div className="absolute top-4 right-4 bg-emerald-500 text-[10px] font-bold px-2 py-1 rounded text-white uppercase tracking-widest">Essai gratuit</div>}
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2 uppercase">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mb-4 h-10">{plan.description}</p>
                    <div className="flex flex-col mb-6">
                       {isTrial ? (
                         <>
                           <div className="text-3xl font-black text-emerald-600">Gratuit <span className="text-sm font-normal text-slate-500">pendant 45 jours</span></div>
                           <div className="text-xs text-rose-500 font-bold mt-1">Accès suspendu automatiquement après 45 jours</div>
                         </>
                       ) : (
                         <>
                           <div className="text-3xl font-black text-slate-800">{Number(plan.price).toLocaleString()} <span className="text-sm font-normal text-slate-500">CFA / mois</span></div>
                           {plan.price_annual > 0 && <div className="text-sm font-bold text-emerald-600 mt-1">{Number(plan.price_annual).toLocaleString()} CFA / an <span className="text-slate-400 line-through text-xs font-normal ml-1">au lieu de {Number(plan.price * 12).toLocaleString()} CFA</span></div>}
                         </>
                       )}
                    </div>
                    
                    <div className="space-y-4 mb-8">
                       <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                             <CheckCircle className="w-3 h-3 text-emerald-500" />
                          </div>
                          {isTrial ? 'Utilisateurs illimités' : `Idéal pour ${plan.max_users} utilisateurs max.`}
                       </div>
                       <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                             <CheckCircle className="w-3 h-3 text-emerald-500" />
                          </div>
                          Accès modules: <Badge className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-200">{plan.modules_included || 'Limité'}</Badge>
                       </div>
                    </div>
                    <Button onClick={() => openEditPlan(plan)} variant="outline" className="w-full rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold">Modifier l'offre</Button>
                 </Card>
              )})}
            </div>
          )}
        </div>

        {/* INVOICES SECTION */}
        <Card className="bg-white border-slate-200 shadow-md p-6 rounded-[2rem]">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <h3 className="text-slate-800 font-bold text-lg uppercase tracking-widest flex items-center gap-2"> Historique des Paiements</h3>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                className="bg-white border-slate-300 rounded-full pl-10 text-sm focus:border-blue-500" 
                placeholder="Rechercher une facture..." 
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-xl border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold rounded-tl-xl">ID Facture</th>
                  <th className="px-6 py-4 font-bold">Client</th>
                  <th className="px-6 py-4 font-bold">Plan</th>
                  <th className="px-6 py-4 font-bold">Montant</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-right rounded-tr-xl">Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{inv.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{inv.client_name}</td>
                    <td className="px-6 py-4 text-slate-600">{inv.plan_name}</td>
                    <td className="px-6 py-4 font-bold text-blue-600">{Number(inv.amount).toLocaleString()} CFA</td>
                    <td className="px-6 py-4 text-slate-500">{inv.payment_date ? new Date(inv.payment_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="outline" className={`
                        ${inv.status === 'payé' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                        ${inv.status === 'échoué' ? 'bg-rose-100 text-rose-700 border-rose-200' : ''}
                      `}>
                        {inv.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="text-xl font-bold flex items-center gap-2"><CreditCard className="text-blue-500 w-5 h-5"/> Paramétrage du Forfait</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSavePlan} className="space-y-4 mt-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom du Plan</label>
                  <Input required placeholder="Ex: Professionnel" value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <Input placeholder="Description courte du forfait..." value={planForm.description} onChange={e => setPlanForm({...planForm, description: e.target.value})} />
               </div>
               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Mensuel</label>
                     <Input required type="number" placeholder="10000" value={planForm.price} onChange={e => setPlanForm({...planForm, price: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Annuel</label>
                     <Input required type="number" placeholder="100000" value={planForm.price_annual} onChange={e => setPlanForm({...planForm, price_annual: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Max Users</label>
                     <Input required type="number" placeholder="20" value={planForm.max_users} onChange={e => setPlanForm({...planForm, max_users: e.target.value})} />
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Modules inclus (séparés par virgule)</label>
                  <Input placeholder="health,erp,hotel" value={planForm.modules_included} onChange={e => setPlanForm({...planForm, modules_included: e.target.value})} />
               </div>
               <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Enregistrer les tarifs</Button>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  );
}
