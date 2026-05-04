import { useState, useEffect } from "react";
import { 
  TrendingDown, 
  Plus, 
  Search, 
  Receipt, 
  Calendar,
  ArrowLeft,
  Trash2,
  Filter,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Expenses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: "",
    category: "Loyer",
    description: "",
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ["Loyer", "Salaires", "Électricité/Eau", "Transport", "Marketing", "Fournitures Bureau", "Maintenance", "Autres"];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.erp.expenses(user.clinicId);
      setExpenses(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les dépenses." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.erp.addExpense({ ...formData, clinicId: user.clinicId });
      toast({ title: "Dépense enregistrée", description: "La charge a été ajoutée au journal." });
      setIsAddOpen(false);
      loadData();
      setFormData({ amount: "", category: "Loyer", description: "", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'ajout." });
    }
  };

  const filtered = expenses.filter(e => 
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filtered.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-rose-600" /> Journal des Dépenses
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Suivi des charges et frais fixes de l'entreprise.</p>
          </div>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700 font-bold gap-2 text-white shadow-lg shadow-rose-200 h-11 px-6 rounded-xl border-none">
              <Plus className="w-4 h-4" /> Nouvelle Charge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-8 border-none italic-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Saisir une Dépense</DialogTitle>
              <CardDescription>Enregistrez un frais lié à l'activité.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-6">
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Montant (CFA) *</Label>
                  <Input type="number" className="h-12 rounded-xl bg-slate-50 border-none font-black text-lg" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                     <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="Choisir une catégorie" />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-none shadow-2xl">
                        {categories.map(cat => <SelectItem key={cat} value={cat} className="font-medium">{cat}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description / Détails</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Ex: Paiement facture SNE Mars..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Date</Label>
                  <Input type="date" className="h-12 rounded-xl bg-slate-50 border-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
            </div>
            <div className="pt-6">
               <Button className="w-full h-14 bg-rose-600 font-black text-white rounded-2xl shadow-xl shadow-rose-100 border-none" onClick={handleAdd}>ENREGISTRER LA CHARGE</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-xl bg-rose-600 text-white rounded-[2rem]">
            <CardContent className="p-8 space-y-2">
               <BarChart3 className="h-10 w-10 text-rose-200 mb-4" />
               <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Total Charges (Période)</p>
               <h2 className="text-4xl font-black">{totalExpenses.toLocaleString()} <span className="text-lg">CFA</span></h2>
            </CardContent>
         </Card>
         <Card className="border-none shadow-xl bg-white rounded-[2rem]">
            <CardContent className="p-8 space-y-2">
               <Receipt className="h-10 w-10 text-slate-300 mb-4" />
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nombre d'opérations</p>
               <h2 className="text-4xl font-black text-slate-900">{filtered.length}</h2>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
         <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                     placeholder="Rechercher une charge..." 
                     className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <Button variant="outline" className="rounded-xl border-slate-200 gap-2 font-bold h-11 px-6"><Filter className="h-4 w-4" /> Filtrer par Date</Button>
            </div>
         </CardHeader>
         <CardContent className="p-0 border-none">
            <Table className="border-none">
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Date</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right p-6">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center opacity-20">
                             <TrendingDown className="h-16 w-16 mb-4" />
                             <p className="font-black uppercase tracking-widest">Aucune dépense enregistrée</p>
                          </div>
                       </TableCell>
                    </TableRow>
                  ) : filtered.map((expense) => (
                     <TableRow key={expense.id} className="group hover:bg-slate-50/50 border-slate-100">
                        <TableCell className="p-6">
                           <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(expense.date).toLocaleDateString()}
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] uppercase font-black px-2 py-0.5">
                              {expense.category}
                           </Badge>
                        </TableCell>
                        <TableCell>
                           <p className="text-xs font-bold text-slate-600 uppercase leading-none">{expense.description || 'N/A'}</p>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="font-mono text-sm font-black text-rose-600">
                              -{Number(expense.amount).toLocaleString()} <span className="text-[9px]">CFA</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right p-6">
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </CardContent>
      </Card>
    </div>
  );
}
