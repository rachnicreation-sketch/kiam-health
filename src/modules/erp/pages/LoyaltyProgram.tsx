import { useState } from "react";
import {
  Gift, Search, Plus, Award, Star, Settings, CheckCircle2,
  TrendingUp, Users, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: "Bronze" | "Silver" | "Gold";
  lastPurchase: string;
}

const MOCK_MEMBERS: Member[] = [
  { id: "M001", name: "Khadija Sy", phone: "+221 77 123 4567", points: 420, tier: "Silver", lastPurchase: "2026-07-06" },
  { id: "M002", name: "Amadou Diallo", phone: "+221 77 234 5678", points: 850, tier: "Gold", lastPurchase: "2026-07-07" },
  { id: "M003", name: "Oumar Sow", phone: "+221 77 345 6789", points: 150, tier: "Bronze", lastPurchase: "2026-07-01" },
];

export default function LoyaltyProgram() {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [search, setSearch] = useState("");

  const addPoints = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== id) return m;
      const pts = m.points + 50;
      const tier = pts >= 800 ? "Gold" : pts >= 400 ? "Silver" : "Bronze";
      return { ...m, points: pts, tier };
    }));
    toast({ title: "+50 points ajoutés au client" });
  };

  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Gift className="h-7 w-7 text-purple-600" /> Programme de Fidélité
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gérer les points de fidélité clients, les remises automatiques et les paliers.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Membres actifs" value={String(members.length)} icon={Users} iconClassName="bg-purple-100 text-purple-600" />
        <StatCard title="Points Distribués" value={String(members.reduce((s, m) => s + m.points, 0))} icon={Star} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Clients Gold" value={String(members.filter(m => m.tier === "Gold").length)} icon={Award} iconClassName="bg-yellow-100 text-yellow-600" />
        <StatCard title="Taux d'engagement" value="78%" icon={TrendingUp} iconClassName="bg-blue-100 text-blue-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un membre fidélité..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(m => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{m.name}</p>
                    <Badge className={`text-[10px] h-4 ${m.tier === "Gold" ? "bg-amber-100 text-amber-800" : m.tier === "Silver" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>
                      {m.tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Tél : {m.phone} · Dernière visite : {m.lastPurchase}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="font-black text-sm text-purple-700 mr-2">{m.points} pts</p>
                  <Button size="xs" variant="outline" className="h-7 text-xs" onClick={() => addPoints(m.id)}>
                    +50 Pts (Achat)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
