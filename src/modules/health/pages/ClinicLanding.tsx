import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Building2, 
  Stethoscope, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  HeartPulse,
  Syringe,
  Baby,
  Thermometer,
  CalendarDays,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clinic, Appointment, Patient } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ClinicLanding() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    reason: "",
    date: ""
  });

  useEffect(() => {
    if (clinicId) {
      loadClinic();
    }
  }, [clinicId]);

  const loadClinic = async () => {
    if (!clinicId) return;
    try {
      const data = await api.clinics.get(clinicId);
      setClinic(data);
    } catch (error) {
      console.error("Clinic load error:", error);
    }
  };

  const handleRequestRDV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !clinicId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir votre nom et téléphone." });
      return;
    }

    try {
      await api.appointments.create({
        clinicId: clinicId,
        patientId: "PUBLIC", // Nouveau patient potentiel
        doctorId: "pending", 
        date: form.date || new Date().toISOString().split('T')[0],
        time: "08:00",
        patient: form.name,
        doctor: "À attribuer",
        type: "Demande Web",
        status: 'pending'
      });

      toast({ title: "Demande envoyée !", description: "La clinique vous contactera sous peu pour confirmer votre créneau." });
      setForm({ name: "", phone: "", reason: "", date: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer votre demande." });
    }
  };

  if (!clinic) return <div className="p-20 text-center">Clinique non trouvée</div>;

  const specialties = [
    { title: "Pédiatrie", icon: Baby, desc: "Soins spécialisés pour les nourrissons et les enfants." },
    { title: "Chirurgie", icon: Syringe, desc: "Interventions chirurgicales de pointe et suivi." },
    { title: "Maternité", icon: HeartPulse, desc: "Accompagnement complet de la grossesse à l'accouchement." },
    { title: "Urgences", icon: Thermometer, desc: "Service d'accueil des urgences disponible 24h/24." }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {clinic.logo ? (
                <img src={clinic.logo} alt="Logo" className="h-10 w-10 object-contain rounded-lg" />
             ) : (
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                   <Building2 className="h-6 w-6 text-primary" />
                </div>
             )}
             <span className="font-black text-xl tracking-tighter uppercase text-primary">{clinic.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
             <a href="#services" className="text-sm font-bold uppercase hover:text-primary transition-colors">Services</a>
             <a href="#about" className="text-sm font-bold uppercase hover:text-primary transition-colors">À Propos</a>
             <Button variant="default" className="shadow-lg shadow-primary/20" onClick={() => navigate(`/patient/${clinicId}/login`)}>Accès Patient</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-60 md:pb-40 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
           <div className="space-y-8 text-center lg:text-left">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 py-1 px-4 text-xs font-bold uppercase tracking-widest">Votre santé, notre priorité</Badge>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter">
                Des soins d'excellence à la <span className="text-primary italic">portée de tous.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
                La {clinic.name} met à votre disposition les meilleurs spécialistes et des équipements de pointe pour une prise en charge complète et humaine.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                 <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2" asChild>
                    <a href="#rdv">Prendre Rendez-vous <ArrowRight className="h-5 w-5" /></a>
                 </Button>
                 <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold" onClick={() => navigate(`/patient/${clinicId}/login`)}>Mon Dossier Médical</Button>
              </div>
           </div>
           
           <div className="hidden lg:block relative group">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl group-hover:bg-primary/20 transition-all"></div>
              <img 
                src="https://images.unsplash.com/photo-1579684385127-1ea15659787e?q=80&w=1000&auto=format&fit=crop" 
                alt="Clinic Interior" 
                className="rounded-3xl shadow-2xl relative z-10 transform translate-x-4 -translate-y-4 hover:translate-x-0 hover:translate-y-0 transition-transform duration-700"
              />
           </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-slate-50 px-6">
         <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase">Nos Pôles de Spécialité</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Un plateau technique complet pour répondre à tous vos besoins de santé.</p>
         </div>
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {specialties.map((s, idx) => {
              const Icon = s.icon;
              return (
                <Card key={idx} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-2 cursor-pointer">
                   <CardContent className="p-8 space-y-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                         <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                      <div className="flex items-center text-primary text-xs font-bold uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         En savoir plus <ChevronRight className="h-3 w-3" />
                      </div>
                   </CardContent>
                </Card>
              );
            })}
         </div>
      </section>

      {/* RDV Section */}
      <section id="rdv" className="py-20 px-6">
         <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row border-4 border-slate-100">
            <div className="lg:w-2/5 p-12 bg-primary text-primary-foreground space-y-6">
               <h2 className="text-3xl font-black leading-tight">Besoin d'un rendez-vous rapide ?</h2>
               <p className="text-primary-foreground/80 font-medium">Laissez-nous vos coordonnées et nous vous rappellerons dans les 30 minutes pour confirmer votre visite.</p>
               <div className="space-y-4 pt-8">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 text-primary bg-white rounded-full flex items-center justify-center shrink-0"><Clock className="h-5 w-5" /></div>
                     <p className="text-sm font-bold">Lun - Sam / 08h00 - 18h00</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 text-primary bg-white rounded-full flex items-center justify-center shrink-0"><MapPin className="h-5 w-5" /></div>
                     <p className="text-sm font-bold leading-snug">{clinic.address}</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 p-12 bg-white">
               <form onSubmit={handleRequestRDV} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Votre Nom Complet</Label>
                        <Input placeholder="Jean Dupont" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12" />
                     </div>
                     <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input placeholder="+242 06 ..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label>Date de visite souhaitée</Label>
                     <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-12" />
                  </div>
                  <div className="space-y-2">
                     <Label>Motif de visite</Label>
                     <Textarea placeholder="Précisez votre besoin (optionnel)" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="min-h-[100px]" />
                  </div>
                  <Button className="w-full h-14 text-lg font-black uppercase tracking-widest mt-4">Soumettre la demande</Button>
               </form>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-20 px-6 text-white border-t border-white/5">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6 max-w-sm">
               <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                     <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <span className="font-black text-2xl tracking-tighter uppercase">{clinic.name}</span>
               </div>
               <p className="text-slate-400 text-sm leading-relaxed">Pionnier de la santé numérique au Congo Brazzaville. Rejoignez le futur de la médecine dès aujourd'hui.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
               <div className="space-y-4">
                  <h4 className="font-bold uppercase tracking-widest text-xs opacity-50">Découvrir</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                     <li className="hover:text-primary cursor-pointer">Accueil</li>
                     <li className="hover:text-primary cursor-pointer">Spécialités</li>
                     <li className="hover:text-primary cursor-pointer">Urgences</li>
                  </ul>
               </div>
               <div className="space-y-4">
                  <h4 className="font-bold uppercase tracking-widest text-xs opacity-50">Support</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                     <li className="hover:text-primary cursor-pointer">Contact</li>
                     <li className="hover:text-primary cursor-pointer">Aide</li>
                  </ul>
               </div>
               <div className="space-y-4">
                  <h4 className="font-bold uppercase tracking-widest text-xs opacity-50">Contact</h4>
                  <p className="text-sm text-slate-300">{clinic.phone}</p>
                  <p className="text-sm text-slate-300">{clinic.email}</p>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between text-[10px] uppercase font-bold text-slate-500 tracking-widest gap-2">
            <p>© 2026 Kiam Health SaaS - Propulsé par <a href="https://www.rxservices-cg.com" className="hover:text-primary transition-colors">RX services</a></p>
            <div className="flex gap-6">
               <span>Confidentialité</span>
               <span>Conditions d'utilisation</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
