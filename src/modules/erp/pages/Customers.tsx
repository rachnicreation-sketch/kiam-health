import { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Award, 
  CreditCard,
  ArrowLeft,
  Trash2,
  Edit2
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

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.erp.customers(user.clinicId);
      setCustomers(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les clients." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.erp.addCustomer({ ...formData, clinicId: user.clinicId });
      toast({ title: "Client ajouté", description: `${formData.name} est enregistré.` });
      setIsAddOpen(false);
      loadData();
      setFormData({ name: "", phone: "", email: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'ajout." });
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" /> Gestion des Clients
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Suivi de la fidélité et des comptes clients.</p>
          </div>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 text-white shadow-lg shadow-blue-200 h-11 px-6 rounded-xl border-none">
              <Plus className="w-4 h-4" /> Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-8 border-none italic-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Enregistrer un Client</DialogTitle>
              <CardDescription>Créez un profil pour le suivi de fidélité.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-6">
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nom Complet *</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Téléphone</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
               </div>
            </div>
            <div className="pt-6">
               <Button className="w-full h-14 bg-blue-600 font-black text-white rounded-2xl shadow-xl shadow-blue-100" onClick={handleAdd}>ENREGISTRER LE CLIENT</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2rem]">
            <CardContent className="p-8 space-y-2">
               <Award className="h-10 w-10 text-blue-200 mb-4" />
               <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Clients Actifs</p>
               <h2 className="text-4xl font-black">{customers.length}</h2>
            </CardContent>
         </Card>
         <Card className="border-none shadow-xl bg-white rounded-[2rem]">
            <CardContent className="p-8 space-y-2">
               <CreditCard className="h-10 w-10 text-emerald-500 mb-4" />
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Crédits</p>
               <h2 className="text-4xl font-black text-slate-900">0 <span className="text-lg">CFA</span></h2>
            </CardContent>
         </Card>
         <Card className="border-none shadow-xl bg-white rounded-[2rem]">
            <CardContent className="p-8 space-y-2">
               <Award className="h-10 w-10 text-amber-500 mb-4" />
               <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Points de Fidélité</p>
               <h2 className="text-4xl font-black text-slate-900">
                  {customers.reduce((acc, c) => acc + (c.loyalty_points || 0), 0)}
               </h2>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
         <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="relative w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                  placeholder="Rechercher un client..." 
                  className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
         </CardHeader>
         <CardContent className="p-0 border-none">
            <Table className="border-none">
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Client</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fidélité</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solde Crédit</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right p-6">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filtered.map((customer) => (
                     <TableRow key={customer.id} className="group hover:bg-slate-50/50 border-slate-100">
                        <TableCell className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase">
                                 {customer.name.substring(0, 2)}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase">{customer.name}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">ID: {customer.id}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Phone className="h-3 w-3" /> {customer.phone || 'N/A'}</div>
                              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400"><Mail className="h-3 w-3" /> {customer.email || 'N/A'}</div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge className="bg-amber-100 text-amber-600 border-none text-[9px] uppercase font-black px-2 py-0.5">
                              {customer.loyalty_points || 0} pts
                           </Badge>
                        </TableCell>
                        <TableCell>
                           <div className={`font-mono text-sm font-black ${Number(customer.debt_balance) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {Number(customer.debt_balance || 0).toLocaleString()} <span className="text-[9px]">CFA</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right p-6">
                           <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><Edit2 className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                           </div>
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
