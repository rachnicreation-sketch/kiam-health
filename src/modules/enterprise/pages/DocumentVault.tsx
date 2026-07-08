import { useState } from "react";
import {
  FolderOpen, Upload, Search, FileText, Download, Trash2,
  File, Image, Archive, Eye, Share2, Lock, Clock, Filter,
  Plus, FolderPlus, Star, Tag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

type DocType = "pdf" | "docx" | "xlsx" | "img" | "zip" | "other";

interface Document {
  id: string;
  name: string;
  type: DocType;
  size: string;
  project: string;
  category: string;
  uploadedBy: string;
  date: string;
  tags: string[];
  starred: boolean;
  shared: boolean;
}

const MOCK_DOCS: Document[] = [
  { id: "D001", name: "Contrat TotalEnergies 2026.pdf", type: "pdf", size: "2.4 MB", project: "Audit SI TotalEnergies", category: "Contrats", uploadedBy: "Seydou Camara", date: "2026-07-01", tags: ["signature", "juridique"], starred: true, shared: false },
  { id: "D002", name: "Spécifications_App_ClientA_v3.docx", type: "docx", size: "856 KB", project: "App Mobile Client A", category: "Livrables", uploadedBy: "Aïcha Barry", date: "2026-07-03", tags: ["technique", "v3"], starred: false, shared: true },
  { id: "D003", name: "Budget_Projet_CRM_Sonatel.xlsx", type: "xlsx", size: "1.1 MB", project: "CRM Sonatel", category: "Finance", uploadedBy: "Kofi Asante", date: "2026-07-05", tags: ["budget", "confidentiel"], starred: false, shared: false },
  { id: "D004", name: "Maquettes_Kiam_V2.zip", type: "zip", size: "45 MB", project: "Refonte Site Web Kiam", category: "Design", uploadedBy: "Aïcha Barry", date: "2026-07-06", tags: ["design", "figma"], starred: true, shared: true },
  { id: "D005", name: "Rapport_Audit_Q2_2026.pdf", type: "pdf", size: "3.8 MB", project: "Audit SI TotalEnergies", category: "Rapports", uploadedBy: "Seydou Camara", date: "2026-07-07", tags: ["audit", "confidentiel"], starred: false, shared: false },
  { id: "D006", name: "Photo_Equipe_Kiam.jpg", type: "img", size: "4.2 MB", project: "Formation Interne", category: "Divers", uploadedBy: "Rokhaya Ndiaye", date: "2026-06-28", tags: ["photo", "team"], starred: false, shared: true },
];

const CATEGORIES = ["Tous", "Contrats", "Livrables", "Finance", "Design", "Rapports", "Divers"];
const PROJECTS = ["Tous", "Audit SI TotalEnergies", "App Mobile Client A", "CRM Sonatel", "Refonte Site Web Kiam", "Formation Interne"];

const typeConfig: Record<DocType, { icon: any; color: string; bg: string }> = {
  pdf:   { icon: FileText, color: "text-rose-600",   bg: "bg-rose-50" },
  docx:  { icon: File,     color: "text-blue-600",   bg: "bg-blue-50" },
  xlsx:  { icon: File,     color: "text-emerald-600", bg: "bg-emerald-50" },
  img:   { icon: Image,    color: "text-violet-600",  bg: "bg-violet-50" },
  zip:   { icon: Archive,  color: "text-amber-600",   bg: "bg-amber-50" },
  other: { icon: File,     color: "text-slate-600",   bg: "bg-slate-50" },
};

export default function DocumentVault() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Document[]>(MOCK_DOCS);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Tous");
  const [filterProj, setFilterProj] = useState("Tous");
  const [view, setView] = useState<"grid" | "list">("grid");

  const toggleStar = (id: string) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, starred: !d.starred } : d));
  };

  const deleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    toast({ title: "Document supprimé" });
  };

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.includes(search.toLowerCase()));
    const matchCat = filterCat === "Tous" || d.category === filterCat;
    const matchProj = filterProj === "Tous" || d.project === filterProj;
    return matchSearch && matchCat && matchProj;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <FolderOpen className="h-7 w-7 text-indigo-600" /> Gestion Documentaire
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Contrats, livrables et fichiers par projet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><FolderPlus className="h-4 w-4" /> Nouveau dossier</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            onClick={() => toast({ title: "Bientôt disponible", description: "L'upload de fichiers sera disponible prochainement." })}>
            <Upload className="h-4 w-4" /> Uploader
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Documents" value={String(docs.length)} icon={FileText} iconClassName="bg-indigo-100 text-indigo-600" />
        <StatCard title="Partagés" value={String(docs.filter(d => d.shared).length)} icon={Share2} iconClassName="bg-blue-100 text-blue-600" />
        <StatCard title="Favoris" value={String(docs.filter(d => d.starred).length)} icon={Star} iconClassName="bg-amber-100 text-amber-600" />
        <StatCard title="Stockage utilisé" value="57.4 MB" icon={Archive} iconClassName="bg-slate-100 text-slate-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher un document, tag..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[160px]"><Tag className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterProj} onValueChange={setFilterProj}>
          <SelectTrigger className="w-[200px]"><FolderOpen className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>{PROJECTS.map(p => <SelectItem key={p} value={p}>{p.length > 20 ? p.slice(0, 20) + "…" : p}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(doc => {
          const cfg = typeConfig[doc.type];
          const Icon = cfg.icon;
          return (
            <Card key={doc.id} className="border-none shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-3 rounded-xl ${cfg.bg} shrink-0`}>
                    <Icon className={`h-6 w-6 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.size}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleStar(doc.id)}>
                    <Star className={`h-4 w-4 ${doc.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </Button>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" /> {doc.project.length > 30 ? doc.project.slice(0, 30) + "…" : doc.project}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(doc.date).toLocaleDateString("fr-FR")} · {doc.uploadedBy.split(" ")[0]}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-wrap mb-3">
                  <Badge variant="outline" className="text-[10px] h-4">{doc.category}</Badge>
                  {doc.shared && <Badge className="text-[10px] h-4 bg-blue-50 text-blue-600 border-blue-200">Partagé</Badge>}
                  {doc.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] h-4 text-slate-500">#{tag}</Badge>
                  ))}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7">
                    <Eye className="h-3 w-3" /> Voir
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-xs h-7 text-rose-500 hover:bg-rose-50" onClick={() => deleteDoc(doc.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun document trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
