import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  User, 
  Mail, 
  Lock, 
  ShieldCheck,
  Zap,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    sector: "health",
    plan_id: "plan_pro"
  });

  const sectors = [
    { id: "health", label: "Santé (Clinique / Hôpital)", icon: "🏥" },
    { id: "hotel", label: "Hôtellerie", icon: "🏨" },
    { id: "school", label: "Éducation (École / Lycée)", icon: "🏫" },
    { id: "erp", label: "Commerce / ERP Global", icon: "🏪" },
    { id: "shop", label: "Petite Boutique / Pharmacie", icon: "💊" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.tenants.create(formData);
      toast({
        title: "Compte créé avec succès !",
        description: "Votre environnement Kiam est prêt. Connectez-vous maintenant.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de la création de votre compte.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans uppercase-none">
      {/* Left Side: Marketing Info */}
      <div className="hidden lg:flex lg:w-2/5 bg-blue-600 p-12 text-white flex-col justify-between relative overflow-hidden italic-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex items-center gap-2 mb-12">
          <div className="bg-white p-2 rounded-xl">
            <Building2 className="text-blue-600 w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter">KIAM<span className="opacity-80">SaaS</span></span>
        </div>

        <div className="relative z-10 space-y-8">
          <Badge className="bg-blue-500 text-white border-blue-400 px-4 py-1 rounded-full font-bold">
            14 Jours d'Essai Gratuit
          </Badge>
          <h2 className="text-5xl font-black leading-[0.9] tracking-tight">
            Démarrez votre transformation <span className="italic">digitale</span> aujourd'hui.
          </h2>
          <div className="space-y-4">
            {[
              "Accès immédiat à tous les modules sélectionnés",
              "Importation de vos données existantes assistée",
              "Hébergement Cloud haute disponibilité inclus",
              "Assistance technique 24/7 (SLA 99.9%)"
            ].map((text, i) => (
              <div key={i} className="flex gap-3 items-center font-medium opacity-90">
                <CheckCircle2 className="w-5 h-5 text-blue-200 shrink-0" />
                <span className="text-lg">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-12 border-t border-white/20">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-slate-200"></div>
              ))}
            </div>
            <p className="text-sm font-bold opacity-80 uppercase tracking-widest">+50 institutions nous font confiance</p>
          </div>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex-1 p-6 sm:p-12 lg:p-24 flex items-center justify-center bg-white italic-none">
        <div className="w-full max-w-xl space-y-10">
          <Link to="/" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Créez votre <span className="text-blue-600">Espace Kiam.</span></h1>
            <p className="text-slate-500 font-medium">Rejoignez l'élite des gestionnaires numériques.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Business Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">1</span>
                Informations Établissement
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Nom de l'établissement</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      required
                      placeholder="Clinique Horizon..." 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Secteur d'activité</label>
                  <select 
                    className="w-full h-12 rounded-md bg-slate-50 border border-slate-200 px-3 text-sm font-bold focus:bg-white outline-none transition-all shadow-sm"
                    value={formData.sector}
                    onChange={(e) => setFormData({...formData, sector: e.target.value})}
                  >
                    {sectors.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Admin Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">2</span>
                Compte Administrateur
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      required
                      placeholder="Dr. Jean Dupont" 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Email professionnel</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      required
                      type="email"
                      placeholder="admin@votreclinique.com" 
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    required
                    type="password"
                    placeholder="Min. 8 caractères" 
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-sm"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Plan Selector */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Choix du Plan (L'essai est gratuit sur tous les plans)</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "plan_basic", label: "Basic" },
                  { id: "plan_pro", label: "Professional" },
                  { id: "plan_ent", label: "Enterprise" }
                ].map(p => (
                  <div 
                    key={p.id}
                    onClick={() => setFormData({...formData, plan_id: p.id})}
                    className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all font-black text-sm uppercase tracking-tighter ${
                      formData.plan_id === p.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-white text-slate-400 opacity-60'
                    }`}
                  >
                    {p.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <Button disabled={loading} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 group transition-all">
                {loading ? "Déploiement en cours..." : "Créer mon cockpit Kiam"}
                <Zap className="ml-2 w-5 h-5 group-hover:scale-125 transition-transform" />
              </Button>
              <p className="text-center text-xs text-slate-400 font-medium">
                En cliquant sur ce bouton, vous acceptez nos <Link to="#" className="underline font-bold">Conditions Générales</Link> et notre <Link to="#" className="underline font-bold">Politique de Confidentialité</Link>.
              </p>
            </div>
          </form>

          <p className="text-center text-slate-500 font-bold">
            Vous avez déjà un compte ? <Link to="/login" className="text-blue-600 hover:underline">Connectez-vous ici</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
