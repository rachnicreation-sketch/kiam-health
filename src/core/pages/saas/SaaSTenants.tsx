import { useState, useEffect } from "react";
import { Building2, Search, Plus, Filter, Lock, Blocks, Trash2, CheckCircle, ShieldAlert, ArrowRight, Activity, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api-service";

export default function SaaSTenants() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // ONBOARDING STATE
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sector: 'health',
    plan_id: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
     setLoading(true);
     try {
       const [tenantsData, plansData] = await Promise.all([
           api.saas.tenants(),
           api.saas.plans()
       ]);
       setTenants(tenantsData || []);
       setPlans(plansData || []);
       if (plansData && plansData.length > 0) {
          setFormData(prev => ({...prev, plan_id: plansData[0].id}));
       }
     } catch (e) {
       console.error(e);
     } finally {
       setLoading(false);
     }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if(!formData.plan_id && plans.length > 0) {
        formData.plan_id = plans[0].id; // Fallback
      }
      await api.tenants.create(formData);
      toast({ title: "Déploiement réussi", description: "Le locataire a été créé et son environnement est provisionné." });
      setIsNewTenantOpen(false);
      setFormData({name: '', sector: 'health', plan_id: plans[0]?.id || '', admin_name: '', admin_email: '', admin_password: ''});
      loadData();
    } catch(err: any) {
      toast({ variant: "destructive", title: "Erreur de création", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de "${name}" ? Cette action est irréversible.`)) return;
    try {
      await api.saas.deleteTenant(id);
      toast({ title: "Locataire supprimé", description: "Le compte et toutes ses données ont été retirés." });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.saas.updateTenantStatus(id, newStatus);
      toast({ title: "Statut mis à jour", description: `Le compte est désormais ${newStatus === 'active' ? 'actif' : 'suspendu'}.` });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" /> Locataires & Entreprises
            </h1>
            <p className="text-slate-500 mt-1">Gérez les comptes des établissements connectés à votre SaaS.</p>
          </div>
          <Button onClick={() => setIsNewTenantOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold">
            <Plus className="w-4 h-4 mr-2" /> Nouveau Locataire
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 mt-4">
        
        {/* ACTION BAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex w-full md:w-auto gap-3 flex-1 md:max-w-xl">
             <div className="relative w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <Input 
                 className="bg-white border-slate-300 rounded-full pl-10 text-sm focus:border-blue-500 h-11" 
                 placeholder="Chercher un nom, sous-domaine, email..." 
               />
             </div>
             <Button variant="outline" className="rounded-full h-11 px-6 border-slate-300 text-slate-600 hover:bg-slate-100 font-bold shrink-0">
               <Filter className="w-4 h-4 mr-2" /> Filtres
             </Button>
           </div>
           
           <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
             <span className="flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Actifs
             </span>
             <span className="flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Demo
             </span>
             <span className="flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Suspendus
             </span>
           </div>
        </div>

        {/* TENANTS GRID */}
        {loading ? (
             <div className="p-8 text-center text-muted-foreground italic text-sm">Chargement des données...</div>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant, i) => (
            <Card key={i} className="bg-white border-slate-200 p-6 rounded-[2rem] hover:shadow-lg transition-shadow relative overflow-hidden shadow-sm group">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl border border-blue-100">
                       {tenant.name?.[0] || '?'}
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 leading-tight mb-0.5 group-hover:text-blue-600 transition-colors">
                          {tenant.name}
                       </h3>
                       <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          {tenant.domain_prefix || tenant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.kiam.tech
                       </div>
                    </div>
                 </div>
                 
                 <Badge variant="outline" className={`border-0 uppercase tracking-widest text-[10px] ${
                    tenant.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                    tenant.subscription_status === 'suspended' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                 }`}>
                    {tenant.subscription_status}
                 </Badge>
              </div>

              <div className="mb-6">
                 <p className="text-sm text-slate-500 mb-1">{tenant.admin_name || 'Admin Principal'} <span className="text-slate-300">•</span> {tenant.admin_email}</p>
                 <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-mono text-[10px] uppercase">
                        Plan: {tenant.plan_name || tenant.plan_id || 'Inconnu'}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
                        Secteur: {tenant.sector || 'Général'}
                    </Badge>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-sm text-center">
                 <Button variant="ghost" onClick={() => navigate(`/saas/tenants/${tenant.id}`)} className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                    <Activity className="w-4 h-4" /> Profil client
                 </Button>
                 <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(tenant.id, tenant.subscription_status)} className={`rounded-xl h-9 w-9 ${tenant.subscription_status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}>
                       {tenant.subscription_status === 'active' ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tenant.id, tenant.name)} className="rounded-xl h-9 w-9 text-rose-500 hover:bg-rose-50">
                       <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
              </div>
            </Card>
          ))}
          {tenants.length === 0 && <div className="col-span-full p-8 text-center text-muted-foreground italic text-sm">Aucun compte locataire trouvé.</div>}
        </div>
        )}
      </div>

      <Dialog open={isNewTenantOpen} onOpenChange={setIsNewTenantOpen}>
         <DialogContent className="sm:max-w-xl">
            <DialogHeader>
               <DialogTitle className="text-xl font-bold flex items-center gap-2"><Building2 className="text-blue-500 w-5 h-5"/> Nouveau Déploiement SaaS</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4 mt-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Nom de l'Entreprise / Établissement</label>
                  <Input required placeholder="Ex: Clinique La Renaissance" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Secteur Industriel</label>
                     <select required className="w-full mt-1 bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-700 outline-none" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})}>
                        <option value="health">Santé (Cliniques)</option>
                        <option value="hotel">Hôtellerie</option>
                        <option value="school">Lycées / Universités</option>
                        <option value="shop">Poste de Vente (Boutiquier)</option>
                        <option value="erp">ERP Global (B2B)</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Forfait / Abonnement</label>
                     <select required className="w-full mt-1 bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-700 outline-none" value={formData.plan_id} onChange={e => setFormData({...formData, plan_id: e.target.value})}>
                        {plans.length === 0 ? <option value="">Aucun plan disponible</option> : null}
                        {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {Number(p.price).toLocaleString()} CFA</option>)}
                     </select>
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100">
                   <h3 className="text-sm font-bold text-slate-800 mb-3">Identifiants Superviseur (Locataire)</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Nom complet</label>
                         <Input required placeholder="Jean Dupont" value={formData.admin_name} onChange={e => setFormData({...formData, admin_name: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Email principal</label>
                         <Input required type="email" placeholder="admin@clinique.com" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} />
                      </div>
                   </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Mot de passe de connexion</label>
                  <Input type="text" placeholder="Généré automatiquement si vide" value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} />
               </div>

               <Button disabled={isSubmitting} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2 font-bold shadow-sm">
                  {isSubmitting ? "Déploiement..." : <><Save className="w-4 h-4 mr-2" /> Provisionner cet espace</>}
               </Button>
            </form>
         </DialogContent>
      </Dialog>
    </div>
  );
}
