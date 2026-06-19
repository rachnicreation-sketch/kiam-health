import { useState, useEffect } from "react";
import { 
  TrendingUp, BarChart3, Search, Calendar, Package, CreditCard,
  Download, Filter, ArrowUpRight, ArrowDownRight, Printer, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import { apiRequest } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function Reports() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("month");
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest(`pharmacy.php?action=sales_report&period=${period}`);
      
      // Format chart data
      if (data && data.daily) {
        data.daily = data.daily.map((d: any) => {
          const date = new Date(d.day);
          return {
            ...d,
            dayLabel: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            sales: parseFloat(d.total_ttc),
            invoices: parseInt(d.nb_invoices)
          };
        });
      }
      setReport(data);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les rapports." });
    } finally {
      setIsLoading(false);
    }
  };

  const fmt = (n: any) => Number(n || 0).toLocaleString("fr-FR");

  if (!report && isLoading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>;
  }

  if (!report) return null;

  const { summary, margin, daily, top_products, by_payment } = report;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Rapports & Statistiques</h1>
          <p className="text-xs text-muted-foreground">Analyse détaillée des ventes, marges et performances produits.</p>
        </div>
        <div className="flex gap-2 items-center bg-white p-1 rounded-lg border shadow-sm">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] h-9 text-xs border-none shadow-none focus:ring-0">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">7 Derniers Jours</SelectItem>
              <SelectItem value="month">30 Derniers Jours</SelectItem>
              <SelectItem value="year">Cette Année</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-teal-600" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chiffre d'Affaires</p>
                <h3 className="text-2xl font-black text-slate-800 font-mono">{fmt(summary?.total_ttc)} <span className="text-sm">CFA</span></h3>
              </div>
              <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[10px] text-slate-500 flex items-center gap-1">
              <Badge variant="outline" className="text-[9px] bg-slate-50">{summary?.nb_invoices} factures</Badge>
              <span>sur la période</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Marge Brute</p>
                <h3 className="text-2xl font-black text-emerald-600 font-mono">{fmt(margin)} <span className="text-sm">CFA</span></h3>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[10px] text-slate-500">
              Marge = CA TTC - Coût d'achat HT
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ventes Encaissées</p>
                <h3 className="text-2xl font-black text-blue-600 font-mono">{fmt(summary?.total_paid)} <span className="text-sm">CFA</span></h3>
              </div>
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[10px] text-slate-500">
              Ventes réglées immédiatement
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ventes à Crédit</p>
                <h3 className="text-2xl font-black text-amber-600 font-mono">{fmt(summary?.total_credit)} <span className="text-sm">CFA</span></h3>
              </div>
              <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[10px] text-slate-500">
              En attente de règlement
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600">Évolution des Ventes (CA TTC)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalesReport" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dayLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${fmt(value)} CFA`, "Ventes TTC"]}
                    labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorSalesReport)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0f766e' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600">Répartition par Paiement</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={by_payment.map((p: any) => ({ name: p.method, value: parseFloat(p.total) }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {by_payment.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${fmt(value)} CFA`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {by_payment.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="font-medium text-slate-700">{p.method}</span>
                  </div>
                  <span className="font-mono font-bold">{fmt(p.total)} CFA</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600">Top 10 Produits Vendus</CardTitle>
          <Package className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit / DCI</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Quantité Vendue</TableHead>
                <TableHead className="text-right">Chiffre d'Affaires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top_products.map((p: any, i: number) => (
                <TableRow key={i} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">{p.dci || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-700 text-xs">
                    {p.qty_sold}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-teal-600 text-xs">
                    {fmt(p.revenue)} CFA
                  </TableCell>
                </TableRow>
              ))}
              {top_products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic text-xs">Aucune vente enregistrée sur cette période.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
