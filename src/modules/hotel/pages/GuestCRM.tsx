import { useState, useEffect } from "react";
import {
  Users, Search, Plus, Star, Phone, Mail, Globe,
  Calendar, BedDouble, TrendingUp, Award, ChevronRight,
  Filter, Download, MessageSquare, Heart, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  totalStays: number;
  totalSpent: number;
  lastStay: string;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  preferences: string;
  notes: string;
  avatar?: string;
}

const MOCK_GUESTS: Guest[] = [
  { id: "G001", name: "Amadou Diallo", email: "amadou@email.com", phone: "+221 77 123 4567", nationality: "Sénégal", totalStays: 12, totalSpent: 2850000, lastStay: "2026-06-15", segment: "vip", preferences: "Chambre calme, étage élevé, oreiller ferme", notes: "Préfère le petit-déjeuner en chambre" },
  { id: "G002", name: "Marie Kouassi", email: "marie.k@corp.ci", phone: "+225 05 987 6543", nationality: "Côte d'Ivoire", totalStays: 5, totalSpent: 890000, lastStay: "2026-07-01", segment: "regular", preferences: "Vue sur mer, lit king-size", notes: "Allergique aux arachides" },
  { id: "G003", name: "Jean-Pierre Mbarga", email: "jp.mbarga@gmail.com", phone: "+237 690 456 789", nationality: "Cameroun", totalStays: 1, totalSpent: 145000, lastStay: "2026-07-05", segment: "new", preferences: "", notes: "" },
  { id: "G004", name: "Fatima El-Amin", email: "felamin@business.ma", phone: "+212 6 61 234 567", nationality: "Maroc", totalStays: 8, totalSpent: 1650000, lastStay: "2026-05-20", segment: "regular", preferences: "Chambre non-fumeur, minibar sans alcool", notes: "Arrive toujours tard le soir" },
  { id: "G005", name: "David Mensah", email: "d.mensah@acme.gh", phone: "+233 24 567 8901", nationality: "Ghana", totalStays: 3, totalSpent: 420000, lastStay: "2026-03-10", segment: "inactive", preferences: "Suite exécutive", notes: "Client corporate — facturation mensuelle" },
  { id: "G006", name: "Awa Traoré", email: "awa.t@ministere.ml", phone: "+223 76 543 2109", nationality: "Mali", totalStays: 15, totalSpent: 4200000, lastStay: "2026-07-06", segment: "vip", preferences: "Suite présidentielle, service 24h", notes: "Délégation gouvernementale — traitement prioritaire" },
];

