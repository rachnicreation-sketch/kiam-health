import { useState, useEffect } from "react";
import {
  Sparkles, Clock, Wrench, BedDouble, CheckCircle2,
  User, AlertTriangle, RefreshCw, Timer, Play, Pause, RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

type RoomHKStatus = "clean" | "dirty" | "cleaning" | "maintenance" | "inspecting";

interface HKRoom {
  id: string;
  room_number: string;
  type: string;
  floor: number;
  status: RoomHKStatus;
  assignedTo?: string;
  cleaningStarted?: number; // timestamp
  priority: "normal" | "urgent";
}

const STAFF = ["Aïssatou Diop", "Mariama Balde", "Coumba Sow", "Rokhaya Fall", "Fatou Ndiaye"];

const MOCK_ROOMS: HKRoom[] = [
  { id: "r1", room_number: "101", type: "Standard", floor: 1, status: "dirty", priority: "urgent" },
  { id: "r2", room_number: "102", type: "Standard", floor: 1, status: "cleaning", assignedTo: "Aïssatou Diop", cleaningStarted: Date.now() - 1200000, priority: "normal" },
  { id: "r3", room_number: "201", type: "Supérieure", floor: 2, status: "clean", priority: "normal" },
  { id: "r4", room_number: "202", type: "Supérieure", floor: 2, status: "dirty", priority: "urgent" },
  { id: "r5", room_number: "203", type: "Suite", floor: 2, status: "maintenance", priority: "normal" },
  { id: "r6", room_number: "301", type: "Suite", floor: 3, status: "inspecting", assignedTo: "Mariama Balde", priority: "normal" },
  { id: "r7", room_number: "302", type: "Suite junior", floor: 3, status: "clean", priority: "normal" },
  { id: "r8", room_number: "401", type: "Suite Prestige", floor: 4, status: "dirty", assignedTo: "Coumba Sow", priority: "urgent" },
];

const statusCfg: Record<RoomHKStatus, { label: string; color: string; bg: string; icon: any }> = {
  clean:       { label: "Propre",        color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  dirty:       { label: "À nettoyer",    color: "text-rose-700",    bg: "bg-rose-50 border-rose-200",       icon: Sparkles },
  cleaning:    { label: "En nettoyage",  color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       icon: Timer },
  maintenance: { label: "Maintenance",   color: "text-orange-700",  bg: "bg-orange-50 border-orange-200",   icon: Wrench },
  inspecting:  { label: "En inspection", color: "text-violet-700",  bg: "bg-violet-50 border-violet-200",   icon: AlertTriangle },
};

const STATUS_FLOW: Record<RoomHKStatus, RoomHKStatus | null> = {
  dirty: "cleaning",
  cleaning: "inspecting",
  inspecting: "clean",
  clean: null,
  maintenance: "clean",
};

function CleaningTimer({ started }: { started?: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [started]);
  if (!started) return null;
  const m = Math.floor(elapsed / 60), s = elapsed % 60;
  const isOver = elapsed > 1800; // >30min = slow
  return (
    <span className={`text-xs font-mono font-bold ${isOver ? "text-rose-600" : "text-blue-600"}`}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function Housekeeping() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<HKRoom[]>(MOCK_ROOMS);
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const advance = (roomId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const next = STATUS_FLOW[r.status];
      if (!next) return r;
      const update: Partial<HKRoom> = { status: next };
      if (next === "cleaning") update.cleaningStarted = Date.now();
      if (next === "clean") { update.assignedTo = undefined; update.cleaningStarted = undefined; }
      return { ...r, ...update };
    }));
  };

  const assign = (roomId: string, staff: string) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, assignedTo: staff } : r));
    toast({ title: "Affectation mise à jour", description: `Chambre attribuée à ${staff}.` });
  };

  const floors = [...new Set(rooms.map(r => r.floor))].sort();
  const filtered = rooms.filter(r =>
    (filterFloor === "all" || r.floor === Number(filterFloor)) &&
    (filterStatus === "all" || r.status === filterStatus)
  );

  const counts = {
    dirty: rooms.filter(r => r.status === "dirty").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length,
    clean: rooms.filter(r => r.status === "clean").length,
    maintenance: rooms.filter(r => r.status === "maintenance").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-pink-600" /> Housekeeping
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestion du nettoyage et de l'état des chambres en temps réel.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => toast({ title: "Actualisé" })}>
          <RefreshCw className="h-4 w-4" /> Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="À nettoyer" value={String(counts.dirty)} icon={Sparkles} iconClassName="bg-rose-100 text-rose-600" />
        <StatCard title="En nettoyage" value={String(counts.cleaning)} change="En cours" changeType="neutral" icon={Timer} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Prêtes" value={String(counts.clean)} changeType="positive" icon={CheckCircle2} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Maintenance" value={String(counts.maintenance)} icon={Wrench} iconClassName="bg-orange-100 text-orange-600" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterFloor} onValueChange={setFilterFloor}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Étage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les étages</SelectItem>
            {floors.map(f => <SelectItem key={f} value={String(f)}>Étage {f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(statusCfg).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(room => {
          const cfg = statusCfg[room.status];
          const Icon = cfg.icon;
          const nextStatus = STATUS_FLOW[room.status];
          return (
            <Card key={room.id} className={`border-2 ${cfg.bg} shadow-sm hover:shadow-md transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-2xl font-black text-slate-900">N° {room.room_number}</p>
                    <p className="text-xs text-muted-foreground">{room.type} • Étage {room.floor}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <Badge className={`text-[10px] border ${cfg.bg} ${cfg.color} font-bold`}>{cfg.label}</Badge>
                  {room.priority === "urgent" && (
                    <Badge variant="destructive" className="text-[10px]">Urgent</Badge>
                  )}
                  {room.status === "cleaning" && <CleaningTimer started={room.cleaningStarted} />}
                </div>

                {/* Staff assignment */}
                <div className="mb-3">
                  <Select value={room.assignedTo || ""} onValueChange={v => assign(room.id, v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <User className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Assigner staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {nextStatus && (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    variant={room.status === "dirty" ? "default" : "outline"}
                    onClick={() => advance(room.id)}
                  >
                    {room.status === "dirty" && <><Play className="h-3 w-3 mr-1" /> Démarrer nettoyage</>}
                    {room.status === "cleaning" && <><AlertTriangle className="h-3 w-3 mr-1" /> Soumettre à inspection</>}
                    {room.status === "inspecting" && <><CheckCircle2 className="h-3 w-3 mr-1" /> Valider — Chambre prête</>}
                    {room.status === "maintenance" && <><CheckCircle2 className="h-3 w-3 mr-1" /> Terminer maintenance</>}
                  </Button>
                )}
                {!nextStatus && room.status === "clean" && (
                  <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold py-1">
                    <CheckCircle2 className="h-4 w-4" /> Chambre prête
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
