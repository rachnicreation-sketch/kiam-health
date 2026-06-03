import { useState, useEffect } from "react";
import { 
  FileText, Search, Plus, ArrowLeft, RefreshCw, 
  Send, CheckCircle, XCircle, Clock, Truck, Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CommercialDocs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [deliverySlips, setDeliverySlips] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Quote Create Form State
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [qCustomer, setQCustomer] = useState("");
  const [qItems, setQItems] = useState<any[]>([{ product_name: "", quantity: 1, unit_price: 0 }]);
  const [qNotes, setQNotes] = useState("");

  // Delivery Slip Create Form State
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [delCustomer, setDelCustomer] = useState("");
  const [delItems, setDelItems] = useState<any[]>([{ product_name: "", qty_ordered: 1, qty_shipped: 1 }]);
  const [delNotes, setDelNotes] = useState("");

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotesData, slipsData, invsData] = await Promise.all([
        api.erp.quotesList(user!.clinicId),
        api.erp.deliverySlipsList(user!.clinicId),
        api.procurement.invList(user!.clinicId)
      ]);
      setQuotes(quotesData);
      setDeliverySlips(slipsData);
      setInvoices(invsData);
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les documents commerciaux." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    try {
      const items = qItems.map(it => ({
        ...it,
        total_price: Number(it.quantity) * Number(it.unit_price)
      }));
      const total_ht = items.reduce((sum, it) => sum + it.total_price, 0);
      const total_ttc = total_ht * 1.18; // 18% standard VAT

      const payload = {
        clinicId: user!.clinicId,
        customer_name: qCustomer,
        total_ht,
        tax_rate: 18,
        total_ttc,
        notes: qNotes,
        items
      };

      const res = await api.erp.quoteCreate(payload);
      toast({ title: "Devis créé", description: `Numéro: ${res.number}` });
      setIsQuoteOpen(false);
      // Reset
      setQCustomer("");
      setQItems([{ product_name: "", quantity: 1, unit_price: 0 }]);
      setQNotes("");
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Création échouée." });
    }
  };

  const handleUpdateQuoteStatus = async (id: string, status: string) => {
    try {
      await api.erp.quoteUpdateStatus({ clinicId: user!.clinicId, id, status });
      toast({ title: "Statut mis à jour", description: `Le devis est désormais : ${status}` });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Mise à jour échouée." });
    }
  };

  const handleCreateDeliverySlip = async () => {
    try {
      const payload = {
        clinicId: user!.clinicId,
        customer_name: delCustomer,
        notes: delNotes,
        items: delItems
      };
      const res = await api.erp.deliverySlipCreate(payload);
      toast({ title: "Bon de livraison créé", description: `Numéro: ${res.number}` });
      setIsDelOpen(false);
      setDelCustomer("");
      setDelItems([{ product_name: "", qty_ordered: 1, qty_shipped: 1 }]);
      setDelNotes("");
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Création échouée." });
    }
  };

  const handleUpdateSlipStatus = async (id: string, status: string) => {
    try {
      await api.erp.deliverySlipUpdateStatus({ clinicId: user!.clinicId, id, status });
      toast({ title: "Statut de livraison mis à jour", description: `Le colis est désormais : ${status}` });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Mise à jour échouée." });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-indigo-600" /> Documents Commerciaux
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Suivi global et cycle de vie des Devis, Factures et Livraisons.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold h-11 px-6 shadow-sm" onClick={loadData}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="quotes" className="space-y-6">
        <TabsList className="bg-slate-100 rounded-xl p-1 w-fit">
          <TabsTrigger value="quotes" className="rounded-lg font-bold text-xs uppercase px-4 py-2">Gestion Devis</TabsTrigger>
          <TabsTrigger value="delivery" className="rounded-lg font-bold text-xs uppercase px-4 py-2">Bons de livraison</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg font-bold text-xs uppercase px-4 py-2">Factures Fournisseurs</TabsTrigger>
        </TabsList>

        {/* Quotes tab */}
        <TabsContent value="quotes">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase text-slate-800">Suivi des Devis</h3>
              <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 text-white shadow-lg h-11 px-6 rounded-xl border-none">
                    <Plus className="w-4 h-4" /> Nouveau Devis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white rounded-[2rem] p-8 border-none flex flex-col h-[75vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Créer un Devis Client</DialogTitle>
                    <DialogDescription>Rédiger une offre commerciale.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 my-4 flex-1 overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Nom du client</Label>
                      <Input placeholder="Client..." value={qCustomer} onChange={e=>setQCustomer(e.target.value)} className="h-11 rounded-xl" />
                    </div>

                    <div className="space-y-2 pt-4">
                      <Label className="text-xs font-bold uppercase text-slate-500">Articles</Label>
                      {qItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                          <Input 
                            placeholder="Produit..." 
                            value={item.product_name} 
                            onChange={e => {
                              const newItems = [...qItems];
                              newItems[idx].product_name = e.target.value;
                              setQItems(newItems);
                            }}
                            className="col-span-6 h-10 rounded-lg text-xs" 
                          />
                          <Input 
                            type="number" 
                            placeholder="Qty" 
                            value={item.quantity} 
                            onChange={e => {
                              const newItems = [...qItems];
                              newItems[idx].quantity = e.target.value;
                              setQItems(newItems);
                            }}
                            className="col-span-2 h-10 rounded-lg text-xs text-center" 
                          />
                          <Input 
                            type="number" 
                            placeholder="Prix unit" 
                            value={item.unit_price} 
                            onChange={e => {
                              const newItems = [...qItems];
                              newItems[idx].unit_price = e.target.value;
                              setQItems(newItems);
                            }}
                            className="col-span-3 h-10 rounded-lg text-xs text-right" 
                          />
                          <Button variant="ghost" className="col-span-1 text-rose-600 font-bold" onClick={() => setQItems(qItems.filter((_,i)=>i!==idx))}>X</Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="h-8 rounded-lg mt-2 text-xs" onClick={()=>setQItems([...qItems, {product_name: "", quantity: 1, unit_price: 0}])}>+ Ajouter article</Button>
                    </div>

                    <div className="space-y-2 pt-4">
                      <Label className="text-xs font-bold uppercase text-slate-500">Notes / Conditions</Label>
                      <Input placeholder="Note..." value={qNotes} onChange={e=>setQNotes(e.target.value)} className="h-11 rounded-xl" />
                    </div>
                  </div>

                  <DialogFooter className="border-t pt-4">
                    <Button variant="ghost" onClick={()=>setIsQuoteOpen(false)} className="font-bold rounded-xl">Annuler</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 rounded-xl border-none" onClick={handleCreateQuote}>ENREGISTRER LE DEVIS</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Numéro</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total TTC</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map(q => (
                      <TableRow key={q.id} className="hover:bg-slate-50/50">
                        <TableCell className="p-6 font-mono font-black text-xs text-slate-700">{q.quote_number}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-800">{q.customer_name}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-black text-slate-900">{Number(q.total_ttc).toLocaleString()} CFA</TableCell>
                        <TableCell>
                          <Badge className={`text-[8px] uppercase font-black border-none ${
                            q.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                            q.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>{q.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right p-6 space-x-2">
                          {q.status === 'draft' && (
                            <>
                              <Button size="sm" variant="ghost" className="text-xs font-bold text-emerald-600" onClick={()=>handleUpdateQuoteStatus(q.id, 'accepted')}>Accepter</Button>
                              <Button size="sm" variant="ghost" className="text-xs font-bold text-rose-600" onClick={()=>handleUpdateQuoteStatus(q.id, 'rejected')}>Refuser</Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="text-xs font-bold text-slate-400">Imprimer</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Delivery Slips tab */}
        <TabsContent value="delivery">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase text-slate-800">Livraisons & Colis</h3>
              <Dialog open={isDelOpen} onOpenChange={setIsDelOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white shadow-lg h-11 px-6 rounded-xl border-none">
                    <Plus className="w-4 h-4" /> Bon de livraison
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white rounded-[2rem] p-8 border-none flex flex-col h-[75vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Créer un Bon de Livraison</DialogTitle>
                    <DialogDescription>Enregistrer l'expédition de marchandises.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 my-4 flex-1 overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-500">Destinataire</Label>
                      <Input placeholder="Client..." value={delCustomer} onChange={e=>setDelCustomer(e.target.value)} className="h-11 rounded-xl" />
                    </div>

                    <div className="space-y-2 pt-4">
                      <Label className="text-xs font-bold uppercase text-slate-500">Articles expédiés</Label>
                      {delItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                          <Input 
                            placeholder="Produit..." 
                            value={item.product_name} 
                            onChange={e => {
                              const newItems = [...delItems];
                              newItems[idx].product_name = e.target.value;
                              setDelItems(newItems);
                            }}
                            className="col-span-6 h-10 rounded-lg text-xs" 
                          />
                          <Input 
                            type="number" 
                            placeholder="Commandé" 
                            value={item.qty_ordered} 
                            onChange={e => {
                              const newItems = [...delItems];
                              newItems[idx].qty_ordered = e.target.value;
                              setDelItems(newItems);
                            }}
                            className="col-span-3 h-10 rounded-lg text-xs text-center" 
                          />
                          <Input 
                            type="number" 
                            placeholder="Livré" 
                            value={item.qty_shipped} 
                            onChange={e => {
                              const newItems = [...delItems];
                              newItems[idx].qty_shipped = e.target.value;
                              setDelItems(newItems);
                            }}
                            className="col-span-3 h-10 rounded-lg text-xs text-center" 
                          />
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="h-8 rounded-lg mt-2 text-xs" onClick={()=>setDelItems([...delItems, {product_name: "", qty_ordered: 1, qty_shipped: 1}])}>+ Ajouter ligne</Button>
                    </div>
                  </div>

                  <DialogFooter className="border-t pt-4">
                    <Button variant="ghost" onClick={()=>setIsDelOpen(false)} className="font-bold rounded-xl">Annuler</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-xl border-none" onClick={handleCreateDeliverySlip}>EXPÉDIER</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Numéro</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliverySlips.map(d => (
                      <TableRow key={d.id} className="hover:bg-slate-50/50">
                        <TableCell className="p-6 font-mono font-black text-xs text-slate-700">{d.slip_number}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-800">{d.customer_name}</TableCell>
                        <TableCell>
                          <Badge className={`text-[8px] uppercase font-black border-none ${
                            d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            d.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>{d.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right p-6 space-x-2">
                          {d.status === 'preparation' && (
                            <Button size="sm" variant="ghost" className="text-xs font-bold text-indigo-600" onClick={()=>handleUpdateSlipStatus(d.id, 'shipped')}>Expédier</Button>
                          )}
                          {d.status === 'shipped' && (
                            <Button size="sm" variant="ghost" className="text-xs font-bold text-emerald-600" onClick={()=>handleUpdateSlipStatus(d.id, 'delivered')}>Livré</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Supplier invoices tab */}
        <TabsContent value="invoices">
          <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Numéro</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fournisseur</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Montant TTC</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Reste à payer</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/50">
                      <TableCell className="p-6 font-mono font-black text-xs text-slate-700">{inv.invoice_number || 'FACTURE-SYS'}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-800">{inv.supplier_name}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-black text-slate-900">{Number(inv.total_ttc).toLocaleString()} CFA</TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600 font-bold">{Number(inv.total_ttc - inv.paid_amount).toLocaleString()} CFA</TableCell>
                      <TableCell>
                        <Badge className={`text-[8px] uppercase font-black border-none ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>{inv.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
