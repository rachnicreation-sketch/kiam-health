import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ChevronRight,
  CirclePlay,
  Clock3,
  Compass,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Twitter,
  Workflow,
} from "lucide-react";

type Solution = {
  slug: string;
  name: string;
  shortName: string;
  accent: string;
  accentSoft: string;
  tagline: string;
  description: string;
  features: string[];
  modules: string[];
  kpis: { label: string; value: string }[];
  testimonial: { quote: string; person: string; role: string };
  highlights: string[];
};

const solutions: Solution[] = [
  {
    slug: "health",
    name: "Kiam Health",
    shortName: "Santé",
    accent: "#0EA5E9",
    accentSoft: "from-sky-500/20 to-cyan-500/10",
    tagline: "Pilotage intelligent des établissements de santé",
    description:
      "Un moteur SaaS unique pour gérer les patients, les consultations, la pharmacie, l’administration et la qualité de soins.",
    features: [
      "Dossiers patients centralisés",
      "Gestion de la facturation et des actes",
      "Plateforme de téléconsultation",
    ],
    modules: ["Patients", "Consultations", "Pharmacie", "Laboratoire", "Facturation"],
    kpis: [
      { label: "Temps de traitement", value: "-38%" },
      { label: "Satisfaction patient", value: "+24%" },
      { label: "Taux de conformité", value: "99.2%" },
    ],
    testimonial: {
      quote: "Kiam Health a transformé notre fonctionnement en un seul espace de travail fiable et moderne.",
      person: "Dr. A. Koné",
      role: "Directeur médical",
    },
    highlights: ["Sécurisé", "Interopérable", "Rapports temps réel"],
  },
  {
    slug: "erp",
    name: "Kiam ERP",
    shortName: "ERP",
    accent: "#8B5CF6",
    accentSoft: "from-violet-500/20 to-fuchsia-500/10",
    tagline: "Gestion commerciale et opérationnelle sans friction",
    description:
      "Centralisez ventes, inventaires, achats et finances avec une plateforme robuste pensée pour les PME et groupes.",
    features: [
      "Gestion d’inventaire multi-entrepôt",
      "Factures, devis et commandes automatisés",
      "Tableau de bord financier en temps réel",
    ],
    modules: ["Ventes", "Achats", "Stocks", "Comptabilité", "CRM"],
    kpis: [
      { label: "Erreurs de stock", value: "-47%" },
      { label: "Rotation des stocks", value: "+18%" },
      { label: "Temps de clôture", value: "-22h" },
    ],
    testimonial: {
      quote: "Nous avons gagné en visibilité sur nos opérations en quelques semaines seulement.",
      person: "M. Sarr",
      role: "Directeur financier",
    },
    highlights: ["Scalable", "Multi-entreprise", "Automatisations"],
  },
  {
    slug: "school",
    name: "Kiam School",
    shortName: "École",
    accent: "#F59E0B",
    accentSoft: "from-amber-500/20 to-orange-500/10",
    tagline: "Une école connectée, plus simple à piloter",
    description:
      "Pour les établissements scolaires, Kiam School offre suivi des élèves, emplois du temps, évaluations et communication parentale.",
    features: [
      "Suivi scolaire et absences",
      "Bulletins et évaluations",
      "Portail parents et enseignants",
    ],
    modules: ["Élèves", "Classes", "Notes", "Présences", "Paiements"],
    kpis: [
      { label: "Temps de saisie", value: "-41%" },
      { label: "Engagement parents", value: "+31%" },
      { label: "Productivité admin", value: "+27%" },
    ],
    testimonial: {
      quote: "La communication avec les parents est désormais fluide et transparente.",
      person: "Mme Diop",
      role: "Directrice d’établissement",
    },
    highlights: ["Éducation", "Communication", "Données"],
  },
  {
    slug: "hotel",
    name: "Kiam Hotel",
    shortName: "Hôtel",
    accent: "#EC4899",
    accentSoft: "from-pink-500/20 to-rose-500/10",
    tagline: "L’expérience hôtelière au service de l’efficacité",
    description:
      "Un centre d’opérations complet pour réservations, chambres, services clients et management multi-sites.",
    features: [
      "Réservations centralisées",
      "Gestion des chambres et housekeeping",
      "Tableau de bord d’exploitation",
    ],
    modules: ["Réservations", "Chambres", "Check-in", "Housekeeping", "CRM"],
    kpis: [
      { label: "Taux d’occupation", value: "+15%" },
      { label: "Temps de réponse", value: "-29%" },
      { label: "Satisfaction client", value: "+22%" },
    ],
    testimonial: {
      quote: "Le quotidien de notre hôtel est devenu plus fluide et plus rentable.",
      person: "M. Traoré",
      role: "Gérant d’hôtel",
    },
    highlights: ["Hospitalité", "Multi-sites", "Service"],
  },
  {
    slug: "pharmacy",
    name: "Kiam Pharmacy",
    shortName: "Pharmacie",
    accent: "#10B981",
    accentSoft: "from-emerald-500/20 to-green-500/10",
    tagline: "Gérer chaque flux de la pharmacie avec confiance",
    description:
      "Un logiciel complet pour la vente, les stocks, les prescriptions, la conformité et le pilotage de la chaîne de soins.",
    features: [
      "CAISSE et ventes rapides",
      "Contrôle des lots et dates d’expiration",
      "Suivi des prescriptions et des retours",
    ],
    modules: ["Caisse", "Inventaire", "Ordonnances", "Alertes", "Comptabilité"],
    kpis: [
      { label: "Temps de caisse", value: "-34%" },
      { label: "Rupture de stock", value: "-52%" },
      { label: "Conformité", value: "100%" },
    ],
    testimonial: {
      quote: "Nous avons réduit les erreurs de stock et simplifié l’activité au quotidien.",
      person: "Mme Bâ",
      role: "Responsable pharmacie",
    },
    highlights: ["Conformité", "Vitesse", "Traçabilité"],
  },
  {
    slug: "enterprise",
    name: "Kiam Enterprise",
    shortName: "Entreprise",
    accent: "#EF4444",
    accentSoft: "from-rose-500/20 to-red-500/10",
    tagline: "Un système d’entreprise pensé pour la performance",
    description:
      "Pour les groupes et entreprises, Kiam Enterprise centralise projets, RH, documents, facturation et suivi opérationnel.",
    features: [
      "Gestion de projets et tâches",
      "Suivi RH et temps",
      "Documents et conformité centralisés",
    ],
    modules: ["Projets", "RH", "Documents", "Facturation", "Reporting"],
    kpis: [
      { label: "Productivité équipe", value: "+29%" },
      { label: "Délai de livraison", value: "-21%" },
      { label: "Visibilité exécutive", value: "100%" },
    ],
    testimonial: {
      quote: "Notre direction pilote désormais l’entreprise depuis un tableau de bord unique et clair.",
      person: "M. Gueye",
      role: "CEO",
    },
    highlights: ["Pilotage", "Collaboration", "Sécurité"],
  },
];

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Solutions", href: "/solutions" },
  { label: "Tarifs", href: "/pricing" },
  { label: "Démo", href: "/demo" },
  { label: "À propos", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-['IBM Plex Mono'] uppercase tracking-[0.3em] text-[#4B5157]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl md:text-4xl font-['Fraunces'] text-[#15181C]">{title}</h2>
      <p className="mt-4 text-lg text-[#4B5157]">{description}</p>
    </div>
  );
}

function PageShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <div className="min-h-screen bg-[#EEEDE7] text-[#15181C]">
      <MarketingLayout>
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.35em] text-[#4B5157] font-['IBM Plex Mono']">Kiam</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-['Fraunces'] leading-tight">{title}</h1>
            <p className="mt-5 text-lg text-[#4B5157]">{description}</p>
          </div>
          {children}
        </div>
      </MarketingLayout>
    </div>
  );
}

function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setSolutionsOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#EEEDE7]">
      <header className="sticky top-0 z-40 border-b border-[#D6D3C9]/80 bg-[#EEEDE7]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3 text-[#15181C]">
            <img
              src="/kiam/images/logo-kiam.png"
              alt="KIAM Logo"
              className="h-11 w-11 object-contain bg-white rounded-xl p-0.5 shadow-sm border border-[#D6D3C9]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/logo-kiam.png";
              }}
            />
            <div>
              <p className="font-['Fraunces'] text-xl leading-none">Kiam</p>
              <p className="text-xs uppercase tracking-[0.25em] text-[#4B5157]">Suite SaaS</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) =>
              item.label === "Solutions" ? (
                <div key={item.href} className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium text-[#15181C] transition hover:text-[#0EA5E9]"
                    onClick={() => setSolutionsOpen((current) => !current)}
                    aria-expanded={solutionsOpen}
                  >
                    {item.label}
                    <ChevronRight className={`h-4 w-4 transition ${solutionsOpen ? "rotate-90" : ""}`} />
                  </button>
                  {solutionsOpen ? (
                    <div className="absolute left-0 top-10 w-[32rem] rounded-3xl border border-[#D6D3C9] bg-white/95 p-5 shadow-2xl">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {solutions.map((solution) => (
                          <Link
                            key={solution.slug}
                            to={`/solutions/${solution.slug}`}
                            className="rounded-2xl border border-[#D6D3C9] p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: solution.accent }} />
                              <p className="font-semibold text-[#15181C]">{solution.name}</p>
                            </div>
                            <p className="mt-2 text-sm text-[#4B5157]">{solution.tagline}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link key={item.href} to={item.href} className="text-sm font-medium text-[#15181C] transition hover:text-[#0EA5E9]">
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="rounded-full border border-[#D6D3C9] px-4 py-2 text-sm font-medium text-[#15181C] transition hover:bg-white">
              Connexion
            </Link>
            <Link to="/signup" className="rounded-full bg-[#15181C] px-4 py-2 text-sm font-medium text-[#EEEDE7] transition hover:bg-[#0EA5E9]">
              Essai gratuit
            </Link>
          </div>

          <button
            type="button"
            className="rounded-full border border-[#D6D3C9] p-2 lg:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-[#D6D3C9] bg-[#EEEDE7] px-6 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} className="text-sm font-medium text-[#15181C]">
                  {item.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-2">
                <Link to="/login" className="rounded-full border border-[#D6D3C9] px-4 py-2 text-sm font-medium">
                  Connexion
                </Link>
                <Link to="/signup" className="rounded-full bg-[#15181C] px-4 py-2 text-sm font-medium text-[#EEEDE7]">
                  Essai gratuit
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="border-t border-[#D6D3C9] bg-[#15181C] text-[#EEEDE7]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 lg:grid-cols-4 md:px-8 lg:px-10">
          <div>
            <p className="font-['Fraunces'] text-2xl">Kiam</p>
            <p className="mt-4 text-sm leading-7 text-[#D6D3C9]">
              Une suite SaaS multi-tenant pensée pour moderniser les opérations de santé, commerce, éducation, hôtellerie et entreprises.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D6D3C9]">Produits</p>
            <ul className="mt-4 space-y-3 text-sm text-[#EEEDE7]">
              {solutions.map((solution) => (
                <li key={solution.slug}>
                  <Link to={`/solutions/${solution.slug}`} className="transition hover:text-[#0EA5E9]">
                    {solution.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D6D3C9]">Entreprise</p>
            <ul className="mt-4 space-y-3 text-sm text-[#EEEDE7]">
              <li><Link to="/about" className="transition hover:text-[#0EA5E9]">À propos</Link></li>
              <li><Link to="/careers" className="transition hover:text-[#0EA5E9]">Carrières</Link></li>
              <li><Link to="/blog" className="transition hover:text-[#0EA5E9]">Blog</Link></li>
              <li><Link to="/contact" className="transition hover:text-[#0EA5E9]">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D6D3C9]">Support</p>
            <ul className="mt-4 space-y-3 text-sm text-[#EEEDE7]">
              <li><Link to="/docs" className="transition hover:text-[#0EA5E9]">Documentation</Link></li>
              <li><Link to="/faq" className="transition hover:text-[#0EA5E9]">FAQ</Link></li>
              <li><Link to="/privacy" className="transition hover:text-[#0EA5E9]">Confidentialité</Link></li>
              <li><Link to="/terms" className="transition hover:text-[#0EA5E9]">Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-[#D6D3C9] md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
            <p>© 2026 Kiam. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <a href="https://www.linkedin.com" aria-label="LinkedIn" className="transition hover:text-[#0EA5E9]"><Linkedin className="h-4 w-4" /></a>
              <a href="https://www.twitter.com" aria-label="Twitter" className="transition hover:text-[#0EA5E9]"><Twitter className="h-4 w-4" /></a>
              <a href="https://www.instagram.com" aria-label="Instagram" className="transition hover:text-[#0EA5E9]"><Instagram className="h-4 w-4" /></a>
              <a href="https://www.facebook.com" aria-label="Facebook" className="transition hover:text-[#0EA5E9]"><Facebook className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function HomePage() {
  const [activeSolution, setActiveSolution] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSolution((current) => (current + 1) % solutions.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  const solution = solutions[activeSolution];

  return (
    <MarketingLayout>
      <section className="relative overflow-hidden rounded-[2rem] border border-[#D6D3C9] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent_40%),linear-gradient(135deg,_#F7F4EE_0%,_#EEEDE7_100%)] px-6 py-16 shadow-[0_30px_120px_rgba(21,24,28,0.08)] md:px-8 lg:px-10 lg:py-24">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-white/70 via-transparent to-transparent" />
        <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6D3C9] bg-white/80 px-4 py-2 text-sm text-[#4B5157] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#0EA5E9]" />
              Une suite SaaS unique, multi-secteurs et prête à grandir
            </div>
            <h1 className="mt-6 text-5xl leading-[0.95] md:text-6xl lg:text-7xl font-['Fraunces'] text-[#15181C]">
              Le logiciel qui
              <br />
              s’adapte à chaque
              <br />
              secteur d’activité.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-[#4B5157]">
              Kiam réunit santé, ERP, école, hôtel, pharmacie et entreprise dans une architecture SaaS moderne, sécurisée et modulable.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/solutions" className="rounded-full bg-[#15181C] px-6 py-3 text-sm font-medium text-[#EEEDE7] transition hover:bg-[#0EA5E9]">
                Découvrir les solutions
              </Link>
              <Link to="/demo" className="rounded-full border border-[#D6D3C9] bg-white/80 px-6 py-3 text-sm font-medium text-[#15181C] transition hover:bg-white">
                Essayer gratuitement
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-[#4B5157]">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#10B981]" /> Sécurisé</div>
              <div className="flex items-center gap-2"><Workflow className="h-4 w-4 text-[#8B5CF6]" /> Intégrations natives</div>
              <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#F59E0B]" /> Analytics temps réel</div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-5 shadow-xl backdrop-blur-md">
            <div className="rounded-[1.5rem] border border-[#D6D3C9] bg-[#15181C] p-6 text-[#EEEDE7]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#D6D3C9]">Démo interactive</p>
                  <h2 className="mt-2 text-2xl font-['Fraunces']">{solution.name}</h2>
                </div>
                <div className="rounded-full px-3 py-1 text-sm" style={{ backgroundColor: `${solution.accent}20`, color: solution.accent }}>
                  {solution.shortName}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {solution.kpis.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-2xl font-semibold">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.25em] text-[#D6D3C9]">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4">
                <div className="flex items-center gap-2 text-sm text-[#D6D3C9]">
                  <Compass className="h-4 w-4" />
                  Modules clés
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {solution.modules.map((module) => (
                    <span key={module} className="rounded-full border border-white/10 px-3 py-1 text-sm text-[#EEEDE7]">
                      {module}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
                <p className="text-sm italic text-[#D6D3C9]">“{solution.testimonial.quote}”</p>
                <p className="mt-3 text-sm font-semibold">{solution.testimonial.person}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-[#D6D3C9]">{solution.testimonial.role}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {solutions.map((item, index) => (
                <button
                  key={item.slug}
                  type="button"
                  className={`rounded-full px-3 py-2 text-sm transition ${index === activeSolution ? "text-[#EEEDE7]" : "text-[#4B5157]"}`}
                  style={{ backgroundColor: index === activeSolution ? item.accent : "#F7F4EE" }}
                  onClick={() => setActiveSolution(index)}
                >
                  {item.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 lg:px-10">
        <SectionTitle
          eyebrow="Pourquoi Kiam"
          title="Un seul moteur, six expériences sectorielles"
          description="L’architecture reste commune, mais chaque solution adopte une expérience adaptée à ses usages et à son public."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((item) => (
            <Link
              key={item.slug}
              to={`/solutions/${item.slug}`}
              className="group rounded-[1.75rem] border border-[#D6D3C9] bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-['IBM Plex Mono'] uppercase tracking-[0.25em] text-[#4B5157]">{item.shortName}</p>
                  <h3 className="mt-2 text-2xl font-['Fraunces'] text-[#15181C]">{item.name}</h3>
                </div>
                <div className="h-10 w-10 rounded-full border border-[#D6D3C9]" style={{ backgroundColor: `${item.accent}12` }} />
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4B5157]">{item.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {item.highlights.map((highlight) => (
                  <span key={highlight} className="rounded-full border border-[#D6D3C9] px-3 py-1 text-sm text-[#4B5157]">
                    {highlight}
                  </span>
                ))}
              </div>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#15181C]">
                En savoir plus <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-8 lg:px-10">
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-[#15181C] p-8 text-[#EEEDE7] md:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#D6D3C9] font-['IBM Plex Mono']">Confiance</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-['Fraunces']">Des équipes, des données, une seule plateforme.</h2>
              <p className="mt-4 text-lg leading-8 text-[#D6D3C9]">
                Kiam s’appuie sur une architecture multi-tenant, des modules évolutifs et une sécurité de niveau entreprise pour accompagner votre croissance sans compromis.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "50+ modules", description: "Prêts à activer selon vos besoins métier" },
                { title: "24/7 monitoring", description: "Performance, disponibilité et sécurité" },
                { title: "Multi-tenant", description: "Un seul moteur pour plusieurs entités" },
                { title: "Expert support", description: "Accompagnement sur mesure" },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
                  <p className="text-2xl font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-[#D6D3C9]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export function SolutionsPage() {
  return (
    <PageShell title="Des solutions pensées pour chaque métier" description="Chaque logiciel Kiam conserve une identité propre, tout en partageant la même architecture SaaS, les mêmes principes de sécurité et d’évolutivité.">
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {solutions.map((solution) => (
          <Link key={solution.slug} to={`/solutions/${solution.slug}`} className="group rounded-[1.75rem] border border-[#D6D3C9] bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-[#4B5157] font-['IBM Plex Mono']">{solution.shortName}</p>
                <h2 className="mt-2 text-2xl font-['Fraunces'] text-[#15181C]">{solution.name}</h2>
              </div>
              <div className="h-10 w-10 rounded-full" style={{ backgroundColor: `${solution.accent}20` }} />
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4B5157]">{solution.description}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#15181C]">
              Voir la présentation <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}

export function SolutionPage() {
  const { slug } = useParams<{ slug: string }>();
  const solution = useMemo(() => solutions.find((item) => item.slug === slug), [slug]);

  if (!solution) {
    return <PageShell title="Solution introuvable" description="Cette page n’existe pas encore. Retournez à l’accueil pour découvrir la suite Kiam." />;
  }

  return (
    <PageShell title={solution.name} description={solution.description}>
      <div className="mt-12 rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm" style={{ backgroundColor: `${solution.accent}14`, color: solution.accent }}>
              <Sparkles className="h-4 w-4" />
              {solution.tagline}
            </div>
            <p className="mt-6 text-lg leading-8 text-[#4B5157]">{solution.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {solution.features.map((feature) => (
                <span key={feature} className="rounded-full border border-[#D6D3C9] bg-[#F7F4EE] px-3 py-2 text-sm text-[#15181C]">
                  {feature}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-[#D6D3C9] bg-[#15181C] p-6 text-[#EEEDE7]">
            <p className="text-sm uppercase tracking-[0.3em] text-[#D6D3C9] font-['IBM Plex Mono']">Pilotage de l’activité</p>
            <div className="mt-6 grid gap-3">
              {solution.kpis.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm text-[#D6D3C9]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
          <h2 className="text-2xl font-['Fraunces'] text-[#15181C]">Modules inclus</h2>
          <ul className="mt-6 space-y-3 text-[#4B5157]">
            {solution.modules.map((module) => (
              <li key={module} className="flex items-center gap-3 rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3">
                <CheckCircle />
                <span>{module}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-[#F7F4EE] p-8 shadow-sm">
          <h2 className="text-2xl font-['Fraunces'] text-[#15181C]">Captures & vidéos</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {["Tableau de bord", "Workflow métier", "Reporting", "Mobile"].map((item, index) => (
              <div key={item} className="rounded-[1.5rem] border border-[#D6D3C9] bg-white p-5">
                <div className={`h-24 rounded-[1rem] bg-gradient-to-br ${solution.accentSoft}`} />
                <p className="mt-4 font-semibold text-[#15181C]">{item}</p>
                <p className="mt-2 text-sm text-[#4B5157]">Prévisualisation {index + 1} – pensée pour une adoption rapide.</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <a href="/demo" className="inline-flex items-center gap-2 rounded-full bg-[#15181C] px-5 py-3 text-sm font-medium text-[#EEEDE7]">
              <CirclePlay className="h-4 w-4" /> Demander une démo
            </a>
            <Link to="/pricing" className="rounded-full border border-[#D6D3C9] px-5 py-3 text-sm font-medium text-[#15181C]">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
        <h2 className="text-2xl font-['Fraunces'] text-[#15181C]">FAQ rapide</h2>
        <div className="mt-6 space-y-3">
          {[
            { question: "La solution peut-elle évoluer avec notre activité ?", answer: "Oui. Kiam est conçue pour évoluer avec vos workflows et votre volume d’activité." },
            { question: "Est-il possible d’implémenter plusieurs modules ?", answer: "Absolument. Chaque module peut être activé progressivement selon vos priorités." },
            { question: "L’outil est-il adapté au travail mobile ?", answer: "Oui, toutes les solutions sont pensées pour être utilisées depuis desktop et mobile." },
          ].map((item) => (
            <details key={item.question} className="rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] p-4">
              <summary className="cursor-pointer font-medium text-[#15181C]">{item.question}</summary>
              <p className="mt-3 text-sm leading-7 text-[#4B5157]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function PricingPage() {
  const plans = [
    { name: "Essentiel", price: "150 000", description: "Idéal pour lancer votre transformation digitale", features: ["1 site ou entité", "Modules de base", "Support standard"], cta: "/demo" },
    { name: "Croissance", price: "450 000", description: "Pour les équipes qui souhaitent accélérer", features: ["Plusieurs entités", "Automatisations", "Rapports avancés"], cta: "/signup" },
    { name: "Entreprise", price: "Sur devis", description: "Pour les groupes et structures complexes", features: ["Sécurité entreprise", "Intégrations avancées", "Support dédié"], cta: "/contact" },
  ];

  return (
    <PageShell title="Des abonnements transparents" description="Choisissez le niveau le plus adapté à votre maturité, votre taille et vos ambitions.">
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-[#4B5157] font-['IBM Plex Mono']">{plan.name}</p>
            <p className="mt-4 text-4xl font-['Fraunces'] text-[#15181C]">{plan.price}</p>
            <p className="mt-2 text-sm text-[#4B5157]">FCFA / mois</p>
            <p className="mt-6 text-sm leading-7 text-[#4B5157]">{plan.description}</p>
            <ul className="mt-6 space-y-3 text-sm text-[#15181C]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3"><CheckCircle />{feature}</li>
              ))}
            </ul>
            <Link to={plan.cta} className="mt-8 inline-flex rounded-full bg-[#15181C] px-5 py-3 text-sm font-medium text-[#EEEDE7]">
              Choisir {plan.name}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#D6D3C9] bg-white/80 shadow-sm">
        <div className="overflow-x-auto p-6">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D6D3C9] text-[#4B5157]">
                <th className="pb-4 pr-6">Fonctionnalités</th>
                <th className="pb-4 pr-6">Essentiel</th>
                <th className="pb-4 pr-6">Croissance</th>
                <th className="pb-4">Entreprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Tableau de bord", "Oui", "Oui", "Oui"],
                ["Modules avancés", "Non", "Oui", "Oui"],
                ["Support prioritaire", "Non", "Oui", "Oui"],
                ["Intégrations API", "Non", "Oui", "Oui"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-[#F0EEE8] text-[#15181C]">
                  <td className="py-4 pr-6">{row[0]}</td>
                  <td className="py-4 pr-6">{row[1]}</td>
                  <td className="py-4 pr-6">{row[2]}</td>
                  <td className="py-4">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}

export function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <PageShell title="Planifiez votre démo" description="Dites-nous quel besoin vous avez, et notre équipe vous accompagne vers la solution la plus adaptée.">
      <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-[#15181C] p-8 text-[#EEEDE7]">
          <p className="text-sm uppercase tracking-[0.3em] text-[#D6D3C9] font-['IBM Plex Mono']">Pourquoi demander une démo</p>
          <h2 className="mt-4 text-2xl font-['Fraunces']">Découvrez les workflows qui feront gagner du temps à vos équipes.</h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-[#D6D3C9]">
            <li className="flex gap-3"><CheckCircle /> Analyse de vos besoins métier</li>
            <li className="flex gap-3"><CheckCircle /> Proposition de modules adaptés</li>
            <li className="flex gap-3"><CheckCircle /> Définition d’un plan de déploiement</li>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#15181C]">Logiciel</label>
                <select className="w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" defaultValue="health">
                  <option value="health">Kiam Health</option>
                  <option value="erp">Kiam ERP</option>
                  <option value="school">Kiam School</option>
                  <option value="hotel">Kiam Hotel</option>
                  <option value="pharmacy">Kiam Pharmacy</option>
                  <option value="enterprise">Kiam Enterprise</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#15181C]">Nombre d’utilisateurs</label>
                <input className="w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" placeholder="50" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#15181C]">Entreprise</label>
                <input className="w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" placeholder="Nom de l’entreprise" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#15181C]">Téléphone</label>
                <input className="w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" placeholder="+221" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#15181C]">Email</label>
              <input type="email" className="w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" placeholder="contact@entreprise.com" />
            </div>
            <button type="submit" className="rounded-full bg-[#15181C] px-6 py-3 text-sm font-medium text-[#EEEDE7]">
              Envoyer la demande
            </button>
            {submitted ? <p className="text-sm text-[#10B981]">Merci. Notre équipe vous recontactera rapidement.</p> : null}
          </form>
        </div>
      </div>
    </PageShell>
  );
}

export function AboutPage() {
  return (
    <PageShell title="Ã€ propos de Kiam" description="Kiam est une suite SaaS multi-tenant conÃ§ue pour aider les organisations Ã  moderniser leurs opÃ©rations sans changer d'outil Ã  chaque Ã©tape.">

      {/* CEO Quote Section */}
      <div className="mt-12 rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-[#4B5157] mb-6" style={{fontFamily: 'IBM Plex Mono, monospace'}}>Le Mot du Fondateur</p>
        <div className="flex flex-col-reverse gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="flex-1">
            <blockquote className="relative">
              <span className="absolute -top-4 -left-2 text-7xl leading-none text-[#0EA5E9]/20 select-none" style={{fontFamily: 'Fraunces, serif'}}>"</span>
              <p className="relative text-lg leading-8 text-[#15181C] italic pl-4" style={{fontFamily: 'Fraunces, serif'}}>
                Chaque grande rÃ©ussite commence par une vision.<br /><br />
                La nÃ´tre est de contribuer Ã  bÃ¢tir des organisations plus performantes, plus sereines et tournÃ©es vers l'avenir grÃ¢ce Ã  des solutions qui simplifient le quotidien, renforcent la prise de dÃ©cision et accompagnent durablement leur croissance.<br /><br />
                Chez Kiam, nous croyons que la technologie doit Ãªtre un vÃ©ritable partenaire de confiance : simple Ã  utiliser, fiable et pensÃ©e pour rÃ©pondre aux dÃ©fis rÃ©els de celles et ceux qui entreprennent.<br /><br />
                Merci de faire partie de cette aventure. Ensemble, construisons l'avenir de la gestion.
              </p>
            </blockquote>
            <div className="mt-8 flex items-center gap-4 pl-4">
              <div className="h-px flex-1 bg-[#D6D3C9]" />
              <div className="text-right">
                <p className="text-base font-bold text-[#15181C]" style={{fontFamily: 'Fraunces, serif'}}>RM MATIABA</p>
                <p className="text-sm text-[#4B5157]">Fondateur &amp; CEO</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-full lg:w-auto" style={{maxWidth: '240px', margin: '0 auto'}}>
            <img
              src="/kiam/images/ceo-matiaba.jpg"
              alt="RM MATIABA, Fondateur et CEO de Kiam"
              className="w-full h-auto object-cover shadow-md"
              style={{borderRadius: '1.5rem', aspectRatio: '3/4', objectPosition: 'top'}}
            />
          </div>
        </div>
      </div>

      {/* Values Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {[
          { title: "Vision", text: "Rendre la technologie accessible, unifiÃ©e et impactante pour les entreprises modernes." },
          { title: "Mission", text: "CrÃ©er un moteur logiciel unique capable de servir plusieurs secteurs et plusieurs modÃ¨les d'organisation." },
          { title: "Valeurs", text: "Transparence, fiabilitÃ©, innovation et accompagnement humain." },
        ].map((item) => (
          <div key={item.title} className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
            <h2 className="text-2xl text-[#15181C]" style={{fontFamily: 'Fraunces, serif'}}>{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-[#4B5157]">{item.text}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
export function ContactPage() {
  return (
    <PageShell title="Contactez-nous" description="Discutons de vos besoins, de votre architecture et du meilleur déploiement pour votre organisation.">
      <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
          <div className="space-y-4 text-sm text-[#4B5157]">
            <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-[#0EA5E9]" /> +221 77 000 00 00</div>
            <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#0EA5E9]" /> contact@kiam.io</div>
            <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#0EA5E9]" /> Dakar, Sénégal</div>
          </div>
          <div className="mt-8 h-64 rounded-[1.75rem] border border-[#D6D3C9] bg-[#F7F4EE]" />
        </div>
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
          <div className="space-y-4">
            <input className="w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" placeholder="Nom complet" />
            <input className="w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" placeholder="Email" />
            <textarea className="min-h-36 w-full rounded-2xl border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3" placeholder="Votre message" />
            <button className="rounded-full bg-[#15181C] px-6 py-3 text-sm font-medium text-[#EEEDE7]">Envoyer</button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export function FaqPage() {
  return (
    <PageShell title="FAQ" description="Les questions les plus courantes sur Kiam, ses solutions et son déploiement.">
      <div className="mt-12 space-y-4">
        {[
          { question: "Kiam est-il adapté à plusieurs secteurs ?", answer: "Oui, le moteur principal est commun, mais chaque secteur dispose de modules spécifiques." },
          { question: "Pouvez-vous déployer la solution en mode SaaS ?", answer: "Oui, nous proposons des déploiements SaaS et sur mesure selon vos besoins de conformité." },
          { question: "Quel est le temps de mise en place ?", answer: "Selon la complexité, l’implémentation démarre souvent en quelques jours à quelques semaines." },
        ].map((item) => (
          <details key={item.question} className="rounded-[1.5rem] border border-[#D6D3C9] bg-white/80 p-5 shadow-sm">
            <summary className="cursor-pointer font-medium text-[#15181C]">{item.question}</summary>
            <p className="mt-3 text-sm leading-7 text-[#4B5157]">{item.answer}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}

export function BlogPage() {
  const [query, setQuery] = useState("");
  const posts = [
    { title: "Comment centraliser vos opérations avec un moteur SaaS unique", category: "Product", excerpt: "Découvrez comment Kiam simplifie la gouvernance de plusieurs activités depuis une seule plateforme." },
    { title: "Pourquoi le multi-tenant devient un enjeu stratégique", category: "Strategy", excerpt: "Le multi-tenant offre évolutivité, sécurité et rapidité de déploiement." },
    { title: "Le futur des logiciels métiers en Afrique francophone", category: "Insights", excerpt: "Une vision des logiciels de gestion conçus pour les réalités locales." },
  ];

  const filtered = posts.filter((post) => `${post.title} ${post.excerpt}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PageShell title="Blog" description="Actualités, réflexions et bonnes pratiques autour de la digitalisation des organisations.">
      <div className="mt-12 rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 rounded-full border border-[#D6D3C9] bg-[#F7F4EE] px-4 py-3">
            <Search className="h-4 w-4 text-[#4B5157]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent outline-none" placeholder="Rechercher un article" />
          </div>
          <div className="flex flex-wrap gap-2">
            {['Tous', 'Product', 'Strategy', 'Insights'].map((category) => (
              <span key={category} className="rounded-full border border-[#D6D3C9] px-3 py-1 text-sm text-[#4B5157]">{category}</span>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => (
            <article key={post.title} className="rounded-[1.5rem] border border-[#D6D3C9] bg-[#F7F4EE] p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[#4B5157] font-['IBM Plex Mono']">{post.category}</p>
              <h2 className="mt-3 text-xl font-['Fraunces'] text-[#15181C]">{post.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4B5157]">{post.excerpt}</p>
              <Link to="/blog" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#15181C]">Lire l’article <ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function CareersPage() {
  return (
    <PageShell title="Carrières" description="Rejoignez une équipe qui construit des logiciels utiles, modernes et orientés impact.">
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
          <h2 className="text-2xl font-['Fraunces'] text-[#15181C]">Pourquoi rejoindre Kiam</h2>
          <p className="mt-4 text-sm leading-7 text-[#4B5157]">Nous travaillons sur des produits à forte valeur, au croisement du SaaS, de la data et de l’expérience utilisateur.</p>
        </div>
        <div className="rounded-[2rem] border border-[#D6D3C9] bg-[#15181C] p-8 text-[#EEEDE7]">
          <h2 className="text-2xl font-['Fraunces']">Postes ouverts</h2>
          <ul className="mt-6 space-y-3 text-sm text-[#D6D3C9]">
            <li className="flex items-center gap-3"><Briefcase className="h-4 w-4" /> Product Designer</li>
            <li className="flex items-center gap-3"><Briefcase className="h-4 w-4" /> Senior Frontend Developer</li>
            <li className="flex items-center gap-3"><Briefcase className="h-4 w-4" /> Customer Success Lead</li>
          </ul>
          <Link to="/contact" className="mt-8 inline-flex rounded-full bg-[#0EA5E9] px-5 py-3 text-sm font-medium text-[#EEEDE7]">Postuler</Link>
        </div>
      </div>
    </PageShell>
  );
}

export function PrivacyPage() {
  return (
    <PageShell title="Politique de confidentialité" description="Nous traitons vos données avec la plus grande rigueur, conformément à la réglementation en vigueur.">
      <div className="mt-12 rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm text-sm leading-8 text-[#4B5157]">
        <p>Cette politique décrit les informations collectées, leurs finalités, les mesures de sécurité et les droits des personnes concernées.</p>
      </div>
    </PageShell>
  );
}

export function TermsPage() {
  return (
    <PageShell title="Conditions d’utilisation" description="Voici les règles applicables à l’utilisation de la plateforme Kiam et de ses services.">
      <div className="mt-12 rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm text-sm leading-8 text-[#4B5157]">
        <p>L’utilisation de Kiam implique l’acceptation de ces conditions, ainsi que le respect des obligations de sécurité et de confidentialité.</p>
      </div>
    </PageShell>
  );
}

export function DocsPage() {
  return (
    <PageShell title="Documentation" description="Accédez à la documentation de référence pour découvrir les modules, les intégrations et les bonnes pratiques.">
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {[
          { title: "Guide d’initiation", description: "Configurez votre espace et activez vos premiers modules." },
          { title: "API & intégrations", description: "Connectez vos outils métiers et vos données existantes." },
          { title: "Sécurité", description: "Découvrez les mesures de sécurité et d’audit de la suite Kiam." },
        ].map((item) => (
          <div key={item.title} className="rounded-[2rem] border border-[#D6D3C9] bg-white/80 p-8 shadow-sm">
            <BookOpen className="h-6 w-6 text-[#0EA5E9]" />
            <h2 className="mt-4 text-2xl font-['Fraunces'] text-[#15181C]">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-[#4B5157]">{item.description}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function CheckCircle() {
  return <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] text-white"><Star className="h-3 w-3" /></div>;
}
