import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  Building,
  CreditCard,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Transaction } from "@/lib/mock-data";
import { StatCard } from "@/components/StatCard";
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
import { useToast } from "@/hooks/use-toast";

export default function Accounting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'expense',
    amount: 0,
    category: 'Autres',
    description: "",
    paymentMethod: 'cash'
  });

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = () => {
    const allTransactions: Transaction[] = JSON.parse(localStorage.getItem('kiam_transactions') || '[]');
    if (user?.clinicId) {
      setTransactions(allTransactions.filter(t => t.clinicId === user.clinicId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.description || !user?.clinicId) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez remplir le montant et la description."
      });
      return;
    }

    const allTransactions: Transaction[] = JSON.parse(localStorage.getItem('kiam_transactions') || '[]');
    const transactionToAdd: Transaction = {
      id: `TR-${Date.now()}`,
      clinicId: user.clinicId,
      type: newTransaction.type as 'income' | 'expense',
      amount: Number(newTransaction.amount),
      category: newTransaction.category || 'Autres',
      date: new Date().toISOString().split('T')[0],
      description: newTransaction.description,
      paymentMethod: newTransaction.paymentMethod || 'cash'
    };

    const updatedTransactions = [...allTransactions, transactionToAdd];
    localStorage.setItem('kiam_transactions', JSON.stringify(updatedTransactions));
    setTransactions(updatedTransactions.filter(t => t.clinicId === user.clinicId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsAddDialogOpen(false);
    
    setNewTransaction({
      type: 'expense',
      amount: 0,
      category: 'Autres',
      description: "",
      paymentMethod: 'cash'
    });

    toast({
      title: "Transaction enregistrée",
      description: "Le journal comptable a été mis à jour."
    });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    "Consultation", "Pharmacie", "Laboratoire", "Salaires", "Loyer", "Électricité", "Eau", "Maintenance", "Stock", "Autres"
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Comptabilité & Trésorerie
          </h1>
          <p className="text-muted-foreground text-sm">Suivi des flux financiers de l'établissement</p>
        </div>

        <div className="flex gap-2">
           <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer une opération</DialogTitle>
                <CardDescription>Saisissez une recette ou une dépense manuelle</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type d'opération</Label>
                    <Select value={newTransaction.type} onValueChange={v => setNewTransaction({...newTransaction, type: v as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Recette (+)</SelectItem>
                        <SelectItem value="expense">Dépense (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Montant (FCFA)</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={newTransaction.amount} 
                      onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select value={newTransaction.category} onValueChange={v => setNewTransaction({...newTransaction, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Libellé / Description</Label>
                  <Input 
                    placeholder="Ex: Paiement loyer Avril, Achat réactifs..." 
                    value={newTransaction.description}
                    onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mode de règlement</Label>
                  <Select value={newTransaction.paymentMethod} onValueChange={v => setNewTransaction({...newTransaction, paymentMethod: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte / TPE</SelectItem>
                      <SelectItem value="transfer">Virement</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full mt-2" onClick={handleAddTransaction}>Valider l'écriture</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Recettes" value={`${totalIncome.toLocaleString()} CFA`} icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Total Dépenses" value={`${totalExpense.toLocaleString()} CFA`} icon={TrendingDown} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="Solde de Caisse" value={`${balance.toLocaleString()} CFA`} icon={Wallet} iconClassName="bg-blue-100 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Journal des Opérations
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-9 h-8 bg-white text-xs" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="text-[11px] uppercase">Date</TableHead>
                  <TableHead className="text-[11px] uppercase">Libellé / Catégorie</TableHead>
                  <TableHead className="text-[11px] uppercase">Mode</TableHead>
                  <TableHead className="text-right text-[11px] uppercase">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                      Aucune transaction enregistrée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-medium text-muted-foreground">{t.date}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs">{t.description}</div>
                        <div className="text-[10px] text-primary font-medium">{t.category}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] h-4 uppercase">{t.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Répartition par Catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Services Médicaux", "Salaires", "Loyers"].map(cat => {
                const amount = transactions.filter(t => t.category === cat).reduce((acc, t) => acc + t.amount, 0);
                const perc = totalIncome > 0 ? (amount / (totalIncome + totalExpense)) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{cat}</span>
                      <span className="font-mono">{amount.toLocaleString()} CFA</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(10, perc)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-6 space-y-4">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                   <Building className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-xs opacity-70">Trésorerie Actuelle</p>
                   <p className="text-xl font-black">{balance.toLocaleString()} CFA</p>
                 </div>
               </div>
               <p className="text-[10px] opacity-70 italic border-t border-white/10 pt-4">
                 Ces données reflètent les encaissements réels et les dépenses déclarées.
               </p>
               <Button variant="secondary" size="sm" className="w-full text-xs font-bold">Exporter Vers Excel</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
