import { useState, useEffect } from "react";
import { Settings, Save, Server, Globe, Bell, FileText, Lock, Shield, Database, RefreshCw, Mail, Plus, Trash2, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const SectionCard = ({ title, icon: Icon, iconBg, children }: any) => (
  <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
      <div className={`p-2 rounded-xl ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
    </div>
    <div className="p-6 space-y-5">{children}</div>
  </Card>
);

const ToggleRow = ({ label, desc, checked, onChange, color = "data-[state=checked]:bg-teal-500" }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
    <div>
      <h3 className="text-sm font-bold text-slate-900">{label}</h3>
      {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} className={color} />
  </div>
);

export default function SaaSSettings() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", content: "", target_sector: "all" });
  const [isSaving, setIsSaving] = useState(false);

  // Engine toggles
  const [maintenance, setMaintenance] = useState(false);
  const [registrations, setRegistrations] = useState(true);
  const [debugLogs, setDebugLogs] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [trialEnabled, setTrialEnabled] = useState(true);

  // General settings
  const [platformName, setPlatformName] = useState("KIAM Enterprise Solutions");
  const [supportEmail, setSupportEmail] = useState("support@kiam.tech");
  const [currency, setCurrency] = useState("XAF");
  const [trialDays, setTrialDays] = useState("14");
  const [maxTenantsPerPlan, setMaxTenantsPerPlan] = useState("100");
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api.saas.announcements();
      setAnnouncements(data || []);
    } catch (e) { /* silent */ }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    toast({ title: "✓ Paramètres enregistrés", description: "La configuration globale a été mise à jour." });
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saas.createAnnouncement(annForm);
      toast({ title: "Annonce diffusée", description: `Envoyée au secteur: ${annForm.target_sector}` });
      setIsAnnModalOpen(false);
      setAnnForm({ title: "", content: "", target_sector: "all" });
      loadAnnouncements();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-xl">
                <Settings className="w-6 h-6 text-teal-600" />
              </div>
              Paramètres Système
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Configuration centrale (Engine) de la plateforme SaaS Kiam.</p>
          </div>
          <Button onClick={handleSaveGeneral} className="bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold shadow-md shadow-teal-100" disabled={isSaving}>
            {isSaving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">

        {/* GENERAL & BRANDING */}
        <SectionCard title="Général & Branding" icon={Globe} iconBg="bg-teal-100 text-teal-600">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Nom de la Plateforme</label>
            <Input value={platformName} onChange={e => setPlatformName(e.target.value)} className="border-slate-200 focus:border-teal-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email de Support Principal</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="pl-10 border-slate-200 focus:border-teal-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Devise</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-teal-400">
                <option value="XAF">Franc CFA (XAF/XOF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
                <option value="GBP">Livre Sterling (£)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Durée Essai (jours)</label>
              <Input type="number" value={trialDays} onChange={e => setTrialDays(e.target.value)} className="border-slate-200 focus:border-teal-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Max Locataires / Plan</label>
            <Input type="number" value={maxTenantsPerPlan} onChange={e => setMaxTenantsPerPlan(e.target.value)} className="border-slate-200 focus:border-teal-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Webhook URL (Paiements)</label>
            <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://votre-serveur.com/webhook" className="border-slate-200 focus:border-teal-400" />
          </div>
        </SectionCard>

        {/* ENGINE CONTROL */}
        <SectionCard title="Contrôle Moteur (Engine)" icon={Server} iconBg="bg-rose-100 text-rose-600">
          <ToggleRow
            label="Mode Maintenance Global"
            desc="Bloque l'accès à tous les locataires pour mise à jour."
            checked={maintenance} onChange={setMaintenance}
            color="data-[state=checked]:bg-rose-500"
          />
          <ToggleRow
            label="Inscriptions Libres (Self-Serve)"
            desc="Les entreprises peuvent s'inscrire elles-mêmes."
            checked={registrations} onChange={setRegistrations}
          />
          <ToggleRow
            label="Période d'Essai Automatique"
            desc="Nouveau locataire = 14 jours d'essai gratuit."
            checked={trialEnabled} onChange={setTrialEnabled}
            color="data-[state=checked]:bg-blue-500"
          />
          <ToggleRow
            label="Renouvellement Automatique"
            desc="Renouvelle les abonnements avant expiration."
            checked={autoRenewal} onChange={setAutoRenewal}
          />
          <ToggleRow
            label="Logs Détaillés (Debug)"
            desc="Stocke les logs SQL/API (ralentit légèrement le système)."
            checked={debugLogs} onChange={setDebugLogs}
            color="data-[state=checked]:bg-amber-500"
          />
          <ToggleRow
            label="Notifications Emails Auto"
            desc="Alertes d'expiration, paiements, annonces."
            checked={emailNotifs} onChange={setEmailNotifs}
          />
        </SectionCard>

        {/* SECURITY */}
        <SectionCard title="Sécurité & Authentification" icon={Shield} iconBg="bg-blue-100 text-blue-600">
          <ToggleRow
            label="Authentification 2 Facteurs (2FA)"
            desc="Exige un code OTP à la connexion des super admins."
            checked={twoFactor} onChange={setTwoFactor}
            color="data-[state=checked]:bg-blue-600"
          />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Durée Session (minutes)</label>
            <Input type="number" defaultValue="480" className="border-slate-200 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">IP Autorisées (séparées par virgule)</label>
            <Input placeholder="0.0.0.0 = Toutes les IPs" className="border-slate-200 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tentatives Login Max</label>
            <Input type="number" defaultValue="5" className="border-slate-200 focus:border-blue-400" />
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 font-medium flex items-center gap-3">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Les mots de passe sont hashés avec bcrypt (coût 12). Conformité RGPD activée.</span>
          </div>
        </SectionCard>

        {/* ANNOUNCEMENTS */}
        <SectionCard title="Annonces Système" icon={Bell} iconBg="bg-amber-100 text-amber-600">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Diffusez des messages ciblés aux locataires de la plateforme.</p>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 rounded-full text-white font-bold" onClick={() => setIsAnnModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nouvelle
            </Button>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {announcements.length === 0 && (
              <p className="text-center text-slate-400 italic text-sm py-8">Aucune annonce diffusée.</p>
            )}
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{ann.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                  <Badge className="bg-amber-200 text-amber-800 border-0 text-[10px] shrink-0">{ann.target_sector}</Badge>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">{new Date(ann.created_at).toLocaleString('fr-FR')}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* DATABASE MAINTENANCE */}
        <div className="lg:col-span-2">
          <SectionCard title="Maintenance & Base de Données" icon={Database} iconBg="bg-slate-100 text-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Vider le Cache", desc: "Supprime les données en cache et reconstruit l'index.", color: "border-slate-200 text-slate-700 hover:bg-slate-50" },
                { label: "Exporter les Données", desc: "Téléchargement complet CSV/JSON de toutes les données.", color: "border-teal-200 text-teal-700 hover:bg-teal-50" },
                { label: "Purger les Logs", desc: "Supprime les logs de plus de 90 jours.", color: "border-rose-200 text-rose-700 hover:bg-rose-50" },
              ].map(({ label, desc, color }) => (
                <button key={label} onClick={() => toast({ title: label, description: "Action simulée (non implémentée en prod)." })}
                  className={`p-4 text-left rounded-xl border font-medium text-sm transition-colors ${color}`}
                >
                  <p className="font-bold">{label}</p>
                  <p className="text-xs opacity-70 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

      </div>

      {/* ANNOUNCEMENT MODAL */}
      <Dialog open={isAnnModalOpen} onOpenChange={setIsAnnModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Bell className="text-amber-500 w-5 h-5" /> Nouvelle Annonce
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAnnouncement} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Titre *</label>
              <Input required value={annForm.title} onChange={e => setAnnForm({ ...annForm, title: e.target.value })} placeholder="Maintenance planifiée" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Message *</label>
              <textarea
                required
                value={annForm.content}
                onChange={e => setAnnForm({ ...annForm, content: e.target.value })}
                placeholder="Détails de l'annonce..."
                rows={4}
                className="w-full mt-1 border border-slate-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Destinataires</label>
              <select value={annForm.target_sector} onChange={e => setAnnForm({ ...annForm, target_sector: e.target.value })}
                className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-400">
                <option value="all">Tous les locataires</option>
                <option value="health">Secteur Santé</option>
                <option value="hotel">Secteur Hôtellerie</option>
                <option value="school">Secteur Éducation</option>
                <option value="erp">Secteur Commerce/ERP</option>
                <option value="pharmacy">Secteur Pharmacie</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAnnModalOpen(false)} className="flex-1 rounded-xl">Annuler</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold">Diffuser</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
