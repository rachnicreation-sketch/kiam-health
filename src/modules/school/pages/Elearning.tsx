import { 
  PlayCircle, 
  BookOpen, 
  FileText, 
  Search, 
  Clock, 
  Award,
  Video
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Elearning() {
  const courses = [
    { title: "Mathématiques : Algebre", instructor: "M. Koua", duration: "1h 20m", type: "Vidéo" },
    { title: "Physique : Mécanique", instructor: "Mme. Traore", duration: "45m", type: "Document" },
    { title: "Français : Conjugaison", instructor: "M. Bamba", duration: "2h 10m", type: "Live" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-rose-600" /> Kiam Learning
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Cours en ligne, ressources et e-learning.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input placeholder="Rechercher un cours..." className="pl-10 h-10 border-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <Card key={course.title} className="border-none shadow-xl bg-white overflow-hidden rounded-[2rem] group hover:-translate-y-2 transition-all duration-500">
            <div className="h-40 bg-edu-gradient flex items-center justify-center relative overflow-hidden">
               <Video className="h-12 w-12 text-white/50 group-hover:scale-110 transition-transform duration-500" />
               <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            </div>
            <CardContent className="p-6">
               <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-rose-100 text-rose-600 border-none text-[8px] uppercase font-black">{course.type}</Badge>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="h-3 w-3" /> {course.duration}</div>
               </div>
               <CardTitle className="text-lg font-black text-slate-900 mb-1">{course.title}</CardTitle>
               <p className="text-xs text-slate-500 mb-4">{course.instructor}</p>
               <Button className="w-full h-10 bg-slate-950 text-white font-bold rounded-2xl group-hover:bg-rose-600 transition-colors">
                  Démarrer le cours
               </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
