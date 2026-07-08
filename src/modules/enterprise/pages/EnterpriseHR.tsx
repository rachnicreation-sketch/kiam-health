import { useState } from "react";
import {
  Users, Plus, Search, Briefcase, Calendar, FileText,
  TrendingUp, Award, MapPin, Phone, Mail, ChevronRight,
  DollarSign, Clock, CheckCircle2, AlertCircle, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  salary: number;
  status: "active" | "on_leave" | "inactive";
  leaveBalance: number;
}

interface LeaveRequest {
  id: string;
  employee: string;
  type: string;
  from: string;
  to: string;
  status: "pending" | "approved" | "rejected";
  days: number;
}

interface ExpenseNote {
  id: string;
  employee: string;
  category: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
  description: string;
}

const EMPLOYEES: Employee[] = [
  { id: "E001", name: "Seydou Camara", role: "Directeur Général", department: "Direction", email: "s.camara@kiam.sn", phone: "+221 77 001 0001", hireDate: "2020-01-15", salary: 850000, status: "active", leaveBalance: 22 },
  { id: "E002", name: "Aïcha Barry", role: "Responsable Projets", department: "Tech", email: "a.barry@kiam.sn", phone: "+221 77 002 0002", hireDate: "2021-03-10", salary: 620000, status: "active", leaveBalance: 18 },
  { id: "E003", name: "Kofi Asante", role: "Développeur Senior", department: "Tech", email: "k.asante@kiam.sn", phone: "+221 77 003 0003", hireDate: "2022-06-01", salary: 550000, status: "active", leaveBalance: 15 },
  { id: "E004", name: "Rokhaya Ndiaye", role: "Comptable", department: "Finance", email: "r.ndiaye@kiam.sn", phone: "+221 77 004 0004", hireDate: "2021-09-15", salary: 480000, status: "on_leave", leaveBalance: 5 },
  { id: "E005", name: "Omar Diallo", role: "Commercial", department: "Ventes", email: "o.diallo@kiam.sn", phone: "+221 77 005 0005", hireDate: "2023-01-20", salary: 400000, status: "active", leaveBalance: 20 },
];

const LEAVES: LeaveRequest[] = [
  { id: "L001", employee: "Rokhaya Ndiaye", type: "Congé annuel", from: "2026-07-08", to: "2026-07-22", status: "approved", days: 14 },
  { id: "L002", employee: "Omar Diallo", type: "Congé maladie", from: "2026-07-10", to: "2026-07-12", status: "pending", days: 2 },
  { id: "L003", employee: "Kofi Asante", type: "Congé personnel", from: "2026-07-20", to: "2026-07-21", status: "pending", days: 1 },
];

const EXPENSES: ExpenseNote[] = [
  { id: "EX001", employee: "Seydou Camara", category: "Transport", amount: 45000, date: "2026-07-05", status: "approved", description: "Taxi aéroport — mission Abidjan" },
  { id: "EX002", employee: "Aïcha Barry", category: "Repas client", amount: 32000, date: "2026-07-03", status: "pending", description: "Déjeuner présentation client TotalEnergies" },
  { id: "EX003", employee: "Omar Diallo", category: "Hébergement", amount: 85000, date: "2026-06-28", status: "approved", description: "Hôtel Dakar — salon professionnel" },
];

const deptColors: Record<string, string> = {
  Direction: "bg-violet-100 text-violet-700",
  Tech: "bg-blue-100 text-blue-700",
  Finance: "bg-emerald-100 text-emerald-700",
  Ventes: "bg-orange-100 text-orange-700",
  RH: "bg-rose-100 text-rose-700",
};

