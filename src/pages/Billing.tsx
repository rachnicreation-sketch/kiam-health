import { useState, useEffect } from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  User,
  CreditCard,
  DollarSign,
  Ban,
  Trash2,
  FileText,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { Patient, Invoice, Transaction, Clinic } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { DocumentPreview } from "@/components/DocumentPreview";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<{
    patientId: string;
    items: { description: string; amount: number }[];
    status: 'paid' | 'pending';
    paymentMethod: 'cash' | 'card' | 'transfer';
  }>({
    patientId: "",
    items: [{ description: "Consultation générale", amount: 5000 }],
    status: 'paid',
    paymentMethod: 'cash'
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    const allInvoices: Invoice[] = JSON.parse(localStorage.getItem('kiam_invoices') || '[]');
    const allPatients: Patient[] = JSON.parse(localStorage.getItem('kiam_patients') || '[]');
    const allClinics: Clinic[] = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
    
    if (user?.clinicId) {
      setInvoices(allInvoices.filter(i => i.clinicId === user.clinicId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setPatients(allPatients.filter(p => p.clinicId === user.clinicId));
      setClinic(allClinics.find(c => c.id === user.clinicId) || null);
    }
  };

  const addItem = () => {
    setForm({...form, items: [...form.items, { description: "", amount: 0 }]});
  };

  const removeItem = (index: number) => {
    const newItems = [...form.items];
    newItems.splice(index, 1);
    setForm({...form, items: newItems});
  };

  const updateItem = (index: number, field: 'description' | 'amount', value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: field === 'amount' ? Number(value) : value };
    setForm({...form, items: newItems});
  };

  const calculateTotal = () => {
    return form.items.reduce((acc, item) => acc + item.amount, 0);
  };

  const handleSaveInvoice = () => {
    if (!form.patientId || form.items.some(i => !i.description || i.amount <= 0) || !user?.clinicId) {
      toast({
        variant: "destructive",
        title: "Champs invalides",
        description: "Veuillez remplir correctement tous les champs de la facture."
      });
      return;
    }

    const allInvoices: Invoice[] = JSON.parse(localStorage.getItem('kiam_invoices') || '[]');
    const total = calculateTotal();
    const newInvoice: Invoice = {
      id: `F-${new Date().getFullYear()}-${(allInvoices.length + 1).toString().padStart(4, '0')}`,
      clinicId: user.clinicId,
      patientId: form.patientId,
      date: new Date().toISOString().split('T')[0],
      items: form.items,
      total: total,
      status: form.status,
      paymentMethod: form.paymentMethod
    };

    const updatedInvoices = [...allInvoices, newInvoice];
    localStorage.setItem('kiam_invoices', JSON.stringify(updatedInvoices));

    // If paid, create a transaction for accounting
    if (form.status === 'paid') {
      const allTransactions: Transaction[] = JSON.parse(localStorage.getItem('kiam_transactions') || '[]');
      const patient = patients.find(p => p.id === form.patientId);
      const newTransaction: Transaction = {
        id: `TR-${Date.now()}`,
        clinicId: user.clinicId,
        type: 'income',
        amount: total,
        category: 'Services Médicaux',
        date: newInvoice.date,
        description: `Paiement Facture ${newInvoice.id} - ${patient?.name}`,
        paymentMethod: form.paymentMethod
      };
      localStorage.setItem('kiam_transactions', JSON.stringify([...allTransactions, newTransaction]));
    }

    setInvoices(updatedInvoices.filter(i => i.clinicId === user.clinicId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsAddDialogOpen(false);
    toast({
      title: "Facture enregistrée",
      description: `La facture ${newInvoice.id} a été créée avec succès.`
    });

    // Reset form
    setForm({
      patientId: "",
      items: [{ description: "Consultation générale", amount: 5000 }],
      status: 'paid',
      paymentMethod: 'cash'
    });
  };

  const openPreview = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsPreviewOpen(true);
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((acc, i) => acc + i.total, 0);

  const filteredInvoices = invoices.filter(inv => {
    const patient = patients.find(p => p.id === inv.patientId);
    return inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
           patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Facturation & Recettes
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des règlements et honoraires</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Émettre une Facture
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Nouvelle Pièce de Caisse
              </DialogTitle>
              <CardDescription>Sélectionnez un patient et détaillez la prestation</CardDescription>
            </DialogHeader>

            <div className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient *</Label>
                  <Select value={form.patientId} onValueChange={v => setForm({...form, patientId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} {p.firstName} ({p.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut Initial</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Payé (Encaissé)</SelectItem>
                      <SelectItem value="pending">En attente (Dette)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider">Détails Prestation</Label>
                  <Button variant="ghost" size="sm" onClick={addItem} className="h-8 text-[10px] gap-1 text-primary">
                    <Plus className="h-3 w-3" /> Ajouter une ligne
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end group">
                      <div className="flex-1 space-y-1">
                        <Input 
                          placeholder="Ex: Consultation, Examen Bio..." 
                          className="h-9"
                          value={item.description}
                          onChange={e => updateItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <Input 
                          type="number" 
                          placeholder="Montant" 
                          className="h-9 font-mono"
                          value={item.amount}
                          onChange={e => updateItem(index, 'amount', e.target.value)}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeItem(index)}
                        disabled={form.items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label>Mode de Paiement</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={form.paymentMethod === 'cash' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setForm({...form, paymentMethod: 'cash'})}
                      className="h-8 text-[10px]"
                    >Espèces</Button>
                    <Button 
                      variant={form.paymentMethod === 'card' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setForm({...form, paymentMethod: 'card'})}
                      className="h-8 text-[10px]"
                    >TPE / Mobile</Button>
                    <Button 
                      variant={form.paymentMethod === 'transfer' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setForm({...form, paymentMethod: 'transfer'})}
                      className="h-8 text-[10px]"
                    >Virement</Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Total à payer</p>
                  <p className="text-2xl font-black text-primary font-mono">{calculateTotal().toLocaleString()} <span className="text-xs">FCFA</span></p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSaveInvoice} className="px-8">{form.status === 'paid' ? 'Encaisser & Valider' : 'Valider la Dette'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Recettes Encaissées" value={`${totalPaid.toLocaleString()} CFA`} icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-600" changeType="positive" change="Mois en cours" />
        <StatCard title="Reste à Recouvrer" value={`${totalPending.toLocaleString()} CFA`} icon={Clock} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Factures de Santé" value={String(invoices.length)} icon={CheckCircle} iconClassName="bg-blue-100 text-blue-600" />
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par N° ou Patient..." 
              className="pl-10 h-10 bg-white" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="w-[120px]">Référence</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Montant Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                    Aucune facture enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const patient = patients.find(p => p.id === inv.patientId);
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-[11px] font-bold text-primary">{inv.id}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs uppercase">{patient?.name} {patient?.firstName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{patient?.id}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{inv.date}</TableCell>
                      <TableCell className="font-mono font-bold text-sm">
                        {inv.total.toLocaleString()} <span className="text-[10px] text-muted-foreground">CFA</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <Badge variant={inv.status === "paid" ? "default" : "outline"} className={inv.status === "paid" ? "bg-emerald-600" : "border-amber-500 text-amber-600"}>
                            {inv.status === "paid" ? "Payée" : "En attente"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openPreview(inv)} className="h-8 gap-1 text-primary">
                          <Eye className="h-4 w-4" /> Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DocumentPreview 
        type="invoice" 
        isOpen={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen} 
        data={selectedInvoice} 
        clinic={clinic} 
        patient={patients.find(p => p.id === selectedInvoice?.patientId) || null} 
      />
    </div>
  );
}
