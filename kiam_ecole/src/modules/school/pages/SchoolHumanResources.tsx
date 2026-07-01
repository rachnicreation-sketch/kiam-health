import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  UserPlus, Shield, FileText, Download, Banknote, Calculator,
  Users, Wallet, TrendingUp, CheckCircle2, Pencil,
  PrinterIcon, Eye, GraduationCap, BookOpen, Award,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export-utils";
import { api } from "@/lib/api-service";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  id: string; clinicId: string;
  name: string; firstName: string; gender: string;
  nationality: string; maritalStatus: string; childrenCount: number;
  address: string; phone: string; email: string;
  niu: string; cnssNumber: string;
  department: string; position: string; contractType: string; hireDate: string; status: string;
  taxRegime: string;
  baseSalary: number; transportAllowance: number; housingAllowance: number; mealAllowance: number;
  notes: string;
}

const EMPTY_EMP: Partial<Employee> = {
  name: "", firstName: "", gender: "M", nationality: "Camerounaise",
  maritalStatus: "Célibataire", childrenCount: 0,
  address: "", phone: "", email: "",
  niu: "", cnssNumber: "",
  department: "Corps Enseignant", position: "", contractType: "CDI",
  hireDate: new Date().toISOString().split("T")[0], status: "active", taxRegime: "salarie_prive",
  baseSalary: 0, transportAllowance: 0, housingAllowance: 0, mealAllowance: 0, notes: "",
};

const DEPARTMENTS_SCHOOL = [
  "Direction", "Corps Enseignant", "Administration Scolaire",
  "Service de Scolarité", "Service Financier", "Personnel de Service", "Surveillance",
];

const POSITIONS_SCHOOL = [
  "Directeur / Proviseur", "Censeur / Directeur Adjoint", "Professeur Principal",
  "Professeur", "Instituteur(trice)", "Maître(sse) de Maternelle",
  "Secrétaire de Direction", "Comptable", "Agent de Scolarité",
  "Surveillant(e)", "Agent d'Entretien",
];

const SCHOOL_ROLES = [
  { value: "school_direction", label: "Direction (Proviseur/Directeur)" },
  { value: "school_admin", label: "Administration Scolaire" },
  { value: "school_finance", label: "Service Financier" },
  { value: "school_scolarite", label: "Service de Scolarité" },
  { value: "school_teacher", label: "Enseignant(e)" },
  { value: "clinic_admin", label: "Administrateur Système" },
];

const fmt = (n: number) => Math.round(n || 0).toLocaleString("fr-CM");

