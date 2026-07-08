import { Settings, Building2, Bell, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function GesSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500 text-sm">Configuration du module de gestion des stocks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-blue-600" /> Informations Entrepôt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nom de l'entrepôt principal</Label>
              <Input defaultValue="Entrepôt Principal" />
            </div>
            <div className="space-y-1">
              <Label>Adresse</Label>
              <Input placeholder="Adresse de l'entrepôt" />
            </div>
            <div className="space-y-1">
              <Label>Responsable stock</Label>
              <Input placeholder="Nom du responsable" />
            </div>
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-orange-500" /> Alertes de Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Alertes stock faible</p>
                <p className="text-xs text-slate-400">Notifier quand le stock passe sous le minimum</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Alertes stock critique</p>
                <p className="text-xs text-slate-400">Alerte urgente quand le stock est à 0</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Rapport hebdomadaire</p>
                <p className="text-xs text-slate-400">Résumé automatique chaque lundi</p>
              </div>
              <Switch />
            </div>
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
