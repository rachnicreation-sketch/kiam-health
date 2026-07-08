import { useState } from "react";
import {
  FileText, Search, Plus, Filter, AlertTriangle, CheckCircle2,
  Users, Calendar, Clock, Smile, Award, Sparkles, PlusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DisciplineRecord {
  id: string;
  studentName: string;
  className: string;
  type: "Sanction" | "Mérite" | "Observation";
  category: string;
  date: string;
  description: string;
}

const MOCK_RECORDS: DisciplineRecord[] = [
  { id: "DIS-001", studentName: "Saliou Diop", className: "4ème B", type: "Sanction", category: "Retard", date: "2026-07-06", description: "3 retards consécutifs non justifiés cette semaine." },
  { id: "DIS-002", studentName: "Mariama Diop", className: "CM1-A", type: "Mérite", category: "Excellence", date: "2026-07-07", description: "Félicitations pour son investissement dans le projet d'école." },
];

export default function StudentLife() {
  const { toast } = useToast();
  const [records, setRecords] = useState<DisciplineRecord[]>(MOCK_RECORDS);
  const [search, setSearch] = useState("");

  const filtered = records.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-amber-600" /> Vie Scolaire & Discipline
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Registre disciplinaire, carnet de correspondance numérique, absences et encouragements.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sanctions (Mois)" value={String(records.filter(r => r.type === "Sanction").length)} icon={AlertTriangle} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Mérites attribués" value={String(records.filter(r => r.type === "Mérite").length)} icon={Award} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Retards signalés" value="12" icon={Clock} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Engagement Vie Sco" value="Bon" icon={Smile} iconClassName="bg-blue-100 text-blue-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un élève..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map(record => (
          <Card key={record.id} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{record.studentName}</p>
                    <Badge variant="outline">{record.className}</Badge>
                    <Badge className={`text-[10px] h-4 ${record.type === "Sanction" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {record.type}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{record.category} · {record.date}</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2 leading-relaxed">
                {record.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
