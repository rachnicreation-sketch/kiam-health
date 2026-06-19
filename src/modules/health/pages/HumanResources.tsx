import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  UserPlus, UserCog, Mail, Lock, Shield, FileText, Download, Banknote, CalendarDays,
  Calculator, Info, Camera, Upload, File, Users, GraduationCap, Wallet, TrendingUp,
  Building2, Phone, MapPin, Heart, CreditCard, AlertTriangle, CheckCircle2, Pencil,
  X, ChevronDown, ChevronRight, BarChart3, PrinterIcon, Eye, ArrowLeft,
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
  birthDate: string; birthPlace: string; nationality: string;
  maritalStatus: string; childrenCount: number;
  address: string; phone: string; email: string;
  niu: string; cnssNumber: string;
  idCardType: string; idCardNumber: string; idCardExpiry: string;
  rib: string; bankName: string; bankAccount: string;
  emergencyName: string; emergencyPhone: string; emergencyRelation: string;
  department: string; position: string; echelon: string;
  contractType: string; contractEndDate: string; hireDate: string; status: string;
  taxRegime: string;
  baseSalary: number; transportAllowance: number; housingAllowance: number; mealAllowance: number;
  notes: string; photoUrl: string;
}

interface PayrollCalc {
  grossSalary: number; transportAllowance: number; housingAllowance: number;
  mealAllowance: number; bonusesTotal: number;
  cnssEmployee: number; irpp: number; cac: number; advanceDeduction: number; deductionsTotal: number;
  netSalary: number;
  cnssEmployer: number; crEmployer: number; atEmployer: number; pfEmployer: number; totalLaborCost: number;
}

interface PayrollRecord {
  id: string; employeeId: string; month: string;
  baseSalary: number; grossSalary: number;
  transportAllowance: number; housingAllowance: number; mealAllowance: number; bonusesTotal: number;
  cnssEmployee: number; irpp: number; cac: number; advanceDeduction: number; deductionsTotal: number;
  netSalary: number;
  cnssEmployer: number; crEmployer: number; atEmployer: number; pfEmployer: number; totalLaborCost: number;
  status: string; paymentDate: string; notes: string;
  bonuses: {name:string; amount:number; type:string}[];
  deductions: {name:string; amount:number; type:string}[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_EMP: Partial<Employee> = {
  name: "", firstName: "", gender: "M", birthDate: "", birthPlace: "",
  nationality: "Camerounaise", maritalStatus: "Célibataire", childrenCount: 0,
  address: "", phone: "", email: "",
  niu: "", cnssNumber: "", idCardType: "CNI", idCardNumber: "", idCardExpiry: "",
  rib: "", bankName: "", bankAccount: "",
  emergencyName: "", emergencyPhone: "", emergencyRelation: "",
  department: "", position: "", echelon: "", contractType: "CDI",
  hireDate: new Date().toISOString().split("T")[0], status: "active", taxRegime: "salarie_prive",
  baseSalary: 0, transportAllowance: 0, housingAllowance: 0, mealAllowance: 0, notes: "",
};

const fmt = (n: number) => Math.round(n || 0).toLocaleString("fr-CM");
const pct = (a: number, b: number) => b === 0 ? "—" : ((a / b) * 100).toFixed(1) + "%";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HumanResources() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialogs
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState<Partial<Employee>>(EMPTY_EMP);
  const [empTab, setEmpTab] = useState("identity");

  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [payslipOpen, setPayslipOpen] = useState(false);
  const [payslipView, setPayslipView] = useState<'employee' | 'employer'>('employee');
  const [dossierOpen, setDossierOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [payrollForm, setPayrollForm] = useState({
    employeeId: "", month: new Date().toISOString().slice(0, 7),
    bonusesTotal: 0, advanceDeduction: 0,
    transportOverride: 0, housingOverride: 0, mealOverride: 0,
    useOverrides: false, notes: "",
  });
  const [payrollSim, setPayrollSim] = useState<PayrollCalc | null>(null);

  // User access form
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "hr" });

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
      
      setEmployees(empsData);
      
      // Filter payrolls
      const clinicalEmpIds = new Set(empsData.map((e: any) => e.id));
      setPayrolls(payData.filter((pay: any) => clinicalEmpIds.has(pay.employeeId)));
      
