import { useState, useEffect } from "react";
import { BarChart, PieChart, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";

export default function Reports() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.clinicId) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const data = await api.school.stats(user!.clinicId!);
      setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center text-white shadow-lg"><BarChart /></div>
          Statistiques & Rapports
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Tableaux de bord des performances et de l'assiduité.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="rounded-2xl border-none shadow-xl bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-500">Effectif Total</CardTitle><Users className="h-4 w-4 text-sky-500"/></CardHeader>
            <CardContent><div className="text-2xl font-black text-slate-800">{stats?.total_students || 0}</div></CardContent>
         </Card>
         <Card className="rounded-2xl border-none shadow-xl bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-500">Actifs</CardTitle><Users className="h-4 w-4 text-emerald-500"/></CardHeader>
            <CardContent><div className="text-2xl font-black text-slate-800">{stats?.active_students || 0}</div></CardContent>
         </Card>
         <Card className="rounded-2xl border-none shadow-xl bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-500">Taux de Réussite</CardTitle><TrendingUp className="h-4 w-4 text-emerald-500"/></CardHeader>
            <CardContent><div className="text-2xl font-black text-slate-800">84%</div></CardContent>
         </Card>
         <Card className="rounded-2xl border-none shadow-xl bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium text-slate-500">Présents (Jour)</CardTitle><PieChart className="h-4 w-4 text-orange-500"/></CardHeader>
            <CardContent><div className="text-2xl font-black text-slate-800">{stats?.today_attendance || 0}</div></CardContent>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl rounded-[2xl] bg-white">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-lg font-black text-slate-800">Meilleurs Élèves (Trimestre 1)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center">1</div>
                  <div>
                    <div className="font-bold text-slate-900">Dubois Léo</div>
                    <div className="text-xs text-slate-500">6ème A</div>
                  </div>
                </div>
                <div className="font-black text-emerald-600 text-lg">18.5/20</div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center">2</div>
                  <div>
                    <div className="font-bold text-slate-900">Martin Sophie</div>
                    <div className="text-xs text-slate-500">3ème B</div>
                  </div>
                </div>
                <div className="font-black text-sky-600 text-lg">17.8/20</div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">3</div>
                  <div>
                    <div className="font-bold text-slate-900">Lefebvre Emma</div>
                    <div className="text-xs text-slate-500">Terminale C</div>
                  </div>
                </div>
                <div className="font-black text-indigo-600 text-lg">16.9/20</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2xl] bg-white">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-lg font-black text-slate-800">Alertes Assiduité</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 font-black flex items-center justify-center">!</div>
                  <div>
                    <div className="font-bold text-slate-900">Petit Lucas</div>
                    <div className="text-xs text-slate-500">4ème A</div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="font-black text-rose-600">5 Absences</div>
                   <div className="text-xs text-slate-500 font-semibold">Mois en cours</div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 font-black flex items-center justify-center">!</div>
                  <div>
                    <div className="font-bold text-slate-900">Roux Thomas</div>
                    <div className="text-xs text-slate-500">2nde B</div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="font-black text-amber-600">3 Absences</div>
                   <div className="text-xs text-slate-500 font-semibold">Mois en cours</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
