import { useState, useEffect } from "react";
import { 
  Landmark, BookOpen, Search, ArrowUpDown, DollarSign, 
  FileText, Calendar, RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function Accounting() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [journal, setJournal] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"journal" | "ledger" | "balance" | "income">("journal");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("pharmacy.php?action=accounting_reports");
      setJournal(data.journal || []);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données comptables." });
    } finally {
      setIsLoading(false);
    }
  };

  // Process data for Ledger (Grand Livre)
  const getLedger = () => {
    const accounts: Record<string, { label: string; lines: any[] }> = {};
    
    journal.forEach(entry => {
      if (entry.lines) {
        entry.lines.forEach((line: any) => {
          if (!accounts[line.account_code]) {
            accounts[line.account_code] = {
              label: line.account_label || "Compte Général",
              lines: []
            };
          }
          accounts[line.account_code].lines.push({
            date: entry.entry_date,
            ref: entry.reference || entry.id,
            label: entry.label,
            debit: parseFloat(line.debit || 0),
            credit: parseFloat(line.credit || 0)
          });
        });
      }
    });

    return accounts;
  };

  // Process data for Trial Balance (Balance)
  const getTrialBalance = () => {
    const ledger = getLedger();
    const balance: any[] = [];

    Object.keys(ledger).forEach(code => {
      const acc = ledger[code];
      const totalDebit = acc.lines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = acc.lines.reduce((sum, l) => sum + l.credit, 0);
      
      const balDebit = totalDebit > totalCredit ? totalDebit - totalCredit : 0;
      const balCredit = totalCredit > totalDebit ? totalCredit - totalDebit : 0;

      balance.push({
        code,
        label: acc.label,
        debit: totalDebit,
        credit: totalCredit,
        balDebit,
        balCredit
      });
    });

    return balance.sort((a, b) => a.code.localeCompare(b.code));
  };

  // Process Income Statement (Compte de résultat)
  const getIncomeStatement = () => {
    const balance = getTrialBalance();
    const revenues = balance.filter(a => a.code.startsWith('7'));
    const expenses = balance.filter(a => a.code.startsWith('6'));

    const totalRevenues = revenues.reduce((sum, r) => sum + (r.balCredit || r.credit), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.balDebit || e.debit), 0);
    const netIncome = totalRevenues - totalExpenses;

    return {
      revenues,
      expenses,
      totalRevenues,
      totalExpenses,
      netIncome
    };
  };

  const ledger = getLedger();
  const trialBalance = getTrialBalance();
  const incomeStatement = getIncomeStatement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Comptabilité OHADA</h1>
          <p className="text-xs text-muted-foreground">Registre des écritures comptables générées automatiquement (Ventes, Achats, Règlements).</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(["journal", "ledger", "balance", "income"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab 
                  ? "bg-white text-emerald-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "journal" ? "Journal" :
               tab === "ledger" ? "Grand Livre" :
               tab === "balance" ? "Balance" : "Compte de Résultat"}
            </button>
          ))}
        </div>
      </div>

      {/* JOURNAL TAB */}
      {activeTab === "journal" && (
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600">
              Livre-Journal des Opérations
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Référence / Libellé</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead className="text-right">Débit</TableHead>
                  <TableHead className="text-right">Crédit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journal.map(entry => (
                  <TableRow key={entry.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-xs text-muted-foreground align-top">{entry.entry_date}</TableCell>
                    <TableCell className="align-top">
                      <div className="font-bold text-xs">{entry.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Ref: {entry.reference || entry.id} | Journal: {entry.journal_code}</div>
                    </TableCell>
                    <TableCell colSpan={3} className="p-0">
                      <Table className="border-0 shadow-none">
                        <TableBody>
                          {entry.lines && entry.lines.map((l: any, i: number) => (
                            <TableRow key={i} className="hover:bg-transparent border-0">
                              <TableCell className="text-xs w-[60%] py-1">
                                <span className="font-mono text-slate-500 mr-2">{l.account_code}</span>
                                {l.account_label}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs w-[20%] py-1 text-slate-700">
                                {parseFloat(l.debit) > 0 ? Number(l.debit).toLocaleString() : ""}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs w-[20%] py-1 text-slate-700">
                                {parseFloat(l.credit) > 0 ? Number(l.credit).toLocaleString() : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                ))}
                {journal.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">Aucune écriture comptable.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* LEDGER TAB (GRAND LIVRE) */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {Object.keys(ledger).map(code => (
            <Card key={code} className="border-none shadow-md bg-white">
              <CardHeader className="py-3 border-b bg-slate-50">
                <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-700">
                  <span>
                    <span className="font-mono text-emerald-700 mr-2">{code}</span>
                    {ledger[code].label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Solde: {Number(
                      ledger[code].lines.reduce((sum, l) => sum + l.debit, 0) - 
                      ledger[code].lines.reduce((sum, l) => sum + l.credit, 0)
                    ).toLocaleString()} CFA
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="text-right">Débit</TableHead>
                      <TableHead className="text-right">Crédit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledger[code].lines.map((l, idx) => (
                      <TableRow key={idx} className="text-xs">
                        <TableCell className="text-muted-foreground">{l.date}</TableCell>
                        <TableCell className="font-mono text-slate-400">{l.ref}</TableCell>
                        <TableCell>{l.label}</TableCell>
                        <TableCell className="text-right font-mono">{l.debit > 0 ? l.debit.toLocaleString() : "--"}</TableCell>
                        <TableCell className="text-right font-mono">{l.credit > 0 ? l.credit.toLocaleString() : "--"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
          {Object.keys(ledger).length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white border rounded-xl">Aucun compte actif.</div>
          )}
        </div>
      )}

      {/* TRIAL BALANCE TAB */}
      {activeTab === "balance" && (
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600">Balance Générale des Comptes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Compte</TableHead>
                  <TableHead>Intitulé du compte</TableHead>
                  <TableHead className="text-right">Total Débit</TableHead>
                  <TableHead className="text-right">Total Crédit</TableHead>
                  <TableHead className="text-right">Solde Débiteur</TableHead>
                  <TableHead className="text-right">Solde Créditeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance.map(b => (
                  <TableRow key={b.code} className="hover:bg-slate-50 font-mono text-xs">
                    <TableCell className="font-bold text-slate-700">{b.code}</TableCell>
                    <TableCell className="font-sans text-slate-800">{b.label}</TableCell>
                    <TableCell className="text-right">{b.debit > 0 ? b.debit.toLocaleString() : "--"}</TableCell>
                    <TableCell className="text-right">{b.credit > 0 ? b.credit.toLocaleString() : "--"}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-700">{b.balDebit > 0 ? b.balDebit.toLocaleString() : "--"}</TableCell>
                    <TableCell className="text-right font-bold text-rose-700">{b.balCredit > 0 ? b.balCredit.toLocaleString() : "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* INCOME STATEMENT TAB */}
      {activeTab === "income" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charges (Classe 6) */}
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="py-4 border-b bg-rose-50 text-rose-800">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex justify-between">
                <span>Charges (Classe 6)</span>
                <span>Total: {Number(incomeStatement.totalExpenses).toLocaleString()} CFA</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeStatement.expenses.map(e => (
                    <TableRow key={e.code} className="text-xs font-mono">
                      <TableCell className="font-bold">{e.code}</TableCell>
                      <TableCell className="font-sans">{e.label}</TableCell>
                      <TableCell className="text-right font-bold text-rose-600">{(e.balDebit || e.debit).toLocaleString()} CFA</TableCell>
                    </TableRow>
                  ))}
                  {incomeStatement.expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-slate-400 italic">Aucune charge comptabilisée.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Produits (Classe 7) */}
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="py-4 border-b bg-emerald-50 text-emerald-800">
                <CardTitle className="text-xs font-bold uppercase tracking-widest flex justify-between">
                  <span>Produits & Ventes (Classe 7)</span>
                  <span>Total: {Number(incomeStatement.totalRevenues).toLocaleString()} CFA</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Compte</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatement.revenues.map(r => (
                      <TableRow key={r.code} className="text-xs font-mono">
                        <TableCell className="font-bold">{r.code}</TableCell>
                        <TableCell className="font-sans">{r.label}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">{(r.balCredit || r.credit).toLocaleString()} CFA</TableCell>
                      </TableRow>
                    ))}
                    {incomeStatement.revenues.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-slate-400 italic">Aucun revenu comptabilisé.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Net Profit card */}
            <Card className={`border-none shadow-lg text-white ${incomeStatement.netIncome >= 0 ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-rose-600 to-red-500'}`}>
              <CardHeader className="py-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-white/80">Résultat Net Comptable (Bénéfice/Perte)</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="text-2xl font-black font-mono">
                  {Number(incomeStatement.netIncome).toLocaleString()} CFA
                </div>
                <p className="text-[10px] text-white/70 mt-1">
                  {incomeStatement.netIncome >= 0 ? "Exercice bénéficiaire compatible plan comptable OHADA." : "Exercice déficitaire."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
