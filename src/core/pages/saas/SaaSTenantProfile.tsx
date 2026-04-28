import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, ArrowLeft, Mail, Phone, Calendar, CheckCircle, ShieldAlert, Badge as BadgeIcon, FileText, Activity, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-service";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function SaaSTenantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const domainPrefix = tenant?.domain_prefix || tenant?.name?.toLowerCase().replace(/[^a-z0-9]/g, "");

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    try {
      if (id) {
        const data = await api.tenants.get(id);
        setTenant(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!id) return;
    setIsImpersonating(true);
    const res = await impersonate(id);
    if (res.success) {
      toast({ title: "Mode Présentation Activé", description: `Vous visualisez l'interface de ${tenant.name} sans accès aux données réelles.` });
      
      // Dynamic redirection based on sector
      const sector = tenant.sector || 'health';
      const sectorRoutes: Record<string, string> = {
        health: '/dashboard',
        hotel: '/hotel',
        school: '/school/dashboard',
        erp: '/erp/dashboard',
        shop: '/erp/dashboard',
        pharmacy: '/pharmacy/dashboard',
        enterprise: '/enterprise/dashboard'
      };
      
      navigate(sectorRoutes[sector] || '/dashboard');
    } else {
      toast({ title: "Erreur", description: res.message, variant: "destructive" });
      setIsImpersonating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de "${tenant.name}" ?`)) return;
    try {
      await api.saas.deleteTenant(id!);
      toast({ title: "Client supprimé" });
      navigate('/saas/tenants');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = tenant.subscription_status === 'active' ? 'suspended' : 'active';
    try {
      await api.saas.updateTenantStatus(id!, newStatus);
      toast({ title: "Statut mis à jour" });
      loadTenant();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  if (loading) {
     return <div className="p-8 text-center text-muted-foreground italic">Chargement du profil client...</div>;
  }

  if (!tenant) {
     return <div className="p-8 text-center text-rose-500 italic font-bold">Client introuvable.</div>;
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
                {tenant.name}
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2 text-xs">
                <Badge variant="outline" className="font-mono text-[10px]">{domainPrefix || tenant.id}.kiam.tech</Badge>
                ID: {tenant.id}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
               disabled={isImpersonating} 
               onClick={handleImpersonate} 
               className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold"
            >
              <Activity className="w-4 h-4 mr-2" />
              {isImpersonating ? "Connexion..." : "Voir Interface (Démo)"}
            </Button>
            
            <Button variant="outline" onClick={handleToggleStatus} className={tenant.subscription_status === 'active' ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}>
              {tenant.subscription_status === 'active' ? <ShieldAlert className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {tenant.subscription_status === 'active' ? "Bloquer" : "Débloquer"}
            </Button>
            
            <Button variant="destructive" onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1200px] mx-auto space-y-6 mt-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* INFO GENERALES */}
           <Card className="md:col-span-2 border-slate-200 shadow-sm bg-white">
              <CardHeader className="border-b bg-slate-50/50 py-4">
                 <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Informations Entreprise
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                       <p className="text-xs text-slate-500 uppercase font-bold mb-1">Responsable Principal</p>
                       <p className="font-medium text-slate-800">{tenant.admin_name || 'Non spécifié'}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email de Contact</p>
                       <p className="font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {tenant.admin_email}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 uppercase font-bold mb-1">Secteur d'Activité</p>
                       <Badge variant="outline" className="bg-slate-100">{tenant.sector || 'Général'}</Badge>
                    </div>
                    <div>
                       <p className="text-xs text-slate-500 uppercase font-bold mb-1">Date d'inscription</p>
                       <p className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {tenant.created_at || 'Inconnue'}</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* ETAT ABONNEMENT */}
           <Card className="border-slate-200 shadow-sm bg-white top-24">
              <CardHeader className="border-b bg-slate-50/50 py-4">
                 <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <BadgeIcon className="w-4 h-4 text-emerald-600" />
                    Abonnement
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-slate-500 font-bold uppercase">Plan Actuel</span>
                       <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{tenant.plan_id || 'Free'}</Badge>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                       <span className="text-sm text-slate-500 font-bold uppercase">Statut</span>
                       <Badge variant="outline" className={`border-0 ${tenant.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {tenant.subscription_status}
                       </Badge>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                       <span className="text-sm text-slate-500 font-bold uppercase">MRR Généré</span>
                       <span className="font-black text-slate-800 text-lg">{Number(tenant.mrr_value || 0).toLocaleString()} CFA</span>
                    </div>

                    <Button variant="outline" className="w-full mt-4 text-blue-600 border-blue-200 hover:bg-blue-50 font-bold">
                       Modifier l'Abonnement
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* FACTURES DU CLIENT */}
        <Card className="border-slate-200 shadow-sm bg-white">
           <CardHeader className="border-b py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <FileText className="w-4 h-4 text-slate-500" />
                 Dernières Factures
              </CardTitle>
           </CardHeader>
           <CardContent className="p-0">
             <div className="p-8 text-center text-muted-foreground italic text-sm">
                Aucune facture enregistrée pour ce client.
             </div>
           </CardContent>
        </Card>

      </div>
    </div>
  );
}