      // Filter users to only show clinical roles
      const clinicalRoles = ["hr", "doctor", "nurse", "receptionist", "pharmacist", "lab_tech", "clinic_admin"];
      setUsers(usrsData.filter((u: any) => clinicalRoles.includes(u.role)));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally { setIsLoading(false); }
  };

  // ── KPI metrics ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active = employees.filter(e => e.status === "active");
    const totalBase = active.reduce((s, e) => s + (e.baseSalary || 0), 0);
    const lastMonthPay = payrolls.filter(p => p.month === new Date().toISOString().slice(0, 7));
    const totalNet = lastMonthPay.reduce((s, p) => s + (p.netSalary || 0), 0);
    const totalTOL = lastMonthPay.reduce((s, p) => s + (p.totalLaborCost || 0), 0);
    return { active: active.length, totalBase, totalNet, totalTOL };
  }, [employees, payrolls]);

  // ── Employee CRUD ────────────────────────────────────────────────────────────
  const openAddEmp = () => { setEmpForm(EMPTY_EMP); setEditingEmp(null); setEmpTab("identity"); setEmpDialogOpen(true); };
  const openEditEmp = (emp: Employee) => { setEmpForm(emp); setEditingEmp(emp); setEmpTab("identity"); setEmpDialogOpen(true); };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !empForm.name || !empForm.position) return;
    try {
      if (editingEmp) {
        await api.hr.updateEmployee(editingEmp.id, { ...empForm, clinicId });
      } else {
        await api.hr.createEmployee({ ...empForm, clinicId } as any);
      }
      loadData();
      setEmpDialogOpen(false);
      toast({ title: editingEmp ? "Employé modifié" : "Employé ajouté", description: `Dossier de ${empForm.name} ${empForm.firstName} enregistré.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  // ── Document upload ──────────────────────────────────────────────────────────
  const openDossier = (emp: Employee) => {
    setSelectedEmployee(emp);
    setDossierOpen(true);
    loadDocuments(emp.id);
  };

  const loadDocuments = async (empId: string) => {
    try {
      const data = await api.hr.listDocuments(empId);
      setDocuments(data);
    } catch (err) { console.error(err); }
  };

  const handleUpload = async (type: string, label: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file || !selectedEmployee) return;
      setIsUploading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result?.toString() || '';
          await api.hr.addDocument({
            employee_id: selectedEmployee.id,
            type,
            name: `${label} (${file.name})`,
            file_name: file.name,
            file_data: base64Data
          });
          toast({ title: "Document ajouté" });
          loadDocuments(selectedEmployee.id);
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } catch { 
        toast({ variant: "destructive", title: "Erreur upload" }); 
        setIsUploading(false);
      }
    };
    input.click();
  };

  // ── Payroll simulation ───────────────────────────────────────────────────────
  const simulatePayroll = async () => {
    if (!payrollForm.employeeId || !clinicId) return;
    try {
      const emp = employees.find(e => e.id === payrollForm.employeeId)!;
      const data = await api.hr.simulatePayroll({
        employeeId: payrollForm.employeeId,
        baseSalary: String(emp.baseSalary),
        transportAllowance: String(payrollForm.useOverrides ? payrollForm.transportOverride : emp.transportAllowance),
        housingAllowance: String(payrollForm.useOverrides ? payrollForm.housingOverride : emp.housingAllowance),
        mealAllowance: String(payrollForm.useOverrides ? payrollForm.mealOverride : emp.mealAllowance),
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
        clinicId,
        employeeId: payrollForm.employeeId,
        month: payrollForm.month,
        baseSalary: emp.baseSalary,
        bonusesTotal: payrollForm.bonusesTotal,
        advanceDeduction: payrollForm.advanceDeduction,
        transportAllowance: payrollForm.useOverrides ? payrollForm.transportOverride : emp.transportAllowance,
        housingAllowance: payrollForm.useOverrides ? payrollForm.housingOverride : emp.housingAllowance,
        mealAllowance: payrollForm.useOverrides ? payrollForm.mealOverride : emp.mealAllowance,
        notes: payrollForm.notes,
        status: "paid",
        paymentDate: new Date().toISOString().split("T")[0],
      });
      loadData();
      setPayrollDialogOpen(false);
      setPayrollSim(null);
      toast({ title: "Fiche de paie générée ✓", description: `Net à payer : ${fmt(payrollSim.netSalary)} CFA` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  // ── Users ────────────────────────────────────────────────────────────────────
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;
    try {
      await api.users.create({ clinicId, ...userForm });
      loadData(); setUserDialogOpen(false);
      toast({ title: "Accès créé" });
      setUserForm({ name: "", email: "", password: "", role: "hr" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    }
  };

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border">Actif</Badge>;
    if (status === "on_leave") return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 border">Congé</Badge>;
    return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 border">Terminé</Badge>;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <div className="bg-pink-500/10 p-2 rounded-xl"><Users className="h-6 w-6 text-pink-500" /></div>
            Ressources Humaines & Paie
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion du personnel, fiches de paie, CNSS, IRPP et coût total employeur</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Effectif actif", value: kpis.active, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Masse salariale brute", value: fmt(kpis.totalBase) + " CFA", icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Net versé ce mois", value: fmt(kpis.totalNet) + " CFA", icon: Wallet, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Coût total employeur", value: fmt(kpis.totalTOL) + " CFA", icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-500/10" },
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

      {/* Main Tabs */}
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="w-full max-w-xl grid grid-cols-4 bg-muted/50">
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="payroll">Fiches de Paie</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="users">Accès IT</TabsTrigger>
        </TabsList>

        {/* ── TAB: Employees ── */}
        <TabsContent value="employees" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-base font-bold">Annuaire des collaborateurs ({employees.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => exportToCSV(employees, "Employes_KIAM")}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button size="sm" className="gap-2 bg-pink-600 hover:bg-pink-700 text-white" onClick={openAddEmp}>
                <UserPlus className="h-4 w-4" /> Recruter
              </Button>
            </div>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Collaborateur</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>NIU</TableHead>
                    <TableHead>N° CNSS</TableHead>
                    <TableHead>Salaire Base</TableHead>
                    <TableHead>Contrat</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Aucun employé enregistré</p>
                        <p className="text-xs mt-1">Cliquez sur "Recruter" pour créer le premier dossier</p>
                      </TableCell>
                    </TableRow>
                  ) : employees.map(emp => (
                    <TableRow key={emp.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 font-black text-xs flex-shrink-0">
                            {(emp.name[0] || "?")}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{emp.name} {emp.firstName}</div>
                            <div className="text-[11px] text-muted-foreground">{emp.phone || emp.email || emp.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{emp.position}</div>
                        <div className="text-xs text-muted-foreground">{emp.department}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{emp.niu || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-mono text-xs">{emp.cnssNumber || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-mono text-sm font-bold">{fmt(emp.baseSalary)} <span className="text-muted-foreground text-xs font-normal">CFA</span></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{emp.contractType || "CDI"}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(emp.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDossier(emp)} title="Dossier">
                            <FileText className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEmp(emp)} title="Modifier">
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

        {/* ── TAB: Payroll ── */}
        <TabsContent value="payroll" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold">Bulletins de Paie ({payrolls.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => exportToCSV(payrolls, "Fiches_Paie_KIAM")}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setPayrollSim(null); setPayrollDialogOpen(true); }}>
                <Calculator className="h-4 w-4" /> Générer Bulletin
              </Button>
            </div>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-indigo-500/5">
                    <TableHead>Mois</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Brut</TableHead>
                    <TableHead>CNSS</TableHead>
                    <TableHead>IRPP</TableHead>
                    <TableHead>Net à Payer</TableHead>
                    <TableHead>Coût Employeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
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
                        <TableCell className="font-mono text-sm text-rose-600">-{fmt(pay.cnssEmployee)}</TableCell>
                        <TableCell className="font-mono text-sm text-orange-600">-{fmt(pay.irpp + pay.cac)}</TableCell>
                        <TableCell className="font-mono font-black text-emerald-600">{fmt(pay.netSalary)} CFA</TableCell>
                        <TableCell className="font-mono text-sm text-pink-600">{fmt(pay.totalLaborCost)}</TableCell>
                        <TableCell>
                          <Badge className={pay.status === "paid" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 border" : "bg-amber-500/10 text-amber-500 border-amber-500/20 border"}>
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

        {/* ── TAB: Analytics ── */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Répartition charges */}
            <Card className="border-border/50 col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-500" /> Analyse des coûts salariaux</CardTitle>
                <CardDescription>Masse salariale du mois en cours</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const monthKey = new Date().toISOString().slice(0, 7);
                  const monthPays = payrolls.filter(p => p.month === monthKey);
                  if (monthPays.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">Aucun bulletin pour ce mois</p>;
                  const totNet = monthPays.reduce((s,p) => s + p.netSalary, 0);
                  const totCnssEmp = monthPays.reduce((s,p) => s + p.cnssEmployee, 0);
                  const totIrpp = monthPays.reduce((s,p) => s + p.irpp + p.cac, 0);
                  const totPatronal = monthPays.reduce((s,p) => s + p.cnssEmployer, 0);
                  const totTOL = monthPays.reduce((s,p) => s + p.totalLaborCost, 0);
                  const rows = [
                    { label: "Net versé aux employés", amount: totNet, color: "bg-emerald-500" },
                    { label: "CNSS Part Salariale (2.8%)", amount: totCnssEmp, color: "bg-rose-400" },
                    { label: "IRPP + CAC retenus", amount: totIrpp, color: "bg-orange-400" },
                    { label: "Charges Patronales CNSS", amount: totPatronal, color: "bg-pink-500" },
                  ];
                  return (
                    <div className="space-y-3">
                      {rows.map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{r.label}</span>
                            <span className="font-bold font-mono">{fmt(r.amount)} CFA <span className="text-muted-foreground font-normal">({pct(r.amount, totTOL)})</span></span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${r.color} rounded-full`} style={{ width: `${(r.amount / totTOL) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t flex justify-between font-black">
                        <span>Coût Total Employeur (CTE)</span>
                        <span className="text-pink-600 font-mono">{fmt(totTOL)} CFA</span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Répartition effectifs */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" /> Effectifs par département</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const depts: Record<string, number> = {};
                  employees.filter(e => e.status === "active").forEach(e => {
                    const d = e.department || "Non défini";
                    depts[d] = (depts[d] || 0) + 1;
                  });
                  const entries = Object.entries(depts).sort((a, b) => b[1] - a[1]);
                  if (entries.length === 0) return <p className="text-muted-foreground text-sm text-center py-8">Aucune donnée</p>;
                  const total = entries.reduce((s, [,n]) => s + n, 0);
                  return (
                    <div className="space-y-2">
                      {entries.map(([dept, count], i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="text-xs font-medium flex-1 truncate text-muted-foreground">{dept}</div>
                          <div className="text-sm font-bold w-6 text-center">{count}</div>
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: Users ── */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-red-500" /> Accès au Logiciel</CardTitle>
                <CardDescription>Comptes autorisés à se connecter au système Kiam</CardDescription>
              </div>
              <Button size="sm" className="gap-2 bg-destructive hover:bg-destructive/90" onClick={() => setUserDialogOpen(true)}>
                <UserPlus className="h-4 w-4" /> Créer un accès
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead></TableRow>
                </TableHeader>
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: Employee Form (Add / Edit)                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-pink-500" />
              {editingEmp ? "Modifier le dossier" : "Nouveau dossier employé"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEmployee} className="space-y-6 pt-2">
            {/* Tab nav for form sections */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
              {[
                { id: "identity", label: "Identité", icon: Users },
                { id: "docs", label: "Pièces", icon: FileText },
                { id: "bank", label: "Banque & NIU", icon: CreditCard },
                { id: "emergency", label: "Urgence", icon: Heart },
                { id: "contract", label: "Contrat & Paie", icon: Banknote },
              ].map(tab => (
                <button key={tab.id} type="button" onClick={() => setEmpTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all ${empTab === tab.id ? "bg-white dark:bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <tab.icon className="h-3.5 w-3.5" />{tab.label}
                </button>
              ))}
            </div>

            {/* Identity */}
            {empTab === "identity" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-bold">NOM *</Label><Input required value={empForm.name || ""} onChange={e => setEmpForm({...empForm, name: e.target.value.toUpperCase()})} placeholder="NOM DE FAMILLE" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Prénom *</Label><Input required value={empForm.firstName || ""} onChange={e => setEmpForm({...empForm, firstName: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Sexe</Label>
                  <Select value={empForm.gender || "M"} onValueChange={v => setEmpForm({...empForm, gender: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Date de naissance</Label><Input type="date" value={empForm.birthDate || ""} onChange={e => setEmpForm({...empForm, birthDate: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Lieu de naissance</Label><Input value={empForm.birthPlace || ""} onChange={e => setEmpForm({...empForm, birthPlace: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Nationalité</Label><Input value={empForm.nationality || "Camerounaise"} onChange={e => setEmpForm({...empForm, nationality: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Situation matrimoniale</Label>
                  <Select value={empForm.maritalStatus || "Célibataire"} onValueChange={v => setEmpForm({...empForm, maritalStatus: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Célibataire">Célibataire</SelectItem>
                      <SelectItem value="Marié">Marié(e)</SelectItem>
                      <SelectItem value="Veuf">Veuf/Veuve</SelectItem>
                      <SelectItem value="Divorcé">Divorcé(e)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Nombre d'enfants</Label><Input type="number" min={0} value={empForm.childrenCount ?? 0} onChange={e => setEmpForm({...empForm, childrenCount: +e.target.value})} /></div>
                <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Adresse complète</Label><Input value={empForm.address || ""} onChange={e => setEmpForm({...empForm, address: e.target.value})} placeholder="Quartier, Ville..." /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Téléphone</Label><Input value={empForm.phone || ""} onChange={e => setEmpForm({...empForm, phone: e.target.value})} placeholder="+237 6XX XXX XXX" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Email professionnel</Label><Input type="email" value={empForm.email || ""} onChange={e => setEmpForm({...empForm, email: e.target.value})} /></div>
              </div>
            )}

            {/* Docs */}
            {empTab === "docs" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-bold">Type de pièce d'identité</Label>
                  <Select value={empForm.idCardType || "CNI"} onValueChange={v => setEmpForm({...empForm, idCardType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNI">CNI (Carte Nationale d'Identité)</SelectItem>
                      <SelectItem value="Passeport">Passeport</SelectItem>
                      <SelectItem value="Permis">Permis de conduire</SelectItem>
                      <SelectItem value="Titre_sejour">Titre de séjour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Numéro de la pièce</Label><Input value={empForm.idCardNumber || ""} onChange={e => setEmpForm({...empForm, idCardNumber: e.target.value})} placeholder="Ex: 12345678901" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Date d'expiration pièce</Label><Input type="date" value={empForm.idCardExpiry || ""} onChange={e => setEmpForm({...empForm, idCardExpiry: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">NIU (Numéro Identifiant Unique)</Label><Input value={empForm.niu || ""} onChange={e => setEmpForm({...empForm, niu: e.target.value})} placeholder="NIU fiscal DGI" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">N° CNSS / Matricule</Label><Input value={empForm.cnssNumber || ""} onChange={e => setEmpForm({...empForm, cnssNumber: e.target.value})} /></div>
              </div>
            )}

            {/* Bank */}
            {empTab === "bank" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">Le RIB (Relevé d'Identité Bancaire) est utilisé pour les virements salariaux automatiques.</p>
                  </div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Banque</Label><Input value={empForm.bankName || ""} onChange={e => setEmpForm({...empForm, bankName: e.target.value})} placeholder="Afriland, BGFI, SCB..." /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">RIB complet</Label><Input value={empForm.rib || ""} onChange={e => setEmpForm({...empForm, rib: e.target.value})} placeholder="XX XXX XXXX XXXX..." /></div>
                <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">N° de compte bancaire</Label><Input value={empForm.bankAccount || ""} onChange={e => setEmpForm({...empForm, bankAccount: e.target.value})} /></div>
              </div>
            )}

            {/* Emergency */}
            {empTab === "emergency" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <div className="flex items-center gap-2 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">Personne à contacter en cas d'urgence médicale ou d'absence.</p>
                  </div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Nom complet du contact</Label><Input value={empForm.emergencyName || ""} onChange={e => setEmpForm({...empForm, emergencyName: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Téléphone d'urgence</Label><Input value={empForm.emergencyPhone || ""} onChange={e => setEmpForm({...empForm, emergencyPhone: e.target.value})} placeholder="+237 6XX XXX XXX" /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Lien de parenté</Label><Input value={empForm.emergencyRelation || ""} onChange={e => setEmpForm({...empForm, emergencyRelation: e.target.value})} placeholder="Épouse, Père, Frère..." /></div>
              </div>
            )}

            {/* Contract & Salary */}
            {empTab === "contract" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs font-bold">Département / Service *</Label><Input required value={empForm.department || ""} onChange={e => setEmpForm({...empForm, department: e.target.value})} placeholder="Administration, Commercial..." /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Fonction / Poste *</Label><Input required value={empForm.position || ""} onChange={e => setEmpForm({...empForm, position: e.target.value})} placeholder="Directeur, Comptable, Caissier..." /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Catégorie / Échelon</Label><Input value={empForm.echelon || ""} onChange={e => setEmpForm({...empForm, echelon: e.target.value})} placeholder="Cat. 7, Grade B..." /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Type de contrat</Label>
                  <Select value={empForm.contractType || "CDI"} onValueChange={v => setEmpForm({...empForm, contractType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDI">CDI (Durée indéterminée)</SelectItem>
                      <SelectItem value="CDD">CDD (Durée déterminée)</SelectItem>
                      <SelectItem value="Stage">Stage</SelectItem>
                      <SelectItem value="Vacataire">Vacataire</SelectItem>
                      <SelectItem value="Consultant">Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Date d'embauche</Label><Input type="date" value={empForm.hireDate || ""} onChange={e => setEmpForm({...empForm, hireDate: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Fin de contrat (CDD)</Label><Input type="date" value={empForm.contractEndDate || ""} onChange={e => setEmpForm({...empForm, contractEndDate: e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Régime fiscal</Label>
                  <Select value={empForm.taxRegime || "salarie_prive"} onValueChange={v => setEmpForm({...empForm, taxRegime: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salarie_prive">Salarié privé (IRPP barème)</SelectItem>
                      <SelectItem value="fonctionnaire">Fonctionnaire (retenue IGR)</SelectItem>
                      <SelectItem value="exonere">Exonéré (Stage / Convention)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Salaire de base (CFA) *</Label><Input required type="number" min={0} value={empForm.baseSalary ?? 0} onChange={e => setEmpForm({...empForm, baseSalary: +e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Indemnité transport (CFA/mois)</Label><Input type="number" min={0} value={empForm.transportAllowance ?? 0} onChange={e => setEmpForm({...empForm, transportAllowance: +e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Indemnité logement (CFA/mois)</Label><Input type="number" min={0} value={empForm.housingAllowance ?? 0} onChange={e => setEmpForm({...empForm, housingAllowance: +e.target.value})} /></div>
                <div className="space-y-1.5"><Label className="text-xs font-bold">Panier repas (CFA/mois)</Label><Input type="number" min={0} value={empForm.mealAllowance ?? 0} onChange={e => setEmpForm({...empForm, mealAllowance: +e.target.value})} /></div>
                <div className="space-y-1.5 col-span-2"><Label className="text-xs font-bold">Notes / Observations</Label><Input value={empForm.notes || ""} onChange={e => setEmpForm({...empForm, notes: e.target.value})} /></div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEmpDialogOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {editingEmp ? "Mettre à jour" : "Enregistrer le dossier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: Generate Payroll                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={payrollDialogOpen} onOpenChange={setPayrollDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Calculator className="h-5 w-5 text-indigo-500" /> Génération du Bulletin de Paie
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGeneratePayroll} className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-bold">Employé *</Label>
                <Select value={payrollForm.employeeId} onValueChange={v => setPayrollForm({...payrollForm, employeeId: v})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un employé..." /></SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.status === "active").map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} {e.firstName} — {fmt(e.baseSalary)} CFA/mois
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Mois de paie *</Label>
                <Input type="month" required value={payrollForm.month} onChange={e => setPayrollForm({...payrollForm, month: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Primes / Bonus exceptionnels (CFA)</Label>
                <Input type="number" min={0} value={payrollForm.bonusesTotal} onChange={e => setPayrollForm({...payrollForm, bonusesTotal: +e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Avances sur salaire (CFA)</Label>
                <Input type="number" min={0} value={payrollForm.advanceDeduction} onChange={e => setPayrollForm({...payrollForm, advanceDeduction: +e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Notes</Label>
                <Input value={payrollForm.notes} onChange={e => setPayrollForm({...payrollForm, notes: e.target.value})} placeholder="Observations..." />
              </div>
            </div>

            {/* Simulation Result */}
            {payrollSim && payrollForm.employeeId && (
              <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Résumé de calcul (simulation)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between bg-white dark:bg-card rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Salaire Brut</span>
                    <span className="font-bold">{fmt(payrollSim.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between bg-rose-50 dark:bg-rose-950/30 rounded-lg px-3 py-2">
                    <span className="text-rose-600 text-xs">CNSS Salariale (2.8%)</span>
                    <span className="font-bold text-rose-600">-{fmt(payrollSim.cnssEmployee)}</span>
                  </div>
                  <div className="flex justify-between bg-orange-50 dark:bg-orange-950/30 rounded-lg px-3 py-2">
                    <span className="text-orange-600 text-xs">IRPP retenu</span>
                    <span className="font-bold text-orange-600">-{fmt(payrollSim.irpp)}</span>
                  </div>
                  <div className="flex justify-between bg-orange-50 dark:bg-orange-950/30 rounded-lg px-3 py-2">
                    <span className="text-orange-600 text-xs">CAC (10% IRPP)</span>
                    <span className="font-bold text-orange-600">-{fmt(payrollSim.cac)}</span>
                  </div>
                  {payrollSim.advanceDeduction > 0 && (
                    <div className="flex justify-between bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                      <span className="text-amber-600 text-xs">Avances</span>
                      <span className="font-bold text-amber-600">-{fmt(payrollSim.advanceDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2 col-span-2">
                    <span className="text-emerald-700 font-black">NET À PAYER</span>
                    <span className="font-black text-emerald-700 text-lg">{fmt(payrollSim.netSalary)} CFA</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-dashed">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Charges Patronales (info)</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "CNSS Patronale totale", value: payrollSim.cnssEmployer, color: "text-pink-600" },
                      { label: "Coût Total Employeur (CTE/TOL)", value: payrollSim.totalLaborCost, color: "text-pink-700 font-black" },
                    ].map((r, i) => (
                      <div key={i} className={`flex justify-between bg-pink-50 dark:bg-pink-950/30 rounded-lg px-3 py-2 ${i === 1 ? "col-span-2" : ""}`}>
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className={r.color}>{fmt(r.value)} CFA</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPayrollDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={!payrollSim || !payrollForm.employeeId} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Valider & Créer le bulletin
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: Payslip View                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="sr-only">Bulletin de Paie</DialogTitle>
          </DialogHeader>
          {selectedPayroll && selectedEmployee && (
            <div className="space-y-5 pt-2" id="payslip-print">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">BULLETIN DE PAIE</h2>
                  <p className="font-mono text-xs text-slate-500 mt-1">{selectedPayroll.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg">Période : {selectedPayroll.month}</p>
                  <p className="text-sm text-slate-600">Paiement : {selectedPayroll.paymentDate}</p>
                </div>
              </div>

              {/* Employee info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">EMPLOYÉ</p>
                  <p className="font-black text-lg">{selectedEmployee.name} {selectedEmployee.firstName}</p>
                  <p className="text-sm text-slate-600">{selectedEmployee.position} — {selectedEmployee.department}</p>
                  <p className="text-xs text-slate-500 mt-1">Contrat : {selectedEmployee.contractType || "CDI"} | Échelon : {selectedEmployee.echelon || "—"}</p>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">N° CNSS :</span><span className="font-mono font-bold">{selectedEmployee.cnssNumber || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">NIU :</span><span className="font-mono font-bold">{selectedEmployee.niu || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Banque :</span><span className="font-bold">{selectedEmployee.bankName || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">RIB :</span><span className="font-mono text-xs font-bold">{selectedEmployee.rib || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Situation :</span><span>{selectedEmployee.maritalStatus} — {selectedEmployee.childrenCount} enfant(s)</span></div>
                </div>
              </div>

              {/* Salary table */}
              <Table className="border border-slate-200 text-sm">
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-black text-slate-900 text-xs">LIBELLÉ</TableHead>
                    <TableHead className="text-right font-black text-slate-900 text-xs">GAINS (CFA)</TableHead>
                    <TableHead className="text-right font-black text-slate-900 text-xs">RETENUES (CFA)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium">Salaire de Base</TableCell><TableCell className="text-right font-mono">{fmt(selectedPayroll.baseSalary)}</TableCell><TableCell /></TableRow>
                  {selectedPayroll.transportAllowance > 0 && <TableRow><TableCell className="text-slate-600">Indemnité de Transport</TableCell><TableCell className="text-right font-mono">{fmt(selectedPayroll.transportAllowance)}</TableCell><TableCell /></TableRow>}
                  {selectedPayroll.housingAllowance > 0 && <TableRow><TableCell className="text-slate-600">Indemnité de Logement</TableCell><TableCell className="text-right font-mono">{fmt(selectedPayroll.housingAllowance)}</TableCell><TableCell /></TableRow>}
                  {selectedPayroll.mealAllowance > 0 && <TableRow><TableCell className="text-slate-600">Panier Repas</TableCell><TableCell className="text-right font-mono">{fmt(selectedPayroll.mealAllowance)}</TableCell><TableCell /></TableRow>}
                  {selectedPayroll.bonusesTotal > 0 && <TableRow><TableCell className="text-slate-600">Primes & Avantages</TableCell><TableCell className="text-right font-mono">{fmt(selectedPayroll.bonusesTotal)}</TableCell><TableCell /></TableRow>}
                  <TableRow className="border-t bg-slate-50/50"><TableCell className="font-bold">Salaire Brut</TableCell><TableCell className="text-right font-bold font-mono">{fmt(selectedPayroll.grossSalary)}</TableCell><TableCell /></TableRow>
                  <TableRow><TableCell className="text-rose-700">CNSS Part Salariale (2.8%)</TableCell><TableCell /><TableCell className="text-right font-mono text-rose-700">-{fmt(selectedPayroll.cnssEmployee)}</TableCell></TableRow>
                  <TableRow><TableCell className="text-orange-700">IRPP (Retenu à la source)</TableCell><TableCell /><TableCell className="text-right font-mono text-orange-700">-{fmt(selectedPayroll.irpp)}</TableCell></TableRow>
                  <TableRow><TableCell className="text-orange-600">CAC (10% IRPP)</TableCell><TableCell /><TableCell className="text-right font-mono text-orange-600">-{fmt(selectedPayroll.cac)}</TableCell></TableRow>
                  {selectedPayroll.advanceDeduction > 0 && <TableRow><TableCell className="text-amber-700">Avances sur salaire</TableCell><TableCell /><TableCell className="text-right font-mono text-amber-700">-{fmt(selectedPayroll.advanceDeduction)}</TableCell></TableRow>}
                  <TableRow className="bg-emerald-50 border-t-2 border-slate-900">
                    <TableCell className="font-black text-lg" colSpan={1}>NET À PAYER</TableCell>
                    <TableCell className="text-right font-black text-xl text-emerald-700" colSpan={2}>{fmt(selectedPayroll.netSalary)} CFA</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Employer charges */}
              {payslipView === 'employer' && (
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mt-4">
                  <p className="text-xs font-black text-pink-800 uppercase tracking-wider mb-2">Charges Patronales (info employeur)</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-500">CNSS Patronale :</span><br /><span className="font-bold font-mono">{fmt(selectedPayroll.cnssEmployer)} CFA</span></div>
                    <div><span className="text-slate-500">Crédit Retraite (4.2%) :</span><br /><span className="font-bold font-mono">{fmt(selectedPayroll.crEmployer)} CFA</span></div>
                    <div><span className="text-pink-700 font-black">COÛT TOTAL (TOL/CTE) :</span><br /><span className="font-black text-pink-700 font-mono">{fmt(selectedPayroll.totalLaborCost)} CFA</span></div>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-slate-400 border-t pt-3">
                Généré par Kiam SaaS — Document électronique valable pour la comptabilité interne (OHADA)
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4 print:hidden">
            <Button variant="outline" onClick={() => setPayslipOpen(false)}>Fermer</Button>
            <Button variant="outline" className="gap-2 text-pink-700 border-pink-200 hover:bg-pink-50" onClick={() => { setPayslipView('employer'); setTimeout(() => window.print(), 100); }}>
              <PrinterIcon className="h-4 w-4" /> Imprimer Charges (Employeur)
            </Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { setPayslipView('employee'); setTimeout(() => window.print(), 100); }}>
              <PrinterIcon className="h-4 w-4" /> Imprimer Bulletin (Salarié)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: Employee Dossier (Documents)                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={dossierOpen} onOpenChange={setDossierOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Dossier Numérique</p>
                <h2 className="text-xl font-black">{selectedEmployee?.name} {selectedEmployee?.firstName}</h2>
                <p className="text-slate-400 text-sm">{selectedEmployee?.position} — {selectedEmployee?.department}</p>
              </div>
              <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 border px-3 py-1 rounded-full font-black uppercase text-xs">
                {selectedEmployee?.contractType || "CDI"}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-50 p-6 grid grid-cols-3 gap-6 max-h-[65vh] overflow-y-auto">
            {/* Upload Panel */}
            <div className="col-span-1 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Ajouter un document</p>
              {[
                { id: "photo", label: "Photo d'identité", icon: Camera, color: "bg-blue-500" },
                { id: "id_card", label: "Pièce d'identité / Passeport", icon: FileText, color: "bg-indigo-500" },
                { id: "niu_doc", label: "Document NIU fiscal", icon: FileText, color: "bg-violet-500" },
                { id: "cv", label: "Curriculum Vitae (CV)", icon: File, color: "bg-orange-500" },
                { id: "contract", label: "Contrat de travail", icon: FileText, color: "bg-emerald-500" },
                { id: "criminal_record", label: "Casier judiciaire", icon: Shield, color: "bg-rose-500" },
                { id: "diplomas", label: "Diplômes / Certificats", icon: GraduationCap, color: "bg-amber-500" },
                { id: "bank_rib", label: "Justificatif bancaire (RIB)", icon: CreditCard, color: "bg-cyan-500" },
                { id: "other", label: "Autre document...", icon: FileText, color: "bg-slate-500" },
              ].map(doc => (
                <button key={doc.id} type="button" disabled={isUploading} onClick={() => handleUpload(doc.id, doc.label)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group border border-slate-100">
                  <div className={`h-9 w-9 rounded-lg ${doc.color} text-white flex items-center justify-center flex-shrink-0`}>
                    <doc.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 text-left leading-tight">{doc.label}</p>
                  <Upload className="h-3.5 w-3.5 ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Documents */}
            <div className="col-span-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                Documents archivés ({documents.length})
              </p>
              {documents.length === 0 ? (
                <div className="h-52 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                  <FileText className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">Aucun document archivé</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3 group hover:border-indigo-200 transition-colors">
                      <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <File className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">{new Date(doc.created_at || Date.now()).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto rounded-lg text-slate-300 hover:text-indigo-500" onClick={() => window.open(`/kiam/uploads/${doc.file_url}`, '_blank')}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Add User */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-red-500" /> Nouvel accès utilisateur</DialogTitle></DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label className="text-xs font-bold">Nom complet *</Label><Input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Email de connexion *</Label><Input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Mot de passe provisoire *</Label><Input required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>
            <div className="space-y-1.5"><Label className="text-xs font-bold">Rôle</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm({...userForm, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">Gestionnaire RH</SelectItem>
                  <SelectItem value="doctor">Médecin</SelectItem>
                  <SelectItem value="nurse">Infirmier / Major</SelectItem>
                  <SelectItem value="receptionist">Réception / Caisse</SelectItem>
                  <SelectItem value="pharmacist">Pharmacien</SelectItem>
                  <SelectItem value="lab_tech">Laborantin</SelectItem>
                  <SelectItem value="clinic_admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={() => setUserDialogOpen(false)}>Annuler</Button>
              <Button type="submit" variant="destructive" className="gap-2"><CheckCircle2 className="h-4 w-4" /> Créer l'accès</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
