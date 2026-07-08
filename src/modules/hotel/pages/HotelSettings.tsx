import { Settings, Building2, BedDouble, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HotelSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres Hôtel</h1>
        <p className="text-slate-500 text-sm">Configuration de l'établissement hôtelier</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-blue-600" /> Informations de l'Hôtel</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Nom de l'établissement</Label><Input defaultValue="Grand Hôtel Kiam" /></div>
            <div className="space-y-1"><Label>Catégorie</Label>
              <Select defaultValue="3"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 étoile</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="5">5 étoiles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Nombre de chambres</Label><Input type="number" defaultValue="50" /></div>
            <div className="space-y-1"><Label>Heure de check-in</Label><Input type="time" defaultValue="14:00" /></div>
            <div className="space-y-1"><Label>Heure de check-out</Label><Input type="time" defaultValue="12:00" /></div>
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-orange-500" /> Notifications & Alertes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Check-in du jour", desc: "Alertes pour les arrivées prévues" },
              { label: "Check-out du jour", desc: "Rappels pour les départs prévus" },
              { label: "Chambres disponibles", desc: "Notifications de chambres libérées" },
              { label: "Réservations en ligne", desc: "Nouvelles réservations reçues" },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between">
                <div><p className="font-medium text-slate-800 text-sm">{n.label}</p><p className="text-xs text-slate-400">{n.desc}</p></div>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
