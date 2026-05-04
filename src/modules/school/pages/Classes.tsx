import { useState, useEffect } from "react";
import { 
  Building2, 
  Plus, 
  Users, 
  UserCog, 
  MoreVertical, 
  Search,
  BookOpen,
  Edit,
  Trash
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
  DialogTrigger,
  DialogDescription 
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DUMMY_CLASSES } from "@/lib/mock-data";
import { api } from "@/lib/api-service";

export default function Classes() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isStudentsListOpen, setIsStudentsListOpen] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [classForm, setClassForm] = useState({
    name: "",
    level: "CP",
    room_number: "",
    teacher_id: ""
  });

  useEffect(() => {
    if (isPresentationMode) {
      setClasses(DUMMY_CLASSES);
      setIsLoading(false);
    } else if (user?.clinicId) {
      loadData();
    }
  }, [user, isPresentationMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.school.classes(user!.clinicId!);
      setClasses(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des classes échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClass = async () => {
    try {
      await api.school.addClass({ ...classForm, clinicId: user!.clinicId });
      toast({ title: "Classe créée", description: `La classe ${classForm.name} a été ajoutée.` });
      setIsAddClassOpen(false);
      loadData();
      setClassForm({ name: "", level: "6ème", room_number: "", teacher_id: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la création." });
    }
  };

  const openEdit = (cls: any) => {
    setClassForm({
      name: cls.name,
      level: cls.level,
      room_number: cls.room_number || "",
      teacher_id: cls.teacher_id || ""
    });
    setEditingClassId(cls.id);
    setIsEditClassOpen(true);
  };

  const handleUpdateClass = async () => {
    try {
      await api.school.updateClass({ ...classForm, id: editingClassId });
      toast({ title: "Classe modifiée", description: "Les informations ont été mises à jour." });
      setIsEditClassOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la modification." });
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette classe ?")) return;
    try {
      await api.school.deleteClass(id);
      toast({ title: "Classe supprimée", description: "La classe a été retirée." });
      loadData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la suppression." });
    }
  };

  const openStudentsList = async (cls: any) => {
    setSelectedClass(cls);
    setIsStudentsListOpen(true);
    try {
      const allStudents = await api.school.students(user!.clinicId!);
      const filtered = allStudents.filter((s: any) => s.class_id === cls.id || s.class_level === cls.level);
      setClassStudents(filtered);
    } catch (error) {
      console.error(error);
    }
  };

  const openStudentDossier = async (student: any) => {
    setSelectedStudent(student);
    setIsDossierOpen(true);
    try {
      const docs = await api.school.listDocuments(student.id);
      setDocuments(docs);
    } catch (error) {
      console.error(error);
    }
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
        const docs = await api.school.listDocuments(selectedStudent.id);
        setDocuments(docs);
      } catch (error) {
        toast({ variant: "destructive", title: "Erreur", description: "Échec de l'upload." });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-sky-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            Gestion des Classes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Organisation des salles et des niveaux scolaires.</p>
        </div>
        <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
          <DialogTrigger asChild>
            <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-sky-200 h-11 px-6 rounded-xl">
              <Plus className="w-4 h-4" /> Nouvelle Classe
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Building2 className="text-sky-600" /> Créer une Classe
              </DialogTitle>
              <CardDescription className="font-medium">Configurez une nouvelle section pédagogique</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom de la Classe *</Label>
                <Input placeholder="ex: 6ème A, Terminale C" className="rounded-xl border-slate-200 h-11" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Niveau Scolaire</Label>
                <Select value={classForm.level} onValueChange={v => setClassForm({...classForm, level: v})}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue placeholder="Choisir un niveau..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">🌱 Maternelle</SelectLabel>
                      <SelectItem value="Petite Section (PS)">Petite Section (PS)</SelectItem>
                      <SelectItem value="Moyenne Section (MS)">Moyenne Section (MS)</SelectItem>
                      <SelectItem value="Grande Section (GS)">Grande Section (GS)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">📚 Primaire</SelectLabel>
                      <SelectItem value="CP">CP</SelectItem>
                      <SelectItem value="CE1">CE1</SelectItem>
                      <SelectItem value="CE2">CE2</SelectItem>
                      <SelectItem value="CM1">CM1</SelectItem>
                      <SelectItem value="CM2">CM2</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">🏫 Collège</SelectLabel>
                      <SelectItem value="6ème">6ème</SelectItem>
                      <SelectItem value="5ème">5ème</SelectItem>
                      <SelectItem value="4ème">4ème</SelectItem>
                      <SelectItem value="3ème">3ème</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">🎓 Lycée</SelectLabel>
                      <SelectItem value="Seconde">Seconde</SelectItem>
                      <SelectItem value="Première">Première</SelectItem>
                      <SelectItem value="Terminale A">Terminale A</SelectItem>
                      <SelectItem value="Terminale C">Terminale C</SelectItem>
                      <SelectItem value="Terminale D">Terminale D</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Salle / Localisation</Label>
                <Input placeholder="ex: B-102" className="rounded-xl border-slate-200 h-11" value={classForm.room_number} onChange={e => setClassForm({...classForm, room_number: e.target.value})} />
              </div>
              <Button className="w-full bg-edu-gradient text-white h-12 rounded-xl font-bold mt-4 shadow-lg shadow-sky-100" onClick={handleAddClass}>Enregistrer la classe</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditClassOpen} onOpenChange={setIsEditClassOpen}>
          <DialogContent className="rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-2">
                <Edit className="text-sky-600" /> Modifier la Classe
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nom de la Classe *</Label>
                <Input placeholder="ex: 6ème A, Terminale C" className="rounded-xl border-slate-200 h-11" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Niveau Scolaire</Label>
                <Select value={classForm.level} onValueChange={v => setClassForm({...classForm, level: v})}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue placeholder="Choisir un niveau..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">🌱 Maternelle</SelectLabel>
                      <SelectItem value="Petite Section (PS)">Petite Section (PS)</SelectItem>
                      <SelectItem value="Moyenne Section (MS)">Moyenne Section (MS)</SelectItem>
                      <SelectItem value="Grande Section (GS)">Grande Section (GS)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">📚 Primaire</SelectLabel>
                      <SelectItem value="CP">CP</SelectItem>
                      <SelectItem value="CE1">CE1</SelectItem>
                      <SelectItem value="CE2">CE2</SelectItem>
                      <SelectItem value="CM1">CM1</SelectItem>
                      <SelectItem value="CM2">CM2</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">🏫 Collège</SelectLabel>
                      <SelectItem value="6ème">6ème</SelectItem>
                      <SelectItem value="5ème">5ème</SelectItem>
                      <SelectItem value="4ème">4ème</SelectItem>
                      <SelectItem value="3ème">3ème</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs font-black text-slate-400 uppercase">🎓 Lycée</SelectLabel>
                      <SelectItem value="Seconde">Seconde</SelectItem>
                      <SelectItem value="Première">Première</SelectItem>
                      <SelectItem value="Terminale A">Terminale A</SelectItem>
                      <SelectItem value="Terminale C">Terminale C</SelectItem>
                      <SelectItem value="Terminale D">Terminale D</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Salle / Localisation</Label>
                <Input placeholder="ex: B-102" className="rounded-xl border-slate-200 h-11" value={classForm.room_number} onChange={e => setClassForm({...classForm, room_number: e.target.value})} />
              </div>
              <Button className="w-full bg-edu-gradient text-white h-12 rounded-xl font-bold mt-4 shadow-lg shadow-sky-100" onClick={handleUpdateClass}>Enregistrer les modifications</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
           <div className="md:col-span-3 h-60 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 italic bg-white/50">
                <Building2 className="h-12 w-12 mb-2 opacity-20" />
                <p>Aucune classe enregistrée pour le moment.</p>
           </div>
        ) : (
          classes.map(cls => (
            <Card key={cls.id} className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] group hover:translate-y-[-4px] transition-all duration-300">
              <CardHeader className="bg-slate-50/50 border-b p-6 relative">
                <div className="flex justify-between items-start">
                   <div className="h-12 w-12 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-sky-100 group-hover:scale-110 transition-transform">
                      {cls.name[0]}
                   </div>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"><MoreVertical className="w-5 h-5" /></Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-48 rounded-xl">
                       <DropdownMenuItem onClick={() => openEdit(cls)} className="cursor-pointer gap-2 font-medium">
                         <Edit className="w-4 h-4 text-sky-600" /> Modifier
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleDeleteClass(cls.id)} className="cursor-pointer gap-2 font-medium text-rose-600 focus:text-rose-700">
                         <Trash className="w-4 h-4" /> Supprimer
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                </div>
                <div className="mt-4">
                   <CardTitle className="text-xl font-black text-slate-900">{cls.name}</CardTitle>
                   <CardDescription className="text-xs uppercase font-bold text-sky-600 mt-1 flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                     {cls.level}
                   </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-medium"><Users className="h-4 w-4" /> Effectif</div>
                    <Badge className="bg-sky-50 text-sky-700 border-none font-bold">{cls.students_count || '--'} élèves</Badge>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-medium"><UserCog className="h-4 w-4" /> Prof. Principal</div>
                    <span className="font-bold text-slate-800 text-xs">{cls.teacher_name || 'Non assigné'}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-slate-500 font-medium"><BookOpen className="h-4 w-4" /> Localisation</div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold border-slate-200 px-3 py-0.5 rounded-lg">{cls.room_number || 'TBD'}</Badge>
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => openStudentsList(cls)}
                      className="flex-1 h-11 text-[11px] uppercase font-black text-sky-600 bg-sky-50/50 hover:bg-sky-100 rounded-xl transition-all"
                    >
                      Voir les élèves
                    </Button>
                    <Button variant="ghost" className="h-11 w-11 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                      <Users className="w-4 h-4" />
                    </Button>
                  </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* DIALOG LISTE ELEVES */}
      <Dialog open={isStudentsListOpen} onOpenChange={setIsStudentsListOpen}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Users className="text-sky-600" /> Élèves - {selectedClass?.name}
            </DialogTitle>
            <DialogDescription className="font-medium">Liste des apprenants inscrits dans cette section.</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom & Prénom</TableHead>
                  <TableHead>Tuteur</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-10 text-slate-400">Aucun élève trouvé</TableCell></TableRow>
                ) : classStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-bold">{student.first_name} {student.name}</TableCell>
                    <TableCell className="text-xs">{student.tutor_name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openStudentDossier(student)} className="rounded-lg font-bold gap-2 text-sky-700 border-sky-200">
                        <FileText className="w-4 h-4" /> Dossier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DOSSIER NUMERIQUE */}
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
