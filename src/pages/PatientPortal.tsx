import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, 
  LogOut, 
  History, 
  Pill, 
  FlaskConical, 
  Calendar, 
  ChevronRight,
  Download,
  Printer,
  FileText,
  Activity,
  Heart
} from "lucide-material";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Patient, Consultation, LabTest, Clinic } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentPreview } from "@/components/DocumentPreview";

export default function PatientPortal() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewType, setPreviewType] = useState<'prescription' | 'lab'>('prescription');

  useEffect(() => {
    const allClinics: Clinic[] = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
    setClinic(allClinics.find(c => c.id === clinicId) || null);
  }, [clinicId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const allPatients: Patient[] = JSON.parse(localStorage.getItem('kiam_patients') || '[]');
    const found = allPatients.find(p => p.id === patientIdInput && p.clinicId === clinicId);
    
    if (found) {
      setPatient(found);
      const allConsultations: Consultation[] = JSON.parse(localStorage.getItem('kiam_consultations') || '[]');
      const allLabTests: LabTest[] = JSON.parse(localStorage.getItem('kiam_lab_tests') || '[]');
      
      setConsultations(allConsultations.filter(c => c.patientId === found.id));
      setLabTests(allLabTests.filter(t => t.patientId === found.id));
      setIsLoggedIn(true);
      toast({ title: "Connexion réussie", description: `Bienvenue dans votre espace, ${found.name}.` });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: "Identifiant patient incorrect pour cet établissement." });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPatient(null);
    setPatientIdInput("");
  };

  const openDoc = (type: 'prescription' | 'lab', data: any) => {
    setPreviewType(type);
    setPreviewData(data);
    setIsPreviewOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100">
          <div className="text-center space-y-4">
             <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Heart className="h-10 w-10 text-primary" />
             </div>
             <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">Espace Patient</h1>
             <p className="text-sm text-muted-foreground italic font-medium">Accédez à vos ordonnances et résultats d'analyses.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6 pt-4">
             <div className="space-y-2">
                <Label htmlFor="pid">Identifiant Patient (ID Kiam)</Label>
                <Input 
                  id="pid" 
                  placeholder="Ex: PT-2026-0001" 
                  className="h-14 font-mono text-lg tracking-widest text-center" 
                  value={patientIdInput}
                  onChange={e => setPatientIdInput(e.target.value.toUpperCase())}
                />
             </div>
             <Button className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-lg shadow-primary/20">Se Connecter</Button>
          </form>
          
          <div className="text-center pt-6">
             <button onClick={() => navigate(`/${clinicId}`)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Retour au site vitrine</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
         <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Heart className="h-5 w-5 text-primary" />
               <span className="font-black text-sm uppercase tracking-widest text-primary">Portail Santé</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-black uppercase leading-tight">{patient?.name} {patient?.firstName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{patient?.id}</p>
               </div>
               <Button variant="ghost" size="icon" className="hover:text-rose-600" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
               </Button>
            </div>
         </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-24 pb-20 space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="md:col-span-1 border-none shadow-sm bg-primary text-primary-foreground h-fit">
               <CardContent className="p-6 space-y-6">
                  <div className="h-20 w-20 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                     <User className="h-10 w-10" />
                  </div>
                  <div className="text-center">
                     <h3 className="text-xl font-black uppercase">{patient?.name}</h3>
                     <p className="text-xs opacity-70">Membre depuis {patient?.createdAt?.split('T')[0]}</p>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-white/10 uppercase tracking-tighter text-[10px] font-bold">
                     <div className="flex justify-between">
                        <span>Groupe Sanguin</span>
                        <span className="text-white">{patient?.bloodGroup}</span>
                     </div>
                     <div className="flex justify-between">
                        <span>Âge</span>
                        <span className="text-white">{patient?.age} Ans</span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <div className="md:col-span-3">
               <Tabs defaultValue="history" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border p-1 rounded-xl mb-6">
                     <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> Consultations</TabsTrigger>
                     <TabsTrigger value="prescriptions" className="gap-2"><Pill className="h-4 w-4" /> Ordonnances</TabsTrigger>
                     <TabsTrigger value="labs" className="gap-2"><FlaskConical className="h-4 w-4" /> Analyses</TabsTrigger>
                  </TabsList>

                  <TabsContent value="history" className="space-y-4">
                     {consultations.length === 0 ? (
                       <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                          <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">Aucun historique de visite disponible.</p>
                       </div>
                     ) : (
                       consultations.map(c => (
                         <Card key={c.id} className="border-none shadow-sm group hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer bg-white">
                            <CardContent className="p-5 flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                     <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  </div>
                                  <div>
                                     <p className="text-xs font-bold uppercase text-slate-800">{c.reason}</p>
                                     <p className="text-[10px] text-muted-foreground">Visite du {c.date}</p>
                                  </div>
                               </div>
                               <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                            </CardContent>
                         </Card>
                       ))
                     )}
                  </TabsContent>

                  <TabsContent value="prescriptions" className="space-y-4">
                     {consultations.filter(c => c.prescription && c.prescription !== 'Aucune').map(c => (
                        <Card key={`pr-${c.id}`} className="border-none shadow-sm bg-white overflow-hidden group">
                           <CardContent className="p-0 flex">
                              <div className="w-2 bg-emerald-500"></div>
                              <div className="p-5 flex-1 flex items-center justify-between">
                                 <div>
                                    <p className="text-xs font-black uppercase text-emerald-600">Ordonnance Médicale</p>
                                    <p className="text-[10px] text-muted-foreground">{c.date} - Réf: {c.id}</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50" onClick={() => openDoc('prescription', c)}>
                                       <FileText className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-600 hover:bg-emerald-50" onClick={() => openDoc('prescription', c)}>
                                       <Printer className="h-5 w-5" />
                                    </Button>
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                     ))}
                  </TabsContent>

                  <TabsContent value="labs" className="space-y-4">
                     {labTests.map(t => (
                        <Card key={`lab-${t.id}`} className="border-none shadow-sm bg-white overflow-hidden group">
                           <CardContent className="p-0 flex">
                              <div className="w-2 bg-blue-500"></div>
                              <div className="p-5 flex-1 flex items-center justify-between">
                                 <div>
                                    <p className="text-xs font-black uppercase text-blue-600">{t.testName}</p>
                                    <p className="text-[10px] text-muted-foreground">{t.date} - Réf: {t.id}</p>
                                 </div>
                                 <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className={t.status === 'completed' ? 'bg-blue-600' : 'bg-slate-100'}>
                                    {t.status === 'completed' ? 'Résultat disponible' : 'En attente'}
                                 </Badge>
                                 {t.status === 'completed' && (
                                   <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" onClick={() => openDoc('lab', t)}>
                                      <Download className="h-5 w-5" />
                                   </Button>
                                 )}
                              </div>
                           </CardContent>
                        </Card>
                     ))}
                  </TabsContent>
               </Tabs>
            </div>
         </div>
      </main>

      <DocumentPreview 
        type={previewType}
        data={previewData}
        clinic={clinic}
        patient={patient}
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </div>
  );
}
