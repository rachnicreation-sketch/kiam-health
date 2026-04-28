import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Filter,
  Download,
  GraduationCap
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
import { DUMMY_STUDENTS } from "@/lib/mock-data";

export default function Students() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Strict Role Checking
  const isFinance = user?.role === 'school_finance';
  const isTeacher = user?.role === 'school_teacher';
  const isAdmin = user?.role === 'school_admin' || user?.role === 'clinic_admin' || user?.role === 'saas_admin';
  const canView = ['school_direction', 'school_admin', 'school_scolarite', 'clinic_admin', 'saas_admin'].includes(user?.role || '');

  useEffect(() => {
    if (isPresentationMode) {
      setStudents(DUMMY_STUDENTS);
      setIsLoading(false);
    } else if (user?.clinicId) {
      loadData();
    }
  }, [user, isPresentationMode]);

  if (isFinance || isTeacher || !canView) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 italic">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Users className="h-10 w-10 opacity-10" />
        </div>
        <p>Accès Refusé. Le registre des élèves est réservé à l'Administration et à la Scolarité.</p>
      </div>
    );
  }

  const loadData = async () => {
    setIsLoading(true);
    try {
      const studentData = await api.school.students(user!.clinicId!);
      setStudents(studentData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des élèves échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      await api.school.addStudent({ ...studentForm, clinicId: user!.clinicId });
      toast({ title: "Élève inscrit", description: `${studentForm.first_name} ${studentForm.name} a été ajouté.` });
      setIsAddStudentOpen(false);
      loadData();
      setStudentForm({ name: "", first_name: "", class_id: "", class_level: "6ème", tutor_name: "", tutor_phone: "", address: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'inscription." });
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [studentForm, setStudentForm] = useState({
    name: "",
    first_name: "",
    class_id: "",
    class_level: "6ème",
    tutor_name: "",
    tutor_phone: "",
    address: ""
  });

  const levels = ["6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale"];

  return (
    <div className="space-y-6 p-2 sm:p-6 italic-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-sky-200">
              <Users className="w-6 h-6 text-white" />
            </div>
            Registre des Élèves
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Bases de données centrale des apprenants.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white font-bold gap-2 border-slate-200 h-11 px-6 rounded-xl">
            <Download className="w-4 h-4" /> Export
          </Button>
          {isAdmin && (
            <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
              <DialogTrigger asChild>
                <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-sky-200 h-11 px-6 rounded-xl">
                  <UserPlus className="w-4 h-4" /> Nouvel Élève
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black flex items-center gap-2">
                    <GraduationCap className="text-sky-600" /> Inscription Académique
                  </DialogTitle>
                  <CardDescription className="font-medium">Remplissez la fiche d'inscription du nouvel élève</CardDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 pt-4">
                   <div className="space-y-2">
                     <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom *</Label>
                     <Input placeholder="Nom" className="rounded-xl border-slate-200 h-11" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Prénom *</Label>
                     <Input placeholder="Prénom" className="rounded-xl border-slate-200 h-11" value={studentForm.first_name} onChange={e => setStudentForm({...studentForm, first_name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Niveau *</Label>
                     <Select value={studentForm.class_level} onValueChange={v => setStudentForm({...studentForm, class_level: v})}>
                       <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         {levels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tuteur (Nom)</Label>
                     <Input placeholder="Parent / Gardien" className="rounded-xl border-slate-200 h-11" value={studentForm.tutor_name} onChange={e => setStudentForm({...studentForm, tutor_name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tél. Tuteur</Label>
                     <Input placeholder="Téléphone" className="rounded-xl border-slate-200 h-11" value={studentForm.tutor_phone} onChange={e => setStudentForm({...studentForm, tutor_phone: e.target.value})} />
                   </div>
                   <div className="space-y-2 col-span-2">
                     <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Adresse</Label>
                     <Input placeholder="Adresse de résidence" className="rounded-xl border-slate-200 h-11" value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
                   </div>
                   <Button className="col-span-2 bg-edu-gradient text-white h-12 rounded-xl font-bold mt-4 shadow-lg shadow-sky-100" onClick={handleAddStudent}>Valider l'inscription</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem]">
        <CardHeader className="bg-slate-50/50 border-b pb-6 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Rechercher un élève, une classe..." 
                className="pl-12 h-12 border-none bg-white shadow-inner rounded-2xl text-sm" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="sm" className="text-slate-500 font-bold hover:bg-white hover:shadow-sm rounded-xl px-4"><Filter className="w-4 h-4 mr-2" /> Filtrer</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="border-none">
                  <TableHead className="text-[11px] font-black uppercase tracking-widest px-6 py-4">Élève</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest py-4">Niveau / Classe</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest py-4">Tuteur / Contact</TableHead>
                  <TableHead className="text-[11px] font-black uppercase tracking-widest py-4">Statut</TableHead>
                  <TableHead className="text-right text-[11px] font-black uppercase tracking-widest px-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">Aucun élève trouvé dans le registre</TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-sky-50/30 transition-colors cursor-pointer group border-b border-slate-50">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                           <div className="h-11 w-11 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-lg shadow-sky-100 group-hover:scale-110 transition-transform">
                             {student.name[0]}{student.first_name?.[0] || ''}
                           </div>
                           <div>
                             <div className="font-black text-slate-900 group-hover:text-sky-600 transition-colors">{student.first_name} {student.name}</div>
                             <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{student.id}</div>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-sky-100 font-bold px-3 py-1 rounded-lg">{student.class_level}</Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-xs font-medium space-y-1">
                           <div className="flex items-center gap-2 text-slate-700"><Users className="h-3.5 w-3.5 text-slate-400" /> {student.tutor_name}</div>
                           <div className="flex items-center gap-2 text-slate-400"><Phone className="h-3.5 w-3.5" /> {student.tutor_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={student.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-none font-bold' : 'bg-slate-100 text-slate-600 border-none font-bold'}>
                          {student.status === 'active' ? '● Inscrit' : '○ Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