const segmentConfig = {
  vip:      { label: "VIP", color: "bg-amber-100 text-amber-800 border-amber-200" },
  regular:  { label: "Régulier", color: "bg-blue-100 text-blue-800 border-blue-200" },
  new:      { label: "Nouveau", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  inactive: { label: "Inactif", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " CFA";

export default function GuestCRM() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>(MOCK_GUESTS);
  const [search, setSearch] = useState("");
  const [filterSeg, setFilterSeg] = useState("all");
  const [selected, setSelected] = useState<Guest | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", nationality: "", preferences: "", notes: "", segment: "new" });

  const filtered = guests.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search);
    const matchSeg = filterSeg === "all" || g.segment === filterSeg;
    return matchSearch && matchSeg;
  });

  const stats = {
    total: guests.length,
    vip: guests.filter(g => g.segment === "vip").length,
    avgSpend: Math.round(guests.reduce((s, g) => s + g.totalSpent, 0) / guests.length),
    totalRevenue: guests.reduce((s, g) => s + g.totalSpent, 0),
  };

  const handleAdd = () => {
    const newGuest: Guest = {
      id: `G${String(guests.length + 1).padStart(3, "0")}`,
      ...form,
      segment: form.segment as Guest["segment"],
      totalStays: 0,
      totalSpent: 0,
      lastStay: "—",
    };
    setGuests([newGuest, ...guests]);
    setIsAddOpen(false);
    setForm({ name: "", email: "", phone: "", nationality: "", preferences: "", notes: "", segment: "new" });
    toast({ title: "Client ajouté", description: `${newGuest.name} a été enregistré.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="h-7 w-7 text-pink-600" /> CRM Clients Hôteliers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Historique, préférences et fidélisation des clients.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exporter</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2 shadow-lg shadow-pink-200">
                <Plus className="h-4 w-4" /> Nouveau Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Ajouter un client</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                {[
                  { label: "Nom complet", key: "name", placeholder: "Prénom Nom" },
                  { label: "Email", key: "email", placeholder: "email@domaine.com" },
                  { label: "Téléphone", key: "phone", placeholder: "+221 77 000 0000" },
                  { label: "Nationalité", key: "nationality", placeholder: "Sénégal" },
                ].map(f => (
                  <div key={f.key}>
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{f.label}</Label>
                    <Input className="mt-1" placeholder={f.placeholder} value={(form as any)[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Segment</Label>
                  <Select value={form.segment} onValueChange={v => setForm({ ...form, segment: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nouveau</SelectItem>
                      <SelectItem value="regular">Régulier</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Préférences</Label>
                  <Textarea className="mt-1" placeholder="Type de chambre, préférences alimentaires..." value={form.preferences}
                    onChange={e => setForm({ ...form, preferences: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notes internes</Label>
                  <Textarea className="mt-1" placeholder="Informations importantes pour l'équipe..." value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={handleAdd} disabled={!form.name} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={String(stats.total)} icon={Users} iconClassName="bg-pink-100 text-pink-600" />
        <StatCard title="Clients VIP" value={String(stats.vip)} change="Priorité haute" changeType="positive" icon={Star} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Dépense Moyenne" value={fmt(stats.avgSpend)} icon={TrendingUp} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Revenu Total" value={fmt(stats.totalRevenue)} change="Tous séjours confondus" changeType="positive" icon={Award} iconClassName="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Filters & Table */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Nom, email, téléphone..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterSeg} onValueChange={setFilterSeg}>
              <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Segment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="regular">Régulier</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(guest => (
              <div key={guest.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                onClick={() => setSelected(guest)}>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {guest.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{guest.name}</p>
                    {guest.segment === "vip" && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                    <Badge className={`text-[10px] h-4 px-1.5 border ${segmentConfig[guest.segment].color} shrink-0`}>
                      {segmentConfig[guest.segment].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{guest.nationality}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{guest.phone}</span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-end text-right">
                  <p className="text-sm font-bold text-pink-700">{fmt(guest.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">{guest.totalStays} séjour{guest.totalStays > 1 ? "s" : ""}</p>
                </div>
                <div className="hidden lg:flex flex-col items-end text-right">
                  <p className="text-xs text-muted-foreground">Dernier séjour</p>
                  <p className="text-sm font-semibold">{guest.lastStay === "—" ? "—" : new Date(guest.lastStay).toLocaleDateString("fr-FR")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-pink-600 transition-colors" />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun client trouvé.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Panel */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center text-white font-bold">
                  {selected.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-black">{selected.name}</p>
                  <Badge className={`text-[10px] ${segmentConfig[selected.segment].color} border`}>{segmentConfig[selected.segment].label}</Badge>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-pink-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-pink-700">{selected.totalStays}</p>
                  <p className="text-xs text-muted-foreground">Séjours</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-black text-amber-700">{fmt(selected.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Dépenses totales</p>
                </div>
              </div>
              {[
                { icon: Mail, label: "Email", val: selected.email },
                { icon: Phone, label: "Téléphone", val: selected.phone },
                { icon: Globe, label: "Nationalité", val: selected.nationality },
                { icon: Calendar, label: "Dernier séjour", val: selected.lastStay === "—" ? "—" : new Date(selected.lastStay).toLocaleDateString("fr-FR") },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-center gap-3 border-b pb-2 last:border-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-semibold">{val}</p>
                  </div>
                </div>
              ))}
              {selected.preferences && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1 mb-1"><Heart className="h-3 w-3" /> Préférences</p>
                  <p className="text-sm text-slate-700">{selected.preferences}</p>
                </div>
              )}
              {selected.notes && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-1"><AlertCircle className="h-3 w-3" /> Notes internes</p>
                  <p className="text-sm text-slate-700">{selected.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1 gap-2"><MessageSquare className="h-4 w-4" /> Message</Button>
                <Button size="sm" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white gap-2"><BedDouble className="h-4 w-4" /> Réserver</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
