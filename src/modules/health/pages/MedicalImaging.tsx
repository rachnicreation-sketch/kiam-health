import { useState } from "react";
import {
  FileImage, Upload, Search, Download, Trash2, Tag, Image as ImageIcon,
  Eye, Calendar, User, FileText, Plus, CheckCircle2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface ImagingStudy {
  id: string;
  patientName: string;
  type: "Radio" | "Écho" | "Scanner" | "IRM";
  date: string;
  technician: string;
  conclusions: string;
  imageUrl: string;
}

const MOCK_STUDIES: ImagingStudy[] = [
  { id: "IMG-001", patientName: "Aissatou Sow", type: "Radio", date: "2026-07-06", technician: "M. Faye", conclusions: "Fracture non déplacée du tibia gauche", imageUrl: "/imaging/placeholder_xray.png" },
  { id: "IMG-002", patientName: "Amadou Diallo", type: "Écho", date: "2026-07-07", technician: "Mme. Cissé", conclusions: "Échographie abdominale normale", imageUrl: "/imaging/placeholder_echo.png" },
  { id: "IMG-003", patientName: "Moussa Diouf", type: "Scanner", date: "2026-07-05", technician: "M. Faye", conclusions: "Scanner thoracique sans particularité", imageUrl: "/imaging/placeholder_scanner.png" },
];

export default function MedicalImaging() {
  const { toast } = useToast();
  const [studies, setStudies] = useState<ImagingStudy[]>(MOCK_STUDIES);
  const [search, setSearch] = useState("");
  const [selectedStudy, setSelectedStudy] = useState<ImagingStudy | null>(null);

  const filtered = studies.filter(s =>
    s.patientName.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <FileImage className="h-7 w-7 text-sky-600" /> Imagerie Médicale
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Archivage, consultation de radiographies, échographies et IRM liées aux dossiers patients.</p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700 text-white gap-2"
          onClick={() => toast({ title: "Bientôt disponible", description: "L'upload de DICOM sera disponible prochainement." })}>
          <Upload className="h-4 w-4" /> Uploader un examen
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Examens archivés" value={String(studies.length)} icon={FileImage} iconClassName="bg-sky-100 text-sky-600" />
        <StatCard title="Radiographies" value={String(studies.filter(s => s.type === "Radio").length)} icon={ImageIcon} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Échographies" value={String(studies.filter(s => s.type === "Écho").length)} icon={ImageIcon} iconClassName="bg-emerald-100 text-emerald-600" />
        <StatCard title="Aujourd'hui" value="2" icon={Calendar} iconClassName="bg-violet-100 text-violet-600" />
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher patient, type d'examen..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(study => (
          <Card key={study.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedStudy(study)}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-sky-700 bg-sky-50 border-sky-200">{study.type}</Badge>
                <p className="text-xs text-muted-foreground">{study.date}</p>
              </div>
              <div>
                <h3 className="font-bold text-sm">{study.patientName}</h3>
                <p className="text-xs text-muted-foreground">Technicien : {study.technician}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs">
                <p className="font-semibold text-slate-700 mb-0.5">Conclusion :</p>
                <p className="text-slate-600 truncate">{study.conclusions}</p>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                <Eye className="h-3 w-3" /> Ouvrir l'examen
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedStudy && (
        <Dialog open={!!selectedStudy} onOpenChange={() => setSelectedStudy(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center mr-4">
                <span>{selectedStudy.patientName} — {selectedStudy.type}</span>
                <Badge className="text-sky-700 bg-sky-50 border-sky-200">{selectedStudy.type}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Virtual Lightbox Placeholder */}
              <div className="w-full aspect-video bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-600">
                <FileImage className="h-16 w-16 mb-2 opacity-40 text-sky-400" />
                <p className="text-xs font-mono">VISIONNEUSE LIGHTBOX (Simulation)</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">{selectedStudy.id} · Resolution: 2048x2048</p>
              </div>

              <div className="space-y-2">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span><strong>Date d'examen :</strong> {selectedStudy.date}</span>
                  <span><strong>Opérateur :</strong> {selectedStudy.technician}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                  <p className="font-bold text-slate-700 mb-1">Conclusions médicales :</p>
                  <p className="text-slate-600 leading-relaxed">{selectedStudy.conclusions}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1"><Download className="h-4 w-4" /> Télécharger</Button>
                <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white flex-1">Ajouter au dossier</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
