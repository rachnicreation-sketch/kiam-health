import { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Users, 
  UserPlus
} from "lucide-react";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

// Role-based dashboards
import { SchoolAdminDashboard } from "../components/AdminDashboard";
import { TeacherDashboard } from "../components/TeacherDashboard";
import { StudentDashboard } from "../components/StudentDashboard";
import { ParentDashboard } from "../components/ParentDashboard";
import { AccountantDashboard } from "../components/AccountantDashboard";
import { SecretariatDashboard } from "../components/SecretariatDashboard";

export default function SchoolDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: "",
    first_name: "",
    class_level: "6ème",
    tutor_name: "",
    tutor_phone: "",
    address: ""
  });

  const classes = ["6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale"];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const statData = await api.school.stats(user.clinicId);
      setStats(statData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des données scolaire échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      await api.school.addStudent({ ...studentForm, clinicId: user.clinicId });
      toast({ title: "Élève inscrit", description: `${studentForm.first_name} ${studentForm.name} a été ajouté à la base.` });
      setIsAddStudentOpen(false);
      loadData();
      setStudentForm({ name: "", first_name: "", class_level: "6ème", tutor_name: "", tutor_phone: "", address: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'inscription." });
    }
  };

  // Render dashboard based on role
  const renderDashboard = () => {
    const role = user?.role?.toLowerCase() || 'admin_ecole';
    
    switch (role) {
      case 'enseignant':
        return <TeacherDashboard stats={stats} user={user} />;
      case 'eleve':
        return <StudentDashboard stats={stats} user={user} />;
      case 'parent':
        return <ParentDashboard stats={stats} user={user} />;
      case 'comptable':
        return <AccountantDashboard stats={stats} user={user} />;
      case 'secretariat':
        return <SecretariatDashboard stats={stats} user={user} onAddStudent={() => setIsAddStudentOpen(true)} />;
      case 'clinic_admin':
      case 'admin_ecole':
      default:
        return <SchoolAdminDashboard stats={stats} onAddStudent={() => setIsAddStudentOpen(true)} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      
      {renderDashboard()}

      {/* Shared Dialogs (mostly for admin) */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inscription Académique</DialogTitle>
            <CardDescription>Remplissez la fiche d'inscription du nouvel élève</CardDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
             <div className="space-y-2">
               <Label>Nom *</Label>
               <Input placeholder="MABIALA" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Prénom *</Label>
               <Input placeholder="Jean-Pierre" value={studentForm.first_name} onChange={e => setStudentForm({...studentForm, first_name: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Classe / Niveau *</Label>
               <Select value={studentForm.class_level} onValueChange={v => setStudentForm({...studentForm, class_level: v})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Tuteur (Nom)</Label>
               <Input placeholder="Parent / Gardien" value={studentForm.tutor_name} onChange={e => setStudentForm({...studentForm, tutor_name: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Tél. Tuteur</Label>
               <Input placeholder="06 xxx xx xx" value={studentForm.tutor_phone} onChange={e => setStudentForm({...studentForm, tutor_phone: e.target.value})} />
             </div>
             <div className="space-y-2 col-span-2">
               <Label>Adresse de résidence</Label>
               <Input placeholder="Quartier, Rue..." value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
             </div>
             <Button className="col-span-2 bg-sky-600 mt-4" onClick={handleAddStudent}>Valider l'inscription</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