export default function SchoolHumanResources() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState<Partial<Employee>>(EMPTY_EMP);

  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);
  const [payrollSim, setPayrollSim] = useState<any | null>(null);
  const [payrollForm, setPayrollForm] = useState({
    employeeId: "", month: new Date().toISOString().slice(0, 7),
    bonusesTotal: 0, advanceDeduction: 0, notes: "",
  });

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "school_teacher" });

  const clinicId = currentUser?.clinicId;

  useEffect(() => { if (clinicId) loadData(); }, [clinicId]);

  const loadData = async () => {
    if (!clinicId) return;
    setIsLoading(true);
    try {
      const [empsData, payData, usrsData] = await Promise.all([
        api.hr.employees(clinicId),
        api.hr.payrolls(clinicId),
        api.users.list(clinicId),
      ]);
      
      // Filter employees to only show School-related departments or positions
      const schoolEmps = empsData.filter((emp: any) => 
        DEPARTMENTS_SCHOOL.includes(emp.department) || 
        POSITIONS_SCHOOL.includes(emp.position)
      );
      setEmployees(schoolEmps);
      
      // Filter payrolls to only show those belonging to School employees
      const schoolEmpIds = new Set(schoolEmps.map(e => e.id));
      setPayrolls(payData.filter((pay: any) => schoolEmpIds.has(pay.employeeId)));
      
      // Filter users to only show School roles
      const schoolRoles = ["school_direction", "school_admin", "school_finance", "school_scolarite", "school_teacher"];
      setUsers(usrsData.filter((u: any) => schoolRoles.includes(u.role)));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setIsLoading(false); }
  };

  const kpis = useMemo(() => {
    const active = employees.filter(e => e.status === "active");
    const teachers = active.filter(e => e.department === "Corps Enseignant");
    const totalBase = active.reduce((s, e) => s + (e.baseSalary || 0), 0);
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthPays = payrolls.filter(p => p.month === monthKey);
    const totalNet = monthPays.reduce((s, p) => s + (p.netSalary || 0), 0);
    return { active: active.length, teachers: teachers.length, totalBase, totalNet };
  }, [employees, payrolls]);

  const openAddEmp = () => { setEmpForm(EMPTY_EMP); setEditingEmp(null); setEmpDialogOpen(true); };
  const openEditEmp = (emp: Employee) => { setEmpForm(emp); setEditingEmp(emp); setEmpDialogOpen(true); };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !empForm.name || !empForm.position) return;
    try {
      if (editingEmp) {
        await api.hr.updateEmployee(editingEmp.id, { ...empForm, clinicId });
      } else {
        await api.hr.createEmployee({ ...empForm, clinicId } as any);
      }
      loadData(); setEmpDialogOpen(false);
      toast({ title: editingEmp ? "Dossier modifié" : "Dossier créé" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const simulatePayroll = async () => {
    if (!payrollForm.employeeId || !clinicId) return;
    try {
      const emp = employees.find(e => e.id === payrollForm.employeeId)!;
      const data = await api.hr.simulatePayroll({
        employeeId: payrollForm.employeeId,
        baseSalary: String(emp.baseSalary),
        transportAllowance: String(emp.transportAllowance),
        housingAllowance: String(emp.housingAllowance),
        mealAllowance: String(emp.mealAllowance),
        bonusesTotal: String(payrollForm.bonusesTotal),
        advanceDeduction: String(payrollForm.advanceDeduction),
      });
      setPayrollSim(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (payrollForm.employeeId) simulatePayroll(); }, [payrollForm]);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollSim || !clinicId) return;
    const emp = employees.find(e => e.id === payrollForm.employeeId)!;
    try {
      await api.hr.createPayroll({
        clinicId, employeeId: payrollForm.employeeId, month: payrollForm.month,
        baseSalary: emp.baseSalary, bonusesTotal: payrollForm.bonusesTotal,
        advanceDeduction: payrollForm.advanceDeduction,
        transportAllowance: emp.transportAllowance,
        housingAllowance: emp.housingAllowance,
        mealAllowance: emp.mealAllowance,
        notes: payrollForm.notes, status: "paid",
        paymentDate: new Date().toISOString().split("T")[0],
      });
      loadData(); setPayrollDialogOpen(false); setPayrollSim(null);
      toast({ title: "Fiche de paie générée ✓", description: `Net : ${fmt(payrollSim.netSalary)} CFA` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    try {
      await api.users.create({ clinicId, ...userForm });
      loadData(); setUserDialogOpen(false);
      toast({ title: "Accès créé" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  const deptColor = (dept: string) => {
    if (dept === "Corps Enseignant") return "bg-sky-500/10 text-sky-600";
    if (dept === "Direction") return "bg-indigo-500/10 text-indigo-600";
    if (dept === "Service Financier") return "bg-emerald-500/10 text-emerald-600";
    return "bg-slate-500/10 text-slate-600";
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-sky-500/10 text-sky-600 border border-sky-500/20">Actif</Badge>;
    if (status === "on_leave") return <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20">Congé</Badge>;
    return <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20">Terminé</Badge>;
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <div className="bg-sky-500/10 p-2 rounded-xl">
              <GraduationCap className="h-6 w-6 text-sky-600" />
            </div>
            Ressources Humaines — Établissement Scolaire
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion du personnel enseignant, administratif et de service
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Personnel", value: kpis.active, icon: Users, color: "text-sky-600", bg: "bg-sky-500/10" },
          { label: "Corps Enseignant", value: kpis.teachers, icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-500/10" },
          { label: "Masse salariale brute", value: fmt(kpis.totalBase) + " CFA", icon: Banknote, color: "text-teal-600", bg: "bg-teal-500/10" },
          { label: "Net versé ce mois", value: fmt(kpis.totalNet) + " CFA", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-500/10" },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">{kpi.label}</p>
                  <p className="text-xl font-black">{kpi.value}</p>
                </div>
                <div className={`${kpi.bg} p-2.5 rounded-xl`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="w-full max-w-lg grid grid-cols-3 bg-muted/50">
          <TabsTrigger value="staff">Personnel</TabsTrigger>
          <TabsTrigger value="payroll">Fiches de Paie</TabsTrigger>
          <TabsTrigger value="access">Accès Système</TabsTrigger>
        </TabsList>

        {/* ── Personnel ── */}
        <TabsContent value="staff" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold">Personnel de l'Établissement ({employees.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(employees, "Personnel_Ecole_KIAM")}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={openAddEmp}>
                <UserPlus className="h-4 w-4 mr-1" /> Ajouter du personnel
              </Button>
            </div>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-500/5">
                    <TableHead>Nom & Prénom</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Salaire Base</TableHead>
                    <TableHead>Contrat</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12">Chargement...</TableCell></TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Aucun dossier de personnel</p>
                        <p className="text-xs mt-1">Cliquez sur "Ajouter du personnel" pour commencer</p>
                      </TableCell>
                    </TableRow>
                  ) : employees.map(emp => (
                    <TableRow key={emp.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 font-black text-xs">
                            {emp.name[0] || "?"}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{emp.name} {emp.firstName}</div>
                            <div className="text-[11px] text-muted-foreground">{emp.phone || emp.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{emp.position}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${deptColor(emp.department)}`}>{emp.department}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold">{fmt(emp.baseSalary)} <span className="text-muted-foreground text-xs font-normal">CFA</span></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{emp.contractType || "CDI"}</Badge></TableCell>
                      <TableCell>{statusBadge(emp.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedEmployee(emp); setPayrollSim(null); setPayrollDialogOpen(true); }}>
                            <Calculator className="h-4 w-4 text-indigo-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEmp(emp)}>
                            <Pencil className="h-4 w-4 text-amber-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Fiches de Paie ── */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold">Bulletins de Paie ({payrolls.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(payrolls, "Paie_Ecole_KIAM")}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setPayrollSim(null); setPayrollDialogOpen(true); }}>
                <Calculator className="h-4 w-4 mr-1" /> Générer Bulletin
              </Button>
            </div>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-500/5">
                    <TableHead>Mois</TableHead>
                    <TableHead>Personnel</TableHead>
                    <TableHead>Brut</TableHead>
                    <TableHead>Net à Payer</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                        <Calculator className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Aucun bulletin de paie</p>
                      </TableCell>
                    </TableRow>
                  ) : payrolls.map(pay => {
                    const emp = employees.find(e => e.id === pay.employeeId);
                    return (
                      <TableRow key={pay.id}>
                        <TableCell className="font-bold text-sm">{pay.month}</TableCell>
                        <TableCell>
                          <div className="font-medium">{emp?.name} {emp?.firstName}</div>
                          <div className="text-xs text-muted-foreground">{emp?.position}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{fmt(pay.grossSalary)}</TableCell>
                        <TableCell className="font-mono font-black text-emerald-600">{fmt(pay.netSalary)} CFA</TableCell>
                        <TableCell>
                          <Badge className={pay.status === "paid" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"}>
                            {pay.status === "paid" ? "Payé" : "Brouillon"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1 text-indigo-600" onClick={() => { setSelectedPayroll(pay); setSelectedEmployee(employees.find(e => e.id === pay.employeeId) || null); setPayslipOpen(true); }}>
                            <Eye className="h-4 w-4" /> Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Accès Système ── */}
        <TabsContent value="access" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-sky-500" /> Accès au Système Scolaire</CardTitle>
                <CardDescription>Comptes autorisés à se connecter à Kiam École</CardDescription>
              </div>
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white gap-2" onClick={() => setUserDialogOpen(true)}>
                <UserPlus className="h-4 w-4" /> Créer un accès
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: Add/Edit Employee */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sky-600" />
              {editingEmp ? "Modifier le dossier" : "Nouveau dossier personnel — École"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEmployee} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold">NOM *</Label><Input required value={empForm.name || ""} onChange={e => setEmpForm({ ...empForm, name: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Prénom *</Label><Input required value={empForm.firstName || ""} onChange={e => setEmpForm({ ...empForm, firstName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Département</Label>
                <Select value={empForm.department || "Corps Enseignant"} onValueChange={v => setEmpForm({ ...empForm, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS_SCHOOL.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Fonction *</Label>
                <Select value={empForm.position || ""} onValueChange={v => setEmpForm({ ...empForm, position: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>{POSITIONS_SCHOOL.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Type de contrat</Label>
                <Select value={empForm.contractType || "CDI"} onValueChange={v => setEmpForm({ ...empForm, contractType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI — Enseignant Permanent</SelectItem>
                    <SelectItem value="CDD">CDD — Enseignant Contractuel</SelectItem>
                    <SelectItem value="Vacataire">Vacataire</SelectItem>
                    <SelectItem value="Stage">Stagiaire PPA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Date de prise de poste</Label><Input type="date" value={empForm.hireDate || ""} onChange={e => setEmpForm({ ...empForm, hireDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Téléphone</Label><Input value={empForm.phone || ""} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Email</Label><Input type="email" value={empForm.email || ""} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Salaire de base (CFA) *</Label><Input required type="number" min={0} value={empForm.baseSalary ?? 0} onChange={e => setEmpForm({ ...empForm, baseSalary: +e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Indemnité Transport (CFA)</Label><Input type="number" min={0} value={empForm.transportAllowance ?? 0} onChange={e => setEmpForm({ ...empForm, transportAllowance: +e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">N° CNSS</Label><Input value={empForm.cnssNumber || ""} onChange={e => setEmpForm({ ...empForm, cnssNumber: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">NIU Fiscal</Label><Input value={empForm.niu || ""} onChange={e => setEmpForm({ ...empForm, niu: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setEmpDialogOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Payroll */}
      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-500" /> Générer un bulletin de paie
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGeneratePayroll} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label className="text-xs font-bold">Personnel *</Label>
              <Select value={payrollForm.employeeId} onValueChange={v => setPayrollForm({ ...payrollForm, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} {e.firstName} — {e.position}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-xs font-bold">Mois</Label><Input type="month" value={payrollForm.month} onChange={e => setPayrollForm({ ...payrollForm, month: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Primes (CFA)</Label><Input type="number" min={0} value={payrollForm.bonusesTotal} onChange={e => setPayrollForm({ ...payrollForm, bonusesTotal: +e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-bold">Avances déduites (CFA)</Label><Input type="number" min={0} value={payrollForm.advanceDeduction} onChange={e => setPayrollForm({ ...payrollForm, advanceDeduction: +e.target.value })} /></div>
            </div>
            {payrollSim && (
              <div className="space-y-2 bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-black uppercase tracking-widest mb-2">Simulation</p>
                <div className="flex justify-between bg-indigo-50 dark:bg-indigo-950/30 rounded-lg px-3 py-2"><span className="text-xs">Salaire Brut</span><span className="font-bold">{fmt(payrollSim.grossSalary)} CFA</span></div>
                <div className="flex justify-between bg-rose-50 dark:bg-rose-950/30 rounded-lg px-3 py-2"><span className="text-rose-600 text-xs">CNSS Salariale</span><span className="font-bold text-rose-600">-{fmt(payrollSim.cnssEmployee)}</span></div>
                <div className="flex justify-between bg-orange-50 dark:bg-orange-950/30 rounded-lg px-3 py-2"><span className="text-orange-600 text-xs">IRPP + CAC</span><span className="font-bold text-orange-600">-{fmt(payrollSim.irpp + payrollSim.cac)}</span></div>
                <div className="flex justify-between bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2"><span className="text-emerald-700 font-black">NET À PAYER</span><span className="font-black text-emerald-700 text-lg">{fmt(payrollSim.netSalary)} CFA</span></div>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setPayrollDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={!payrollSim || !payrollForm.employeeId} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Valider & Créer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Payslip */}
      <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}>
        <DialogContent className="max-w-xl bg-white text-slate-900">
          <DialogHeader><DialogTitle className="sr-only">Bulletin de Paie</DialogTitle></DialogHeader>
          {selectedPayroll && selectedEmployee && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-xl font-black uppercase">BULLETIN DE PAIE — ÉCOLE</h2>
                  <p className="font-mono text-xs text-slate-500">{selectedPayroll.id}</p>
                </div>
                <p className="font-black">Période : {selectedPayroll.month}</p>
              </div>
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                <p className="font-black text-lg">{selectedEmployee.name} {selectedEmployee.firstName}</p>
                <p className="text-sm text-slate-600">{selectedEmployee.position} — {selectedEmployee.department}</p>
              </div>
              <Table className="border border-slate-200 text-sm">
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-black text-slate-900">LIBELLÉ</TableHead>
                    <TableHead className="text-right font-black text-slate-900">GAINS</TableHead>
                    <TableHead className="text-right font-black text-slate-900">RETENUES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>Salaire de Base</TableCell><TableCell className="text-right font-mono">{fmt(selectedPayroll.baseSalary)}</TableCell><TableCell /></TableRow>
                  {selectedPayroll.transportAllowance > 0 && <TableRow><TableCell className="text-slate-600">Indemnité Transport</TableCell><TableCell className="text-right font-mono">{fmt(selectedPayroll.transportAllowance)}</TableCell><TableCell /></TableRow>}
                  <TableRow className="border-t bg-slate-50/50"><TableCell className="font-bold">Salaire Brut</TableCell><TableCell className="text-right font-bold font-mono">{fmt(selectedPayroll.grossSalary)}</TableCell><TableCell /></TableRow>
                  <TableRow><TableCell className="text-rose-700">CNSS Salariale</TableCell><TableCell /><TableCell className="text-right font-mono text-rose-700">-{fmt(selectedPayroll.cnssEmployee)}</TableCell></TableRow>
                  <TableRow><TableCell className="text-orange-700">IRPP + CAC</TableCell><TableCell /><TableCell className="text-right font-mono text-orange-700">-{fmt(selectedPayroll.irpp + selectedPayroll.cac)}</TableCell></TableRow>
                  <TableRow className="bg-emerald-50 border-t-2 border-slate-900">
                    <TableCell className="font-black text-lg">NET À PAYER</TableCell>
                    <TableCell className="text-right font-black text-xl text-emerald-700" colSpan={2}>{fmt(selectedPayroll.netSalary)} CFA</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-center text-xs text-slate-400 border-t pt-3">Kiam SaaS — Module RH École</p>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPayslipOpen(false)}>Fermer</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={() => window.print()}>
              <PrinterIcon className="h-4 w-4" /> Imprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Add User */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-sky-500" /> Nouvel accès — Kiam École</DialogTitle></DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label className="text-xs font-bold">Nom complet *</Label><Input required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Email *</Label><Input required type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Mot de passe *</Label><Input required type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Rôle dans l'établissement</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm({ ...userForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SCHOOL_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setUserDialogOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white gap-2"><CheckCircle2 className="h-4 w-4" /> Créer l'accès</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
