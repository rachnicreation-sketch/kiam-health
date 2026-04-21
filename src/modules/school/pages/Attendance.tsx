import { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  ChevronRight, 
  Save, 
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  UserCheck
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

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'late' | 'justified'>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSelectors();
  }, [user]);

  const loadSelectors = async () => {
    if (!user?.clinicId) return;
    try {
      const classData = await apiRequest("school.php?action=list_classes");
      setClasses(classData);
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
      const currentClass = classes.find(c => c.id === selectedClass);
      if (currentClass) {
         const filtered = data.filter((s: any) => s.class_level === currentClass.level);
         setStudents(filtered);
         // Default all to present
         const initial: Record<string, 'present' | 'absent' | 'late' | 'justified'> = {};
         filtered.forEach((s: any) => initial[s.id] = 'present');
         setAttendanceData(initial);
      } else {
         setStudents(data);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des élèves échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'justified') => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    try {
      const records = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        status: status
      }));

      await apiRequest("school.php?action=take_attendance", {
        method: "POST",
        body: JSON.stringify({
          date: date,
          records: records,
          clinicId: user.clinicId
        })
      });

      toast({ title: "Appel validé", description: "Les présences ont été enregistrées." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'enregistrement." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-sky-600" /> Registre d'Appel
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Pointage journalier des élèves par classe.</p>
        </div>
        <div className="flex gap-2 text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border">
           <CalendarIcon className="h-4 w-4 text-sky-600" /> {new Date(date).toLocaleDateString()}
        </div>
      </div>

      <Card className="border-none shadow-md bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Sélectionner la classe</label>
                 <Select value={selectedClass} onValueChange={setSelectedClass}>
                   <SelectTrigger className="h-10 bg-white"><SelectValue placeholder="Choisir une classe..." /></SelectTrigger>
                   <SelectContent>
                     {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                   </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Date de l'appel</label>
                 <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-10" />
              </div>
              <div className="flex items-end">
                 <Button className="w-full h-10 bg-sky-600 hover:bg-sky-700 font-bold gap-2" onClick={handleSaveAttendance} disabled={!selectedClass}>
                    <Save className="w-4 h-4" /> Valider l'Appel
                 </Button>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           {!selectedClass ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                 <UserCheck className="h-10 w-10 mx-auto opacity-20" />
                 <p className="text-sm font-medium italic">Choisissez une classe pour faire l'appel.</p>
              </div>
           ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest pl-6">Élève</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="text-[11px] font-black uppercase tracking-widest text-right pr-6">Sélection Rapide</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-sky-100 rounded-full flex items-center justify-center font-black text-sky-700 text-[10px]">
                               {student.name[0]}{student.first_name?.[0] || ''}
                            </div>
                            <div className="font-bold text-slate-900">{student.first_name} {student.name}</div>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         {attendanceData[student.id] === 'present' && <Badge className="bg-emerald-500">Présent</Badge>}
                         {attendanceData[student.id] === 'absent' && <Badge className="bg-rose-500">Absent</Badge>}
                         {attendanceData[student.id] === 'late' && <Badge className="bg-amber-500">Retard</Badge>}
                         {attendanceData[student.id] === 'justified' && <Badge className="bg-indigo-500">Justifié</Badge>}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <div className="flex justify-end gap-1">
                            <Button 
                              variant={attendanceData[student.id] === 'present' ? 'default' : 'outline'} 
                              size="sm" 
                              className={`h-8 w-8 p-0 rounded-full ${attendanceData[student.id] === 'present' ? 'bg-emerald-500 border-emerald-500 text-white' : 'text-emerald-500 border-emerald-100'}`} 
                              onClick={() => handleStatusChange(student.id, 'present')}
                            >
                               <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant={attendanceData[student.id] === 'absent' ? 'default' : 'outline'} 
                              size="sm" 
                              className={`h-8 w-8 p-0 rounded-full ${attendanceData[student.id] === 'absent' ? 'bg-rose-500 border-rose-500 text-white' : 'text-rose-500 border-rose-100'}`} 
                              onClick={() => handleStatusChange(student.id, 'absent')}
                            >
                               <XCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant={attendanceData[student.id] === 'late' ? 'default' : 'outline'} 
                              size="sm" 
                              className={`h-8 w-8 p-0 rounded-full ${attendanceData[student.id] === 'late' ? 'bg-amber-500 border-amber-500 text-white' : 'text-amber-500 border-amber-100'}`} 
                              onClick={() => handleStatusChange(student.id, 'late')}
                            >
                               <AlertCircle className="h-4 w-4" />
                            </Button>
                         </div>
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
