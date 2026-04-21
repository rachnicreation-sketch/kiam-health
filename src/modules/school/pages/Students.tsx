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

export default function Students() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

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

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [studentData, classData] = await Promise.all([
        api.school.students(user.clinicId),
        api.school.stats(user.clinicId).then(() => apiRequest("school.php?action=list_classes", {})) // Manual fetch for now as api-service is limited
      ]);
      setStudents(studentData);
      // setClasses(classData); 
    } catch (error) {
      // Fallback for missing api methods
      const data = await api.school.students(user.clinicId);
      setStudents(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    try {
      await api.school.addStudent({ ...studentForm, clinicId: user.clinicId });
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-sky-600" /> Registre des Élèves
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Bases de données centrale des apprenants.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700 font-bold gap-2">
                <UserPlus className="w-4 h-4" /> Nouvel Élève
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
                   <Input placeholder="Nom" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Prénom *</Label>
                   <Input placeholder="Prénom" value={studentForm.first_name} onChange={e => setStudentForm({...studentForm, first_name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Niveau *</Label>
                   <Select value={studentForm.class_level} onValueChange={v => setStudentForm({...studentForm, class_level: v})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       {levels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Tuteur (Nom)</Label>
                   <Input placeholder="Parent / Gardien" value={studentForm.tutor_name} onChange={e => setStudentForm({...studentForm, tutor_name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Tél. Tuteur</Label>
                   <Input placeholder="Téléphone" value={studentForm.tutor_phone} onChange={e => setStudentForm({...studentForm, tutor_phone: e.target.value})} />
                 </div>
                 <div className="space-y-2 col-span-2">
                   <Label>Adresse</Label>
                   <Input placeholder="Adresse de résidence" value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
                 </div>
                 <Button className="col-span-2 bg-sky-600 mt-4" onClick={handleAddStudent}>Valider l'inscription</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Rechercher un élève, une classe..." 
                className="pl-10 h-10 border-slate-200" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
               <Button variant="ghost" size="sm" className="text-slate-500 font-bold"><Filter className="w-4 h-4 mr-2" /> Filtrer</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="text-[11px] font-black uppercase tracking-widest">Élève</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest">Niveau / Classe</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest">Tuteur / Contact</TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest">Statut</TableHead>
                <TableHead className="text-right text-[11px] font-black uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400 italic">Aucun élève trouvé</TableCell>
                </TableRow>
              ) : (
                filteredStudents.map(student => (
                  <TableRow key={student.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <div className="h-9 w-9 bg-sky-100 rounded-full flex items-center justify-center font-black text-sky-700 text-xs">
                           {student.name[0]}{student.first_name?.[0] || ''}
                         </div>
                         <div>
                           <div className="font-bold text-slate-900">{student.first_name} {student.name}</div>
                           <div className="text-[10px] font-mono text-slate-400 uppercase">{student.id}</div>
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
                      <Badge className={student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}>
                        {student.status === 'active' ? 'En Scrit' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
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

// Helper for manual fetch since we can't update api-service.ts easily in the same call
async function apiRequest(endpoint: string, options: any) {
    const token = localStorage.getItem('kiam_jwt_token');
    const response = await fetch(`/kiam/api/${endpoint}`, {
      ...options,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...options.headers }
    });
    return response.json();
}
