import { useState } from "react";
import {
  FileText, Search, Plus, Filter, Clock, CheckCircle2,
  AlertCircle, DollarSign, Award, Monitor, Play, Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface OnlineExam {
  id: string;
  title: string;
  className: string;
  duration: number; // minutes
  questionsCount: number;
  status: "draft" | "active" | "ended";
  submissions: number;
}

const MOCK_EXAMS: OnlineExam[] = [
  { id: "EXM-001", title: "QCM d'Histoire - La Révolution", className: "3ème A", duration: 30, questionsCount: 20, status: "active", submissions: 18 },
  { id: "EXM-002", title: "Contrôle de Mathématiques - Algèbre", className: "1ère S", duration: 60, questionsCount: 5, status: "draft", submissions: 0 },
];

export default function OnlineExams() {
  const { toast } = useToast();
  const [exams, setExams] = useState<OnlineExam[]>(MOCK_EXAMS);
  const [search, setSearch] = useState("");

  const publishExam = (id: string) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, status: "active" } : e));
    toast({ title: "Examen mis en ligne", description: "Les élèves concernés peuvent démarrer le devoir." });
  };

  const filtered = exams.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Monitor className="h-7 w-7 text-amber-600" /> Examens en Ligne
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Conception de devoirs et QCM numériques, planification des sessions et correction assistée.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Examens" value={String(exams.length)} icon={Monitor} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Sessions Actives" value={String(exams.filter(e => e.status === "active").length)} icon={Play} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Soumissions" value="18" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="À corriger" value="2" icon={AlertCircle} iconClassName="bg-rose-100 text-rose-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un examen en ligne..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filtered.map(exam => (
          <Card key={exam.id} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base">{exam.title}</h3>
                  <Badge variant="outline">{exam.className}</Badge>
                  <Badge className={`text-[10px] ${exam.status === "active" ? "bg-emerald-100 text-emerald-700" : exam.status === "draft" ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-700"}`}>
                    {exam.status === "active" ? "En cours" : exam.status === "draft" ? "Brouillon" : "Terminé"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Durée : {exam.duration} min</span>
                  <span>Questions : {exam.questionsCount}</span>
                  <span>Soumissions : {exam.submissions}</span>
                </div>
              </div>
              <div className="shrink-0 flex gap-2">
                {exam.status === "draft" && (
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1" onClick={() => publishExam(exam.id)}>
                    <Play className="h-4 w-4" /> Publier
                  </Button>
                )}
                <Button size="sm" variant="outline">Gérer / Corriger</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
