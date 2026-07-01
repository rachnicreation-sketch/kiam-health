import { Settings as SettingsIcon, Save } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SchoolSettings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Paramètres enregistrés", description: "La configuration de l'école a été mise à jour." });
  };

  return (
    <div className="space-y-6 p-2 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-edu-gradient flex items-center justify-center text-white shadow-lg"><SettingsIcon /></div>
            Paramètres École
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Configuration globale du module scolaire.</p>
        </div>
        <Button onClick={handleSave} className="bg-edu-gradient text-white h-11 px-6 rounded-xl shadow-lg shadow-sky-200">
          <Save className="w-4 h-4 mr-2"/> Enregistrer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2xl] border-none shadow-2xl">
          <CardHeader><CardTitle className="text-lg font-bold text-slate-800">Année Scolaire & Cycles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label>Année Scolaire Active</Label>
               <Select defaultValue="2024-2025">
                 <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="2023-2024">2023 - 2024</SelectItem>
                   <SelectItem value="2024-2025">2024 - 2025</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Format d'Évaluation</Label>
               <Select defaultValue="trimesters">
                 <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="trimesters">Trimestriel</SelectItem>
                   <SelectItem value="semesters">Semestriel</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2xl] border-none shadow-2xl">
          <CardHeader><CardTitle className="text-lg font-bold text-slate-800">Établissement</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label>Devise</Label>
               <Input defaultValue="Franc CFA" className="h-11 rounded-xl" />
             </div>
             <div className="space-y-2">
               <Label>Directeur/Directrice</Label>
               <Input placeholder="Nom du responsable" className="h-11 rounded-xl" />
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
