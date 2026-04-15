import { useState, useEffect } from "react";
import { Clinic } from "@/lib/mock-data";
import { 
  Building2, 
  Plus, 
  Users, 
  Lock, 
  LayoutDashboard, 
  CreditCard, 
  Blocks, 
  LifeBuoy, 
  Megaphone, 
  TrendingUp, 
  Settings, 
  Shield, 
  DollarSign, 
  Ticket, 
  UserPlus, 
  UserMinus, 
  Clock, 
  CheckCircle,
  Filter,
  Edit,
  Send,
  RefreshCw,
  AlertTriangle,
  Server,
  Mail,
  ShieldCheck,
  Power
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const growthData = [
  { name: 'Jan', value: 1500000 },
  { name: 'Fév', value: 2100000 },
  { name: 'Mar', value: 2800000 },
  { name: 'Avr', value: 3800000 },
  { name: 'Mai', value: 4200000 },
  { name: 'Juin', value: 5800000 },
  { name: 'Juil', value: 7500000 },
];

const moduleData = [
  { name: 'Health', value: 45, color: '#1E6FFF' },
  { name: 'ERP', value: 30, color: '#00D47E' },
  { name: 'Pharma', value: 15, color: '#2dd4bf' },
  { name: 'Store', value: 10, color: '#fb923c' },
];

export default function SaaSAdminDashboard() {
  const { toast } = useToast();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States pour ajouter un client
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const [marketingTarget, setMarketingTarget] = useState("all");
  const [marketingTitle, setMarketingTitle] = useState("");
  const [marketingMessage, setMarketingMessage] = useState("");

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketingTitle || !marketingMessage) return;
    
    try {
      await api.notifications.create({
        title: marketingTitle,
        message: marketingMessage,
        target_audience: marketingTarget,
        type: 'system'
      });
      toast({title: "Envoyé", description: "Notification diffusée avec succès."});
      setMarketingTitle("");
      setMarketingMessage("");
    } catch (error: any) {
      toast({variant: "destructive", title: "Erreur", description: error.message});
    }
  };

  const loadData = async () => {
    try {
      const data = await api.clinics.list();
      setClinics(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les clients." });
    } finally {
      setLoading(false);
    }
  };

  const toggleClinicStatus = async (clinicId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await api.clinics.update({ id: clinicId, status: newStatus });
      toast({ title: "Statut mis à jour", description: `Le tenant est désormais ${newStatus}.` });
      loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le statut." });
    }
  };

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newAdminEmail || !newAdminPassword) return;

    try {
      const clinicResponse = await api.clinics.create({ name: newClinicName, status: 'active' });

      if (clinicResponse.status === 'success') {
        const newClinicId = clinicResponse.id;
        await api.users.create({
          email: newAdminEmail,
          password: newAdminPassword,
          role: 'clinic_admin',
          clinicId: newClinicId,
          name: `Admin ${newClinicName}`
        });

        toast({ title: "Succès", description: `Le client ${newClinicName} a été intégré.` });
        loadData();
        setIsAddDialogOpen(false);
        setNewClinicName("");
        setNewAdminEmail("");
        setNewAdminPassword("");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur d'intégration", description: error.message });
    }
  };

  if (loading) return null;

  return (
    // Application of dark mode / premium SAAS theme locally
    <div className="min-h-[calc(100vh-4rem)] rounded-xl overflow-hidden -m-4 md:-m-6 bg-[#050b14] text-slate-300 dark">
      <Tabs defaultValue="dashboard" className="flex flex-col h-full md:flex-row">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-[#0A1628] border-r border-[#1e293b] p-4 flex flex-col shrink-0">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1E6FFF] to-blue-800 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              K
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight leading-tight">Kiam Master</h1>
              <p className="text-[10px] text-[#00D47E] uppercase font-bold tracking-widest">Super Admin</p>
            </div>
          </div>

          <TabsList className="flex md:flex-col h-auto justify-start bg-transparent p-0 gap-1 overflow-x-auto items-stretch">
            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 hidden md:block">Plateforme</div>
            <TabsTrigger 
              value="dashboard" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <LayoutDashboard className="w-5 h-5" /> <span className="hidden md:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <Building2 className="w-5 h-5" /> <span className="hidden md:inline">Clients & Tenants</span>
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <CreditCard className="w-5 h-5" /> <span className="hidden md:inline">Facturation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="modules" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <Blocks className="w-5 h-5" /> <span className="hidden md:inline">Licences Modules</span>
            </TabsTrigger>

            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 hidden md:block">Opérations</div>
            <TabsTrigger 
              value="support" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <LifeBuoy className="w-5 h-5" /> <span className="hidden md:inline">Support Tickets</span>
            </TabsTrigger>
            <TabsTrigger 
              value="marketing" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <Megaphone className="w-5 h-5" /> <span className="hidden md:inline">Marketing</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <TrendingUp className="w-5 h-5" /> <span className="hidden md:inline">Rapports</span>
            </TabsTrigger>

            <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 hidden md:block">Système</div>
            <TabsTrigger 
              value="config" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <Settings className="w-5 h-5" /> <span className="hidden md:inline">Configuration</span>
            </TabsTrigger>
            <TabsTrigger 
              value="admins" 
              className="justify-start gap-3 w-full px-4 py-2.5 rounded-lg text-slate-400 hover:text-white data-[state=active]:bg-[#1E6FFF] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(30,111,255,0.3)]"
            >
              <Shield className="w-5 h-5" /> <span className="hidden md:inline">Équipe Kiam</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050b14]">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">

            {/* TAB: DASHBOARD */}
            <TabsContent value="dashboard" className="mt-0 h-full w-full outline-none">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Vue d'ensemble</h2>
                  <p className="text-slate-400 text-sm">Performance globale de la plateforme SaaS</p>
                </div>
                <select className="bg-[#0A1628] border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none">
                  <option>30 derniers jours</option>
                  <option>Ce trimestre</option>
                  <option>Cette année</option>
                </select>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 border-l-4 border-l-[#1E6FFF] shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 text-sm font-medium">Revenus Mensuels (MRR)</p>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><DollarSign className="w-5 h-5" /></div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">12.5M <span className="text-lg font-medium text-slate-500">XAF</span></h3>
                  <p className="text-[#00D47E] text-sm flex items-center gap-1 font-medium"><TrendingUp className="w-4 h-4" /> +14.5% vs mois prec.</p>
                </div>
                
                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 border-l-4 border-l-[#00D47E] shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 text-sm font-medium">Clients Actifs (Tenants)</p>
                    <div class="p-2 bg-[#00D47E]/10 rounded-lg text-[#00D47E]"><Building2 className="w-5 h-5" /></div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">{clinics.filter(c => c.status === 'active').length} / {clinics.length}</h3>
                  <p className="text-[#00D47E] text-sm flex items-center gap-1 font-medium"><UserPlus className="w-4 h-4" /> +2 nouveaux</p>
                </div>

                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 border-l-4 border-l-amber-500 shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 text-sm font-medium">Tickets Support Ouverts</p>
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Ticket className="w-5 h-5" /></div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">18</h3>
                  <p className="text-slate-400 text-sm flex items-center gap-1 font-medium"><Clock className="w-4 h-4" /> SLA moyen : 1h 45m</p>
                </div>

                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 border-l-4 border-l-rose-500 shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 text-sm font-medium">Taux de Churn</p>
                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><UserMinus className="w-5 h-5" /></div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">1.2%</h3>
                  <p className="text-[#00D47E] text-sm flex items-center gap-1 font-medium"><CheckCircle className="w-4 h-4" /> Objectif atteint</p>
                </div>
              </div>

              {/* Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 shadow-md lg:col-span-2">
                  <h3 className="text-lg font-bold text-white mb-6">Évolution des Souscriptions Nettes</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0A1628', borderColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#1E6FFF' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#1E6FFF" strokeWidth={3} dot={{ r: 4, fill: '#0A1628', stroke: '#1E6FFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 shadow-md">
                  <h3 className="text-lg font-bold text-white mb-4">Répartition par Module</h3>
                  <div className="h-48 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={moduleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {moduleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0A1628', borderColor: '#1e293b', color: '#fff', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3">
                    {moduleData.map((mod, i) => (
                      <div key={i} className="flex justify-between text-sm items-center">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: mod.color}}></div> <span className="text-slate-300">{mod.name}</span></span> 
                        <span className="font-bold text-white">{mod.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: CLIENTS */}
            <TabsContent value="clients" className="mt-0 outline-none">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Gestion des Clients / Tenants</h2>
                  <p className="text-slate-400 text-sm">Liste des entreprises utilisant la plateforme Kiam</p>
                </div>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1E6FFF] hover:bg-blue-600 text-white border-0 shadow-[0_0_15px_rgba(30,111,255,0.4)]">
                      <Plus className="mr-2 h-4 w-4" />
                      Nouveau Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0A1628] text-white border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Créer un nouveau Tenant SaaS</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddClinic} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="cname" className="text-slate-300">Nom de l'entreprise</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <Input id="cname" required value={newClinicName} onChange={e => setNewClinicName(e.target.value)} className="pl-9 bg-[#050b14] border-slate-700 text-white" placeholder="Nom officiel..." />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cemail" className="text-slate-300">Email Administrateur Principal</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <Input id="cemail" required type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="pl-9 bg-[#050b14] border-slate-700 text-white" placeholder="admin@client.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpass" className="text-slate-300">Mot de passe temporaire</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                          <Input id="cpass" required type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="pl-9 bg-[#050b14] border-slate-700 text-white" placeholder="••••••••" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-[#1E6FFF] hover:bg-blue-600 text-white">Déployer l'instance</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-[#0A1628] rounded-xl border border-slate-800 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-700 relative">
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Identifiant (Tenant ID)</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Entreprise / Clinique</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Date de création</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Accès & Statut</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {clinics.map((clinic) => (
                        <tr key={clinic.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="font-mono text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded inline-block border border-blue-800/50">{clinic.id}</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="font-bold text-white text-base">{clinic.name}</div>
                             <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Blocks className="w-3 h-3" /> Module: Kiam Health</div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                             {new Date(clinic.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Switch 
                                checked={clinic.status === 'active'}
                                onCheckedChange={() => toggleClinicStatus(clinic.id, clinic.status)}
                                className="data-[state=checked]:bg-[#00D47E]"
                              />
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${clinic.status === 'active' ? 'bg-[#00D47E]/10 text-[#00D47E] border-[#00D47E]/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}>
                                {clinic.status === 'active' ? 'Opérationnel' : 'Suspendu'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-slate-500 hover:text-white p-2 rounded hover:bg-slate-700 transition-colors">
                               <Edit className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {clinics.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">Aucun client trouvé dans la base de données SaaS.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Other Placeholders */}
            <TabsContent value="billing" className="mt-0 h-full flex items-center justify-center outline-none">
                <div className="text-center text-slate-500 max-w-md">
                    <LifeBuoy className="w-16 h-16 mx-auto mb-4 opacity-50 text-slate-600" />
                    <h3 className="text-xl font-bold text-white mb-2">Paiements & Abonnements</h3>
                    <p>Interface de gestion connectée à Stripe et aux APIs Mobile Money pour le recouvrement SaaS.</p>
                </div>
            </TabsContent>

            <TabsContent value="modules" className="mt-0 outline-none">
              <h2 className="text-2xl font-bold text-white mb-6">Attribution des Licences</h2>
              <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 shadow-md">
                 <h3 className="font-bold text-white mb-4 border-b border-slate-700 pb-3">Exemple: Clinique Marion (Plan Pro)</h3>
                 <div className="space-y-5">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-white font-bold text-sm">Dossier Patient Électronique (DPI)</p>
                          <p className="text-xs text-slate-400 mt-1">Inclus pde base dans Kiam Health</p>
                       </div>
                       <Switch checked={true} className="data-[state=checked]:bg-[#1E6FFF]" />
                    </div>
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-white font-bold text-sm">Ressources Humaines (Paie)</p>
                          <p className="text-xs text-slate-400 mt-1">Module Optionnel Premium</p>
                       </div>
                       <Switch checked={true} className="data-[state=checked]:bg-[#1E6FFF]" />
                    </div>
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-white font-bold text-sm">Comptabilité Analytique Avancée</p>
                          <p className="text-xs text-amber-500 mt-1 font-medium">Nécessite le plan Enterprise</p>
                       </div>
                       <Switch checked={false} />
                    </div>
                 </div>
              </div>
            </TabsContent>

            {/* TAB: SUPPORT */}
            <TabsContent value="support" className="mt-0 outline-none">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Tickets de Support</h2>
                  <p className="text-slate-400 text-sm">Gérez les demandes d'assistance des cliniques clientes.</p>
                </div>
                <Button className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                  <Filter className="w-4 h-4 mr-2" /> Filtrer par statut
                </Button>
              </div>

              <div className="space-y-4">
                {[
                  { id: "TK-1042", client: "Clinique Marion", subject: "Impossible d'ajouter un lot en pharmacie", status: "open", time: "Il y a 10 min", prio: "Haute" },
                  { id: "TK-1041", client: "Pharmacie Nouvelle", subject: "Questions sur la facturation annuelle", status: "pending", time: "Il y a 2 heures", prio: "Normale" },
                  { id: "TK-1040", client: "Hôpital Général", subject: "Erreur 500 sur le rapport comptable", status: "closed", time: "Hier", prio: "Critique" }
                ].map((ticket) => (
                  <div key={ticket.id} className="bg-[#0A1628] rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-700 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${ticket.status === 'open' ? 'bg-rose-500/10 text-rose-500' : ticket.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-[#00D47E]/10 text-[#00D47E]'}`}>
                         <LifeBuoy className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-slate-500 border border-slate-700 px-2 py-0.5 rounded bg-[#050b14]">{ticket.id}</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${ticket.prio === 'Critique' || ticket.prio === 'Haute' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>{ticket.prio}</span>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-1">{ticket.subject}</h4>
                        <p className="text-sm text-slate-400">Par <strong className="text-slate-300">{ticket.client}</strong> • {ticket.time}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="shrink-0 bg-transparent border-slate-700 text-white hover:bg-slate-800">
                      Répondre
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB: MARKETING */}
            <TabsContent value="marketing" className="mt-0 outline-none">
              <h2 className="text-2xl font-bold text-white mb-6">Marketing & Notifications Multi-Tenants</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 shadow-md">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E6FFF]/10 flex items-center justify-center text-[#1E6FFF]"><Mail className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-white">Nouvelle Notification / Email</h3>
                      <p className="text-xs text-slate-400">Envoyer un message de masse à tous les administrateurs de cliniques</p>
                    </div>
                  </div>
                  
                  <form className="space-y-4" onSubmit={handleSendNotification}>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Audience cible</Label>
                      <select value={marketingTarget} onChange={e => setMarketingTarget(e.target.value)} className="w-full bg-[#050b14] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#1E6FFF]">
                        <option value="all">Tous les clients actifs (Subscribers)</option>
                        <option value="kiam_health">Clients "Kiam Health" uniquement</option>
                        <option value="kiam_pharma">Clients "Kiam Pharmacy" uniquement</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Sujet de la communication</Label>
                      <Input value={marketingTitle} onChange={e => setMarketingTitle(e.target.value)} required className="bg-[#050b14] border-slate-700 text-white" placeholder="Ex: Déploiement de la version 2.4..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Contenu du message (Markdown supporté)</Label>
                      <textarea value={marketingMessage} onChange={e => setMarketingMessage(e.target.value)} required rows={5} className="w-full bg-[#050b14] border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#1E6FFF] resize-none" placeholder="Rédigez votre annonce ici..."></textarea>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Switch id="mail-copy" /> <Label htmlFor="mail-copy" className="text-slate-400 text-sm">Envoyer également via Email (en plus de l'alerte in-app)</Label>
                    </div>
                    <Button type="submit" disabled={!marketingTitle || !marketingMessage} className="w-full bg-[#1E6FFF] hover:bg-blue-600 text-white"><Send className="w-4 h-4 mr-2" /> Diffuser la campagne</Button>
                  </form>
                </div>

                <div className="bg-[#0A1628] rounded-xl p-6 border border-slate-800 shadow-md h-fit">
                  <h3 className="font-bold text-white mb-4">Campagnes Récentes</h3>
                  <div className="space-y-4">
                    <div className="border-l-2 border-l-[#00D47E] pl-4 py-1">
                      <p className="text-white font-bold text-sm">Nouveau module: Kiam Store !</p>
                      <p className="text-xs text-slate-500 mt-1">Envoyé le 12 Fév 2026 • 100% reçus</p>
                    </div>
                    <div className="border-l-2 border-l-slate-700 pl-4 py-1">
                      <p className="text-white font-bold text-sm">Maintenance de serveur - Prévue ce vendredi</p>
                      <p className="text-xs text-slate-500 mt-1">Envoyé le 01 Fév 2026 • 98% reçus</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: CONFIGURATION */}
            <TabsContent value="config" className="mt-0 outline-none">
              <h2 className="text-2xl font-bold text-white mb-6">Maintien & Configuration Serveur</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Maintenance Card */}
                <div className="bg-[#0A1628] rounded-xl border border-rose-500/30 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500"><Power className="w-6 h-6" /></div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Mode Maintenance Global</h3>
                        <p className="text-xs text-slate-400">Verrouiller tout l'accès aux clients</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                      L'activation du mode maintenance déconnectera de force tous les utilisateurs des cliniques et bloquera l'API. Seuls les Super Admins (Équipe Kiam) pourront se connecter. À utiliser avec grande précaution lors des migrations critiques.
                    </p>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#050b14] border border-rose-500/20">
                      <div>
                        <p className="text-rose-400 font-bold text-sm">Hors ligne pour tous les Tenants</p>
                        <p className="text-xs text-slate-500">Statut actuel: Inactif</p>
                      </div>
                      <Switch className="data-[state=checked]:bg-rose-500" />
                    </div>
                  </div>
                </div>

                {/* System Update Card */}
                <div className="bg-[#0A1628] rounded-xl border border-slate-800 shadow-md">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#1E6FFF]/10 rounded-lg text-[#1E6FFF]"><Server className="w-6 h-6" /></div>
                      <div>
                        <h3 className="font-bold text-white text-lg">Version Système & Déploiements</h3>
                        <p className="text-xs text-slate-400">Version actuelle: <span className="font-mono text-[#00D47E]">v2.4.1 (Stable)</span></p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-blue-400 font-bold text-sm">Mise à jour v2.5 disponible</span>
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 rounded">Beta</span>
                        </div>
                        <p className="text-xs text-slate-400">Inclut de nouveaux index pour accélérer les requêtes laboratoire.</p>
                      </div>
                    </div>
                    
                    <Button onClick={() => {toast({title:"MAJ Lancée", description: "Veuillez patienter pendant le déploiement..."})}} className="w-full bg-[#050b14] hover:bg-slate-800 text-white border border-slate-700">
                      <RefreshCw className="w-4 h-4 mr-2" /> Forcer la Synchronisation des Migrations SQL
                    </Button>
                  </div>
                </div>

              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0 outline-none flex items-center justify-center p-20">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[#1E6FFF] opacity-50" />
                <h3 className="text-white font-bold text-xl mb-2">Centre de Rapports Personnalisés</h3>
                <p className="text-slate-400 max-w-sm">Exporter les logs, analyser la rétention, et générer les rapports trimestriels pour le conseil Kiam.</p>
              </div>
            </TabsContent>

            <TabsContent value="admins" className="mt-0 outline-none flex items-center justify-center p-20">
              <div className="text-center">
                <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-[#00D47E] opacity-50" />
                <h3 className="text-white font-bold text-xl mb-2">Accès Super-Administrateurs</h3>
                <p className="text-slate-400 max-w-sm">Gérez les développeurs, le support technique et vos agents de facturation internes ayant un accès Kiam Master.</p>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
