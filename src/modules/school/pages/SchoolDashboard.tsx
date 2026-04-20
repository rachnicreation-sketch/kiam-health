import { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock, 
  Plus, 
  Search, 
  UserPlus, 
  ClipboardCheck, 
  Award, 
  Calendar,
  Filter,
  MoreVertical,
  Mail,
  Phone
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

export default function SchoolDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      const [studentData, statData] = await Promise.all([
        api.school.students(user.clinicId),
        api.school.stats(user.clinicId)
      ]);
      setStudents(studentData);
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

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-sky-600" /> Kiam School System
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion académique et suivi des élèves.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700 font-bold gap-2">
                <UserPlus className="w-4 h-4" /> Inscrire un Élève
              </Button>
            </DialogTrigger>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Élèves" value={stats.total_students || "0"} icon={Users} className="bg-white" />
        <StatCard title="Élèves Actifs" value={stats.active_students || "0"} change="En cours" changeType="positive" icon={CheckCircle2} iconClassName="bg-sky-100 text-sky-600" className="bg-white" />
        <StatCard title="Classes" value="18" change="Toutes actives" changeType="neutral" icon={BookOpen} iconClassName="bg-emerald-100 text-emerald-600" className="bg-white" />
        <StatCard title="Absences (J)" value="12" change="Attention" changeType="negative" icon={Clock} iconClassName="bg-rose-100 text-rose-600" className="bg-white" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Registre des Élèves</CardTitle>
                <CardDescription>Liste globale des inscrits par classe</CardDescription>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Rechercher un élève, une classe..." 
                  className="pl-10 h-10 border-slate-200" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest">ID / Élève</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest">Classe</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest">Tuteur / Contact</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest">Statut</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic">Aucun élève trouvé</TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 bg-sky-100 rounded-full flex items-center justify-center font-black text-sky-700 text-xs">
                             {student.name[0]}{student.first_name[0]}
                           </div>
                           <div>
                             <div className="font-bold text-slate-900">{student.first_name} {student.name}</div>
                             <div className="text-[10px] font-mono text-slate-400">{student.id}</div>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-sky-100">{student.class_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium space-y-0.5">
                           <div className="flex items-center gap-1 text-slate-600"><GraduationCap className="h-3 w-3" /> {student.tutor_name}</div>
                           <div className="flex items-center gap-1 text-slate-400"><Phone className="h-3 w-3" /> {student.tutor_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500">Actif</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-600" title="Notes"><Award className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-sky-600" title="Présence"><ClipboardCheck className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreVertical className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
