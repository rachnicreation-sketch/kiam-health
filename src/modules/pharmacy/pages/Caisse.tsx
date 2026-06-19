import { useState, useEffect } from "react";
import { 
  Receipt, Plus, Search, DollarSign, Clock, CheckCircle, 
  AlertTriangle, Lock, Unlock, ArrowDownRight, ArrowUpRight,
  Printer, Coins, History, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

// Billetage denominations (Franc CFA)
const DENOMINATIONS = [
  { value: 10000, label: "Billets 10.000" },
  { value: 5000, label: "Billets 5.000" },
  { value: 2000, label: "Billets 2.000" },
  { value: 1000, label: "Billets 1.000" },
  { value: 500, label: "Billets/Pièces 500" },
  { value: 200, label: "Pièces 200" },
  { value: 100, label: "Pièces 100" },
  { value: 50, label: "Pièces 50" },
  { value: 25, label: "Pièces 25" },
];

export default function Caisse() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Modals
  const [isAddTransOpen, setIsAddTransOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isPrintZOpen, setIsPrintZOpen] = useState(false);
  const [sessionToPrint, setSessionToPrint] = useState<any>(null);

  // Forms
  const [transForm, setTransForm] = useState({
    type: "out", amount: "", category: "Frais divers", reason: ""
  });
  
  // Billetage state
  const [cashCounts, setCashCounts] = useState<Record<number, number>>({});
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  
  // Registers (Caisses physiques)
  const [registers, setRegisters] = useState<any[]>([]);
  const [selectedRegister, setSelectedRegister] = useState("");

  const calculateTotalCash = () => {
    return Object.entries(cashCounts).reduce((total, [val, count]) => {
      return total + (parseInt(val) * (count || 0));
    }, 0);
  };

  useEffect(() => {
    loadData();
    loadHistory();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiRequest("pharmacy.php?action=caisse_status");
      if (data.isOpen) {
        setSessionInfo(data.session);
        setIsOpen(true);
      } else {
        setSessionInfo(null);
        setIsOpen(false);
      }
      
      const regs = await apiRequest("pharmacy.php?action=list_registers");
      setRegisters(regs || []);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la caisse." });
    }
  };

  const loadHistory = async () => {
    try {
      const data = await apiRequest("pharmacy.php?action=list_closed_sessions");
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCashCountChange = (value: number, count: string) => {
    setCashCounts(prev => ({
      ...prev,
      [value]: parseInt(count) || 0
    }));
  };

  const handleOpenCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegister) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner une caisse physique." });
      return;
    }
    const total = calculateTotalCash();
    try {
      await apiRequest("pharmacy.php?action=open_caisse", {
        method: "POST",
        body: JSON.stringify({ 
          opening_balance: total, 
          notes: openingNotes,
          register_id: selectedRegister
        })
      });
      toast({ title: "Caisse ouverte", description: `Fond initial: ${total.toLocaleString()} CFA` });
      setCashCounts({});
      setOpeningNotes("");
      loadData();
    } catch (ex: any) {
      toast({ variant: "destructive", title: "Erreur", description: ex.message });
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transForm.amount || !transForm.reason || !transForm.category) return;

    try {
      await apiRequest("pharmacy.php?action=add_cash_transaction", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionInfo.id,
          type: transForm.type,
          amount: parseFloat(transForm.amount),
          reason: `[${transForm.category}] ${transForm.reason}`
        })
      });
      toast({ title: "Opération enregistrée", description: "La transaction de caisse a été ajoutée." });
      setIsAddTransOpen(false);
      setTransForm({ type: "out", amount: "", category: "Frais divers", reason: "" });
      loadData();
    } catch (ex: any) {
      toast({ variant: "destructive", title: "Erreur", description: ex.message });
    }
  };

  const handleCloseCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = calculateTotalCash();
    
    try {
      const data = await apiRequest("pharmacy.php?action=close_caisse", {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionInfo.id,
          closing_balance: total,
          notes: closingNotes
        })
      });
      
      toast({ 
        title: "Caisse clôturée", 
        description: `Clôture effectuée. Écart constaté: ${data.discrepancy} CFA.` 
      });
      
      setIsCloseOpen(false);
      setCashCounts({});
      setClosingNotes("");
      loadData();
      loadHistory();
      
      // Auto-open print dialog for the closed session
      const closedSession = {
        ...sessionInfo,
        closing_balance: total,
        total_sales: parseFloat(sessionInfo.total_sales) || 0, // This is computed by backend but we can approximate or rely on history
        expected: data.expected,
        discrepancy: data.discrepancy,
        closed_at: new Date().toISOString()
      };
      
      // Better to fetch history and get the latest to print
      setTimeout(async () => {
         const hData = await apiRequest("pharmacy.php?action=list_closed_sessions");
         if (hData && hData.length > 0) {
            setSessionToPrint(hData[0]);
            setIsPrintZOpen(true);
         }
      }, 500);

    } catch (ex: any) {
      toast({ variant: "destructive", title: "Erreur", description: ex.message });
    }
  };

  const renderBilletageGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
      {DENOMINATIONS.map(d => (
        <div key={d.value} className="flex items-center gap-2">
          <Label className="text-xs w-24 text-right text-slate-600">{d.label}</Label>
          <Input 
            type="number" 
            min="0"
            className="h-8 w-16 text-center text-xs font-mono bg-white" 
            value={cashCounts[d.value] || ""} 
            onChange={e => handleCashCountChange(d.value, e.target.value)}
          />
        </div>
      ))}
      <div className="col-span-full pt-2 border-t mt-2 flex justify-between items-center">
        <span className="text-sm font-bold text-slate-700">Total Compté :</span>
        <span className="text-lg font-black font-mono text-emerald-700">
          {calculateTotalCash().toLocaleString()} CFA
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Gestion de la Caisse Officine</h1>
          <p className="text-xs text-muted-foreground">Ouverture, mouvements, clôture et billetage (Ticket Z).</p>
        </div>
        
        {isOpen && (
          <div className="flex gap-2">
            <Button onClick={() => setIsAddTransOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs h-9">
              <Plus className="h-4 w-4" /> Entrée / Sortie
            </Button>
            <Button onClick={() => setIsCloseOpen(true)} variant="destructive" className="font-bold gap-2 text-xs h-9">
              <Lock className="h-4 w-4" /> Clôturer la Caisse
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="text-xs font-bold gap-2">
            <Unlock className="h-4 w-4" /> Session Active
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-bold gap-2">
            <History className="h-4 w-4" /> Historique des Clôtures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {!isOpen ? (
            <Card className="border border-slate-200 bg-white max-w-2xl mx-auto shadow-md">
              <CardHeader className="text-center border-b">
                <Coins className="h-10 w-10 text-emerald-600 mx-auto animate-pulse" />
                <CardTitle className="text-base font-bold text-slate-800 mt-2">Démarrer une session de caisse</CardTitle>
                <CardDescription className="text-xs">
                  Veuillez compter physiquement le fond de caisse (billetage) pour démarrer.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleOpenCaisse} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-bold">Sélectionner la Caisse Physique</Label>
                    <Select value={selectedRegister} onValueChange={setSelectedRegister} required>
                      <SelectTrigger className="h-10 text-sm border-slate-300">
                        <SelectValue placeholder="Choisir une caisse..." />
                      </SelectTrigger>
                      <SelectContent>
                        {registers.filter(r => r.status === 'closed').map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {renderBilletageGrid()}
                  <Button type="submit" disabled={calculateTotalCash() <= 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-sm">
                    Ouvrir la caisse avec {calculateTotalCash().toLocaleString()} CFA
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Active Session Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-white">
                  <CardHeader className="py-3 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Fond Initial</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-lg font-bold font-mono text-slate-700">
                      {Number(sessionInfo.opening_balance).toLocaleString()} CFA
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                  <CardHeader className="py-3 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Ventes (Entrées)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-lg font-bold font-mono text-emerald-600 flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4" />
                      {Number(sessionInfo.total_sales || 0).toLocaleString()} CFA
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white">
                  <CardHeader className="py-3 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Dépenses (Sorties)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-lg font-bold font-mono text-rose-600 flex items-center gap-1">
                      <ArrowDownRight className="h-4 w-4" />
                      {Number(sessionInfo.total_expenses || 0).toLocaleString()} CFA
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-emerald-200 shadow-md bg-emerald-50">
                  <CardHeader className="py-3 border-b border-emerald-100">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-800">Solde Théorique</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-lg font-black font-mono text-emerald-700">
                      {Number(
                        parseFloat(sessionInfo.opening_balance) + 
                        parseFloat(sessionInfo.total_sales || 0) - 
                        parseFloat(sessionInfo.total_expenses || 0)
                      ).toLocaleString()} CFA
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions list */}
              <Card className="border-none shadow-md bg-white">
                <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600">
                    Mouvements de la session
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[50vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Heure</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Motif / Raison</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionInfo.transactions && sessionInfo.transactions.map((t: any) => (
                        <TableRow key={t.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs font-mono text-slate-400">
                            {new Date(t.created_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={t.type === 'in' ? 'secondary' : 'destructive'} className="text-[9px] font-bold uppercase">
                              {t.type === 'in' ? 'Entrée' : 'Sortie'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-700">{t.reason}</TableCell>
                          <TableCell className={`text-right font-mono font-bold text-xs ${t.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'in' ? '+' : '-'}{Number(t.amount).toLocaleString()} CFA
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!sessionInfo.transactions || sessionInfo.transactions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">Aucune transaction enregistrée.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4" /> Archives des Sessions Clôturées
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Heure Clôture</TableHead>
                    <TableHead>Caissier</TableHead>
                    <TableHead className="text-right">Fond Initial</TableHead>
                    <TableHead className="text-right">Ventes</TableHead>
                    <TableHead className="text-right">Solde Final</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="text-xs">
                        <div className="font-bold">{new Date(h.closed_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(h.closed_at).toLocaleTimeString()}</div>
                      </TableCell>
                      <TableCell className="text-xs">{h.user_name || "Système"}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-500">{Number(h.opening_balance).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-emerald-600">+{Number(h.total_sales).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-800">{Number(h.closing_balance).toLocaleString()} CFA</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {Number(h.discrepancy) === 0 ? (
                          <span className="text-emerald-600 font-bold">0</span>
                        ) : Number(h.discrepancy) > 0 ? (
                          <span className="text-amber-600 font-bold">+{Number(h.discrepancy).toLocaleString()}</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{Number(h.discrepancy).toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setSessionToPrint(h); setIsPrintZOpen(true); }}>
                          <Printer className="h-4 w-4 text-slate-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-6 text-slate-400">Aucun historique disponible.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: ADD TRANSACTION */}
      <Dialog open={isAddTransOpen} onOpenChange={setIsAddTransOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enregistrer une Entrée/Sortie</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Type *</Label>
                <Select value={transForm.type} onValueChange={v => setTransForm({...transForm, type: v, category: v === 'in' ? 'Apport de fonds' : 'Frais divers'})}>
                  <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="out">Sortie (Dépense)</SelectItem>
                    <SelectItem value="in">Entrée (Recette)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Catégorie *</Label>
                <Select value={transForm.category} onValueChange={v => setTransForm({...transForm, category: v})}>
                  <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {transForm.type === 'out' ? (
                      <>
                        <SelectItem value="Frais de transport">Frais de transport</SelectItem>
                        <SelectItem value="Achat fournitures">Achat fournitures</SelectItem>
                        <SelectItem value="Paiement fournisseur">Paiement fournisseur</SelectItem>
                        <SelectItem value="Remboursement patient">Remboursement patient</SelectItem>
                        <SelectItem value="Frais divers">Frais divers</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Apport de fonds">Apport de fonds (Monnaie)</SelectItem>
                        <SelectItem value="Recette exceptionnelle">Recette exceptionnelle</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Montant (CFA) *</Label>
              <Input type="number" required value={transForm.amount} onChange={e => setTransForm({...transForm, amount: e.target.value})} className="h-9 text-xs font-mono font-bold" />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Détails / Justificatif *</Label>
              <Input required value={transForm.reason} onChange={e => setTransForm({...transForm, reason: e.target.value})} className="h-9 text-xs" placeholder="Ex: Achat de rames de papier" />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
              Confirmer l'opération
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CLOSE CAISSE */}
      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Clôture et Billetage (Ticket Z)</DialogTitle></DialogHeader>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] p-2 rounded-lg font-medium mb-2">
            Rappel: Le solde théorique de votre caisse est de {Number(
              parseFloat(sessionInfo?.opening_balance || 0) + 
              parseFloat(sessionInfo?.total_sales || 0) - 
              parseFloat(sessionInfo?.total_expenses || 0)
            ).toLocaleString()} CFA. Comptez physiquement vos espèces.
          </div>
          <form onSubmit={handleCloseCaisse} className="space-y-4">
            {renderBilletageGrid()}

            <div className="space-y-1.5">
              <Label className="text-xs">Remarques de clôture (si écart)</Label>
              <Input value={closingNotes} onChange={e => setClosingNotes(e.target.value)} className="h-9 text-xs" placeholder="Ex: Rendu monnaie manquant..." />
            </div>

            <Button type="submit" disabled={calculateTotalCash() <= 0} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11">
              Valider la Clôture ({calculateTotalCash().toLocaleString()} CFA)
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: TICKET Z PRINT */}
      <Dialog open={isPrintZOpen} onOpenChange={setIsPrintZOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Ticket Z - Rapport de Caisse</DialogTitle>
          </DialogHeader>
          {sessionToPrint && (
            <div id="ticket-z" className="bg-white p-4 font-mono text-xs text-slate-800 border rounded-lg shadow-inner space-y-3">
              <div className="text-center pb-2 border-b border-dashed">
                <h3 className="font-bold text-sm">PHARMACIE SAAS</h3>
                <p>Rapport de Session (Ticket Z)</p>
                <p>{new Date(sessionToPrint.closed_at).toLocaleString()}</p>
              </div>
              
              <div className="space-y-1 py-2 border-b border-dashed">
                <div className="flex justify-between"><span>CAISSIER :</span> <span>{sessionToPrint.user_name || "Pharmacien"}</span></div>
                <div className="flex justify-between"><span>SESSION ID:</span> <span>{sessionToPrint.id.substring(0,8)}</span></div>
              </div>

              <div className="space-y-1 py-2 border-b border-dashed">
                <div className="flex justify-between"><span>Fond Initial :</span> <span>{Number(sessionToPrint.opening_balance).toLocaleString()}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Ventes (+) :</span> <span>{Number(sessionToPrint.total_sales).toLocaleString()}</span></div>
                <div className="flex justify-between text-rose-600"><span>Dépenses (-) :</span> <span>{Number(sessionToPrint.total_expenses).toLocaleString()}</span></div>
              </div>

              <div className="space-y-1 py-2 border-b border-solid">
                <div className="flex justify-between font-bold">
                  <span>TOTAL THÉORIQUE :</span> 
                  <span>{Number(
                    parseFloat(sessionToPrint.opening_balance) + 
                    parseFloat(sessionToPrint.total_sales) - 
                    parseFloat(sessionToPrint.total_expenses)
                  ).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>TOTAL EN CAISSE :</span> 
                  <span>{Number(sessionToPrint.closing_balance).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 py-2">
                <div className="flex justify-between font-bold">
                  <span>ÉCART CONSTATÉ :</span> 
                  <span className={Number(sessionToPrint.discrepancy) < 0 ? "text-rose-600" : Number(sessionToPrint.discrepancy) > 0 ? "text-amber-600" : "text-emerald-600"}>
                    {Number(sessionToPrint.discrepancy).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-center pt-4 text-[10px] text-slate-400">
                <p>*** Fin du rapport ***</p>
                <p>Généré le {new Date().toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full bg-slate-800" onClick={() => {
              const printContent = document.getElementById('ticket-z')?.innerHTML;
              if (printContent) {
                const win = window.open('', '_blank');
                win?.document.write(`
                  <html><head><title>Ticket Z</title>
                  <style>
                    body { font-family: monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 20px; }
                    .flex { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .text-center { text-align: center; }
                    .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
                    .font-bold { font-weight: bold; }
                    .text-lg { font-size: 16px; }
                  </style>
                  </head><body>${printContent.replace(/class="[^"]*"/g, '')}
                  <script>window.print(); window.close();</script>
                  </body></html>
                `);
              }
            }}>
              <Printer className="mr-2 h-4 w-4" /> Imprimer le Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
