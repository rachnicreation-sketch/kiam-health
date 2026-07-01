import { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, GraduationCap, FileText, Camera, Upload, Download, File, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

export default function Teachers() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isPresentationMode) {
      setTeachers([
        { id: "1", name: "Dupont", first_name: "Jean", email: "jean@school.com", phone: "0123456789", role: "teacher" },
        { id: "2", name: "Martin", first_name: "Sophie", email: "sophie@school.com", phone: "0987654321", role: "teacher_principal" }
      ]);
    } else if (user?.clinicId) {
      loadTeachers();
    }
  }, [user, isPresentationMode]);

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await api.school.teachers(user!.clinicId!);
      setTeachers(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger le personnel." });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.first_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Digital Dossier
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const loadDocuments = async (userId: string) => {
    try {
      const data = await api.users.listDocuments(userId);
      setDocuments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const openDossier = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsDossierOpen(true);
    loadDocuments(teacher.id);
  };

  const handleUpload = async (type: string, name: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file || !selectedTeacher) return;
      
      setIsUploading(true);
      try {
        const fileUrl = `docs/teachers/${selectedTeacher.id}/${type}_${file.name}`;
        await api.users.addDocument({
          user_id: selectedTeacher.id,
          type,
          name: name + ' (' + file.name + ')',
          file_url: fileUrl
        });
        toast({ title: "Document ajouté", description: `${name} a été enregistré.` });
        loadDocuments(selectedTeacher.id);
      } catch (error) {
        toast({ variant: "destructive", title: "Erreur", description: "Échec de l'upload." });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-sky-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            Personnel Enseignant
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion du corps professoral.</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem]">
        <CardHeader className="bg-slate-50/50 border-b pb-6 p-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Rechercher un professeur..." 
              className="pl-12 h-12 border-none bg-white shadow-inner rounded-2xl text-sm" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="border-none">
                  <TableHead className="px-6 py-4">Nom & Prénom</TableHead>
                  <TableHead className="py-4">Contact</TableHead>
                  <TableHead className="py-4">Rôle</TableHead>
                  <TableHead className="text-right px-6 py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow><TableCell colSpan={4} className="text-center py-10">Chargement...</TableCell></TableRow>
                ) : filteredTeachers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-slate-400 italic">Aucun professeur trouvé</TableCell></TableRow>
                ) : (
                  filteredTeachers.map(t => (
                    <TableRow key={t.id} className="hover:bg-sky-50/30 transition-colors">
                      <TableCell className="px-6 py-4 font-bold">{t.name} {t.first_name}</TableCell>
                      <TableCell className="py-4">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> {t.email}</div>
                          <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5"/> {t.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{t.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDossier(t)}
                          className="text-sky-600 hover:bg-sky-50 font-bold gap-2"
                        >
                          <FileText className="h-4 w-4" /> Dossier
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

      <Dialog open={isDossierOpen} onOpenChange={setIsDossierOpen}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-edu-gradient p-8 text-white">
              <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Dossier Enseignant</h2>
                    <p className="text-sky-100 font-medium">{selectedTeacher?.first_name} {selectedTeacher?.name}</p>
                 </div>
                 <Badge className="bg-white/20 text-white border-none px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest">{selectedTeacher?.role}</Badge>
              </div>
           </div>
           
           <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50">
              <div className="md:col-span-1 space-y-4">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Télécharger un document</h3>
                 
                 {[
                   { id: 'photo', label: 'Photo d\'identité', icon: Camera, color: 'bg-blue-500' },
                   { id: 'id_card', label: 'Pièce d\'identité', icon: FileText, color: 'bg-indigo-500' },
                   { id: 'cv', label: 'CV / Diplômes', icon: File, color: 'bg-orange-500' },
                   { id: 'contract', label: 'Contrat de travail', icon: GraduationCap, color: 'bg-emerald-500' },
                   { id: 'criminal_record', label: 'Casier judiciaire', icon: Shield, color: 'bg-rose-500' },
                   { id: 'other', label: 'Autre document...', icon: FileText, color: 'bg-slate-500' }
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
