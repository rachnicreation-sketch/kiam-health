import { useState, useEffect } from "react";
import { Users, Plus, ShieldCheck, Mail, ShieldAlert, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-service";

export default function SaaSUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.saas.users();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-amber-600" /> Équipe Kiam (Admins)
            </h1>
            <p className="text-slate-500 mt-1">Gérez les comptes administratifs et les niveaux d'accès de votre équipe.</p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700 font-bold text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Nouvel Administrateur
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 mt-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {users.map((user, i) => (
            <Card key={i} className="bg-white border-slate-200 p-6 rounded-[2rem] hover:bg-slate-50 transition-colors relative overflow-hidden group shadow-sm">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-black text-xl border border-amber-100 shadow-sm">
                    {user.email.charAt(0).toUpperCase()}
                 </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800">
                    <MoreVertical className="h-4 w-4" />
                 </Button>
              </div>

              <div>
                 <h3 className="text-lg font-extrabold text-slate-900 leading-tight mb-1">{user.tenant_id ? `Locataire Admin: ${user.tenant_id.substring(0,8)}` : 'Membre Kiam'}</h3>
                 <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 font-medium">
                    <Mail className="w-3 h-3" /> {user.email}
                 </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                 <Badge variant="outline" className={`font-bold border-0 shadow-sm
                    ${user.global_role === 'saas_admin' ? 'bg-rose-100 text-rose-700' : ''}
                    ${user.global_role === 'tenant_admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                 `}>
                    {user.global_role === 'saas_admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                    {user.global_role === 'tenant_admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                    {user.global_role}
                 </Badge>
                 <Badge variant="outline" className={`border-0 font-bold shadow-sm bg-emerald-100 text-emerald-700`}>
                    Actif
                 </Badge>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex justify-between uppercase tracking-wider font-bold">
                 <span>Dernière connexion</span>
                 <span className="text-slate-600">{user.last_login_at || 'Jamais'}</span>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
