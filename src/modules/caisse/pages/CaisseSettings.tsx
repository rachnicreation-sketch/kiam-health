import { Settings, Bell, Printer, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CaisseSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres Caisse</h1>
        <p className="text-slate-500 text-sm">Configuration du point de vente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Settings className="h-4 w-4 text-blue-600" /> Point de Vente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Nom de la caisse</Label><Input defaultValue="Caisse Principale" /></div>
            <div className="space-y-1"><Label>Devise</Label>
              <Select defaultValue="xaf"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xaf">FCFA (XAF)</SelectItem>
                  <SelectItem value="cdf">Franc Congolais (CDF)</SelectItem>
                  <SelectItem value="usd">Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>TVA par défaut (%)</Label><Input type="number" defaultValue="19.25" /></div>
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Printer className="h-4 w-4 text-green-600" /> Impression & Reçus</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-slate-800">Impression auto du reçu</p><p className="text-xs text-slate-400">Imprimer après chaque vente</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-slate-800">Reçu électronique</p><p className="text-xs text-slate-400">Envoyer par SMS ou email</p></div>
              <Switch />
            </div>
            <div className="space-y-1"><Label>Message de pied de reçu</Label><Input defaultValue="Merci pour votre confiance !" /></div>
            <Button>Enregistrer</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
