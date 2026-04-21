import { useState, useEffect } from "react";
import { 
  Award, 
  Search, 
  Filter, 
  ChevronRight, 
  Save, 
  AlertCircle,
  FileText,
  History
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Grades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [period, setPeriod] = useState("Trimestre 1");
  const [gradeData, setGradeData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSelectors();
  }, [user]);

  const loadSelectors = async () => {
    if (!user?.clinicId) return;
    try {
      const classData = await apiRequest("school.php?action=list_classes");
      const subjectData = await apiRequest("school.php?action=list_subjects");
      setClasses(classData);
      setSubjects(subjectData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("school.php?action=list_students");
      // Filter by class_id if implemented, or level
      const currentClass = classes.find(c => c.id === selectedClass);
      if (currentClass) {
         setStudents(data.filter((s: any) => s.class_level === currentClass.level));
      } else {
         setStudents(data);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des élèves échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, value: string) => {
    setGradeData(prev => ({ ...prev, [studentId]: value }));
  };

  const generatePDF = () => {
    if (!selectedClass) return;
    const doc = new jsPDF();
    const currentClass = classes.find(c => c.id === selectedClass);
    
    // Header
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("LYCÉE DES TALENTS", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text("BULLETIN DE NOTES - " + period.toUpperCase(), 105, 30, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Classe: ${currentClass?.name || 'N/A'}`, 14, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, 50);

    const tableData = students.map(s => [
      s.first_name + " " + s.name,
      gradeData[s.id] || "N/A",
      Number(gradeData[s.id]) >= 10 ? "Admis" : "Échec"
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Nom de l\'Élève', 'Note / 20', 'Observation']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'fill', fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    doc.save(`bulletins_${currentClass?.name || 'classe'}_${period}.pdf`);
    toast({ title: "PDF Généré", description: "Le bulletin a été téléchargé." });
  };

  const handleSaveGrades = async () => {
    if (!selectedSubject) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner une matière." });
      return;
    }

    try {
      const promises = Object.entries(gradeData).map(([studentId, score]) => {
        if (!score) return Promise.resolve();
        return apiRequest("school.php?action=add_grade", {
          method: "POST",
          body: JSON.stringify({
            student_id: studentId,
            subject: selectedSubject,
            score: score,
            period: period,
            clinicId: user.clinicId
          })
        });
      });

      await Promise.all(promises);
      toast({ title: "Notes enregistrées", description: "L'opération a été effectuée avec succès." });
      setGradeData({});
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'enregistrement." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-600" /> Saisie des Evaluations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion académique et bulletin trimestriels.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="font-bold gap-2" onClick={() => navigate('/school/schedule')}><History className="w-4 h-4" /> Emploi du temps</Button>
           <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-sky-200" onClick={generatePDF}>
              <FileText className="w-4 h-4" /> Générer Bulletins
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-md bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">Classe</label>
               <Select value={selectedClass} onValueChange={setSelectedClass}>
                 <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                 <SelectContent>
                   {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">Matière</label>
               <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                 <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Saisir..." /></SelectTrigger>
                 <SelectContent>
                   {subjects.length > 0 ? (
                      subjects.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)
                   ) : (
                      <SelectItem value="Maths">Mathématiques</SelectItem>
                   )}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400">Période</label>
               <Select value={period} onValueChange={setPeriod}>
                 <SelectTrigger className="h-10 bg-white"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Trimestre 1">1er Trimestre</SelectItem>
                   <SelectItem value="Trimestre 2">2ème Trimestre</SelectItem>
                   <SelectItem value="Trimestre 3">3ème Trimestre</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            <div className="flex items-end">
               <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 font-bold gap-2" onClick={handleSaveGrades} disabled={!selectedClass}>
                  <Save className="w-4 h-4" /> Enregistrer tout
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedClass ? (
             <div className="py-20 text-center text-slate-400 space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto opacity-20" />
                <p className="text-sm font-medium italic">Sélectionnez une classe pour commencer la saisie.</p>
             </div>
          ) : (
             <Table>
               <TableHeader className="bg-slate-50/50">
                 <TableRow>
                   <TableHead className="text-[11px] font-black uppercase tracking-widest pl-6">ID / Nom de l'Élève</TableHead>
                   <TableHead className="text-[11px] font-black uppercase tracking-widest text-center">Note (/20)</TableHead>
                   <TableHead className="text-[11px] font-black uppercase tracking-widest text-right pr-6">Statut Global</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {students.map(student => (
                   <TableRow key={student.id} className="hover:bg-slate-50/50">
                     <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-700 text-[10px]">
                              {student.name[0]}{student.first_name?.[0] || ''}
                           </div>
                           <div>
                             <div className="font-bold text-slate-900">{student.first_name} {student.name}</div>
                             <div className="text-[9px] font-mono text-slate-400">ID: {student.id}</div>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="text-center">
                        <Input 
                          type="number" 
                          max="20" 
                          min="0"
                          placeholder="--" 
                          className={`w-20 mx-auto h-9 text-center font-black ${Number(gradeData[student.id]) < 10 ? 'text-rose-600 border-rose-200' : 'text-emerald-600 border-emerald-200'}`} 
                          value={gradeData[student.id] || ""}
                          onChange={e => handleGradeChange(student.id, e.target.value)}
                        />
                     </TableCell>
                     <TableCell className="text-right pr-6">
                        {gradeData[student.id] ? (
                           <Badge className={Number(gradeData[student.id]) >= 10 ? 'bg-emerald-500' : 'bg-rose-500'}>
                              {Number(gradeData[student.id]) >= 10 ? 'Admis' : 'Échec'}
                           </Badge>
                        ) : (
                           <Badge variant="outline" className="text-slate-300">En attente</Badge>
                        )}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function apiRequest(endpoint: string, options: any = {}) {
    const token = localStorage.getItem('kiam_jwt_token');
    const response = await fetch(`/kiam/api/${endpoint}`, {
      ...options,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...options.headers }
    });
    return response.json();
}
