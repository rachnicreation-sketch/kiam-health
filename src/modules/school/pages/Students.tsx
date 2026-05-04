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
  GraduationCap,
  Edit,
  Trash,
  FileText,
  Camera,
  Upload,
  File
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const loadDocuments = async (studentId: string) => {
    try {
      const data = await api.school.listDocuments(studentId);
      setDocuments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const openDossier = (student: any) => {
    setSelectedStudent(student);
    setIsDossierOpen(true);
    loadDocuments(student.id);
  };

  const handleUpload = async (type: string, name: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file || !selectedStudent) return;
      
      setIsUploading(true);
      try {
        const fileUrl = `docs/${selectedStudent.id}/${type}_${file.name}`;
        await api.school.addDocument({
          student_id: selectedStudent.id,
          type,
          name: name + ' (' + file.name + ')',
          file_url: fileUrl
        });
        toast({ title: "Document ajouté", description: `${name} a été enregistré.` });
        loadDocuments(selectedStudent.id);
      } catch (error) {
        toast({ variant: "destructive", title: "Erreur", description: "Échec de l'upload." });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

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
      setStudentForm({ name: "", first_name: "", class_id: "", class_level: "6ème", tutor_name: "", tutor_phone: "", address: "", status: "active" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'inscription." });
    }
  };

  const openEdit = (student: any) => {
    setStudentForm({
      name: student.name,
      first_name: student.first_name,
      class_id: student.class_id || "",
      class_level: student.class_level || "CP",
      tutor_name: student.tutor_name || "",
      tutor_phone: student.tutor_phone || "",
      address: student.address || "",
      status: student.status || "active"
    });
    setEditingStudentId(student.id);
    setIsEditStudentOpen(true);
  };

  const handleUpdateStudent = async () => {
    try {
      await api.school.updateStudent({ ...studentForm, id: editingStudentId });
      toast({ title: "Élève modifié", description: "Les informations ont été mises à jour." });
      setIsEditStudentOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la modification." });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet élève ?")) return;
    try {
      await api.school.deleteStudent(id);
      toast({ title: "Élève supprimé", description: "L'élève a été retiré du registre." });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la suppression." });
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
    class_level: "CP",
    tutor_name: "",
    tutor_phone: "",
    address: "",
    status: "active"
  });

  const levels = [
    // Maternelle
    "Petite Section (PS)", "Moyenne Section (MS)", "Grande Section (GS)",
    // Primaire
    "CP", "CE1", "CE2", "CM1", "CM2",
    // Collège
    "6ème", "5ème", "4ème", "3ème",
    // Lycée
    "Seconde", "Première", "Terminale A", "Terminale C", "Terminale D"
  ];

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

          {isAdmin && (
            <Dialog open={isEditStudentOpen} onOpenChange={setIsEditStudentOpen}>
              <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black flex items-center gap-2">
                    <Edit className="text-sky-600" /> Modifier Élève
                  </DialogTitle>
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
                     <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Statut</Label>
                     <Select value={studentForm.status} onValueChange={v => setStudentForm({...studentForm, status: v})}>
                       <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="active">Actif (Inscrit)</SelectItem>
                         <SelectItem value="inactive">Inactif</SelectItem>
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
                   <Button className="col-span-2 bg-edu-gradient text-white h-12 rounded-xl font-bold mt-4 shadow-lg shadow-sky-100" onClick={handleUpdateStudent}>Enregistrer les modifications</Button>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuItem onClick={() => openDossier(student)} className="cursor-pointer gap-2 font-bold text-sky-700 bg-sky-50/50">
                              <FileText className="w-4 h-4" /> Dossier Numérique
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(student)} className="cursor-pointer gap-2 font-medium">
                              <Edit className="w-4 h-4 text-sky-600" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStudent(student.id)} className="cursor-pointer gap-2 font-medium text-rose-600 focus:text-rose-700">
                              <Trash className="w-4 h-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDossierOpen} onOpenChange={setIsDossierOpen}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-edu-gradient p-8 text-white">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Dossier Numérique</h2>
                    <p className="text-sky-100 font-medium">Élève : {selectedStudent?.first_name} {selectedStudent?.name}</p>
                 </div>
                 <Badge className="bg-white/20 text-white border-none px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest">{selectedStudent?.class_level}</Badge>
              </div>
           </div>
           
           <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50">
              <div className="md:col-span-1 space-y-4">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Télécharger un document</h3>
                 
                 {[
                   { id: 'photo', label: 'Photo d\'identité', icon: Camera, color: 'bg-blue-500' },
                   { id: 'birth', label: 'Acte de Naissance', icon: File, color: 'bg-emerald-500' },
                   { id: 'id_card', label: 'Pièce d\'identité', icon: FileText, color: 'bg-indigo-500' },
                   { id: 'cv', label: 'CV / Dossier Scolaire', icon: GraduationCap, color: 'bg-orange-500' }
                 ].map(doc => (
                   <button 
                     key={doc.id}
                     disabled={isUploading}
                     onClick={() => handleUpload(doc.id, doc.label)}
                     className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group border border-slate-100"
                   >
                     <div className={`h-10 w-10 rounded-xl ${doc.color} text-white flex items-center justify-center shrink-0`}>
                        <doc.icon className="h-5 w-5" />
                     </div>
                     <div className="text-left">
                        <p className="text-xs font-black text-slate-800">{doc.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Cliquer pour charger</p>
                     </div>
                     <Upload className="h-4 w-4 ml-auto text-slate-200 group-hover:text-primary transition-colors" />
                   </button>
                 ))}
              </div>

              <div className="md:col-span-2 space-y-4">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Documents Archivés ({documents.length})</h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documents.length === 0 ? (
                       <div className="col-span-2 h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 italic">
                          <FileText className="h-12 w-12 mb-2 opacity-20" />
                          <p>Aucun document archivé</p>
                       </div>
                    ) : (
                      documents.map(doc => (
                        <div key={doc.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 group hover:border-primary/30 transition-colors">
                           <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <File className="h-5 w-5" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                              <p className="text-[10px] text-slate-400">Ajouté le {new Date().toLocaleDateString()}</p>
                           </div>
                           <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto rounded-lg text-slate-300 hover:text-primary">
                              <Download className="h-4 w-4" />
                           </Button>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
