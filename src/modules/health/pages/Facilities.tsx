import { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Settings2,
  Trash2,
  Edit2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Branch } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-service";

export default function Facilities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<Partial<Branch>>({
    name: "",
    type: "branch",
    address: "",
    phone: "",
    manager: "",
    status: "open"
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.branches.list(user.clinicId);
      setBranches(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Chargement des sites échoué." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.address || !user?.clinicId) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir les champs obligatoires." });
      return;
    }

    try {
      if (editingBranch) {
        await api.branches.update({ ...form, id: editingBranch.id });
        toast({ title: "Site mis à jour", description: "Les informations de l'établissement ont été enregistrées." });
      } else {
        await api.branches.create({ ...form, clinicId: user.clinicId });
        toast({ title: "Nouveau site ajouté", description: "L'établissement a été créé avec succès." });
      }

      loadData();
      setIsAddDialogOpen(false);
      setEditingBranch(null);
      setForm({ name: "", type: "branch", address: "", phone: "", manager: "", status: "open" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cet établissement ?")) {
      try {
        await api.branches.delete(id);
        loadData();
        toast({ title: "Site supprimé", description: "L'établissement a été retiré." });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erreur", description: error.message });
      }
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Établissements & Sites
          </h1>
          <p className="text-muted-foreground text-sm">Gérez vos différentes succursales et plateaux techniques</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingBranch(null);
            setForm({ name: "", type: "branch", address: "", phone: "", manager: "", status: "open" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Ajouter un Établissement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Modifier l'établissement" : "Nouvel Établissement"}</DialogTitle>
              <CardDescription>Configurez les détails du site physique ou du département.</CardDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du site *</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Antenne Nord" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({...form, type: v as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headquarters">Siège Social</SelectItem>
                      <SelectItem value="branch">Succursale</SelectItem>
                      <SelectItem value="department">Département Spécialisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse Complète *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Rue, Quartier, Ville..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+242..." />
                </div>
                <div className="space-y-2">
                  <Label>Responsable / Manager</Label>
                  <Input value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} placeholder="Nom du responsable" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} className="w-full">
                {editingBranch ? "Enregistrer les modifications" : "Créer l'établissement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un site..." 
              className="pl-9 bg-white border-none shadow-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Sites Actifs</p>
                <p className="text-sm font-black">{branches.filter(b => b.status === 'open').length}</p>
             </div>
             <div className="h-8 w-[1px] bg-border"></div>
             <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Personnel</p>
                <p className="text-sm font-black">24 agents</p>
             </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <Card key={branch.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white">
            <div className={`h-1.5 w-full ${branch.type === 'headquarters' ? 'bg-primary' : 'bg-blue-400'}`}></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                   <Building2 className="h-5 w-5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2" onClick={() => {
                      setEditingBranch(branch);
                      setForm(branch);
                      setIsAddDialogOpen(true);
                    }}>
                      <Edit2 className="h-4 w-4" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(branch.id)}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="pt-2">
                <CardTitle className="text-lg font-bold">{branch.name}</CardTitle>
                <Badge variant="secondary" className="mt-1 text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-none">
                  {branch.type === 'headquarters' ? 'Siège Principal' : branch.type === 'branch' ? 'Succursale' : 'Département'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-foreground">Géré par {branch.manager}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-dashed">
                <div className="flex items-center gap-2">
                  {branch.status === 'open' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                      <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></div>
                      Opérationnel
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                      <Clock className="h-3 w-3" />
                      Fermé Temporairement
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-primary gap-1 group/btn px-0 hover:bg-transparent">
                   Accéder au site <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">Aucun établissement trouvé</h3>
            <p className="text-muted-foreground">Commencez par ajouter votre premier site pour organiser votre activité.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Ajouter maintenant
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Conformité & Normes
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  Tous vos établissements doivent respecter les normes sanitaires en vigueur. Assurez-vous que les informations de contact et les responsables sont à jour pour les inspections réglementaires.
               </p>
            </CardContent>
         </Card>
         <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardHeader>
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" /> Astuce Multisite
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-xs text-muted-foreground leading-relaxed">
                  Vous pouvez filtrer vos inventaires (Pharmacie) et vos statistiques (Finances) par établissement pour une vision plus précise de la performance de chaque site.
               </p>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
