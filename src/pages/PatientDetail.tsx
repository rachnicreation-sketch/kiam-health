import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Patient, Consultation, Clinic } from "@/lib/mock-data";
import { useAuth } from "@/hooks/useAuth";
import { DocumentPreview } from "@/components/DocumentPreview";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Activity, 
  ClipboardList, 
  Pill,
  Droplet,
  ShieldAlert,
  IdCard,
  PlusCircle,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const { user, can } = useAuth();

  useEffect(() => {
    if (id && user?.clinicId) {
      const allPatients: Patient[] = JSON.parse(localStorage.getItem('kiam_patients') || '[]');
      const allConsultations: Consultation[] = JSON.parse(localStorage.getItem('kiam_consultations') || '[]');
      const allClinics: Clinic[] = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
      
      const foundPatient = allPatients.find(p => p.id === id && p.clinicId === user.clinicId);
      if (foundPatient) {
        setPatient(foundPatient);
        setConsultations(allConsultations.filter(c => c.patientId === id && c.clinicId === user.clinicId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setClinic(allClinics.find(c => c.id === user.clinicId) || null);
      }
    }
  }, [id, user]);

  if (!patient) return <div className="p-8 text-center">Chargement du dossier...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Dossier Patient</h1>
        </div>
        {can('consultations', 'write') && (
          <Button className="gap-2" onClick={() => navigate(`/consultations?patientId=${patient.id}`)}>
            <PlusCircle className="h-4 w-4" />
            Démarrer une consultation
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                <User className="h-12 w-12 text-primary" />
                {patient.bloodGroup && patient.bloodGroup !== "Inconnu" && (
                  <div className="absolute -bottom-1 -right-1 bg-destructive text-white text-[10px] font-bold h-7 w-7 rounded-full flex items-center justify-center border-2 border-white">
                    {patient.bloodGroup}
                  </div>
                )}
              </div>
              <CardTitle className="text-xl uppercase">{patient.name} {patient.firstName}</CardTitle>
              <CardDescription className="font-mono text-primary font-bold">{patient.id}</CardDescription>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant={patient.status === "Sorti" ? "secondary" : "default"}>{patient.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 border-t">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{patient.age} ans ({patient.gender === 'M' ? 'Masculin' : 'Féminin'})</span>
                </div>
                {patient.dob && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-7 italic">
                    Né(e) le {patient.dob}
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.city}, {patient.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span>ID: {patient.idNumber || "Non renseigné"}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-destructive uppercase">
                  <ShieldAlert className="h-3 w-3" />
                  Contact d'urgence
                </div>
                <p className="text-sm font-medium">{patient.emergencyContactName || "Non spécifié"}</p>
                <p className="text-xs text-muted-foreground">{patient.emergencyContactPhone || ""}</p>
              </div>
              <Button className="w-full mt-4" variant="outline" size="sm">Modifier le profil</Button>
            </CardContent>
          </Card>

          {/* Medical history restricted to medical/nursing staff */}
          {can('consultations', 'read') && !['medical_secretary', 'receptionist', 'nurse_aide'].includes(user?.role || '') && (
            <Card className="border-none shadow-sm bg-destructive/5 text-destructive border border-destructive/10">
              <CardHeader className="py-3">
                <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Détails Médicaux Confidentiels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase opacity-70">Allergies</Label>
                  <p className="text-sm font-semibold">{patient.allergies || "Aucune connue"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase opacity-70">Antécédents majeurs</Label>
                  <p className="text-xs">{patient.history || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: History and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <TabsList className="w-full justify-start border-b rounded-none bg-muted/20 h-12 p-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none px-6 h-full border-r">Aperçu</TabsTrigger>
              {can('consultations', 'read') && !['receptionist', 'nurse_aide'].includes(user?.role || '') && (
                <TabsTrigger value="consultations" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none px-6 h-full border-r">Consultations ({consultations.length})</TabsTrigger>
              )}
              {can('pharmacy', 'read') && !['receptionist'].includes(user?.role || '') && (
                <TabsTrigger value="prescriptions" className="data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none px-6 h-full">Ordonnances</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="overview" className="p-6 m-0 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-muted/30 border-none">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Signes vitaux (Derniers)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {consultations.length > 0 && consultations[0].vitals ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col p-2 bg-white rounded border">
                          <span className="text-muted-foreground text-[10px]">Tension:</span>
                          <span className="font-bold">{consultations[0].vitals.bp || "--"}</span>
                        </div>
                        <div className="flex flex-col p-2 bg-white rounded border">
                          <span className="text-muted-foreground text-[10px]">Temp:</span>
                          <span className="font-bold">{consultations[0].vitals.temp || "--"} °C</span>
                        </div>
                        <div className="flex flex-col p-2 bg-white rounded border">
                          <span className="text-muted-foreground text-[10px]">Poids:</span>
                          <span className="font-bold">{consultations[0].vitals.weight || "--"} kg</span>
                        </div>
                        <div className="flex flex-col p-2 bg-white rounded border">
                          <span className="text-muted-foreground text-[10px]">Pouls:</span>
                          <span className="font-bold">{consultations[0].vitals.hr || "--"} bpm</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic text-center py-4">Aucune donnée récente</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 border-none">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                       <Stethoscope className="h-4 w-4" />
                       Prochain RDV
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 flex items-center justify-center min-h-[80px]">
                    <p className="text-xs text-muted-foreground italic">Aucun rendez-vous planifié</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Dernières Activités</h3>
                <div className="space-y-4">
                  {consultations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm italic border-2 border-dashed rounded-lg">
                      Aucune activité enregistrée
                    </div>
                  ) : (
                    consultations.slice(0, 3).map((c) => (
                      <div key={c.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="mt-1 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">{c.reason}</p>
                            <span className="text-[10px] text-muted-foreground">{c.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground py-1">Diagnostic: <span className="font-medium text-foreground">{c.diagnosis}</span></p>
                          <div className="flex gap-2 mt-1">
                            <Badge className="bg-success/10 text-success border-none text-[9px] h-4">Prescription établie</Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="consultations" className="m-0 p-6">
               <div className="space-y-4">
                 {consultations.map(c => (
                   <Card key={c.id} className="border shadow-none hover:border-primary/50 cursor-pointer overflow-hidden">
                     <div className="flex">
                       <div className="w-1.5 bg-primary"></div>
                       <CardContent className="p-4 flex-1">
                         <div className="flex justify-between mb-2">
                           <span className="text-xs font-bold font-mono text-primary">{c.id}</span>
                           <span className="text-xs text-muted-foreground">{c.date}</span>
                         </div>
                         <h4 className="text-sm font-bold mb-1">{c.reason}</h4>
                         <p className="text-xs text-muted-foreground line-clamp-2 italic">"{c.notes}"</p>
                         <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
                           <div>
                             <Label className="text-[9px] uppercase text-muted-foreground">Diagnostic</Label>
                             <p className="text-[11px] font-medium">{c.diagnosis}</p>
                           </div>
                           <div>
                             <Label className="text-[9px] uppercase text-muted-foreground">Traitement</Label>
                             <p className="text-[11px] font-medium text-success">{c.prescription}</p>
                           </div>
                         </div>
                       </CardContent>
                     </div>
                   </Card>
                 ))}
                 {consultations.length === 0 && <p className="text-center py-8 text-muted-foreground">Aucune consultation</p>}
               </div>
            </TabsContent>

            <TabsContent value="prescriptions" className="m-0 p-6">
               <div className="space-y-4">
                 {consultations.filter(c => c.prescription && c.prescription !== "Aucune prescription").length === 0 ? (
                   <div className="text-center py-12">
                     <Pill className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-20" />
                     <p className="text-sm text-muted-foreground">Aucune ordonnance enregistrée pour ce patient.</p>
                   </div>
                 ) : (
                   consultations
                     .filter(c => c.prescription && c.prescription !== "Aucune prescription")
                     .map(c => (
                       <Card key={`presc-${c.id}`} className="border-none shadow-sm bg-success/5 border-l-4 border-l-success">
                         <CardContent className="p-4">
                           <div className="flex justify-between items-start mb-2">
                             <div>
                               <p className="text-[10px] font-bold text-success uppercase">Ordonnance du {c.date}</p>
                               <p className="text-xs text-muted-foreground">Réf: {c.id}</p>
                             </div>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-7 text-[10px] gap-1 text-success hover:text-success hover:bg-success/10"
                               onClick={() => {
                                 setSelectedPrescription(c);
                                 setIsPreviewOpen(true);
                               }}
                             >
                               Imprimer
                             </Button>
                           </div>
                           <div className="bg-white p-3 rounded border border-success/10 mt-2">
                             <pre className="text-sm font-sans whitespace-pre-wrap">{c.prescription}</pre>
                           </div>
                           <p className="text-[10px] mt-2 text-muted-foreground italic text-right">Prescrit par le médecin en charge</p>
                         </CardContent>
                       </Card>
                     ))
                 )}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DocumentPreview 
        type="prescription" 
        isOpen={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
        data={selectedPrescription} 
        clinic={clinic} 
        patient={patient} 
      />
    </div>
  );
}
