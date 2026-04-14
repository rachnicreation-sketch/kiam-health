import { useState, useEffect } from "react";
import { User, UserRole } from "@/lib/mock-data";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCog, Mail, Lock, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function HumanResources() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("doctor");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = () => {
    const allUsers: User[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
    if (currentUser?.clinicId) {
      setUsers(allUsers.filter(u => u.clinicId === currentUser.clinicId));
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword || !currentUser?.clinicId) return;

    const allUsers: User[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
    const newUser: User = {
      id: `u${Date.now()}`,
      email: newEmail,
      passwordHash: newPassword,
      role: newRole,
      clinicId: currentUser.clinicId,
      name: newName,
      specialty: newSpecialty,
      phone: newPhone
    };

    const updatedUsers = [...allUsers, newUser];
    localStorage.setItem('kiam_users', JSON.stringify(updatedUsers));
    
    setUsers(updatedUsers.filter(u => u.clinicId === currentUser.clinicId));
    setIsAddDialogOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewSpecialty("");
    setNewPhone("");
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'clinic_admin': return <Badge variant="default">Administrateur</Badge>;
      case 'doctor': return <Badge variant="outline" className="border-primary text-primary">Médecin</Badge>;
      case 'pharmacist': return <Badge variant="outline" className="border-success text-success">Pharmacien</Badge>;
      case 'receptionist': return <Badge variant="outline" className="border-warning text-warning">Réceptionniste</Badge>;
      default: return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            Ressources Humaines
          </h1>
          <p className="text-muted-foreground text-sm">Gérez le personnel et les accès de votre établissement</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau membre du personnel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Dr. Sarah Traoré" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="pl-9" placeholder="sarah@clinique.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle / Accréditation</Label>
                <Select value={newRole} onValueChange={(val: UserRole) => setNewRole(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Médecin</SelectItem>
                    <SelectItem value="pharmacist">Pharmacien</SelectItem>
                    <SelectItem value="receptionist">Réceptionniste</SelectItem>
                    <SelectItem value="clinic_admin">Administrateur Adjoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Spécialité (Optionnel)</Label>
                  <Input id="specialty" value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)} placeholder="Cardiologue, IDE..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+242..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="pass" required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-9" placeholder="Créer un mot de passe" />
                </div>
              </div>
              <Button type="submit" className="w-full">Enregistrer le membre</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste du personnel</CardTitle>
          <CardDescription>Tous les utilisateurs ayant accès à cette clinique.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground">{u.phone || "Pas de tel"}</div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-primary">{u.specialty || "--"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
