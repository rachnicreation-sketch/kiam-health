import { useState, useEffect } from "react";
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  ArrowLeft,
  Trash2,
  Edit2,
  Package
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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

export default function Suppliers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.erp.suppliers(user.clinicId);
      setSuppliers(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les fournisseurs." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await api.erp.addSupplier({ ...formData, clinicId: user.clinicId });
      toast({ title: "Fournisseur ajouté", description: `${formData.name} est enregistré.` });
      setIsAddOpen(false);
      loadData();
      setFormData({ name: "", phone: "", email: "", address: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'ajout." });
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Truck className="h-8 w-8 text-emerald-600" /> Annuaire Fournisseurs
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Gestion des partenaires et des approvisionnements.</p>
          </div>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white shadow-lg shadow-emerald-200 h-11 px-6 rounded-xl border-none">
              <Plus className="w-4 h-4" /> Nouveau Fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white rounded-[2.5rem] p-8 border-none italic-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Nouveau Partenaire</DialogTitle>
              <CardDescription>Saisissez les coordonnées du fournisseur.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-6">
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Raison Sociale *</Label>
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
               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Adresse / Siège</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
               </div>
            </div>
            <div className="pt-6">
               <Button className="w-full h-14 bg-emerald-600 font-black text-white rounded-2xl shadow-xl shadow-emerald-100" onClick={handleAdd}>ENREGISTRER</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
         <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="relative w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                  placeholder="Rechercher un fournisseur..." 
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
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Fournisseur</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localisation</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Commandes</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right p-6">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={5} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center opacity-20">
                             <Truck className="h-16 w-16 mb-4" />
                             <p className="font-black uppercase tracking-widest">Aucun fournisseur</p>
                          </div>
                       </TableCell>
                    </TableRow>
                  ) : filtered.map((supplier) => (
                     <TableRow key={supplier.id} className="group hover:bg-slate-50/50 border-slate-100">
                        <TableCell className="p-6">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs uppercase">
                                 {supplier.name.substring(0, 2)}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{supplier.name}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">REF: {supplier.id}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600"><Phone className="h-3 w-3" /> {supplier.phone || 'N/A'}</div>
                              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400"><Mail className="h-3 w-3" /> {supplier.email || 'N/A'}</div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                              <MapPin className="h-3.5 w-3.5" /> {supplier.address || 'N/A'}
                           </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <Badge variant="outline" className="border-slate-200 text-[10px] font-bold gap-1">
                              <Package className="h-3 w-3" /> 0 livraisons
                           </Badge>
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
