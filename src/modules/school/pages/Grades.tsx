import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { DUMMY_CLASSES, DUMMY_STUDENTS, SCHOOL_SUBJECTS } from "@/lib/mock-data";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Grades() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [period, setPeriod] = useState("Trimestre 1");
  const [gradeData, setGradeData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Role-based permissions
  const isTeacher = user?.role === 'school_teacher';
  const canSeeFullBulletin = ['school_direction', 'school_admin', 'school_scolarite'].includes(user?.role || '');

  useEffect(() => {
    if (isPresentationMode) {
      setClasses(DUMMY_CLASSES);
      setStudents(DUMMY_STUDENTS);
    }
  }, [isPresentationMode]);

  useEffect(() => {
    if (selectedClass) {
      const cls = classes.find(c => c.id === selectedClass);
      if (cls) {
        // Mock subjects based on cycle
        const cycle = cls.level.includes('6') || cls.level.includes('3') ? 'Collège' : 'Lycée';
        setSubjects(SCHOOL_SUBJECTS[cycle as keyof typeof SCHOOL_SUBJECTS] || []);
      }
    }
  }, [selectedClass, classes]);

  const handleGradeChange = (studentId: string, value: string) => {
    setGradeData(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveGrades = async () => {
    if (!selectedSubject) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner une matière." });
      return;
    }
    toast({ title: "Notes enregistrées", description: `Les notes de ${selectedSubject} ont été mises à jour.` });
  };

  return (
    <div className="space-y-6 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-indigo-200">
              <Award className="w-6 h-6 text-white" />
            </div>
            Saisie des Évaluations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {isTeacher ? "Saisie de vos notes de cours et suivi de classe." : "Gestion académique et centralisation des résultats."}
          </p>
        </div>
        <div className="flex gap-2">
           {canSeeFullBulletin && (
             <Button 
               className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 font-bold gap-2 shadow-sm rounded-xl"
               onClick={() => navigate('/school/bulletins')}
             >
                <FileText className="w-4 h-4" /> Voir les Bulletins
             </Button>
           )}
           <Button className="bg-edu-gradient text-white font-bold gap-2 shadow-lg shadow-sky-200 rounded-xl" onClick={handleSaveGrades}>
              <Save className="w-4 h-4" /> Enregistrer tout
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Classe</label>
               <Select value={selectedClass} onValueChange={setSelectedClass}>
                 <SelectTrigger className="h-12 bg-white border-none shadow-sm rounded-xl font-bold italic-none">
                   <SelectValue placeholder="Sélectionner une classe" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl border-none shadow-2xl">
                   {classes.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Matière</label>
               <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                 <SelectTrigger className="h-12 bg-white border-none shadow-sm rounded-xl font-bold italic-none">
                   <SelectValue placeholder="Choisir la matière" />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl border-none shadow-2xl">
                   {subjects.map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                 </SelectContent>
               </Select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Période d'évaluation</label>
               <Select value={period} onValueChange={setPeriod}>
                 <SelectTrigger className="h-12 bg-white border-none shadow-sm rounded-xl font-bold italic-none">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl border-none shadow-2xl">
                   <SelectItem value="Trimestre 1" className="font-bold">1er Trimestre</SelectItem>
                   <SelectItem value="Trimestre 2" className="font-bold">2ème Trimestre</SelectItem>
                   <SelectItem value="Trimestre 3" className="font-bold">3ème Trimestre</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedClass ? (
             <div className="py-24 text-center text-slate-300 space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-sm font-medium italic">Veuillez sélectionner une classe pour charger la liste des élèves.</p>
             </div>
          ) : (
             <Table>
               <TableHeader className="bg-slate-50/30">
                 <TableRow className="border-none">
                   <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 pl-8 h-14">Élève</TableHead>
                   <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center h-14">Note (/20)</TableHead>
                   <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 h-14">Commentaire</TableHead>
                   <TableHead className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right pr-8 h-14">Statut</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {students.filter(s => s.class_level === classes.find(c => c.id === selectedClass)?.level).map(student => (
                   <TableRow key={student.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                     <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center font-black text-indigo-500 text-xs shadow-inner">
                              {student.name[0]}{student.first_name?.[0] || ''}
                           </div>
                           <div>
                             <div className="font-black text-slate-900">{student.first_name} {student.name}</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{student.id}</div>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell className="text-center py-4">
                        <Input 
                          type="number" 
                          max="20" 
                          min="0"
                          placeholder="--" 
                          className={`w-24 mx-auto h-11 text-center font-black text-lg border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-indigo-500 ${Number(gradeData[student.id]) < 10 && gradeData[student.id] !== "" ? 'text-rose-500' : 'text-emerald-500'}`} 
                          value={gradeData[student.id] || ""}
                          onChange={e => handleGradeChange(student.id, e.target.value)}
                        />
                     </TableCell>
                     <TableCell className="py-4">
                        <Input 
                          placeholder="Appréciation..." 
                          className="h-11 border-none bg-transparent text-sm font-medium text-slate-500 italic-none"
                        />
                     </TableCell>
                     <TableCell className="text-right pr-8 py-4">
                        {gradeData[student.id] ? (
                           <Badge className={`${Number(gradeData[student.id]) >= 10 ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'} text-white border-none px-3 py-1 font-black text-[10px] shadow-lg`}>
                              {Number(gradeData[student.id]) >= 10 ? 'ADMIS' : 'ÉCHEC'}
                           </Badge>
                        ) : (
                           <Badge variant="outline" className="text-slate-300 border-slate-200 font-bold px-3 py-1 text-[10px]">EN ATTENTE</Badge>
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
