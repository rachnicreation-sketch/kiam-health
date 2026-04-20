import { useState } from "react";
import { MessageSquare, Send, Megaphone, CheckCircle2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

export default function SaaSMarketing() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [loading, setLoading] = useState(false);

  const [announcements] = useState([
    { id: 1, title: "Maintenance Programmée", message: "Le système sera indisponible ce dimanche de 02:00 à 04:00 (GMT) pour une mise à jour mineure.", target: "Tous les locataires", date: "18 Juin 2026", status: "envoyé" },
    { id: 2, title: "Nouveau Module: Facturation Pro", message: "Découvrez notre nouveau système de facturation avancé disponible dès demain dans l'Add-on Store.", target: "Secteur: Santé", date: "15 Juin 2026", status: "envoyé" },
    { id: 3, title: "Rappel de paiement", message: "Merci de bien vouloir régulariser votre facture avant le 30 du mois pour éviter toute suspension de service.", target: "Plans Basic", date: "10 Juin 2026", status: "envoyé" },
  ]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.saas.createAnnouncement({ title, content: message, target_sector: target });
      toast({ title: "Message diffusé", description: "L'annonce a bien été envoyée à la cible.", variant: "default" });
      setTitle("");
      setMessage("");
    } catch (e: any) {
      toast({ title: "Erreur", description: "L'envoi a échoué. " + e.message, variant: "destructive" });
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
              <MessageSquare className="w-8 h-8 text-pink-600" /> Communications
            </h1>
            <p className="text-slate-500 mt-1">Créez et diffusez des annonces globales à vos locataires.</p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:px-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* COMPOSE SECTION */}
        <div className="lg:col-span-5 space-y-6">
           <Card className="bg-white border-slate-200 p-6 rounded-[2rem] shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                 <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                    <Megaphone className="w-6 h-6 text-pink-600" />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-900">Nouvelle Annonce</h2>
                    <p className="text-xs text-slate-500">Message Broadcast Push</p>
                 </div>
              </div>
              
              <form onSubmit={handleBroadcast} className="space-y-5">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre du Message</label>
                    <Input required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 bg-white border-slate-300 focus:border-pink-500" placeholder="Ex: Mise à jour v2.3..." />
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audience Cible</label>
                    <select value={target} onChange={e => setTarget(e.target.value)} className="w-full mt-1 bg-white border border-slate-300 rounded-md p-2 text-sm text-slate-700 focus:border-pink-500 outline-none">
                       <option value="all">Tous les locataires (Sans exception)</option>
                       <option value="health">Secteur: Santé (Cliniques / Hôpitaux)</option>
                       <option value="hotel">Secteur: Hôtellerie</option>
                       <option value="school">Secteur: Éducation</option>
                       <option value="plan_pro">Locataires avec Plan Pro / Enterprise</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contenu</label>
                    <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full mt-1 bg-white border border-slate-300 rounded-md p-3 text-sm text-slate-700 focus:border-pink-500 outline-none resize-none placeholder-slate-400" placeholder="Tapez votre message ici..." />
                 </div>

                 <Button disabled={loading} type="submit" className="w-full font-bold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-[0_0_15px_rgba(219,39,119,0.2)]">
                    <Send className="w-4 h-4 mr-2" /> 
                    {loading ? "Diffusion en cours..." : "Diffuser maintenant"}
                 </Button>
              </form>
           </Card>
        </div>

        {/* HISTORY SECTION */}
        <div className="lg:col-span-7 space-y-6">
           <Card className="bg-white border-slate-200 p-6 rounded-[2rem] h-full flex flex-col shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                 <h2 className="text-lg font-bold text-slate-900 border-b-2 border-pink-500 pb-1">Annonces Précédentes</h2>
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="bg-white border-slate-300 rounded-full pl-10 text-sm focus:border-pink-500 w-full" placeholder="Rechercher une annonce..." />
                 </div>
              </div>

              <div className="space-y-4 flex-1">
                 {announcements.map((ann, i) => (
                    <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-pink-300 transition-colors relative overflow-hidden group">
                       <div className="flex justify-between items-start mb-3">
                          <h3 className="text-slate-900 font-bold text-base">{ann.title}</h3>
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-0 flex items-center gap-1 font-bold shadow-sm">
                             <CheckCircle2 className="w-3 h-3" /> {ann.status}
                          </Badge>
                       </div>
                       <p className="text-slate-600 text-sm leading-relaxed mb-4">{ann.message}</p>
                       <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span className="bg-slate-200 px-2.5 py-1 rounded-md text-slate-700 border border-slate-300">{ann.target}</span>
                          <span>{ann.date}</span>
                       </div>
                       
                       <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 ))}
              </div>
           </Card>
        </div>

      </div>
    </div>
  );
}
