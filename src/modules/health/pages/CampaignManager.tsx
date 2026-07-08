import { useState } from "react";
import {
  Bell, Mail, MessageSquare, Plus, Search, Filter, Play, Send,
  Users, CheckCircle2, Clock, AlertCircle, Trash2, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Campaign {
  id: string;
  name: string;
  channel: "SMS" | "WhatsApp" | "Email";
  target: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  recipientsCount: number;
  sentCount: number;
  date: string;
  content: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "CMP-001", name: "Rappels RDV Automatiques", channel: "SMS", target: "Tous les RDV de demain", status: "scheduled", recipientsCount: 45, sentCount: 0, date: "Tous les jours", content: "Bonjour [Patient], nous vous rappelons votre RDV demain à [Heure] à la Clinique Kiam. Veuillez confirmer par SMS." },
  { id: "CMP-002", name: "Campagne Vaccination Grippe", channel: "WhatsApp", target: "Patients +60 ans", status: "sent", recipientsCount: 120, sentCount: 118, date: "2026-06-15", content: "Chers patients, la campagne annuelle de vaccination contre la grippe a commencé. Prenez rendez-vous en ligne." },
];

const statusCfg = {
  draft:     { label: "Brouillon", color: "bg-slate-100 text-slate-600 border-slate-200" },
  scheduled: { label: "Programmé", color: "bg-blue-100 text-blue-700 border-blue-200" },
  sent:      { label: "Envoyé", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  failed:    { label: "Échec", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function CampaignManager() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "SMS", target: "Tous les patients", content: "" });

  const handleAdd = () => {
    if (!form.name || !form.content) return;
    const newCamp: Campaign = {
      id: `CMP-${String(campaigns.length + 1).padStart(3, "0")}`,
      name: form.name,
      channel: form.channel as "SMS" | "WhatsApp" | "Email",
      target: form.target,
      status: "draft",
      recipientsCount: 75,
      sentCount: 0,
      date: new Date().toISOString().split("T")[0],
      content: form.content,
    };
    setCampaigns([newCamp, ...campaigns]);
    setIsNewOpen(false);
    setForm({ name: "", channel: "SMS", target: "Tous les patients", content: "" });
    toast({ title: "Campagne de communication créée" });
  };

  const launchCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "sent", sentCount: c.recipientsCount } : c));
    toast({ title: "Campagne lancée avec succès" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <Bell className="h-7 w-7 text-sky-600" /> Rappels & Campagnes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Automatisation de rappels de RDV par SMS/WhatsApp et campagnes d'information santé.</p>
        </div>
        <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Nouvelle Campagne
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une campagne de rappels</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nom de la campagne</Label>
                <Input className="mt-1" placeholder="Ex: Rappel Vaccins Pédiatrie" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Canal</Label>
                  <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cible</Label>
                  <Input className="mt-1" placeholder="Ex: Patients +60 ans" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Message</Label>
                <Textarea className="mt-1" placeholder="Bonjour [Patient]..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white" onClick={handleAdd}>
                Enregistrer la campagne
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Campagnes" value={String(campaigns.length)} icon={Bell} iconClassName="bg-sky-100 text-sky-600" />
        <StatCard title="SMS Envoyés" value="1 482" change="Ce mois" changeType="positive" icon={MessageSquare} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="WhatsApp Envoyés" value="382" icon={MessageSquare} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Rappels Automatisés" value="98%" change="Taux de réception" changeType="positive" icon={CheckCircle2} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-lg text-slate-900">Campagnes récentes et planifiées</h2>
        {campaigns.map(camp => {
          const cfg = statusCfg[camp.status];
          return (
            <Card key={camp.id} className="border-none shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base">{camp.name}</h3>
                    <Badge variant="outline">{camp.channel}</Badge>
                    <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 font-mono">{camp.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span><strong>Cible :</strong> {camp.target}</span>
                    <span><strong>Date :</strong> {camp.date}</span>
                    <span><strong>Destinataires :</strong> {camp.recipientsCount}</span>
                  </div>
                </div>
                <div className="shrink-0 flex gap-2">
                  {camp.status === "draft" && (
                    <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white gap-1" onClick={() => launchCampaign(camp.id)}>
                      <Send className="h-4 w-4" /> Envoyer maintenant
                    </Button>
                  )}
                  {camp.status === "sent" && (
                    <div className="text-right">
                      <p className="font-black text-sm text-emerald-600">{camp.sentCount} / {camp.recipientsCount}</p>
                      <p className="text-[10px] text-muted-foreground">délivrés</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
