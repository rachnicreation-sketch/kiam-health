import { useState, useEffect } from "react";
import { User, UserRole, Employee, Payroll } from "@/lib/mock-data";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCog, Mail, Lock, Shield, FileText, Download, Banknote, CalendarDays, Calculator, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV } from "@/lib/export-utils";
import { api } from "@/lib/api-service";

export default function HumanResources() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  // States
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialogs
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);

  // New Employee Form
  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    name: "", firstName: "", department: "", position: "", baseSalary: 0, status: "active"
  });

  // Payroll Form
  const [prForm, setPrForm] = useState({
    employeeId: "", month: new Date().toISOString().slice(0, 7), bonus: 0, deduction: 0
  });

  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isPayslipViewOpen, setIsPayslipViewOpen] = useState(false);

  // New User Form
  const [userForm, setUserForm] = useState({
    name: "", email: "", password: "", role: "nurse" as UserRole
  });

  useEffect(() => {
    if (currentUser?.clinicId) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser?.clinicId) return;
    setIsLoading(true);
    try {
      const [usersData, employeesData, payrollsData] = await Promise.all([
        api.users.list(currentUser.clinicId),
        api.hr.employees(currentUser.clinicId),
        api.hr.payrolls(currentUser.clinicId)
      ]);
      
      setUsers(usersData);
      setEmployees(employeesData);
      setPayrolls(payrollsData);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données RH." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.clinicId || !empForm.name || !empForm.position) return;

    try {
      await api.hr.createEmployee({
        clinicId: currentUser.clinicId,
        name: empForm.name,
        firstName: empForm.firstName,
        department: empForm.department || 'Général',
        position: empForm.position,
        baseSalary: Number(empForm.baseSalary) || 0,
        hireDate: new Date().toISOString().split('T')[0],
        status: 'active',
        cnssNumber: empForm.cnssNumber
      });

      loadData();
      setIsAddEmployeeOpen(false);
      toast({ title: "Employé ajouté", description: "Le dossier du personnel a été créé." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === prForm.employeeId);
    if (!emp || !currentUser?.clinicId) return;

    try {
      // Calcul IRPP & CNSS simplifié (Mocks)
      const base = Number(emp.baseSalary);
      const bonus = Number(prForm.bonus);
      const otherDeduction = Number(prForm.deduction);
      
      // CNSS: 4% part employé (exemple fictif)
      const cnss = Math.round(base * 0.04);
      const totalDeductions = cnss + otherDeduction;
      const net = base + bonus - totalDeductions;

      const payrollData = {
        clinicId: currentUser.clinicId,
        employeeId: emp.id,
        month: prForm.month,
        baseSalary: base,
        bonuses: [{ name: "Prime Divers", amount: bonus }],
        deductions: [
          { name: "CNSS (Part Salariale 4%)", amount: cnss },
          { name: "Autres Retenues", amount: otherDeduction }
        ],
        netSalary: net,
        status: 'paid',
        paymentDate: new Date().toISOString().split('T')[0]
      };

      await api.hr.createPayroll(payrollData);

      // --- Liaison Comptable (Dépense) ---
      await api.transactions.create({
        clinicId: currentUser.clinicId,
        type: 'expense',
        amount: net,
        category: 'Salaires',
        transaction_date: payrollData.paymentDate,
        description: `Salaire ${prForm.month} - ${emp.name} ${emp.firstName}`,
        paymentMethod: 'transfer'
      });

      loadData();
      setIsPayrollOpen(false);
      toast({ title: "Fiche de paie générée", description: "Le salaire net calculé a été enregistré." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.clinicId || !userForm.email || !userForm.password) return;

    try {
      await api.users.create({
        clinicId: currentUser.clinicId,
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role
      });

      loadData();
      setIsAddUserOpen(false);
      toast({ title: "Accès créé", description: `Le compte pour ${userForm.name} est actif.` });
      setUserForm({ name: "", email: "", password: "", role: "nurse" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
       toast({ variant: "destructive", title: "Action impossible", description: "Vous ne pouvez pas supprimer votre propre compte." });
       return;
    }
    
    // Pour l'instant on simule car pas d'endpoint DELETE user, mais on pourrait en ajouter un
    toast({ title: "Info", description: "La suppression d'utilisateur via API sera bientôt disponible." });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'clinic_admin': return <Badge variant="default">Administrateur</Badge>;
      case 'doctor': return <Badge variant="outline" className="border-primary text-primary">Médecin</Badge>;
      case 'nurse': return <Badge variant="outline" className="border-blue-500 text-blue-500">Infirmier</Badge>;
      case 'lab_tech': return <Badge variant="outline" className="border-purple-500 text-purple-500">Tech Lab</Badge>;
      case 'pharmacist': return <Badge variant="outline" className="border-success text-success">Pharmacien</Badge>;
      case 'receptionist': return <Badge variant="outline" className="border-amber-500 text-amber-500">Réception</Badge>;
      case 'hr': return <Badge variant="outline" className="border-pink-500 text-pink-500">RH</Badge>;
      default: return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          Ressources Humaines & Paie
        </h1>
        <p className="text-muted-foreground text-sm">Gérez le personnel, les contrats et les fiches de paie</p>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl bg-muted/50 p-1">
          <TabsTrigger value="employees" className="rounded-md">Personnels & Contrats</TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-md">Fiches de Paie</TabsTrigger>
          <TabsTrigger value="users" className="rounded-md">Accréditations IT</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Annuaire des Employés</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => {
                if (employees.length === 0) {
                  toast({ variant: "destructive", title: "Export impossible", description: "Aucun employé à exporter." });
                  return;
                }
                exportToCSV(employees, "Annuaire_Employes");
                toast({ title: "Export réussi", description: "L'annuaire des employés a été exporté." });
              }}>
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><UserPlus className="h-4 w-4" /> Embaucher</Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Dossier du nouveau collaborateur</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4 grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2 col-span-1">
                    <Label>Nom</Label>
                    <Input required value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>Prénom</Label>
                    <Input value={empForm.firstName} onChange={e => setEmpForm({...empForm, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>Département</Label>
                    <Input value={empForm.department} onChange={e => setEmpForm({...empForm, department: e.target.value})} placeholder="Pédiatrie, Administratif..." />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>Fonction</Label>
                    <Input required value={empForm.position} onChange={e => setEmpForm({...empForm, position: e.target.value})} placeholder="Médecin Chef, Secrétaire..." />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>Salaire de base (CFA)</Label>
                    <Input type="number" required value={empForm.baseSalary} onChange={e => setEmpForm({...empForm, baseSalary: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>N° CNSS/Matricule</Label>
                    <Input value={empForm.cnssNumber || ''} onChange={e => setEmpForm({...empForm, cnssNumber: e.target.value})} />
                  </div>
                  <div className="col-span-2 pt-2">
                    <Button type="submit" className="w-full">Enregistrer le contrat</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                     <TableHead>Employé</TableHead>
                     <TableHead>Fonction</TableHead>
                     <TableHead>Salaire de base</TableHead>
                     <TableHead>Date d'embauche</TableHead>
                     <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun employé enregistré</TableCell></TableRow>
                  ) : employees.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="font-bold">{emp.name} {emp.firstName}</div>
                        <div className="text-[10px] text-muted-foreground">{emp.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{emp.position}</div>
                        <div className="text-xs text-muted-foreground">{emp.department}</div>
                      </TableCell>
                      <TableCell className="font-mono">{emp.baseSalary.toLocaleString()} CFA</TableCell>
                      <TableCell className="text-sm">{emp.hireDate}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none">Actif</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4 space-y-4">
           <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Traitements Salariaux & Fiches de Paie</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => {
                if (payrolls.length === 0) {
                  toast({ variant: "destructive", title: "Export impossible", description: "Aucun historique de paye à exporter." });
                  return;
                }
                exportToCSV(payrolls, "Historique_Payes");
                toast({ title: "Export réussi", description: "L'historique des payes a été exporté." });
              }}>
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
              <Dialog open={isPayrollOpen} onOpenChange={setIsPayrollOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"><Calculator className="h-4 w-4" /> Générer Paie Mensuelle</Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Calcul de la Fiche de Paie</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGeneratePayroll} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Employé</Label>
                    <Select required value={prForm.employeeId} onValueChange={v => setPrForm({...prForm, employeeId: v})}>
                      <SelectTrigger><SelectValue placeholder="Choisir un employé..." /></SelectTrigger>
                      <SelectContent>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.name} {e.firstName} ({e.baseSalary} CFA)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mois Concerné</Label>
                      <Input type="month" required value={prForm.month} onChange={e => setPrForm({...prForm, month: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Primes Exceptionnelles</Label>
                      <Input type="number" value={prForm.bonus} onChange={e => setPrForm({...prForm, bonus: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <Label>Avances sur salaire / Autres retenues</Label>
                     <Input type="number" value={prForm.deduction} onChange={e => setPrForm({...prForm, deduction: Number(e.target.value)})} />
                  </div>
                  <div className="bg-muted p-3 flex justify-between items-center rounded-lg text-sm mb-4">
                     <span className="text-muted-foreground mr-2"><Info className="h-4 w-4 inline mr-1"/> La CNSS de 4% sera déduite automatiquement</span>
                  </div>
                  <Button type="submit" className="w-full">Valider et Créer la fiche</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-indigo-50/50">
                  <TableRow>
                     <TableHead>Mois</TableHead>
                     <TableHead>Employé</TableHead>
                     <TableHead>Salaire Base</TableHead>
                     <TableHead>Net à Payer</TableHead>
                     <TableHead>Paiement</TableHead>
                     <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune paie générée.</TableCell></TableRow>
                  ) : payrolls.map(pay => {
                    const emp = employees.find(e => e.id === pay.employeeId);
                    return (
                      <TableRow key={pay.id}>
                        <TableCell className="font-bold">{pay.month}</TableCell>
                        <TableCell>{emp?.name} {emp?.firstName}</TableCell>
                        <TableCell className="text-muted-foreground">{pay.baseSalary.toLocaleString()} CFA</TableCell>
                        <TableCell className="font-mono font-bold text-success">{pay.netSalary.toLocaleString()} CFA</TableCell>
                        <TableCell><Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">Viré le {pay.paymentDate}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedPayroll(pay); setIsPayslipViewOpen(true); }} className="text-blue-600 hover:bg-blue-50">
                            <FileText className="h-4 w-4 mr-2" /> Bulletin
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

        <TabsContent value="users" className="mt-4 space-y-4">
           {/* Section des accès informatiques (Ancien contenu) */}
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <div>
                    <CardTitle className="text-base text-destructive flex items-center gap-2"><Shield className="h-4 w-4"/> Accès au Logiciel ERP</CardTitle>
                    <CardDescription>Liste du personnel autorisé à se connecter au système Kiam Health.</CardDescription>
                 </div>
                 <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                       <Button size="sm" className="gap-2 bg-destructive hover:bg-destructive/90"><UserPlus className="h-4 w-4"/> Créer un accès</Button>
                    </DialogTrigger>
                    <DialogContent>
                       <DialogHeader>
                          <DialogTitle>Nouvel Utilisateur ERP</DialogTitle>
                       </DialogHeader>
                       <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                          <div className="space-y-2">
                             <Label>Nom complet</Label>
                             <Input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <Label>Email de connexion</Label>
                             <Input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <Label>Mot de passe provisoire</Label>
                             <Input required type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <Label>Rôle / Accréditation</Label>
                             <Select value={userForm.role} onValueChange={(v: any) => setUserForm({...userForm, role: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="doctor">Médecin</SelectItem>
                                   <SelectItem value="nurse">Infirmier / Major</SelectItem>
                                   <SelectItem value="receptionist">Réception / Caisse</SelectItem>
                                   <SelectItem value="pharmacist">Pharmacien</SelectItem>
                                   <SelectItem value="lab_tech">Laborantin</SelectItem>
                                   <SelectItem value="hr">Gestionnaire RH</SelectItem>
                                   <SelectItem value="clinic_admin">Administrateur Clinique</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                          <Button type="submit" variant="destructive" className="w-full">Valider et Envoyer les accès</Button>
                       </form>
                    </DialogContent>
                 </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom (Utilisateur)</TableHead>
                        <TableHead>Email de connexion</TableHead>
                        <TableHead>Acréditation (Rôle)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>{getRoleBadge(u.role)}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)} className="text-destructive hover:bg-destructive/5 hover:text-destructive">
                                <Lock className="h-4 w-4" />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* Visualisation Fiche de Paie (Dialog) */}
      <Dialog open={isPayslipViewOpen} onOpenChange={setIsPayslipViewOpen}>
         <DialogContent className="max-w-2xl bg-white text-slate-900 border shadow-2xl">
            <DialogHeader>
               <DialogTitle className="sr-only">Fiche de Paie</DialogTitle>
            </DialogHeader>
            {selectedPayroll && (
              <div className="space-y-6 print:space-y-6 pt-4" id="payslip-content">
                 <div className="flex justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-tight">Fiche de Paie</h2>
                       <p className="font-mono text-sm text-slate-500">{selectedPayroll.id}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-lg">Mois : {selectedPayroll.month}</p>
                       <p className="text-sm text-slate-600">Paiement : {selectedPayroll.paymentDate}</p>
                    </div>
                 </div>
                 
                 {(() => {
                   const emp = employees.find(e => e.id === selectedPayroll.employeeId);
                   return (
                     <>
                       <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                         <p className="font-bold text-lg mb-1">{emp?.name} {emp?.firstName}</p>
                         <p className="text-sm text-slate-600">Fonction : {emp?.position} ({emp?.department})</p>
                         <p className="text-sm text-slate-600">N° CNSS : {emp?.cnssNumber || 'Non renseigné'}</p>
                       </div>
                       
                       <Table className="border print:border">
                          <TableHeader className="bg-slate-100 print:bg-slate-100">
                             <TableRow>
                                <TableHead className="font-bold text-slate-900">Description</TableHead>
                                <TableHead className="text-right font-bold text-slate-900">Gains (CFA)</TableHead>
                                <TableHead className="text-right font-bold text-slate-900">Retenues (CFA)</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             <TableRow>
                                <TableCell className="font-medium">Salaire de Base</TableCell>
                                <TableCell className="text-right">{selectedPayroll.baseSalary.toLocaleString()}</TableCell>
                                <TableCell className="text-right"></TableCell>
                             </TableRow>
                             {selectedPayroll.bonuses.map((b, i) => (
                               <TableRow key={`b-${i}`}>
                                  <TableCell className="text-slate-600">{b.name}</TableCell>
                                  <TableCell className="text-right">{b.amount.toLocaleString()}</TableCell>
                                  <TableCell className="text-right"></TableCell>
                               </TableRow>
                             ))}
                             {selectedPayroll.deductions.map((d, i) => (
                               <TableRow key={`d-${i}`}>
                                  <TableCell className="text-slate-600">{d.name}</TableCell>
                                  <TableCell className="text-right"></TableCell>
                                  <TableCell className="text-right text-rose-600">-{d.amount.toLocaleString()}</TableCell>
                               </TableRow>
                             ))}
                             <TableRow className="bg-slate-50 border-t-2 border-slate-900">
                                <TableCell className="font-black text-right uppercase" colSpan={2}>Net à Payer</TableCell>
                                <TableCell className="text-right font-black text-lg bg-emerald-50 text-emerald-700">{selectedPayroll.netSalary.toLocaleString()}</TableCell>
                             </TableRow>
                          </TableBody>
                       </Table>
                     </>
                   )
                 })()}
                 <div className="pt-4 border-t border-dashed border-slate-300 text-center text-xs text-slate-400">
                    Document généré électroniquement par Kiam Health ERP. Valable sans signature pour la comptabilité interne.
                 </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4 print:hidden">
               <Button variant="outline" onClick={() => setIsPayslipViewOpen(false)}>Fermer</Button>
               <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                 <Download className="h-4 w-4" /> Exporter PDF
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
