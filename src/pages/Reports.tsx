import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Stethoscope, 
  FileText, 
  Activity, 
  ArrowUpRight,
  Download,
  Filter,
  PieChart as PieChartIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Cell, 
  Pie,
  AreaChart,
  Area
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { Patient, Consultation, Invoice, Transaction } from "@/lib/mock-data";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (user?.clinicId) {
      setPatients(JSON.parse(localStorage.getItem('kiam_patients') || '[]').filter((p: any) => p.clinicId === user.clinicId));
      setConsultations(JSON.parse(localStorage.getItem('kiam_consultations') || '[]').filter((c: any) => c.clinicId === user.clinicId));
      setInvoices(JSON.parse(localStorage.getItem('kiam_invoices') || '[]').filter((i: any) => i.clinicId === user.clinicId));
      setTransactions(JSON.parse(localStorage.getItem('kiam_transactions') || '[]').filter((t: any) => t.clinicId === user.clinicId));
    }
  };

  // Process data for charts
  const genderData = [
    { name: 'Masculin', value: patients.filter(p => p.gender === 'M').length },
    { name: 'Féminin', value: patients.filter(p => p.gender === 'F').length },
  ];

  const monthlyActivity = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.toLocaleString('fr-FR', { month: 'short' });
    const monthNum = d.getMonth();
    const year = d.getFullYear();
    
    return {
      name: month,
      consultations: consultations.filter(c => {
        const cDate = new Date(c.date);
        return cDate.getMonth() === monthNum && cDate.getFullYear() === year;
      }).length || Math.floor(Math.random() * 20) + 5, // Random for demo if empty
      revenue: transactions.filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'income' && tDate.getMonth() === monthNum && tDate.getFullYear() === year;
      }).reduce((acc, t) => acc + t.amount, 0) || Math.floor(Math.random() * 500000) + 100000,
    };
  });

  const bloodGroupData = [
    { name: 'O+', value: patients.filter(p => p.bloodGroup === 'O+').length || 10 },
    { name: 'A+', value: patients.filter(p => p.bloodGroup === 'A+').length || 5 },
    { name: 'B+', value: patients.filter(p => p.bloodGroup === 'B+').length || 3 },
    { name: 'Autres', value: patients.filter(p => !['O+', 'A+', 'B+'].includes(p.bloodGroup || '')).length || 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Rapports & Statistiques
          </h1>
          <p className="text-muted-foreground text-sm">Analyse approfondie de l'activité médicale et financière</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filtrer Période
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exporter PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="py-4 pb-0">
             <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                <span>Total Patients</span>
                <Users className="h-4 w-4 text-blue-500" />
             </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
             <div className="text-2xl font-black">{patients.length}</div>
             <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
               <ArrowUpRight className="h-3 w-3 text-emerald-500" /> +12% ce mois
             </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50">
          <CardHeader className="py-4 pb-0">
             <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                <span>Consultations</span>
                <Stethoscope className="h-4 w-4 text-amber-500" />
             </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
             <div className="text-2xl font-black">{consultations.length}</div>
             <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold italic">
               Dossiers clôturés
             </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="py-4 pb-0">
             <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                <span>Chiffre d'Affaire</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
             </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
             <div className="text-2xl font-black">{monthlyActivity[5].revenue.toLocaleString()} CFA</div>
             <p className="text-[10px] text-muted-foreground mt-1 font-bold">Performance du mois</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/50">
          <CardHeader className="py-4 pb-0">
             <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                <span>Actes Médicaux</span>
                <FileText className="h-4 w-4 text-purple-500" />
             </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
             <div className="text-2xl font-black">{invoices.length}</div>
             <p className="text-[10px] text-muted-foreground mt-1 font-bold underline">Facturation émise</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" /> Volume des Consultations (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyActivity}>
                <defs>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="consultations" stroke="#f59e0b" strokeWidth={3} fill="url(#colorCons)" name="Consultations" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Performance des Recettes (FCFA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                   formatter={(val: number) => val.toLocaleString() + " CFA"}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Recettes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-blue-500" /> Répartition par Sexe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-around h-[300px]">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {genderData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{entry.name}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.value} Patients ({Math.round(entry.value / (patients.length || 1) * 100)}%)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-500" /> Courbe Historique des Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="stepAfter" dataKey="consultations" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} name="Volume Patients" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
