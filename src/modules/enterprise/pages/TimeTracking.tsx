import { useState, useEffect } from "react";
import {
  Clock, Plus, Search, Calendar, Play, Pause, Square,
  BarChart3, FileText, TrendingUp, Users, Timer, DollarSign,
  CheckCircle2, AlertCircle, Download, ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

interface TimeEntry {
  id: string;
  project: string;
  task: string;
  employee: string;
  date: string;
  hours: number;
  billable: boolean;
  status: "draft" | "submitted" | "approved";
}

const PROJECTS = ["Refonte Site Web Kiam", "App Mobile Client A", "Audit SI TotalEnergies", "CRM Sonatel", "Formation Interne"];

const MOCK_ENTRIES: TimeEntry[] = [
  { id: "T001", project: "Refonte Site Web Kiam", task: "Design UI/UX", employee: "Aïcha Barry", date: "2026-07-07", hours: 6.5, billable: true, status: "submitted" },
  { id: "T002", project: "App Mobile Client A", task: "Développement API", employee: "Kofi Asante", date: "2026-07-07", hours: 8, billable: true, status: "approved" },
  { id: "T003", project: "Audit SI TotalEnergies", task: "Analyse des risques", employee: "Seydou Camara", date: "2026-07-06", hours: 4, billable: true, status: "approved" },
  { id: "T004", project: "Formation Interne", task: "Préparation support", employee: "Aïcha Barry", date: "2026-07-06", hours: 2, billable: false, status: "draft" },
  { id: "T005", project: "CRM Sonatel", task: "Réunion client", employee: "Omar Diallo", date: "2026-07-05", hours: 1.5, billable: true, status: "submitted" },
];

const weekData = [
  { day: "Lun", heures: 38 },
  { day: "Mar", heures: 42 },
  { day: "Mer", heures: 35 },
  { day: "Jeu", heures: 44 },
  { day: "Ven", heures: 29 },
  { day: "Sam", heures: 8 },
  { day: "Dim", heures: 0 },
];

const statusCfg = {
  draft:     { label: "Brouillon",  color: "bg-slate-100 text-slate-600" },
  submitted: { label: "Soumis",     color: "bg-amber-100 text-amber-700" },
  approved:  { label: "Approuvé",   color: "bg-emerald-100 text-emerald-700" },
};

export default function TimeTracking() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>(MOCK_ENTRIES);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeProject, setActiveProject] = useState(PROJECTS[0]);
  const [activeTask, setActiveTask] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ project: PROJECTS[0], task: "", hours: "", date: new Date().toISOString().split("T")[0], billable: true });

  useEffect(() => {
    let iv: any;
    if (isRunning) iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, [isRunning]);

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const fmtMoney = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

  const stopTimer = () => {
    if (elapsed < 60) { setIsRunning(false); setElapsed(0); return; }
    const hours = Math.round((elapsed / 3600) * 10) / 10;
    const newEntry: TimeEntry = {
      id: `T${String(entries.length + 1).padStart(3, "0")}`,
      project: activeProject, task: activeTask || "Tâche non spécifiée",
      employee: "Vous", date: new Date().toISOString().split("T")[0],
      hours, billable: true, status: "draft",
    };
    setEntries([newEntry, ...entries]);
    setIsRunning(false); setElapsed(0);
    toast({ title: "Temps enregistré", description: `${hours}h pour ${activeProject}` });
  };

  const submitEntry = () => {
    const newEntry: TimeEntry = {
      id: `T${String(entries.length + 1).padStart(3, "0")}`,
      ...form, hours: Number(form.hours), employee: "Vous", status: "draft",
    };
    setEntries([newEntry, ...entries]);
    setIsAddOpen(false);
    setForm({ project: PROJECTS[0], task: "", hours: "", date: new Date().toISOString().split("T")[0], billable: true });
    toast({ title: "Temps saisi" });
  };

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const filtered = entries.filter(e => filterProject === "all" || e.project === filterProject);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Clock className="h-7 w-7 text-indigo-600" /> Suivi du Temps
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Feuilles de temps par projet, facturation au temps passé.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exporter</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"><Plus className="h-4 w-4" /> Saisir manuellement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Saisir des heures</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Projet</Label>
                  <Select value={form.project} onValueChange={v => setForm({ ...form, project: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROJECTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tâche</Label>
                  <Input className="mt-1" placeholder="Décrivez la tâche..." value={form.task} onChange={e => setForm({ ...form, task: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Heures</Label>
                    <Input className="mt-1" type="number" min="0.5" step="0.5" max="24" placeholder="Ex: 2.5" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date</Label>
                    <Input className="mt-1" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={submitEntry} disabled={!form.task || !form.hours}>
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Live Timer */}
      <Card className="border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">⏱ Chronomètre en direct</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={activeProject} onValueChange={setActiveProject} disabled={isRunning}>
                  <SelectTrigger className="flex-1 bg-white"><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger>
                  <SelectContent>{PROJECTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="flex-1 bg-white" placeholder="Nom de la tâche..." value={activeTask}
                  onChange={e => setActiveTask(e.target.value)} disabled={isRunning} />
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className={`text-3xl font-mono font-black tabular-nums ${isRunning ? "text-indigo-700" : "text-slate-400"}`}>{fmt(elapsed)}</p>
                {isRunning && <p className="text-xs text-indigo-500 animate-pulse">En cours...</p>}
              </div>
              {!isRunning ? (
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 gap-2" onClick={() => setIsRunning(true)}>
                  <Play className="h-5 w-5" /> Démarrer
                </Button>
              ) : (
                <Button variant="destructive" className="h-11 px-6 gap-2" onClick={stopTimer}>
                  <Square className="h-5 w-5" /> Stop & Sauvegarder
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Heures totales" value={`${totalHours}h`} icon={Clock} iconClassName="bg-indigo-100 text-indigo-600" />
        <StatCard title="Heures facturables" value={`${billableHours}h`} changeType="positive" icon={DollarSign} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Taux facturable" value={`${Math.round((billableHours / totalHours) * 100)}%`} icon={TrendingUp} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="À approuver" value={String(entries.filter(e => e.status === "submitted").length)} icon={AlertCircle} iconClassName="bg-amber-100 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <Card className="border-none shadow-md lg:col-span-1">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" /> Heures cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "#9499AE" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9499AE" }} />
                <Tooltip />
                <Bar dataKey="heures" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Entries List */}
        <Card className="border-none shadow-md lg:col-span-2">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" /> Entrées récentes
              </CardTitle>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="h-7 text-xs w-[180px]"><SelectValue placeholder="Tous les projets" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {PROJECTS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-72 overflow-y-auto">
              {filtered.map(entry => (
                <div key={entry.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate">{entry.task}</p>
                      <Badge className={`text-[10px] h-4 ${statusCfg[entry.status].color}`}>{statusCfg[entry.status].label}</Badge>
                      {entry.billable && <Badge variant="outline" className="text-[10px] h-4 text-emerald-600 border-emerald-200">Facturable</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.project} • {entry.employee} • {new Date(entry.date).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <p className="font-black text-indigo-700 shrink-0">{entry.hours}h</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
