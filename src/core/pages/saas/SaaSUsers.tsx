import { useState, useEffect } from "react";
import {
  Users, Plus, ShieldCheck, Mail, ShieldAlert, MoreVertical,
  Search, Filter, Edit3, Trash2, Power, UserPlus, Building2,
  Shield, CheckCircle, XCircle, ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  saas_admin:    { bg: "bg-rose-100",    text: "text-rose-700",    label: "Super Admin",     icon: ShieldAlert },
  tenant_admin:  { bg: "bg-amber-100",   text: "text-amber-700",   label: "Admin Locataire", icon: ShieldCheck },
  staff:         { bg: "bg-blue-100",    text: "text-blue-700",    label: "Personnel",       icon: Users },
};

const defaultForm = {
  id: "", email: "", full_name: "", phone: "", tenant_id: "", global_role: "tenant_admin", password: "", is_active: true,
};

export default function SaaSUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, tenantsData] = await Promise.all([
        api.saas.users(),
        api.saas.tenants(),
      ]);
      setUsers(usersData || []);
      setTenants(tenantsData || []);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les utilisateurs." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.saas.saveUser(form);
      toast({ title: "Succès", description: form.id ? "Utilisateur modifié." : "Utilisateur créé avec succès." });
      setIsModalOpen(false);
      setForm({ ...defaultForm });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setForm({
      id: user.id, email: user.email, full_name: user.full_name || "",
      phone: user.phone || "", tenant_id: user.tenant_id || "",
      global_role: user.global_role, password: "", is_active: !!user.is_active,
    });
    setIsModalOpen(true);
    setMenuOpen(null);
  };

  const handleToggle = async (user: any) => {
    try {
      await api.saas.toggleUser(user.id);
      toast({ title: user.is_active ? "Compte suspendu" : "Compte réactivé" });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
    setMenuOpen(null);
  };

  const handleDelete = async (user: any) => {
    if (!window.confirm(`Supprimer définitivement "${user.email}" ?`)) return;
    try {
      await api.saas.deleteUser(user.id);
      toast({ title: "Utilisateur supprimé" });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
    setMenuOpen(null);
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "all" || u.global_role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    saasAdmins: users.filter(u => u.global_role === 'saas_admin').length,
    tenantAdmins: users.filter(u => u.global_role === 'tenant_admin').length,
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              Gestion des Utilisateurs
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Gérez tous les comptes administratifs et accès à la plateforme.</p>
          </div>
          <Button
            onClick={() => { setForm({ ...defaultForm }); setIsModalOpen(true); }}
            className="bg-amber-600 hover:bg-amber-700 font-bold text-white rounded-full shadow-md shadow-amber-100"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Nouvel Utilisateur
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 mt-4">

        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Utilisateurs", value: stats.total, color: "bg-slate-100 text-slate-600", icon: Users },
            { label: "Comptes Actifs", value: stats.active, color: "bg-emerald-100 text-emerald-600", icon: CheckCircle },
            { label: "Super Admins", value: stats.saasAdmins, color: "bg-rose-100 text-rose-600", icon: ShieldAlert },
            { label: "Admins Locataires", value: stats.tenantAdmins, color: "bg-amber-100 text-amber-600", icon: ShieldCheck },
          ].map(({ label, value, color, icon: Icon }) => (
            <Card key={label} className="bg-white border-0 shadow-sm rounded-2xl p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-900">{value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* SEARCH & FILTERS */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher par email, nom ou locataire..."
                className="pl-10 rounded-full border-slate-200 focus:border-amber-400"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="border border-slate-200 rounded-full px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="saas_admin">Super Admin</option>
              <option value="tenant_admin">Admin Locataire</option>
              <option value="staff">Personnel</option>
            </select>
          </div>
        </Card>

        {/* USERS TABLE */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilisateur</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rôle</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Locataire</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Dernière Connexion</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                  <th className="px-6 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-slate-100 rounded-full animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 italic">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : filtered.map((user) => {
                  const role = ROLE_STYLES[user.global_role] || ROLE_STYLES.staff;
                  const RoleIcon = role.icon;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{user.full_name || '—'}</p>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border-0 font-bold ${role.bg} ${role.text} flex items-center gap-1 w-fit`}>
                          <RoleIcon className="w-3 h-3" />
                          {role.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {user.tenant_name ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {user.tenant_name}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 hidden lg:table-cell">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString('fr-FR') : 'Jamais'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`border-0 font-bold text-xs ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                          {user.is_active ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />Actif</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" />Inactif</>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 relative">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full"
                          onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {menuOpen === user.id && (
                          <div className="absolute right-4 top-12 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 w-48 animate-in fade-in slide-in-from-top-2">
                            <button onClick={() => handleEdit(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                              <Edit3 className="w-4 h-4 text-blue-500" /> Modifier
                            </button>
                            <button onClick={() => handleToggle(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                              <Power className="w-4 h-4 text-amber-500" />
                              {user.is_active ? 'Suspendre' : 'Réactiver'}
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button onClick={() => handleDelete(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
              {filtered.length} utilisateur(s) affiché(s) sur {users.length}
            </div>
          )}
        </Card>
      </div>

      {/* MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Shield className="text-amber-500 w-5 h-5" />
              {form.id ? "Modifier l'utilisateur" : "Créer un utilisateur"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Nom complet</label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jean Dupont" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+237 6XX XXX XXX" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Email *</label>
              <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@kiam.tech" className="mt-1" disabled={!!form.id} />
            </div>
            {!form.id && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Mot de passe temporaire</label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Laisser vide = Kiam@2026!" className="mt-1" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Rôle *</label>
                <select
                  value={form.global_role}
                  onChange={e => setForm({ ...form, global_role: e.target.value })}
                  className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-400"
                  required
                >
                  <option value="tenant_admin">Admin Locataire</option>
                  <option value="saas_admin">Super Admin</option>
                  <option value="staff">Personnel</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Locataire associé</label>
                <select
                  value={form.tenant_id}
                  onChange={e => setForm({ ...form, tenant_id: e.target.value })}
                  className="w-full mt-1 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">— Aucun (SaaS Global) —</option>
                  {tenants.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl">Annuler</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold" disabled={isSubmitting}>
                {isSubmitting ? "En cours..." : form.id ? "Enregistrer" : "Créer le compte"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CLICK OUTSIDE TO CLOSE MENU */}
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
