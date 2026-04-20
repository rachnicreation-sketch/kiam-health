import { useState } from "react";
import { Settings, Save, Server, Globe, Bell, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function SaaSSettings() {
  const { toast } = useToast();
  const [maintenance, setMaintenance] = useState(false);
  const [registrations, setRegistrations] = useState(true);
  const [debugLogs, setDebugLogs] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const handleSave = () => {
    toast({ title: "Paramètres enregistrés", description: "La configuration globale a été mise à jour." });
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-12">
      
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200 px-6 lg:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <Settings className="w-8 h-8 text-teal-600" /> Paramètres Système
            </h1>
            <p className="text-slate-500 mt-1">Configuration centrale (Engine) de la plateforme SaaS Kiam.</p>
          </div>
          <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold">
            <Save className="w-4 h-4 mr-2" /> Enregistrer les modifications
          </Button>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        
        {/* PARAMS GENERAUX */}
        <Card className="bg-white border-slate-200 p-8 rounded-[2rem] shadow-sm">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-teal-50 rounded-lg">
                <Globe className="w-5 h-5 text-teal-600" />
             </div>
             <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Général & Branding</h2>
           </div>
           
           <div className="space-y-5">
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom de la Plateforme SaaS</label>
                 <Input defaultValue="KIAM Enterprise Solutions" className="mt-1 bg-white border-slate-300 focus:border-teal-500" />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email de Support Principal</label>
                 <Input defaultValue="support@kiam.tech" className="mt-1 bg-white border-slate-300 focus:border-teal-500" />
              </div>
              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Devise de Facturation par défaut</label>
                 <select className="w-full mt-1 bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-700 focus:border-teal-500 outline-none">
                    <option>Franc CFA (XAF/XOF/CDF)</option>
                    <option>Euro (€)</option>
                    <option>Dollar Américain ($)</option>
                 </select>
              </div>
           </div>
        </Card>

        {/* PARAMS SYSTEME & CONTROLE */}
        <Card className="bg-white border-slate-200 p-8 rounded-[2rem] shadow-sm">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <div className="p-2 bg-rose-50 rounded-lg">
                <Server className="w-5 h-5 text-rose-600" />
             </div>
             <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Contrôle Moteur (Engine)</h2>
           </div>
           
           <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                 <div>
                    <h3 className="text-slate-900 font-bold text-sm">Mode Maintenance Global</h3>
                    <p className="text-xs text-slate-500">Bloque l'accès à tous les locataires pour mise à jour.</p>
                 </div>
                 <Switch checked={maintenance} onCheckedChange={setMaintenance} className="data-[state=checked]:bg-rose-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                 <div>
                    <h3 className="text-slate-900 font-bold text-sm">Inscriptions Libres (Self-Serve)</h3>
                    <p className="text-xs text-slate-500">Permet aux entreprises de s'inscrire toutes seules.</p>
                 </div>
                 <Switch checked={registrations} onCheckedChange={setRegistrations} className="data-[state=checked]:bg-teal-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                 <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                       <h3 className="text-slate-900 font-bold text-sm">Logs Détaillés (Debug)</h3>
                       <p className="text-xs text-slate-500">Stocke les logs SQL/API dans la BDD (Ralentit le système).</p>
                    </div>
                 </div>
                 <Switch checked={debugLogs} onCheckedChange={setDebugLogs} className="data-[state=checked]:bg-amber-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                 <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <div>
                       <h3 className="text-slate-900 font-bold text-sm">Notifications Emails Auto</h3>
                       <p className="text-xs text-slate-500">Alerte d'expiration, paiements, annonces.</p>
                    </div>
                 </div>
                 <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} className="data-[state=checked]:bg-blue-600" />
              </div>
           </div>
        </Card>

      </div>
    </div>
  );
}