const statusEmployee = {
  active:   { label: "Actif",       color: "bg-emerald-100 text-emerald-700" },
  on_leave: { label: "En congé",    color: "bg-amber-100 text-amber-700" },
  inactive: { label: "Inactif",     color: "bg-slate-100 text-slate-500" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function EnterpriseHR() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [leaves, setLeaves] = useState<LeaveRequest[]>(LEAVES);
  const [expenses, setExpenses] = useState<ExpenseNote[]>(EXPENSES);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("employees");

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const approveLeave = (id: string) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: "approved" } : l));
    toast({ title: "Congé approuvé" });
  };

  const approveExpense = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: "approved" } : e));
    toast({ title: "Note de frais approuvée" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="h-7 w-7 text-indigo-600" /> Ressources Humaines
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Annuaire, congés et notes de frais de l'équipe.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exporter</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="h-4 w-4" /> Nouvel employé
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Effectif total" value={String(employees.length)} icon={Users} iconClassName="bg-indigo-100 text-indigo-600" />
        <StatCard title="En congé" value={String(employees.filter(e => e.status === "on_leave").length)} icon={Calendar} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Masse salariale" value={fmt(employees.reduce((s, e) => s + e.salary, 0))} icon={DollarSign} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Demandes en attente" value={String(leaves.filter(l => l.status === "pending").length + expenses.filter(e => e.status === "pending").length)} icon={AlertCircle} iconClassName="bg-rose-100 text-rose-600" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="border border-slate-200 bg-slate-50">
          <TabsTrigger value="employees">Annuaire ({employees.length})</TabsTrigger>
          <TabsTrigger value="leaves">Congés ({leaves.filter(l => l.status === "pending").length} en attente)</TabsTrigger>
          <TabsTrigger value="expenses">Notes de frais ({expenses.filter(e => e.status === "pending").length} en attente)</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher un employé..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-3">
            {filtered.map(emp => (
              <Card key={emp.id} className="border-none shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{emp.name}</p>
                      <Badge className={`text-[10px] h-4 px-1.5 ${deptColors[emp.department] || "bg-slate-100 text-slate-600"}`}>{emp.department}</Badge>
                      <Badge className={`text-[10px] h-4 px-1.5 ${statusEmployee[emp.status].color}`}>{statusEmployee[emp.status].label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.role}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{emp.email}</span>
                      <span className="hidden md:flex items-center gap-1"><Phone className="h-3 w-3" />{emp.phone}</span>
                    </div>
                  </div>
                  <div className="hidden lg:flex flex-col items-end text-right shrink-0">
                    <p className="font-black text-sm text-indigo-700">{fmt(emp.salary)}</p>
                    <p className="text-xs text-muted-foreground">{emp.leaveBalance}j congés restants</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4 space-y-3">
          {leaves.map(leave => (
            <Card key={leave.id} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm">{leave.employee}</p>
                    <Badge variant="outline" className="text-[10px]">{leave.type}</Badge>
                    <Badge className={`text-[10px] ${leave.status === "approved" ? "bg-emerald-100 text-emerald-700" : leave.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {leave.status === "approved" ? "Approuvé" : leave.status === "rejected" ? "Refusé" : "En attente"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(leave.from).toLocaleDateString("fr-FR")} → {new Date(leave.to).toLocaleDateString("fr-FR")} ({leave.days} jour{leave.days > 1 ? "s" : ""})
                  </p>
                </div>
                {leave.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => approveLeave(leave.id)}>
                      <CheckCircle2 className="h-3 w-3" /> Approuver
                    </Button>
                    <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">Refuser</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-3">
          {expenses.map(exp => (
            <Card key={exp.id} className="border-none shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm">{exp.employee}</p>
                    <Badge variant="outline" className="text-[10px]">{exp.category}</Badge>
                    <Badge className={`text-[10px] ${exp.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {exp.status === "approved" ? "Approuvée" : "En attente"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{exp.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(exp.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="font-black text-base text-indigo-700">{fmt(exp.amount)}</p>
                  {exp.status === "pending" && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => approveExpense(exp.id)}>
                      <CheckCircle2 className="h-3 w-3" /> Valider
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
