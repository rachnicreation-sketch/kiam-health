import { useState, useEffect } from "react";
import { 
  BookOpen, Wallet, ArrowUpRight, ArrowDownRight, 
  FileText, Calendar, Download, RefreshCw, Layers
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ErpAccounting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [balance, setBalance] = useState<any[]>([]);
  const [repStats, setRepStats] = useState<any>(null);

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, ledgerData, balanceData, repData] = await Promise.all([
        api.erp.ohadaJournalEntries(user!.clinicId),
        api.erp.ohadaLedger(user!.clinicId),
        api.erp.ohadaTrialBalance(user!.clinicId),
        api.erp.ohadaFinancialReports(user!.clinicId)
      ]);
      setEntries(entriesData);
      setLedger(ledgerData);
      setBalance(balanceData);
      setRepStats(repData);
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données comptables." });
    } finally {
      setLoading(false);
    }
  };

  // Group ledger lines by Account Code
  const groupedLedger = ledger.reduce((acc: any, curr: any) => {
    if (!acc[curr.account_code]) {
      acc[curr.account_code] = {
        label: curr.account_label,
        lines: []
      };
    }
    acc[curr.account_code].lines.push(curr);
    return acc;
  }, {});

  const totalDebits = balance.reduce((sum, item) => sum + Number(item.total_debit), 0);
  const totalCredits = balance.reduce((sum, item) => sum + Number(item.total_credit), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-indigo-600" /> Comptabilité OHADA
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Saisie automatisée, Balance générale, Grand livre et États Financiers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold h-11 px-6 shadow-sm" onClick={loadData}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </Button>
          <Button className="bg-slate-900 text-white rounded-xl font-bold h-11 px-6 shadow-xl"><Download className="w-4 h-4 mr-2" /> Exporter FEC</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-white rounded-[2rem]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold">Produits (7)</Badge>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Revenus d'exploitation</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">{Number(repStats?.total_income || 0).toLocaleString()} <span className="text-sm font-bold">CFA</span></h2>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-[2rem]">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6" />
              </div>
              <Badge className="bg-rose-100 text-rose-600 border-none font-bold">Charges (6)</Badge>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Charges d'exploitation</p>
            <h2 className="text-3xl font-black text-slate-900 mt-1">{Number(repStats?.total_expenses || 0).toLocaleString()} <span className="text-sm font-bold">CFA</span></h2>
          </CardContent>
        </Card>
        <Card className={`border-none shadow-xl rounded-[2rem] text-white ${Number(repStats?.net_income || 0) >= 0 ? 'bg-gradient-to-br from-indigo-900 to-indigo-800' : 'bg-gradient-to-br from-rose-950 to-rose-900'}`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <Badge className="bg-white/20 text-white border-none font-bold">Résultat Net</Badge>
            </div>
            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Bénéfice / Perte d'exercice</p>
            <h2 className="text-3xl font-black mt-1">{Number(repStats?.net_income || 0).toLocaleString()} <span className="text-sm font-bold">CFA</span></h2>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="journals" className="space-y-6">
        <TabsList className="bg-slate-100 rounded-xl p-1 w-fit">
          <TabsTrigger value="journals" className="rounded-lg font-bold text-xs uppercase px-4 py-2">Journal Comptable</TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-lg font-bold text-xs uppercase px-4 py-2">Grand Livre</TabsTrigger>
          <TabsTrigger value="trial_balance" className="rounded-lg font-bold text-xs uppercase px-4 py-2">Balance Générale</TabsTrigger>
          <TabsTrigger value="financials" className="rounded-lg font-bold text-xs uppercase px-4 py-2">Bilan & Résultat</TabsTrigger>
        </TabsList>

        <TabsContent value="journals">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black uppercase">Écritures Récentes</CardTitle>
              <CardDescription>Générées automatiquement par les modules POS et Approvisionnement.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Journal</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Libellé</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Référence</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-6">Total Débit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-slate-400 font-bold uppercase tracking-widest opacity-35">Aucune écriture</TableCell>
                    </TableRow>
                  ) : (
                    entries.map(ent => (
                      <TableRow key={ent.id} className="hover:bg-slate-50/50">
                        <TableCell className="p-6 font-mono text-xs">{ent.entry_date}</TableCell>
                        <TableCell><Badge className="bg-slate-100 text-slate-600 uppercase font-black text-[9px]">{ent.journal_code}</Badge></TableCell>
                        <TableCell className="font-bold text-slate-800 text-xs">{ent.label}</TableCell>
                        <TableCell className="font-mono text-[10px] text-slate-400">{ent.reference}</TableCell>
                        <TableCell className="text-right p-6 font-black font-mono text-emerald-600 text-xs">{Number(ent.total_debit).toLocaleString()} CFA</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black uppercase">Grand Livre des Comptes</h3>
              <p className="text-slate-500 text-xs mt-0.5">Détail des mouvements débit/crédit pour chaque compte OHADA.</p>
            </div>
            
            {Object.keys(groupedLedger).length === 0 ? (
              <p className="text-center py-12 text-slate-400 uppercase tracking-widest font-black opacity-35">Grand Livre Vide</p>
            ) : (
              Object.keys(groupedLedger).map(accCode => (
                <div key={accCode} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-600 text-white font-mono font-black text-xs px-2.5 py-1 rounded-lg">{accCode}</span>
                      <span className="text-sm font-black text-slate-800 uppercase">{groupedLedger[accCode].label}</span>
                    </div>
                  </div>
                  <Table>
                    <TableHeader className="bg-slate-100/30">
                      <TableRow>
                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 pl-4 py-2">Date</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-2">Libellé écriture</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-2 text-right">Débit</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-2 text-right pr-4">Crédit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedLedger[accCode].lines.map((line: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50">
                          <TableCell className="pl-4 py-3 font-mono text-[10px] text-slate-400">{line.entry_date}</TableCell>
                          <TableCell className="py-3 font-medium text-xs text-slate-700">{line.entry_label} ({line.journal_code})</TableCell>
                          <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-800">{line.debit > 0 ? Number(line.debit).toLocaleString() : '-'}</TableCell>
                          <TableCell className="py-3 text-right pr-4 font-mono text-xs font-bold text-slate-800">{line.credit > 0 ? Number(line.credit).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </Card>
        </TabsContent>

        <TabsContent value="trial_balance">
          <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black uppercase">Balance des Comptes</CardTitle>
              <CardDescription>Vérification du principe fondamental de la partie double.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Compte</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intitulé du compte</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Mouvements Débit</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right p-6">Mouvements Crédit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balance.map(item => (
                    <TableRow key={item.account_code} className="hover:bg-slate-50/50">
                      <TableCell className="p-6 font-mono font-black text-xs text-slate-700">{item.account_code}</TableCell>
                      <TableCell className="font-bold text-slate-800 text-xs uppercase">{item.label}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[8px] uppercase font-black">{item.account_type}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-600">{Number(item.total_debit).toLocaleString()}</TableCell>
                      <TableCell className="text-right p-6 font-mono text-xs text-slate-600">{Number(item.total_credit).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {/* Totals */}
                  <TableRow className="bg-slate-50 hover:bg-slate-50 font-black">
                    <TableCell className="p-6 text-xs uppercase" colSpan={3}>Totaux Généraux</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-900">{totalDebits.toLocaleString()}</TableCell>
                    <TableCell className="text-right p-6 font-mono text-xs text-slate-900">{totalCredits.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Balance Sheet (Bilan) */}
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-lg font-black uppercase">Bilan Simplifié OHADA</CardTitle>
                <CardDescription>Structure de l'Actif et du Passif de l'entreprise.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Actif (Éléments du patrimoine)</h4>
                  <div className="divide-y divide-slate-100">
                    <div className="py-3 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Actif Immobilisé (Terrains, Matériels...)</span>
                      <span className="font-mono font-black">{Number(balance.find(b=>b.account_code.startsWith('2'))?.total_debit || 0).toLocaleString()} CFA</span>
                    </div>
                    <div className="py-3 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Stocks de Marchandises</span>
                      <span className="font-mono font-black">{Number(balance.find(b=>b.account_code==='311000')?.total_debit || 0).toLocaleString()} CFA</span>
                    </div>
                    <div className="py-3 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Créances Clients (411)</span>
                      <span className="font-mono font-black">{Number(balance.find(b=>b.account_code==='411100')?.total_debit || 0).toLocaleString()} CFA</span>
                    </div>
                    <div className="py-3 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Disponibilités (Caisse & Banque)</span>
                      <span className="font-mono font-black">{Number(
                        (Number(balance.find(b=>b.account_code==='571000')?.total_debit || 0) - Number(balance.find(b=>b.account_code==='571000')?.total_credit || 0)) +
                        (Number(balance.find(b=>b.account_code==='521000')?.total_debit || 0) - Number(balance.find(b=>b.account_code==='521000')?.total_credit || 0))
                      ).toLocaleString()} CFA</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profit & Loss (Compte de résultat) */}
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-lg font-black uppercase">Compte de Résultat OHADA</CardTitle>
                <CardDescription>Produits et Charges pour déterminer le profit.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Produits (Classe 7)</h4>
                  <div className="py-3 border-b flex justify-between text-xs">
                    <span className="font-bold text-slate-700">Ventes de Marchandises</span>
                    <span className="font-mono font-black text-emerald-600">+{Number(repStats?.total_income || 0).toLocaleString()} CFA</span>
                  </div>

                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider pt-4">Charges (Classe 6)</h4>
                  <div className="divide-y divide-slate-100">
                    <div className="py-3 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Achats de Marchandises</span>
                      <span className="font-mono font-black text-rose-600">-{Number(balance.find(b=>b.account_code==='601100')?.total_debit || 0).toLocaleString()} CFA</span>
                    </div>
                    <div className="py-3 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Charges externes (Eau, Électricité)</span>
                      <span className="font-mono font-black text-rose-600">-{Number(balance.find(b=>b.account_code==='605000')?.total_debit || 0).toLocaleString()} CFA</span>
                    </div>
                    <div className="py-3 flex justify-between text-xs">
                      <span className="font-bold text-slate-700">Pertes sur écarts stocks / créances</span>
                      <span className="font-mono font-black text-rose-600">-{Number(balance.find(b=>b.account_code==='658000')?.total_debit || 0).toLocaleString()} CFA</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t flex justify-between items-center">
                    <span className="text-sm font-black uppercase">Résultat Net Simplifié</span>
                    <Badge className={`text-sm font-black px-4 py-1.5 rounded-xl border-none ${Number(repStats?.net_income || 0) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {Number(repStats?.net_income || 0) >= 0 ? '+' : ''}{Number(repStats?.net_income || 0).toLocaleString()} CFA
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
