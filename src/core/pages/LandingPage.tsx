import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building2, 
  Stethoscope, 
  Hotel, 
  GraduationCap, 
  Store, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Globe,
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const modules = [
    {
      title: "Kiam Health",
      icon: Stethoscope,
      description: "Gestion hospitalière complète : patients, consultations, pharmacie et facturation.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/health"
    },
    {
      title: "Kiam Hotel",
      icon: Hotel,
      description: "Optimisez vos réservations, la gestion des chambres et l'expérience client.",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      link: "/hotel"
    },
    {
      title: "Kiam School",
      icon: GraduationCap,
      description: "Administration scolaire moderne : élèves, notes, planning et finances.",
      color: "text-sky-600",
      bg: "bg-sky-50",
      link: "/school"
    },
    {
      title: "Kiam Shop & ERP",
      icon: Store,
      description: "Maîtrisez vos stocks, vos ventes et votre comptabilité en temps réel.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      link: "/erp"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 italic-none">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">KIAM<span className="text-blue-600">SaaS</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
              <a href="#modules" className="hover:text-blue-600 transition-colors">Modules</a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">Tarifs</a>
              <Button variant="ghost" className="font-bold text-slate-900" onClick={() => navigate('/login')}>Connexion</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-bold shadow-lg shadow-blue-200" onClick={() => navigate('/register')}>Démarrer l'essai gratuit</Button>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <a href="#features" className="block text-slate-600 font-bold" onClick={() => setIsMenuOpen(false)}>Fonctionnalités</a>
            <a href="#modules" className="block text-slate-600 font-bold" onClick={() => setIsMenuOpen(false)}>Modules</a>
            <a href="#pricing" className="block text-slate-600 font-bold" onClick={() => setIsMenuOpen(false)}>Tarifs</a>
            <hr />
            <Button variant="outline" className="w-full font-bold" onClick={() => navigate('/login')}>Connexion</Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => navigate('/register')}>Essai gratuit</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-blue-100/50 blur-3xl rounded-full opacity-50 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-emerald-100/50 blur-3xl rounded-full opacity-50 -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-full font-bold text-sm mb-4">
            Plateforme Multi-Secteurs • Version 2026
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.9]">
            Pilotez votre <span className="text-blue-600 italic">Business</span> <br className="hidden md:block"/> avec une puissance inédite.
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            KIAM SaaS est le cockpit digital ultime pour les cliniques, hôtels, écoles et entreprises du futur. Déployez votre environnement en 60 secondes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg h-14 rounded-2xl px-10 font-black shadow-2xl shadow-blue-300 group" onClick={() => navigate('/register')}>
              Créer mon espace Kiam <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="bg-white text-slate-900 h-14 text-lg rounded-2xl px-10 font-bold border-slate-200 hover:bg-slate-50 transition-all">
              Découvrir les modules
            </Button>
          </div>
          
          <div className="pt-12 flex items-center justify-center gap-8 grayscale opacity-70">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-xs italic">Propulsé par <a href="https://www.rxservices-cg.com" className="hover:text-blue-600 underline">RX services</a></span>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Un écosystème, <span className="text-blue-600">tous vos métiers.</span></h2>
            <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto">Chaque module est conçu avec des experts du secteur pour garantir une performance métier maximale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((m, i) => (
              <Card key={i} className="group p-8 rounded-[2.5rem] border-slate-100 hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-50 hover:-translate-y-2 flex flex-col items-start text-left bg-white">
                <div className={`${m.bg} ${m.color} p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <m.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{m.title}</h3>
                <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                  {m.description}
                </p>
                <div className="mt-auto pt-4 flex items-center text-sm font-black text-blue-600 hover:gap-3 transition-all cursor-pointer">
                  En savoir plus <ArrowRight className="ml-1 w-4 h-4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Une technologie conçue pour la <span className="text-blue-600">continuité de service.</span>
              </h2>
              <div className="space-y-6 text-slate-600">
                <div className="flex gap-4">
                  <div className="mt-1 bg-emerald-100 p-2 rounded-lg shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm mb-1">Sélection Multi-Tenant Sécurisée</h4>
                    <p className="font-medium text-slate-500">Voss données sont stockées dans des environnements isolés et chiffrés. Aucun croisement de données possible entre établissements.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-blue-100 p-2 rounded-lg shrink-0">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm mb-1">Performance Temps Réel</h4>
                    <p className="font-medium text-slate-500">Synchronisation instantanée sur tous vos appareils. Mobile, tablette, ou desktop, les informations sont toujours là.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-indigo-100 p-2 rounded-lg shrink-0">
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm mb-1">Accès Cloud Global</h4>
                    <p className="font-medium text-slate-500">Accédez à votre cockpit partout dans le monde. Pas d'installation complexe, juste un navigateur.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-3 bg-slate-100 rounded-full"></div>
                    <div className="w-20 h-2 bg-slate-50 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-blue-50 rounded-2xl animate-pulse"></div>
                  <div className="h-24 bg-emerald-50 rounded-2xl"></div>
                  <div className="h-40 col-span-2 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <LayoutDashboard className="w-12 h-12 text-slate-200" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Des tarifs <span className="text-blue-600 italic">sans friction.</span></h2>
          <p className="text-slate-500 font-medium text-lg">Choisissez le plan qui correspond à l'envergure de votre établissement.</p>
        </div>

        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Basic */}
           <Card className="p-10 rounded-[2.5rem] border-slate-100 flex flex-col h-full bg-white hover:border-blue-100 transition-all">
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Basic</h3>
              <div className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">25.000 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest italic font-sans font-normal">CFA / mois</span></div>
              <ul className="space-y-4 mb-10 text-slate-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> 5 utilisateurs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> 1 module au choix</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Support email</li>
              </ul>
              <Button variant="outline" className="mt-auto w-full h-12 rounded-xl font-bold border-slate-200" onClick={() => navigate('/register')}>Essayer gratuitement</Button>
           </Card>

           {/* Professional */}
           <Card className="p-10 rounded-[2.5rem] border-blue-500 flex flex-col h-full bg-white shadow-2xl shadow-blue-100 relative scale-105 z-10 transition-all">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest">Le Plus Populaire</div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Professional</h3>
              <div className="text-4xl font-black text-blue-600 mb-6 tracking-tighter">75.000 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest italic font-sans font-normal">CFA / mois</span></div>
              <ul className="space-y-4 mb-10 text-slate-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> 20 utilisateurs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> 3 modules</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Support prioritaire</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Personnalisation</li>
              </ul>
              <Button className="mt-auto w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/register')}>Démarrer l'essai</Button>
           </Card>

           {/* Enterprise */}
           <Card className="p-10 rounded-[2.5rem] border-slate-100 flex flex-col h-full bg-white hover:border-blue-100 transition-all">
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Enterprise</h3>
              <div className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">250.000 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest italic font-sans font-normal">CFA / mois</span></div>
              <ul className="space-y-4 mb-10 text-slate-600 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Utilisateurs illimités</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Pack complet modules</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Account Manager</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Déploiement Cloud Privé</li>
              </ul>
              <Button variant="outline" className="mt-auto w-full h-12 rounded-xl font-bold border-slate-200" onClick={() => navigate('/register')}>Contacter les ventes</Button>
           </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto bg-blue-600 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">Prêt à propulser votre établissement ?</h2>
            <p className="text-xl opacity-90 font-medium max-w-xl mx-auto">Rejoignez les institutions qui font déjà confiance à KIAM pour leur transformation digitale.</p>
            <div className="pt-8">
              <Button className="bg-white text-blue-600 hover:bg-slate-50 text-xl font-black h-16 px-12 rounded-2xl shadow-xl hover:scale-105 transition-all" onClick={() => navigate('/register')}>
                Créer mon compte maintenant
              </Button>
            </div>
            <p className="text-sm opacity-60 font-medium">14 jours d'essai gratuit • Sans carte bancaire</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Building2 className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">KIAM<span className="text-blue-600">SaaS</span></span>
          </div>
          <p className="text-slate-400 text-sm font-medium">© 2026 KIAM SaaS Platform. Propulsé par <a href="https://www.rxservices-cg.com" className="hover:text-blue-600 underline">RX services</a>. Tous droits réservés.</p>
          <div className="flex justify-center gap-6 text-sm font-bold text-slate-500 italic">
            <a href="#" className="hover:text-blue-600 underline">Confidentialité</a>
            <a href="#" className="hover:text-blue-600 underline">Conditions Générales</a>
            <a href="#" className="hover:text-blue-600 underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
