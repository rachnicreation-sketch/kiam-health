import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Stethoscope,
  Hotel,
  GraduationCap,
  Store,
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">
              KIAM<span className="text-blue-600">SaaS</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Accueil</Link>
            <Button variant="ghost" className="font-bold" onClick={() => navigate('/login')}>Connexion</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate('/register')}>Essai gratuit</Button>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 p-4 space-y-3">
            <Link to="/" className="block text-slate-600 font-bold" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            <Button variant="outline" className="w-full" onClick={() => { setIsMenuOpen(false); navigate('/login'); }}>Connexion</Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setIsMenuOpen(false); navigate('/register'); }}>Essai gratuit</Button>
          </div>
        )}
      </nav>

      {/* Main Launcher Grid */}
      <div className="pt-24 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 max-w-7xl">
          {modules.map((m, i) => (
            <Link
              key={i}
              to={m.link}
              className="group p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition shadow-sm hover:shadow-lg"
            >
              <div className={`${m.bg} ${m.color} p-4 rounded-2xl mb-4 group-hover:scale-110 transition`}
              >
                <m.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{m.title}</h3>
              <p className="text-sm text-slate-600">{m.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
