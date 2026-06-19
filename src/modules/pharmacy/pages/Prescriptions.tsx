import { useState, useEffect } from "react";
import { 
  ClipboardList, Plus, Search, FileText, Upload, Calendar, 
  User, Building, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function Prescriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_name: "", doctor_name: "", institution: "", prescription_date: "", notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiRequest("pharmacy.php?action=list_prescriptions");
      setPrescriptions(data);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les ordonnances." });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("pharmacy.php?action=save_prescription", {
        method: "POST",
        body: JSON.stringify(prescriptionForm)
      });
      toast({ title: "Ordonnance archivée", description: "L'ordonnance a été numérisée dans le registre." });
      setIsAddOpen(false);
      loadData();
      setPrescriptionForm({ patient_name: "", doctor_name: "", institution: "", prescription_date: "", notes: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const filteredPrescs = prescriptions.filter(p => 
    p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.doctor_name && p.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Registre des Ordonnances</h1>
          <p className="text-xs text-muted-foreground">Numérisation, scan, archivage et traçabilité des prescriptions médicales servies.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs h-9">
          <Plus className="h-4 w-4" /> Enregistrer Ordonnance Scan
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher par patient ou médecin..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="pl-10 h-10 bg-white"
        />
      </div>

      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro d'Archive</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Médecin Prescripteur</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Date Prescription</TableHead>
                <TableHead className="text-right">Fichier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescs.map(p => (
                <TableRow key={p.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-xs font-bold">{p.id}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-800 uppercase">{p.patient_name}</TableCell>
                  <TableCell className="text-xs">{p.doctor_name || "--"}</TableCell>
                  <TableCell className="text-xs text-slate-500">{p.institution || "--"}</TableCell>
                  <TableCell className="text-xs">{p.prescription_date || "--"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500 text-emerald-700 bg-emerald-50 cursor-pointer">
                      <FileText className="h-3 w-3" /> PDF / Scan
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPrescs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">Aucune ordonnance numérisée.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG: ADD PRESCRIPTION */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Numériser une Ordonnance</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nom complet du Patient *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input required value={prescriptionForm.patient_name} onChange={e => setPrescriptionForm({...prescriptionForm, patient_name: e.target.value})} className="pl-9 h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom du Médecin</Label>
                <Input value={prescriptionForm.doctor_name} onChange={e => setPrescriptionForm({...prescriptionForm, doctor_name: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Établissement émetteur</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={prescriptionForm.institution} onChange={e => setPrescriptionForm({...prescriptionForm, institution: e.target.value})} className="pl-9 h-9 text-xs" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date de la prescription</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={prescriptionForm.prescription_date} onChange={e => setPrescriptionForm({...prescriptionForm, prescription_date: e.target.value})} className="pl-9 h-9 text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Document Scan / PDF</Label>
                <div className="flex items-center justify-center border border-dashed rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors p-2 h-9">
                  <Upload className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-[10px] text-slate-500 font-bold">Uploader (Simulation)</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Détail des médicaments</Label>
              <Input value={prescriptionForm.notes} onChange={e => setPrescriptionForm({...prescriptionForm, notes: e.target.value})} className="h-9 text-xs" placeholder="ex: Doliprane 1g, Amox..." />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
              Enregistrer & Archiver
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
