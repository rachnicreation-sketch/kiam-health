import { Users, Stethoscope, BedDouble, Receipt, Calendar, TrendingUp, Clock, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const weeklyData = [
  { day: "Lun", consultations: 45, admissions: 12 },
  { day: "Mar", consultations: 52, admissions: 8 },
  { day: "Mer", consultations: 38, admissions: 15 },
  { day: "Jeu", consultations: 61, admissions: 10 },
  { day: "Ven", consultations: 55, admissions: 14 },
  { day: "Sam", consultations: 30, admissions: 6 },
  { day: "Dim", consultations: 18, admissions: 4 },
];

const revenueData = [
  { month: "Jan", revenue: 4200 },
  { month: "Fév", revenue: 4800 },
  { month: "Mar", revenue: 5100 },
  { month: "Avr", revenue: 4700 },
  { month: "Mai", revenue: 5600 },
  { month: "Jun", revenue: 6200 },
];

const departmentData = [
  { name: "Médecine générale", value: 35, color: "hsl(199, 89%, 38%)" },
  { name: "Pédiatrie", value: 20, color: "hsl(162, 63%, 41%)" },
  { name: "Chirurgie", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "Urgences", value: 15, color: "hsl(0, 72%, 51%)" },
  { name: "Autres", value: 12, color: "hsl(215, 15%, 47%)" },
];

const recentPatients = [
  { name: "Marie Dupont", type: "Consultation", time: "09:30", status: "En cours" },
  { name: "Jean Koné", type: "Hospitalisation", time: "10:00", status: "Admis" },
  { name: "Awa Traoré", type: "Laboratoire", time: "10:15", status: "En attente" },
  { name: "Ibrahim Diallo", type: "Consultation", time: "11:00", status: "Planifié" },
  { name: "Fatou Camara", type: "Pharmacie", time: "11:30", status: "Terminé" },
];

const appointments = [
  { time: "09:00", patient: "A. Sanogo", doctor: "Dr. Keita", type: "Cardiologie" },
  { time: "09:30", patient: "M. Dupont", doctor: "Dr. Coulibaly", type: "Générale" },
  { time: "10:00", patient: "F. Bamba", doctor: "Dr. Diarra", type: "Pédiatrie" },
  { time: "10:30", patient: "S. Touré", doctor: "Dr. Keita", type: "Cardiologie" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de l'activité — Clinique Centrale</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patients aujourd'hui"
          value="128"
          change="+12% vs hier"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Consultations"
          value="64"
          change="+8% cette semaine"
          changeType="positive"
          icon={Stethoscope}
          iconClassName="bg-accent/10 text-accent"
        />
        <StatCard
          title="Lits occupés"
          value="42/60"
          change="70% d'occupation"
          changeType="neutral"
          icon={BedDouble}
          iconClassName="bg-warning/10 text-warning"
        />
        <StatCard
          title="Revenus du mois"
          value="6.2M FCFA"
          change="+15% vs mois dernier"
          changeType="positive"
          icon={Receipt}
          iconClassName="bg-success/10 text-success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Activité de la semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 47%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 47%)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(214, 20%, 90%)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="consultations" fill="hsl(199, 89%, 38%)" radius={[4, 4, 0, 0]} name="Consultations" />
                <Bar dataKey="admissions" fill="hsl(162, 63%, 41%)" radius={[4, 4, 0, 0]} name="Admissions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Répartition par service</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={departmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {departmentData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {departmentData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Revenus mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 47%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 47%)" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(162, 63%, 41%)" strokeWidth={2} dot={{ fill: "hsl(162, 63%, 41%)" }} name="Revenus (k FCFA)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Rendez-vous à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">{a.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.patient}</p>
                    <p className="text-xs text-muted-foreground">{a.doctor} · {a.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Patients récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPatients.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.type} · {p.time}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "En cours"
                        ? "bg-primary/10 text-primary"
                        : p.status === "Terminé"
                        ? "bg-success/10 text-success"
                        : p.status === "Admis"
                        ? "bg-accent/10 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
