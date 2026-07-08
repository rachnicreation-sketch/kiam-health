import { useState } from "react";
import {
  Globe, Calendar, RefreshCw, Link2, Download, Upload,
  CheckCircle2, AlertTriangle, Clock, Plus, Trash2,
  ExternalLink, Wifi, WifiOff, TrendingUp, BedDouble
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface Channel {
  id: string;
  name: string;
  logo: string;
  status: "connected" | "disconnected" | "syncing" | "error";
  lastSync?: string;
  reservations: number;
  icalUrl?: string;
}

interface CalendarBlock {
  date: string;
  type: "booking" | "blocked" | "available";
  source: string;
  roomLabel?: string;
}

const CHANNELS: Channel[] = [
  { id: "booking", name: "Booking.com", logo: "🔵", status: "connected", lastSync: "Il y a 5 min", reservations: 12, icalUrl: "https://booking.com/ical/hotel/xyz.ics" },
  { id: "airbnb", name: "Airbnb", logo: "🔴", status: "connected", lastSync: "Il y a 22 min", reservations: 7, icalUrl: "https://airbnb.com/calendar/ical/room123.ics" },
  { id: "expedia", name: "Expedia", logo: "🟡", status: "disconnected", reservations: 0 },
  { id: "trivago", name: "Trivago", logo: "🟢", status: "error", reservations: 0 },
];

const generateCalendar = () => {
  const blocks: CalendarBlock[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const date = d.toISOString().split("T")[0];
    const rand = Math.random();
    if (rand < 0.3) blocks.push({ date, type: "booking", source: "Booking.com", roomLabel: "Ch. 201" });
    else if (rand < 0.5) blocks.push({ date, type: "booking", source: "Airbnb", roomLabel: "Ch. 301" });
    else if (rand < 0.6) blocks.push({ date, type: "blocked", source: "Manuel" });
    else blocks.push({ date, type: "available", source: "" });
  }
  return blocks;
};

const statusCfg = {
  connected:    { label: "Connecté",   color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: Wifi },
  disconnected: { label: "Déconnecté", color: "text-slate-500 bg-slate-50 border-slate-200",        icon: WifiOff },
  syncing:      { label: "Sync…",      color: "text-blue-600 bg-blue-50 border-blue-200",          icon: RefreshCw },
  error:        { label: "Erreur",     color: "text-rose-600 bg-rose-50 border-rose-200",           icon: AlertTriangle },
};

export default function ChannelManager() {
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>(CHANNELS);
  const [calendar] = useState<CalendarBlock[]>(generateCalendar());
  const [newUrl, setNewUrl] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

  const sync = (channelId: string) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, status: "syncing" } : c));
    setTimeout(() => {
      setChannels(prev => prev.map(c => c.id === channelId ? { ...c, status: "connected", lastSync: "À l'instant" } : c));
      toast({ title: "Synchronisation terminée", description: `Les disponibilités ont été mises à jour.` });
    }, 2000);
  };

  const disconnect = (channelId: string) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, status: "disconnected", icalUrl: undefined } : c));
    toast({ title: "Canal déconnecté" });
  };

  const importIcal = () => {
    if (!newUrl) return;
    toast({ title: "iCal importé", description: "Les réservations ont été intégrées au calendrier." });
    setNewUrl("");
    setIsImportOpen(false);
  };

  const total = channels.filter(c => c.status === "connected").length;
  const totalRes = channels.reduce((s, c) => s + c.reservations, 0);

  const dayLabels = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { date: d.toISOString().split("T")[0], label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }) };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Globe className="h-7 w-7 text-pink-600" /> Channel Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Synchronisation des disponibilités avec Booking.com, Airbnb et autres OTAs.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Importer iCal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Importer un calendrier iCal</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">URL du calendrier (.ics)</Label>
                  <Input className="mt-1" placeholder="https://booking.com/calendar/ical/..." value={newUrl}
                    onChange={e => setNewUrl(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Copiez l'URL iCal depuis votre extranet Booking.com ou Airbnb. Les réservations seront importées automatiquement.
                </p>
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white" onClick={importIcal}>
                  <Link2 className="h-4 w-4 mr-2" /> Connecter ce calendrier
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" /> Exporter iCal</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Canaux connectés" value={`${total}/4`} changeType="positive" icon={Wifi} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Réservations actives" value={String(totalRes)} icon={Calendar} iconClassName="bg-pink-100 text-pink-600" />
        <StatCard title="Dernière sync" value="5 min" changeType="positive" icon={RefreshCw} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Taux occupation" value="68%" change="+4% vs semaine dernière" changeType="positive" icon={TrendingUp} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      {/* Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {channels.map(channel => {
          const cfg = statusCfg[channel.status];
          const Icon = cfg.icon;
          const isConnected = channel.status === "connected" || channel.status === "syncing";
          return (
            <Card key={channel.id} className="border-none shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{channel.logo}</div>
                    <div>
                      <p className="font-black">{channel.name}</p>
                      <Badge className={`text-[10px] border ${cfg.color} flex items-center gap-1 w-fit mt-1`}>
                        <Icon className={`h-3 w-3 ${channel.status === "syncing" ? "animate-spin" : ""}`} />
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                  {isConnected && (
                    <div className="text-right">
                      <p className="text-xl font-black text-pink-700">{channel.reservations}</p>
                      <p className="text-xs text-muted-foreground">réservations</p>
                    </div>
                  )}
                </div>

                {channel.lastSync && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <Clock className="h-3 w-3" /> Dernière sync : {channel.lastSync}
                  </p>
                )}

                {channel.icalUrl && (
                  <div className="bg-slate-50 rounded-lg p-2 mb-3">
                    <p className="text-[10px] text-muted-foreground truncate font-mono">{channel.icalUrl}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {isConnected ? (
                    <>
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => sync(channel.id)}
                        disabled={channel.status === "syncing"}>
                        <RefreshCw className={`h-3 w-3 ${channel.status === "syncing" ? "animate-spin" : ""}`} />
                        {channel.status === "syncing" ? "Sync..." : "Synchroniser"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => disconnect(channel.id)}>
                        <WifiOff className="h-3 w-3" /> Déconnecter
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white gap-1"
                      onClick={() => toast({ title: "Connexion", description: `Configurez votre iCal ${channel.name} pour connecter ce canal.` })}>
                      <Link2 className="h-3 w-3" /> Connecter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 14-day Availability Calendar */}
      <Card className="border-none shadow-md">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-4 w-4 text-pink-600" /> Calendrier des disponibilités — 14 prochains jours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {dayLabels.map(({ date, label }) => {
              const block = calendar.find(b => b.date === date);
              const isBooked = block?.type === "booking";
              const isBlocked = block?.type === "blocked";
              return (
                <div key={date} className="w-20 shrink-0">
                  <p className="text-[10px] font-bold text-center text-muted-foreground mb-1 capitalize">{label}</p>
                  <div className={`rounded-lg p-2 text-center text-xs font-bold border ${
                    isBooked ? "bg-rose-100 text-rose-700 border-rose-200" :
                    isBlocked ? "bg-slate-100 text-slate-500 border-slate-200" :
                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {isBooked ? (
                      <><BedDouble className="h-3 w-3 mx-auto mb-0.5" />{block?.source?.split(".")[0]}</>
                    ) : isBlocked ? (
                      "Bloqué"
                    ) : (
                      "Libre"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Disponible</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></div> Réservé (OTA)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div> Bloqué</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
