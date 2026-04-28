import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  FileText,
  UserCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const { user, isPresentationMode } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  // Strict Role Checking
  const isFinance = user?.role === 'school_finance';
  const isDirection = user?.role === 'school_direction';
  const isAdminOrScolarite = ['school_admin', 'school_scolarite', 'school_teacher'].includes(user?.role || '');
  const isGlobalAdmin = user?.role === 'clinic_admin' || user?.role === 'saas_admin';

  useEffect(() => {
    if (isPresentationMode) {
      // Mock some data for presentation
      setPayments([
        { id: 'PAY-001', first_name: 'Jean', name: 'Mabiala', amount: 125000, payment_date: '2026-04-28', type: 'Scolarité' },
        { id: 'PAY-002', first_name: 'Sarah', name: 'Okombi', amount: 45000, payment_date: '2026-04-27', type: 'Inscription' },
      ]);
      setStudents(DUMMY_STUDENTS);
    } else if (user?.clinicId) {
      loadData();
    }
  }, [user, isPresentationMode]);

  if (isAdminOrScolarite && !isGlobalAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 italic">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="h-10 w-10 opacity-10" />
        </div>
        <p>Accès Refusé. La gestion financière est réservée au service Comptabilité.</p>
      </div>
    );
  }

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [payData, studData] = await Promise.all([
        apiRequest("school.php?action=list_payments"),
        apiRequest("school.php?action=list_students")
      ]);
      setPayments(payData);
      setStudents(studData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des paiements échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    try {
      await apiRequest("school.php?action=add_payment", {
        method: "POST",
        body: JSON.stringify({ ...paymentForm, clinicId: user.clinicId })
      });
      toast({ title: "Paiement enregistré", description: "Le reçu a été généré avec succès." });
      setIsAddPaymentOpen(false);
      loadData();
      setPaymentForm({
        student_id: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        type: "Scolarité",
        method: "Espèces",
        status: "paid"
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'enregistrement." });
    }
  };

  const [paymentForm, setPaymentForm] = useState({
    student_id: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    type: "Scolarité",
    method: "Espèces",
    status: "paid"
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2 sm:p-6 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-indigo-600" /> Scolarité & Finances
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Suivi des encaissements et gestion des impayés.</p>
        </div>
        {(isFinance || isGlobalAdmin) && (
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
                <Plus className="w-4 h-4" /> Encaisser Frais
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enregistrer un Paiement</DialogTitle>
                <CardDescription>Saisissez les détails du règlement</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Élève *</Label>
                  <Select value={paymentForm.student_id} onValueChange={v => setPaymentForm({...paymentForm, student_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner l'élève..." /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Montant (CFA) *</Label>
                     <Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Date</Label>
                     <Input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                  <Label>Type de Frais</Label>
                  <Select value={paymentForm.type} onValueChange={v => setPaymentForm({...paymentForm, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scolarité">Mensualité Scolarité</SelectItem>
                      <SelectItem value="Inscription">Inscription / Dossier</SelectItem>
                      <SelectItem value="Examen">Frais d'Examen</SelectItem>
                      <SelectItem value="Uniforme">Uniforme & Fournitures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mode de Règlement</Label>
                  <Select value={paymentForm.method} onValueChange={v => setPaymentForm({...paymentForm, method: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Espèces">Espèces</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money (Airtel/MTN)</SelectItem>
                      <SelectItem value="Virement">Virement Bancaire</SelectItem>
                      <SelectItem value="Chèque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-indigo-600 mt-4" onClick={handleAddPayment}>Valider & Imprimer Reçu</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Total Encaissé</p>
                  <p className="text-lg font-black text-slate-900">1.250.000 CFA</p>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Restes à Percevoir</p>
                  <p className="text-lg font-black text-slate-900">450.000 CFA</p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b pb-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Rechercher par élève ou N° reçu..." className="pl-10 h-10 border-slate-200" />
             </div>
             <Button variant="ghost" size="sm" className="font-bold text-slate-500"><Filter className="w-4 h-4 mr-2" /> Filtrer</Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader className="bg-slate-50/50">
               <TableRow>
                 <TableHead className="text-[11px] font-black uppercase tracking-widest pl-6">Élève</TableHead>
                 <TableHead className="text-[11px] font-black uppercase tracking-widest text-center">Date</TableHead>
                 <TableHead className="text-[11px] font-black uppercase tracking-widest">Type</TableHead>
                 <TableHead className="text-[11px] font-black uppercase tracking-widest text-right">Montant</TableHead>
                 <TableHead className="text-[11px] font-black uppercase tracking-widest text-center">Status</TableHead>
                 <TableHead className="text-right text-[11px] font-black uppercase tracking-widest pr-6">Action</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {payments.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">Aucun paiement enregistré</TableCell>
                 </TableRow>
               ) : (
                 payments.map(pay => (
                   <TableRow key={pay.id} className="hover:bg-slate-50 transition-colors">
                     <TableCell className="pl-6">
                        <div className="font-bold text-slate-900">{pay.first_name} {pay.name}</div>
                        <div className="text-[9px] font-mono text-slate-400 uppercase">{pay.id}</div>
                     </TableCell>
                     <TableCell className="text-center text-xs text-slate-600">{pay.payment_date}</TableCell>
                     <TableCell><Badge variant="outline" className="text-[10px] uppercase font-bold">{pay.type}</Badge></TableCell>
                     <TableCell className="text-right font-black text-slate-900">{Number(pay.amount).toLocaleString()} CFA</TableCell>
                     <TableCell className="text-center">
                        <Badge className="bg-emerald-500">Complet</Badge>
                     </TableCell>
                     <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" title="Imprimer Reçu">
                           <FileText className="w-4 h-4" />
                        </Button>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
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
