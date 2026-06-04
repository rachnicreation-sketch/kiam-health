import { useEffect, useState } from "react";
import { Blocks, Plus, Stethoscope, Pill, Hotel, GraduationCap, Briefcase, Store, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api-service";

export default function SaaSModules() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [modules, setModules] = useState([
    { id: "health", name: "Kiam Health", icon: Stethoscope, description: "Gestion hospitalière complète et dossier patient", clients: 0, status: "active", version: "v3.2" },
    { id: "pharmacy", name: "Kiam Pharmacy", icon: Pill, description: "Inventaire, ventes et ordonnances", clients: 0, status: "active", version: "v2.1" },
    { id: "hotel", name: "Kiam Hotel", icon: Hotel, description: "Réservations, chambres et services hôteliers", clients: 0, status: "beta", version: "v1.0-beta" },
    { id: "school", name: "Kiam School", icon: GraduationCap, description: "Administration scolaire et notes", clients: 0, status: "active", version: "v1.5" },
    { id: "erp", name: "Kiam ERP", icon: Briefcase, description: "Système de point de vente et gestion globale", clients: 0, status: "active", version: "v4.0" },
    { id: "shop", name: "Kiam Commerce", icon: Store, description: "Gestion de boutiquiers", clients: 0, status: "coming_soon", version: "dev" },
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, modulesData] = await Promise.all([
          api.saas.stats(),
          api.saas.listModules()
        ]);
        setStats(statsData);
        
        // Map icon dynamically based on id
        const iconMap: Record<string, any> = {
          health: Stethoscope,
          pharmacy: Pill,
          hotel: Hotel,
          school: GraduationCap,
          erp: Briefcase,
          shop: Store
        };

        if (modulesData && Array.isArray(modulesData)) {
          const mappedModules = modulesData.map((m: any) => ({
            id: m.id,
            name: m.name,
            icon: iconMap[m.id] || Blocks,
            description: m.description,
            clients: statsData?.modulesUsage?.[m.id] || 0,
            status: m.status,
            version: m.version
          }));
          setModules(mappedModules);
        }
      } catch (err) {
        console.error("Error loading module data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Blocks className="w-8 h-8 text-purple-600" /> Modules & Add-ons
            </h1>
            <p className="text-slate-500 mt-1">Gérez la disponibilité globale des modules applicatifs Kiam.</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold">
            <Plus className="w-4 h-4 mr-2" /> Nouveau Module
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto space-y-6 mt-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, i) => (
            <Card key={i} className="bg-white border-slate-200 p-6 rounded-[2rem] hover:border-purple-300 hover:shadow-lg transition-all flex flex-col h-full shadow-sm group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition-colors">
                  <module.icon className="w-7 h-7 text-purple-600" />
                </div>
                <Badge variant="outline" className={`border-0 uppercase tracking-widest text-[10px] bg-slate-50
                  ${module.status === 'active' ? 'text-emerald-700 bg-emerald-100' : ''}
                  ${module.status === 'beta' ? 'text-amber-700 bg-amber-100' : ''}
                  ${module.status === 'coming_soon' ? 'text-slate-500 bg-slate-100' : ''}
                `}>
                  {module.status === 'coming_soon' ? 'Bientôt' : module.status}
                </Badge>
              </div>
              
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-slate-900 font-bold text-lg">{module.name}</h3>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{module.version}</span>
                 </div>
                 <p className="text-slate-500 text-sm mb-6 leading-relaxed">{module.description}</p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col gap-4 mt-auto">
                <div className="flex justify-between items-center text-sm">
                   <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Locataires équipés</div>
                   <div className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">{module.clients}</div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                   <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">État Global</div>
                   <Switch defaultChecked={module.status === 'active'} disabled={module.status === 'coming_soon'} />
                </div>
                
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 border-sky-100"
                    disabled={module.status === 'coming_soon'}
                    onClick={async () => {
                      try {
                        const res = await api.auth.impersonateDemo(module.id, module.name);
                        
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
                        console.error(e);
                      }
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Visualiser l'interface
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
