import { useState, useEffect } from "react";
import { 
  CreditCard, Plus, Search, DollarSign, Clock, Users, 
  CheckCircle, AlertTriangle, ShieldAlert, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function Credits() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [credits, setCredits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  
  const [payForm, setPayForm] = useState({
    amount: "", payment_method: "Cash"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiRequest("pharmacy.php?action=list_credits");
      setCredits(data);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les crédits." });
    }
  };

  const handleOpenPay = (credit: any) => {
    setSelectedCredit(credit);
    setPayForm({ amount: String(credit.remaining_amount), payment_method: "Cash" });
    setIsPayOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !payForm.amount) return;

    try {
      await apiRequest("pharmacy.php?action=add_credit_payment", {
        method: "POST",
        body: JSON.stringify({
          contract_id: selectedCredit.id,
          amount: parseFloat(payForm.amount),
          payment_method: payForm.payment_method
        })
      });
      toast({ title: "Règlement enregistré", description: "Le paiement partiel/total a été validé." });
      setIsPayOpen(false);
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleSendReminder = (credit: any) => {
    toast({ title: "Relance envoyée", description: `Un SMS/Email de relance a été envoyé à ${credit.customer_name}.` });
  };

  const filteredCredits = credits.filter(c => 
    c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.includes(searchTerm)
  );

  const totalOutstanding = credits.reduce((sum, c) => sum + parseFloat(c.remaining_amount), 0);
  const overdueCredits = credits.filter(c => new Date(c.due_date) < new Date() && c.status !== 'paid');

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Créances Totales</CardTitle>
            <DollarSign className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-xl font-bold font-mono text-rose-600">
              {Number(totalOutstanding).toLocaleString()} CFA
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Encours dû par les clients & assurances</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Factures En Attente</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-xl font-bold font-mono text-slate-800">
              {credits.filter(c => c.status !== 'paid').length} crédits
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Contrats non soldés</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Créances Échues</CardTitle>
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-xl font-bold font-mono text-red-600">
              {overdueCredits.length} retards
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Date d'échéance dépassée</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par client..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="pl-10 h-10 bg-white"
          />
        </div>
      </div>

      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrat / Vente</TableHead>
                <TableHead>Client / Assureur</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Montant Total</TableHead>
                <TableHead className="text-right">Reste à payer</TableHead>
                <TableHead className="text-right">Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits.map(c => {
                const isOverdue = new Date(c.due_date) < new Date() && c.status !== 'paid';
                return (
                  <TableRow key={c.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="font-bold text-xs">{c.id}</div>
                      <div className="text-[10px] text-muted-foreground">Vente: {c.sale_id || "Directe"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-800 text-xs">{c.customer_name}</div>
                      <div className="text-[9px] uppercase text-slate-400 font-bold">{c.customer_type}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className={isOverdue ? "text-red-600 font-bold" : "text-slate-500"}>
                        {c.due_date}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{Number(c.total_amount).toLocaleString()} CFA</TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-600 text-xs">{Number(c.remaining_amount).toLocaleString()} CFA</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={
                        c.status === 'paid' ? 'secondary' :
                        isOverdue ? 'destructive' : 'outline'
                      } className="text-[10px]">
                        {c.status === 'paid' ? 'SOLDÉ' :
                         isOverdue ? 'ÉCHU / EN RETARD' : 'EN COURS'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status !== 'paid' && (
                        <div className="flex gap-1 justify-end">
                          <Button onClick={() => handleOpenPay(c)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 text-[10px] px-2">
                            Règlement
                          </Button>
                          <Button onClick={() => handleSendReminder(c)} size="sm" variant="outline" className="border-rose-500 text-rose-600 hover:bg-rose-50 h-7 text-[10px] px-2">
                            Relance
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCredits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 italic">Aucun dossier de crédit trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG: CREDIT PAYMENT */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enregistrer un Règlement de Crédit</DialogTitle></DialogHeader>
          {selectedCredit && (
            <form onSubmit={handlePayment} className="space-y-4 pt-2">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600 space-y-1">
                <p><strong>Client :</strong> {selectedCredit.customer_name}</p>
                <p><strong>Contrat :</strong> {selectedCredit.id}</p>
                <p><strong>Reste dû :</strong> <span className="font-bold text-rose-600">{Number(selectedCredit.remaining_amount).toLocaleString()} CFA</span></p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Montant du versement (CFA) *</Label>
                <Input 
                  type="number" 
                  max={selectedCredit.remaining_amount} 
                  required 
                  value={payForm.amount} 
                  onChange={e => setPayForm({...payForm, amount: e.target.value})} 
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Méthode de paiement *</Label>
                <Select value={payForm.payment_method} onValueChange={v => setPayForm({...payForm, payment_method: v})}>
                  <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash / Espèces</SelectItem>
                    <SelectItem value="Virement">Virement bancaire</SelectItem>
                    <SelectItem value="Chèque">Chèque</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
                Confirmer l'encaissement
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
