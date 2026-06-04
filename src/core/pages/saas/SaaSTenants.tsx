import { useState, useEffect } from "react";
import {
  Building2, Search, Plus, Trash2, CheckCircle, ShieldAlert,
  Activity, Save, Users, TrendingUp, RefreshCw, Clock, Filter
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sector: 'health', plan_id: '',
    admin_name: '', admin_email: '', admin_password: ''
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { loadData(); }, []);

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
        setFormData(prev => ({ ...prev, plan_id: plansData[0].id }));
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
      if (!formData.plan_id && plans.length > 0) {
        formData.plan_id = plans[0].id;
      }
      await api.tenants.create(formData);
      toast({ title: "Déploiement réussi", description: "Le locataire a été créé et son environnement est provisionné." });
      setIsNewTenantOpen(false);
      setFormData({ name: '', sector: 'health', plan_id: plans[0]?.id || '', admin_name: '', admin_email: '', admin_password: '' });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur de création", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer définitivement "${name}" ? Cette action est irréversible.`)) return;
    try {
      await api.saas.deleteTenant(id);
      toast({ title: "Locataire supprimé" });
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

  // Computed stats from real data
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.subscription_status === 'active').length;
  const trialTenants = tenants.filter(t => t.subscription_status === 'trial').length;
  const suspendedTenants = tenants.filter(t => ['suspended', 'canceled'].includes(t.subscription_status)).length;
  const totalMRR = tenants.filter(t => t.subscription_status === 'active').reduce((sum, t) => sum + Number(t.mrr_value || 0), 0);

  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.admin_email && t.admin_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.sector && t.sector.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
      trial:     'bg-blue-100 text-blue-700 border-blue-200',
      suspended: 'bg-rose-100 text-rose-700 border-rose-200',
      canceled:  'bg-slate-100 text-slate-500 border-slate-200',
      past_due:  'bg-amber-100 text-amber-700 border-amber-200',
    };
    const labels: Record<string, string> = {
      active: 'Actif', trial: 'Démo', suspended: 'Suspendu', canceled: 'Résilié', past_due: 'Retard',
    };
    return (
      <Badge className={`border text-[9px] font-bold uppercase tracking-widest ${styles[status] || styles.canceled}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="bg-[#f2f5f8] min-h-screen text-slate-800 font-sans pb-12 antialiased">
      <div className="p-6 max-w-[1800px] mx-auto space-y-5">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[#1e3a5f] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-500" />
              Gestion des Locataires
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Base complète — {totalTenants} espace(s) provisionné(s)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline" size="sm"
              onClick={loadData}
              className="h-9 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Actualiser
            </Button>
            <Button
              onClick={() => setIsNewTenantOpen(true)}
              className="h-9 bg-[#1e3a5f] hover:bg-[#152945] text-white font-black text-xs px-5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Nouveau Locataire
            </Button>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Locataires", value: totalTenants, sub: "Enregistrés", icon: Building2, color: "text-sky-600 bg-sky-50 border-sky-200", onClick: () => setStatusFilter('all') },
            { label: "Abonnements Actifs", value: activeTenants, sub: `MRR: ${Number(totalMRR).toLocaleString()} XAF`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 border-emerald-200", onClick: () => setStatusFilter('active') },
            { label: "En période d'essai", value: trialTenants, sub: "Conversion à surveiller", icon: Clock, color: "text-blue-600 bg-blue-50 border-blue-200", onClick: () => setStatusFilter('trial') },
            { label: "Suspendus / Résiliés", value: suspendedTenants, sub: "Action requise", icon: ShieldAlert, color: suspendedTenants > 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-slate-500 bg-slate-50 border-slate-200", onClick: () => setStatusFilter('suspended') },
          ].map((item, idx) => (
            <Card
              key={idx}
              onClick={item.onClick}
              className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm cursor-pointer hover:border-sky-400 hover:shadow-md transition-all"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl border ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 leading-none">{item.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── SEARCH & FILTER BAR ── */}
        <Card className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 max-w-xl w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="bg-slate-50 border-slate-200 focus:border-sky-500 rounded-lg pl-10 text-xs h-10"
                  placeholder="Chercher par nom, email, secteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {(['all', 'active', 'trial', 'suspended'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                      statusFilter === s
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : s === 'trial' ? 'Démo' : 'Suspendus'}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── TENANTS TABLE ── */}
        <Card className="border border-[#c6d7e9] bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#e6f0fa] to-[#d9e6f2] px-5 py-3.5 border-b border-[#c6d7e9] flex justify-between items-center">
            <h3 className="text-xs font-black text-[#2a4d7c] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Répertoire des Locataires
            </h3>
            <span className="text-xs font-bold text-slate-500">{filteredTenants.length} résultat(s)</span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Chargement des locataires...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                    <th className="p-4 pl-6">Établissement</th>
                    <th className="p-4">Secteur</th>
                    <th className="p-4">Contact Admin</th>
                    <th className="p-4">Forfait</th>
                    <th className="p-4">MRR</th>
                    <th className="p-4">Utilisateurs</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTenants.map((tenant: any, i: number) => (
                    <tr key={i} className="hover:bg-sky-50/30 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-black text-xs shrink-0">
                            {(tenant.name || 'T').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{tenant.name || 'Sans Nom'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {(tenant.name || 'tenant').toLowerCase().replace(/[^a-z0-9]/g, '')}.kiam.tech
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          {tenant.sector || 'Général'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700 text-xs">{tenant.admin_name || '—'}</p>
                        <p className="text-[10px] text-slate-400">{tenant.admin_email || 'Aucun contact'}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                          {tenant.plan_name || tenant.plan_id || 'Aucun'}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-800">
                        {Number(tenant.mrr_value || 0).toLocaleString()} XAF
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-700">{tenant.user_count || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">{statusBadge(tenant.subscription_status)}</td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => navigate(`/saas/tenants/${tenant.id}`)}
                            className="h-8 text-sky-600 hover:text-sky-700 border-sky-200 hover:bg-sky-50 font-bold text-xs"
                          >
                            <Activity className="w-3 h-3 mr-1" /> Gérer
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            onClick={async () => {
                              try {
                                const res = await api.auth.impersonateDemo(tenant.sector, tenant.name);
                                
                                // Save admin session to allow returning
                                const currentAdminUser = localStorage.getItem('kiam_auth_user');
                                const currentAdminToken = localStorage.getItem('kiam_jwt_token');
                                if (currentAdminUser) localStorage.setItem('kiam_admin_session', currentAdminUser);
                                if (currentAdminToken) localStorage.setItem('kiam_admin_token', currentAdminToken);
                                
                                // Set demo session
                                localStorage.setItem('kiam_jwt_token', res.token);
                                localStorage.setItem('kiam_auth_user', JSON.stringify(res.user));
                                localStorage.setItem('kiam_auth_clinic', JSON.stringify(res.clinic));
                                localStorage.setItem('kiam_presentation_mode', 'true');
                                
                                // Navigate directly to the sector-specific dashboard
                                const sectorHome: Record<string, string> = {
                                  health:     '/dashboard',
                                  hotel:      '/hotel/dashboard',
                                  school:     '/school/dashboard',
                                  erp:        '/erp',
                                  shop:       '/erp',
                                  pharmacy:   '/pharmacy/dashboard',
                                  enterprise: '/enterprise/dashboard',
                                };
                                const target = sectorHome[res.user.sector] || '/apps';
                                window.location.href = '/kiam/dist/#' + target;
                                window.location.reload();
                              } catch(e: any) {
                                toast({ variant: "destructive", title: "Erreur", description: e.message });
                              }
                            }}
                            className="h-8 text-purple-600 hover:text-purple-700 border-purple-200 hover:bg-purple-50 font-bold text-xs"
                            title="Voir l'interface en mode démo isolé"
                          >
                            Démarrer
                          </Button>
                          <Button
                            variant="outline" size="icon"
                            onClick={() => handleToggleStatus(tenant.id, tenant.subscription_status)}
                            className={`h-8 w-8 border-slate-200 rounded-lg ${
                              tenant.subscription_status === 'active'
                                ? 'text-amber-500 hover:bg-amber-50 hover:border-amber-200'
                                : 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200'
                            }`}
                            title={tenant.subscription_status === 'active' ? 'Suspendre' : 'Activer'}
                          >
                            {tenant.subscription_status === 'active'
                              ? <ShieldAlert className="w-3.5 h-3.5" />
                              : <CheckCircle className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            variant="outline" size="icon"
                            onClick={() => handleDelete(tenant.id, tenant.name)}
                            className="h-8 w-8 border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTenants.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400 italic text-sm">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Aucun locataire ne correspond aux filtres appliqués.'
                          : 'Aucun locataire enregistré. Cliquez sur "Nouveau Locataire" pour commencer.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── NEW TENANT DIALOG ── */}
      <Dialog open={isNewTenantOpen} onOpenChange={setIsNewTenantOpen}>
        <DialogContent className="sm:max-w-xl border border-sky-100 rounded-xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-lg font-black text-[#1e3a5f] flex items-center gap-2">
              <Building2 className="text-sky-500 w-5 h-5" /> Provisionner un Espace Locataire
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTenant} className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Nom de l'Établissement *
              </label>
              <Input
                required
                placeholder="Ex: Clinique La Renaissance"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="text-xs h-10 border-slate-200 focus:border-sky-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Secteur *</label>
                <select
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 outline-none focus:border-sky-500 h-10 font-bold"
                  value={formData.sector}
                  onChange={e => setFormData({ ...formData, sector: e.target.value })}
                >
                  <option value="health">🏥 Santé (Cliniques)</option>
                  <option value="hotel">🏨 Hôtellerie</option>
                  <option value="school">🎓 Établissements scolaires</option>
                  <option value="shop">🛒 Commerce / ERP</option>
                  <option value="pharmacy">💊 Pharmacie</option>
                  <option value="enterprise">🏢 Entreprise</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Forfait *</label>
                <select
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 outline-none focus:border-sky-500 h-10 font-bold"
                  value={formData.plan_id}
                  onChange={e => setFormData({ ...formData, plan_id: e.target.value })}
                >
                  {plans.length === 0 && <option value="">Aucun plan disponible</option>}
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {Number(p.price || p.price_monthly || 0).toLocaleString()} XAF/mois
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                Compte Administrateur du Locataire
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Nom complet</label>
                  <Input
                    placeholder="Jean Dupont"
                    value={formData.admin_name}
                    onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                    className="text-xs h-10 border-slate-200 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email principal *</label>
                  <Input
                    required type="email"
                    placeholder="admin@clinique.com"
                    value={formData.admin_email}
                    onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                    className="text-xs h-10 border-slate-200 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                Mot de passe (vide = auto-généré)
              </label>
              <Input
                type="text"
                placeholder="Kiam@2026!"
                value={formData.admin_password}
                onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
                className="text-xs h-10 border-slate-200 focus:border-sky-500"
              />
            </div>
            <Button
              disabled={isSubmitting}
              type="submit"
              className="w-full bg-[#1e3a5f] hover:bg-[#152945] text-white font-black uppercase text-xs h-11 shadow-sm"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Déploiement...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Provisionner cet espace</>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
