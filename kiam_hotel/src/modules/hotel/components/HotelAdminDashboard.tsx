import { 
  Building2,
  TrendingUp,
  BedDouble,
  Users,
  DollarSign,
  ArrowUp,
  CalendarCheck,
  Star,
  ShoppingBag
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface HotelAdminDashboardProps {
  stats: any;
  rooms: any[];
}

const revenueData = [
  { name: 'Lun', value: 85000 },
  { name: 'Mar', value: 120000 },
  { name: 'Mer', value: 95000 },
  { name: 'Jeu', value: 145000 },
  { name: 'Ven', value: 200000 },
  { name: 'Sam', value: 350000 },
  { name: 'Dim', value: 280000 },
];

const occupancyData = [
  { name: 'Occupées', value: 0, color: '#4f46e5' },
  { name: 'Libres', value: 0, color: '#10b981' },
  { name: 'Nettoyage', value: 0, color: '#f59e0b' },
];

export function HotelAdminDashboard({ stats, rooms }: HotelAdminDashboardProps) {
  const navigate = useNavigate();

  const pieData = [
    { name: 'Occupées', value: Number(stats.occupied || 0), color: '#4f46e5' },
    { name: 'Libres', value: Number(stats.available || 0), color: '#10b981' },
    { name: 'Nettoyage', value: Number(stats.cleaning || 0), color: '#f59e0b' },
  ];

  const occupancyRate = stats.total_rooms > 0 
    ? Math.round((stats.occupied / stats.total_rooms) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-violet-600" /> Direction Hôtelière
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Vue stratégique des performances et de la rentabilité.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold gap-2 border-slate-200 shadow-sm h-11 px-5 rounded-xl" onClick={() => navigate('/hotel/rooms')}>
            <BedDouble className="w-4 h-4" /> Parc Hôtelier
          </Button>
          <Button className="bg-hotel-gradient text-white font-bold gap-2 shadow-lg shadow-violet-200 h-11 px-5 rounded-xl" onClick={() => navigate('/hotel/bookings')}>
            <CalendarCheck className="w-4 h-4" /> Réservations
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenus (Semaine)" value={`${(1275000).toLocaleString()} CFA`} change="+12% vs semaine passée" changeType="positive" icon={TrendingUp} className="bg-white" />
        <StatCard title="Taux d'Occupation" value={`${occupancyRate}%`} change={`${stats.occupied || 0}/${stats.total_rooms || 0} chambres`} changeType="positive" icon={BedDouble} className="bg-white" />
        <StatCard title="Clients (Séjour)" value={stats.occupied || 0} icon={Users} className="bg-white" />
        <StatCard title="Note Satisfaction" value="4.8 ⭐" change="Sur 5 étoiles" changeType="positive" icon={Star} className="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-slate-50/50 border-b p-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Revenus Hebdomadaires</CardTitle>
                <CardDescription className="mt-1">Flux de recettes en CFA</CardDescription>
              </div>
              <Badge className="bg-violet-100 text-violet-600 border-none px-4 py-1 font-bold">Semaine en cours</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="hotelRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(v: number) => [`${v.toLocaleString()} CFA`, 'Revenus']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={4} fillOpacity={1} fill="url(#hotelRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
            <CardHeader className="bg-slate-50/50 border-b p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Statut des Chambres</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl bg-violet-600 text-white overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-6 space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-violet-300">Alertes Direction</p>
              <div className="space-y-3">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <p className="text-xs font-bold">🧹 {stats.cleaning || 0} chambre(s) en nettoyage</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <p className="text-xs font-bold">📅 {(stats.recent_bookings || []).length} nouvelles résa ce jour</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <p className="text-xs font-bold">💰 Taux d'occupation: {occupancyRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
