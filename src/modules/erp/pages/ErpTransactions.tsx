import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Search, 
  Download, 
  Filter, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Banknote,
  History
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

export default function ErpTransactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await apiRequest(`erp.php?action=list_sales&clinicId=${user.clinicId}`);
      setTransactions(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger l'historique." });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = transactions.filter(tx => 
     tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     tx.id?.toString().includes(searchTerm) ||
     tx.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 border-none">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="border-none">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 border-none flex items-center gap-3">
              <History className="h-8 w-8 text-indigo-600" /> Journal des Opérations
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium border-none italic-none">Historique exhaustif des ventes et mouvements financiers.</p>
          </div>
        </div>
        <div className="flex gap-2 border-none">
          <Button variant="outline" className="font-bold gap-2 border-slate-200 rounded-xl h-11 px-6 shadow-sm border-none">
             <Download className="w-4 h-4" /> Exporter (Excel/PDF)
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
         <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="relative w-80 border-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Rechercher une transaction..." 
                    className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex gap-2 border-none">
                  <Badge variant="outline" className="rounded-lg border-slate-200 px-3 py-1 font-bold text-[10px] uppercase">Tout</Badge>
                  <Badge variant="outline" className="rounded-lg border-slate-200 px-3 py-1 font-bold text-[10px] uppercase opacity-50">Ventes</Badge>
                  <Badge variant="outline" className="rounded-lg border-slate-200 px-3 py-1 font-bold text-[10px] uppercase opacity-50">Dépenses</Badge>
               </div>
            </div>
         </CardHeader>
         <CardContent className="p-0 border-none">
            <Table className="border-none">
               <TableHeader className="bg-slate-50/50 border-none">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Transaction</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Heure</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</TableHead>
                     <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-6">Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody className="border-none">
                  {filtered.length === 0 ? (
                     <TableRow className="hover:bg-transparent border-none">
                        <TableCell colSpan={6} className="h-64 text-center border-none">
                           <div className="flex flex-col items-center justify-center opacity-20 border-none italic-none">
                              <Receipt className="h-16 w-16 mb-4" />
                              <p className="font-black text-lg uppercase tracking-widest">AUCUNE TRANSACTION TROUVÉE</p>
                           </div>
                        </TableCell>
                     </TableRow>
                  ) : (
                     filtered.map((tx) => (
                        <TableRow key={tx.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100 italic-none">
                           <TableCell className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} transition-colors font-bold text-xs`}>
                                    #{tx.id}
                                 </div>
                                 <div className="border-none">
                                    <p className="text-sm font-black text-slate-900 uppercase border-none leading-none mb-1">{tx.description}</p>
                                    <p className="text-[10px] text-slate-500 border-none leading-none">Réf: POS-{tx.id * 7}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="text-xs font-bold text-slate-600 border-none">
                                 {new Date(tx.created_at).toLocaleDateString()}
                                 <span className="block text-[10px] text-slate-400 font-medium">À {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2 border-none">
                                 {tx.payment_method === 'cash' ? <Banknote className="h-3 w-3 text-slate-400" /> : <CreditCard className="h-3 w-3 text-slate-400" />}
                                 <span className="text-[10px] font-black uppercase text-slate-600 border-none">{tx.payment_method}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right">
                              <div className={`font-mono text-sm font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {tx.type === 'income' ? '+' : '-'} {Number(tx.amount).toLocaleString()} <span className="text-[9px]">CFA</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              {tx.type === 'income' ? (
                                 <Badge className="bg-emerald-100 text-emerald-600 border-none text-[8px] uppercase font-black flex items-center gap-1 w-fit">
                                    <ArrowDownRight className="h-3 w-3" /> Entrée
                                 </Badge>
                              ) : (
                                 <Badge className="bg-rose-100 text-rose-600 border-none text-[8px] uppercase font-black flex items-center gap-1 w-fit">
                                    <ArrowUpRight className="h-3 w-3" /> Sortie
                                 </Badge>
                              )}
                           </TableCell>
                           <TableCell className="text-right p-6">
                              <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] uppercase font-black px-3 py-1">Compété</Badge>
                           </TableCell>
                        </TableRow>
                     ))
                  )}
               </TableBody>
            </Table>
         </CardContent>
         <CardFooter className="p-6 border-t bg-slate-50/50 italic-none">
            <div className="w-full flex justify-between items-center italic-none">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none border-none">Total: {filtered.length} opérations</p>
               <p className="text-[10px] font-black text-slate-900 border-none">PIÈCE COMPTABLE SÉCURISÉE</p>
            </div>
         </CardFooter>
      </Card>
    </div>
  );
}
