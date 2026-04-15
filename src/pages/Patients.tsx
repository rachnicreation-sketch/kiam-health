import { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  User as UserIcon, 
  MapPin, 
  FileText, 
  UserPlus,
  ShieldAlert,
  Droplet,
  IdCard,
  Download
} from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Patient } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

export default function Patients() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    name: "",
    firstName: "",
    gender: "M",
    phone: "",
    age: 0,
    dob: "",
    bloodGroup: "Inconnu",
    city: "Pointe-Noire",
    address: "",
    idNumber: "",
    allergies: "",
    history: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    assurance: ""
  });

  useEffect(() => {
    if (user?.clinicId) {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.patients.list(user.clinicId);
      setPatients(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur de chargement", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.phone || !user?.clinicId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le nom et le téléphone sont obligatoires."
      });
      return;
    }

    try {
      const patientToAdd = {
        ...newPatient,
        clinicId: user.clinicId,
        name: newPatient.name.toUpperCase(),
        age: Number(newPatient.age || 0),
      };

      const response = await api.patients.create(patientToAdd);
      
      if (response.status === 'success') {
        toast({
          title: "Dossier créé",
          description: `Le patient ${newPatient.name} a été enregistré avec le numéro ${response.id}.`
        });
        
        loadPatients();
        setIsAddDialogOpen(false);
        setNewPatient({
          name: "",
          firstName: "",
          gender: "M",
          phone: "",
          age: 0,
          dob: "",
          bloodGroup: "Inconnu",
          city: "Pointe-Noire",
          address: "",
          idNumber: "",
          allergies: "",
          history: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          assurance: ""
        });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur d'enregistrement", description: error.message });
    }
  };

  const handleExport = () => {
    if (patients.length === 0) {
      toast({ variant: "destructive", title: "Export impossible", description: "Il n'y a aucun dossier patient à exporter." });
      return;
    }
    exportToCSV(patients, "Liste_Patients_Kiam_Health");
    toast({ title: "Export réussi", description: "Le fichier CSV a été téléchargé." });
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Gestion des Patients
            </h1>
            <p className="text-muted-foreground text-sm">Consultez et gérez les dossiers médicaux complets</p>
          </div>
      </div>

          {can('patients', 'write') && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nouveau Dossier
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Inscription Nouveau Patient
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Section 1: Etat Civil */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                      <UserIcon className="h-4 w-4" />
                      <h3 className="font-bold text-xs uppercase tracking-wider">1. État civil & Famille</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Nom *</Label>
                        <Input 
                          placeholder="EX: NGOMA" 
                          value={newPatient.name} 
                          onChange={e => setNewPatient({...newPatient, name: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prénoms</Label>
                        <Input 
                          placeholder="EX: Marie" 
                          value={newPatient.firstName} 
                          onChange={e => setNewPatient({...newPatient, firstName: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Date de Naissance</Label>
                        <Input 
                          type="date" 
                          value={newPatient.dob} 
                          onChange={e => setNewPatient({...newPatient, dob: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sexe</Label>
                        <Select value={newPatient.gender} onValueChange={v => setNewPatient({...newPatient, gender: v as 'M' | 'F'})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculin</SelectItem>
                            <SelectItem value="F">Féminin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Identité (CNI / Passport)</Label>
                      <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-9"
                          placeholder="N° de pièce" 
                          value={newPatient.idNumber} 
                          onChange={e => setNewPatient({...newPatient, idNumber: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Contact */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                      <Phone className="h-4 w-4" />
                      <h3 className="font-bold text-xs uppercase tracking-wider">2. Coordonnées & Urgence</h3>
                    </div>
                    <div className="space-y-2">
                      <Label>Numéro de Téléphone *</Label>
                      <Input 
                        placeholder="+242 ..." 
                        value={newPatient.phone} 
                        onChange={e => setNewPatient({...newPatient, phone: e.target.value})} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input 
                          value={newPatient.city} 
                          onChange={e => setNewPatient({...newPatient, city: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                         <Label>Adresse</Label>
                         <Input 
                          placeholder="Rue, Quartier"
                          value={newPatient.address} 
                          onChange={e => setNewPatient({...newPatient, address: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20 relative pt-7">
                      <div className="absolute top-2 left-3 flex items-center gap-1.5 text-destructive text-[10px] font-bold uppercase">
                        <ShieldAlert className="h-3 w-3" />
                        🚨 Contact d'urgence
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Nom" 
                          className="h-8 text-xs bg-white" 
                          value={newPatient.emergencyContactName}
                          onChange={e => setNewPatient({...newPatient, emergencyContactName: e.target.value})}
                        />
                        <Input 
                          placeholder="Tél" 
                          className="h-8 text-xs bg-white" 
                          value={newPatient.emergencyContactPhone}
                          onChange={e => setNewPatient({...newPatient, emergencyContactPhone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Medical */}
                  <div className="md:col-span-2 space-y-4 mt-2">
                    <div className="flex items-center gap-2 text-primary border-b pb-1">
                      <Droplet className="h-4 w-4" />
                      <h3 className="font-bold text-xs uppercase tracking-wider">3. Infos Administratives & Médicales</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Groupe Sanguin</Label>
                        <Select value={newPatient.bloodGroup} onValueChange={v => setNewPatient({...newPatient, bloodGroup: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inconnu">Inconnu</SelectItem>
                            <SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Assurance / Mutuelle</Label>
                        <Input 
                          placeholder="EX: NSIA, COSFIEF..." 
                          value={newPatient.assurance} 
                          onChange={e => setNewPatient({...newPatient, assurance: e.target.value})} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Allergies</Label>
                        <Textarea 
                          placeholder="Pénicilline, Aspirine..." 
                          className="h-20"
                          value={newPatient.allergies}
                          onChange={e => setNewPatient({...newPatient, allergies: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Antécédents majeurs</Label>
                        <Textarea 
                          placeholder="Diabète, Hypertension..." 
                          className="h-20"
                          value={newPatient.history}
                          onChange={e => setNewPatient({...newPatient, history: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-top pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleAddPatient} className="px-8 bg-primary">
                    Créer le dossier patient
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
           </div>
          )}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom, prénom ou N° de dossier..." 
                className="pl-10 h-10 bg-white" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 h-10">
              <Filter className="h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="w-[150px]">N° Dossier</TableHead>
                <TableHead>Nom & Prénoms</TableHead>
                <TableHead className="hidden md:table-cell">Groupe</TableHead>
                <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                <TableHead className="hidden md:table-cell">Dernière Visite</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                    Aucun dossier patient trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow 
                    key={p.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/patients/${p.id}`)}
                  >
                    <TableCell className="font-mono text-[11px] font-bold text-primary">{p.id}</TableCell>
                    <TableCell>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.firstName}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-mono">{p.bloodGroup}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{p.phone}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.lastVisit}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Hospitalisé" ? "default" : p.status === "Urgent" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
