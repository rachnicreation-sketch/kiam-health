import { useState, useEffect } from "react";
import { Clinic, User } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Users, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";

export default function SaaSAdminDashboard() {
  const { toast } = useToast();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.clinics.list();
      setClinics(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les cliniques." });
    } finally {
      setLoading(false);
    }
  };

  const toggleClinicStatus = async (clinicId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await api.clinics.update({ id: clinicId, status: newStatus });
      toast({ title: "Statut mis à jour", description: `La clinique est désormais ${newStatus}.` });
      loadData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de modifier le statut." });
    }
  };

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newAdminEmail || !newAdminPassword) return;

    try {
      // 1. Ajouter la clinique
      const clinicResponse = await api.clinics.create({
        name: newClinicName,
        status: 'active'
      });

      if (clinicResponse.status === 'success') {
        const newClinicId = clinicResponse.id;

        // 2. Ajouter l'utilisateur admin pour cette clinique
        await api.users.create({
          email: newAdminEmail,
          password: newAdminPassword,
          role: 'clinic_admin',
          clinicId: newClinicId,
          name: `Admin ${newClinicName}`
        });

        toast({ title: "Succès", description: `La clinique ${newClinicName} et son administrateur ont été créés.` });
        loadData();
        setIsAddDialogOpen(false);
        setNewClinicName("");
        setNewAdminEmail("");
        setNewAdminPassword("");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur de création", description: error.message });
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panneau SaaS</h2>
          <p className="text-muted-foreground mt-1">
            Gérez vos clients et les accès aux cliniques.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une clinique
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle Clinique Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClinic} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="cname">Nom de l'établissement</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="cname" required value={newClinicName} onChange={e => setNewClinicName(e.target.value)} className="pl-9" placeholder="Clinique XYZ" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cemail">Email du gestionnaire</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="cemail" required type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="pl-9" placeholder="admin@xyz.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpass">Mot de passe initial</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="cpass" required type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="pl-9" placeholder="Choisir un mot de passe" />
                </div>
              </div>
              <Button type="submit" className="w-full">Créer l'accès</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cliniques clientes</CardTitle>
          <CardDescription>Liste de tous les clients souscrits à Kiam SaaS.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifiant</TableHead>
                <TableHead>Nom de la clinique</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead>Accès Actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-mono text-xs">{clinic.id}</TableCell>
                  <TableCell className="font-medium">{clinic.name}</TableCell>
                  <TableCell>{new Date(clinic.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={clinic.status === 'active'}
                        onCheckedChange={() => toggleClinicStatus(clinic.id, clinic.status)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {clinic.status === 'active' ? 'Oui' : 'Bloqué'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      </Card>
    </div>
  );
}
