import { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Download, 
  Printer, 
  User, 
  BookOpen,
  Award,
  TrendingUp,
  AlertCircle,
  ChevronRight
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
import { api } from "@/lib/api-service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Bulletins() {
  const { user, isPresentationMode } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState("Trimestre 1");
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [studentsData, gradesData] = await Promise.all([
        api.school.students(user!.clinicId!),
        api.school.grades(user!.clinicId!)
      ]);
      
      // Process grades into averages per student
      const studentsWithAverages = studentsData.map((student: any) => {
        const studentGrades = gradesData.filter((g: any) => g.student_id === student.id);
        const averages: Record<string, number> = {};
        
        // Group by subject and calculate average
        const bySubject: Record<string, number[]> = {};
        studentGrades.forEach((g: any) => {
          if (!bySubject[g.subject]) bySubject[g.subject] = [];
          bySubject[g.subject].push(Number(g.score));
        });
        
        Object.entries(bySubject).forEach(([subject, scores]) => {
          averages[subject] = scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        return { ...student, averages, cycle: student.class_level?.includes('6') || student.class_level?.includes('3') ? 'Collège' : 'Lycée' };
      });
      
      setStudents(studentsWithAverages);
      setGrades(gradesData);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateGeneralAverage = (averages: Record<string, number>) => {
    const values = Object.values(averages);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  const downloadPDF = (student: any) => {
    const doc = new jsPDF();
    const avg = calculateGeneralAverage(student.averages || {});
    
    // Header
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("KIAM SCHOOL PLATFORM", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text("BULLETIN DE NOTES OFFICIEL - " + period.toUpperCase(), 105, 30, { align: 'center' });
    
    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`ÉLÈVE: ${student.first_name} ${student.name}`, 14, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Classe: ${student.class_level}`, 14, 68);
    doc.text(`Cycle: ${student.cycle}`, 14, 76);
    doc.text(`Matricule: ${student.id}`, 160, 60);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, 68);

    // Grades Table
    const subjects = Object.entries(student.averages || {});
    const tableData = subjects.map(([sub, grade]) => [
      sub,
      grade.toString() + " / 20",
      grade >= 10 ? "Satisfaisant" : "Insuffisant",
      "M. Professeur"
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Matière', 'Moyenne', 'Observation', 'Enseignant']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 6 }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, finalY, 196, finalY);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`MOYENNE GÉNÉRALE: ${avg} / 20`, 105, finalY + 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text("Décision du conseil: " + (Number(avg) >= 10 ? "ADMIS(E)" : "REFUSÉ(E)"), 14, finalY + 30);
    
    // Signatures
    doc.text("Le Directeur", 40, finalY + 50);
    doc.text("Le Parent", 140, finalY + 50);

    doc.save(`bulletin_${student.name}_${period}.pdf`);
  };

  return (
    <div className="space-y-6 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center shadow-lg shadow-indigo-200">
              <FileText className="w-6 h-6 text-white" />
            </div>
            Bulletins de Notes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Consolidation des résultats et impression des bulletins.</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] h-11 border-none bg-white shadow-sm rounded-xl font-bold">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List Sidebar */}
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden lg:col-span-1">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Rechercher un élève..." 
                className="pl-10 h-11 border-none bg-white shadow-sm rounded-xl font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {filteredStudents.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left ${selectedStudent?.id === student.id ? 'bg-indigo-50/50 border-r-4 border-indigo-500' : ''}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs">
                      {student.name[0]}{student.first_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{student.first_name} {student.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{student.class_level} • {student.cycle}</div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform ${selectedStudent?.id === student.id ? 'rotate-90 text-indigo-500' : ''}`} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400">
                <p className="text-sm">Aucun élève trouvé.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulletin Preview */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <Badge className="bg-indigo-500 hover:bg-indigo-600 border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest">
                      Officiel • {period}
                    </Badge>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black">{selectedStudent.first_name} {selectedStudent.name}</h2>
                      <p className="text-slate-400 font-bold tracking-wide uppercase text-sm">
                        {selectedStudent.class_level} — Cycle {selectedStudent.cycle}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="bg-white/10 border-white/20 hover:bg-white hover:text-slate-900 text-white font-bold rounded-xl"
                      onClick={() => downloadPDF(selectedStudent)}
                    >
                      <Download className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white hover:text-slate-900 text-white font-bold rounded-xl">
                      <Printer className="h-4 w-4 mr-2" /> Imprimer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Moyenne Générale</div>
                      <div className="text-2xl font-black text-indigo-700">{calculateGeneralAverage(selectedStudent.averages)} <span className="text-sm opacity-50">/ 20</span></div>
                    </div>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Rang</div>
                      <div className="text-2xl font-black text-emerald-700">2ème <span className="text-sm opacity-50">/ {filteredStudents.length}</span></div>
                    </div>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Assiduité</div>
                      <div className="text-2xl font-black text-amber-700">98% <span className="text-sm opacity-50">Présence</span></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-black text-[11px] uppercase pl-6">Matière</TableHead>
                        <TableHead className="font-black text-[11px] uppercase text-center">Note / 20</TableHead>
                        <TableHead className="font-black text-[11px] uppercase">Observation</TableHead>
                        <TableHead className="font-black text-[11px] uppercase pr-6">Professeur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(selectedStudent.averages || {}).map(([subject, grade]: [string, any]) => (
                        <TableRow key={subject}>
                          <TableCell className="font-bold text-slate-700 pl-6">{subject}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${grade >= 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} border-none font-black text-sm px-3`}>
                              {grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500 font-medium">
                              {grade >= 16 ? "Excellent travail" : grade >= 14 ? "Très bon" : grade >= 12 ? "Assez bien" : grade >= 10 ? "Passable" : "A redoubler d'efforts"}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 font-medium text-slate-400 italic text-sm">
                             M. {subject.substring(0, 3)}. Enseignant
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-8 p-6 rounded-[2rem] bg-slate-50 border border-dashed border-slate-200">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Appréciation Générale du Conseil</div>
                   <p className="text-slate-600 font-medium text-sm leading-relaxed">
                     Élève sérieux et appliqué. Les résultats sont satisfaisants dans l'ensemble des matières scientifiques. {Number(calculateGeneralAverage(selectedStudent.averages)) >= 12 ? "Peut encore mieux faire en approfondissant les matières littéraires." : "Attention à ne pas se relâcher."}
                   </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 italic">
              <AlertCircle className="h-16 w-16 mb-4 opacity-10" />
              <p>Sélectionnez un élève pour visualiser son bulletin consolidé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
