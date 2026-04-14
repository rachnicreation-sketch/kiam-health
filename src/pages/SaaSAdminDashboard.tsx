import { useState, useEffect } from "react";
import { Clinic, User, resetSystemData } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Users, Lock, ShieldAlert, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SaaSAdminDashboard() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
    setClinics(data);
    setLoading(false);
  };

  const toggleClinicStatus = (clinicId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const updatedClinics = clinics.map(c => 
      c.id === clinicId ? { ...c, status: newStatus as any } : c
    );
    localStorage.setItem('kiam_clinics', JSON.stringify(updatedClinics));
    setClinics(updatedClinics);
  };

  const handleAddClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName || !newAdminEmail || !newAdminPassword) return;

    // Ajouter la clinique
    const newClinicId = `c${Date.now()}`;
    const newClinic: Clinic = {
      id: newClinicId,
      name: newClinicName,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const updatedClinics = [...clinics, newClinic];
    localStorage.setItem('kiam_clinics', JSON.stringify(updatedClinics));

    // Ajouter l'utilisateur
    const users: User[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
    const newUser: User = {
      id: `u${Date.now()}`,
      email: newAdminEmail,
      passwordHash: newAdminPassword, 
      role: 'clinic_admin',
      clinicId: newClinicId,
      name: `Admin ${newClinicName}`
    };
    localStorage.setItem('kiam_users', JSON.stringify([...users, newUser]));

    setClinics(updatedClinics);
    setIsAddDialogOpen(false);
    setNewClinicName("");
    setNewAdminEmail("");
    setNewAdminPassword("");
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

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Système & Maintenance
          </CardTitle>
          <CardDescription>
            Actions irréversibles sur l'ensemble de la plateforme SaaS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-white">
            <div className="space-y-1">
              <p className="text-sm font-bold">Réinitialisation d'Usine</p>
              <p className="text-xs text-muted-foreground">Efface toutes les données (patients, cliniques, consultations) et recharge les données par défaut.</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => {
                if(confirm("ATTENTION: Toutes vos données locales seront supprimées définitivement. Continuer ?")) {
                  resetSystemData();
                }
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser tout le système
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
