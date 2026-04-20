import { useState, useEffect } from "react";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Truck, 
  Warehouse,
  AlertCircle,
  Receipt,
  RotateCcw,
  Plus,
  Search,
  ArrowUpDown,
  Box
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

const salesData = [
  { day: "Lun", sales: 450000 },
  { day: "Mar", sales: 520000 },
  { day: "Mer", sales: 380000 },
  { day: "Jeu", sales: 610000 },
  { day: "Ven", sales: 850000 },
  { day: "Sam", sales: 1200000 },
  { day: "Dim", sales: 900000 },
];

export default function ErpDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "Général",
    stock: "0",
    price_buy: "0",
    price_sell: "0",
    unit: "unité"
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const [invData, statData] = await Promise.all([
        api.inventory.list(user.clinicId),
        api.inventory.stats(user.clinicId)
      ]);
      setInventory(invData);
      setStats(statData);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger l'inventaire." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      await api.inventory.add({ ...productForm, clinicId: user.clinicId });
      toast({ title: "Produit ajouté", description: `${productForm.name} est maintenant en stock.` });
      setIsAddProductOpen(false);
      loadData();
      setProductForm({ name: "", category: "Général", stock: "0", price_buy: "0", price_sell: "0", unit: "unité" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'ajout du produit." });
    }
  };

  const filteredInventory = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 border-none">
            Kiam ERP & Shop
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium italic-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Gestion Commerciale Intégrée
          </p>
        </div>
        <div className="flex gap-2">
           <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
             <DialogTrigger asChild>
               <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2">
                 <Plus className="h-4 w-4" /> Nouveau Produit
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Ajouter à l'Inventaire</DialogTitle>
                 <CardDescription>Enregistrez un nouvel article dans le stock global</CardDescription>
               </DialogHeader>
               <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Désignation Produit *</Label>
                    <Input placeholder="Ex: Ciment 50kg, Ecran 24'..." value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantité Initiale</Label>
                      <Input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unité</Label>
                      <Input placeholder="Sac, Litre, Unité..." value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix d'Achat</Label>
                      <Input type="number" value={productForm.price_buy} onChange={e => setProductForm({...productForm, price_buy: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix de Vente</Label>
                      <Input type="number" value={productForm.price_sell} onChange={e => setProductForm({...productForm, price_sell: e.target.value})} />
                    </div>
                  </div>
                  <Button className="w-full bg-emerald-600 font-bold" onClick={handleAddProduct}>Valider l'Entrée</Button>
               </div>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Chiffre d'Affaires" value="0 CFA" change="Aujourd'hui" changeType="neutral" icon={TrendingUp} className="bg-white shadow-sm border-none" />
        <StatCard title="Total Produits" value={stats.total_items || "0"} change="En stock" changeType="positive" icon={Box} iconClassName="bg-blue-100 text-blue-600" className="bg-white shadow-sm border-none" />
        <StatCard title="Alertes Stock" value={stats.low_stock || "0"} change="Seuil critique" changeType="negative" icon={AlertCircle} iconClassName="bg-amber-100 text-amber-600" className="bg-white shadow-sm border-none" />
        <StatCard title="Ruptures" value={stats.out_of_stock || "0"} change="À commander" changeType="negative" icon={Warehouse} iconClassName="bg-rose-100 text-rose-600" className="bg-white shadow-sm border-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card className="border-none shadow-md bg-white">
              <CardHeader className="bg-slate-50 border-b pb-4">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Gestion des Stocks</CardTitle>
                    <div className="relative w-full md:w-80">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <Input 
                          placeholder="Chercher produit..." 
                          className="pl-10 h-10 border-slate-200 bg-white" 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                       />
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-slate-50/50">
                       <TableRow>
                          <TableHead className="text-[11px] font-black uppercase">Article</TableHead>
                          <TableHead className="text-[11px] font-black uppercase">Stock</TableHead>
                          <TableHead className="text-[11px] font-black uppercase text-right">Prix Vente</TableHead>
                          <TableHead className="text-[11px] font-black uppercase">Statut</TableHead>
                          <TableHead className="text-right text-[11px] font-black uppercase">Action</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {filteredInventory.length === 0 ? (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">Inventaire vide</TableCell>
                         </TableRow>
                       ) : (
                         filteredInventory.map(item => (
                           <TableRow key={item.id} className="hover:bg-slate-50 transition-colors italic-none">
                              <TableCell>
                                 <div className="font-bold text-slate-900 uppercase text-xs">{item.name}</div>
                                 <div className="text-[10px] text-slate-400 font-mono italic-none">{item.sku}</div>
                              </TableCell>
                              <TableCell className="font-mono font-bold text-sm">
                                 {item.stock} <span className="text-[10px] text-slate-400">{item.unit}</span>
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                 {Number(item.price_sell).toLocaleString()} <span className="text-[10px]">CFA</span>
                              </TableCell>
                              <TableCell>
                                 {Number(item.stock) <= Number(item.threshold) ? (
                                   <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50 text-[10px] uppercase">Alerte Stock</Badge>
                                 ) : (
                                   <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 text-[10px] uppercase">Normal</Badge>
                                 )}
                              </TableCell>
                              <TableCell className="text-right">
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600"><Plus className="w-4 h-4" /></Button>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600"><RotateCcw className="w-4 h-4" /></Button>
                              </TableCell>
                           </TableRow>
                         ))
                       )}
                    </TableBody>
                 </Table>
              </CardContent>
           </Card>

           <Card className="border-none shadow-md bg-white overflow-hidden">
              <CardHeader className="pb-2 border-b bg-slate-50">
                <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-slate-500 italic-none">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  Performances Commerciales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9499AE' }} />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-md bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Package className="w-24 h-24" /></div>
              <CardHeader>
                 <CardTitle className="text-lg font-black text-slate-900 border-none">Actions Ventes</CardTitle>
                 <CardDescription>Directement via le stock</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black gap-2 text-lg shadow-xl shadow-indigo-100">
                    <ShoppingCart className="w-5 h-5" /> Nouvelle Vente
                 </Button>
                 <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="flex flex-col h-20 gap-2 border-slate-100 hover:bg-slate-50 rounded-2xl">
                       <Truck className="h-5 w-5 text-amber-500" />
                       <span className="text-[10px] font-black uppercase">Logistique</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-20 gap-2 border-slate-100 hover:bg-slate-50 rounded-2xl">
                       <Users className="h-5 w-5 text-indigo-500" />
                       <span className="text-[10px] font-black uppercase">Clients</span>
                    </Button>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-md bg-rose-50 border border-rose-100">
              <CardHeader className="pb-2">
                 <CardTitle className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Ruptures Imminentes
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 {inventory.filter(p => Number(p.stock) <= Number(p.threshold)).slice(0, 3).map(item => (
                   <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-rose-100">
                      <div>
                         <p className="text-xs font-black text-slate-900 uppercase">{item.name}</p>
                         <p className="text-[10px] text-rose-500 font-bold">Reste: {item.stock} {item.unit}</p>
                      </div>
                      <Button size="sm" className="h-7 text-[10px] bg-rose-600 font-bold">Commander</Button>
                   </div>
                 ))}
                 {inventory.filter(p => Number(p.stock) <= Number(p.threshold)).length === 0 && (
                   <p className="text-xs text-rose-400 italic text-center py-4 italic-none">Aucune alerte critique</p>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
