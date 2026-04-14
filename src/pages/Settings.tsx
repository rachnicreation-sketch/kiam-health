import { useState, useEffect } from "react";
import { 
  Building2, 
  User, 
  Save, 
  Camera, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck,
  CreditCard,
  Bell,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Clinic, User as UserType } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (!user?.clinicId) return;
    const allClinics: Clinic[] = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
    const allUsers: UserType[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
    
    setClinic(allClinics.find(c => c.id === user.clinicId) || null);
    setUserProfile(allUsers.find(u => u.id === user.id) || null);
  };

  const handleSaveClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic || !user?.clinicId) return;

    const allClinics: Clinic[] = JSON.parse(localStorage.getItem('kiam_clinics') || '[]');
    const updatedClinics = allClinics.map(c => c.id === user.clinicId ? clinic : c);
    
    localStorage.setItem('kiam_clinics', JSON.stringify(updatedClinics));
    toast({ title: "Paramètres enregistrés", description: "Les informations de la clinique ont été mises à jour." });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !user?.id) return;

    const allUsers: UserType[] = JSON.parse(localStorage.getItem('kiam_users') || '[]');
    const updatedUsers = allUsers.map(u => u.id === user.id ? userProfile : u);
    
    localStorage.setItem('kiam_users', JSON.stringify(updatedUsers));
    toast({ title: "Profil mis à jour", description: "Vos informations personnelles ont été enregistrées." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          Paramètres & Configuration
        </h1>
        <p className="text-muted-foreground text-sm">Gérez votre établissement et vos préférences personnelles</p>
      </div>

      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="grid w-full sm:w-[600px] grid-cols-2 sm:grid-cols-4 bg-muted/50 p-1">
          <TabsTrigger value="clinic" className="gap-2"><Building2 className="h-4 w-4" /> Ma Clinique</TabsTrigger>
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" /> Mon Profil</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><ShieldCheck className="h-4 w-4" /> Sécurité</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-4 w-4" /> Abonnement</TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="pt-4">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 border-b">
               <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                 <Building2 className="h-4 w-4" /> Identité de l'Établissement
               </CardTitle>
               <CardDescription>Ces informations apparaîtront sur vos factures et ordonnances.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveClinic} className="space-y-8">
                {/* Branding Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="space-y-4 flex flex-col items-center">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Logo de la Clinique</Label>
                    <div className="relative group cursor-pointer">
                      <div className="h-32 w-32 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/10 overflow-hidden">
                        {clinic?.logo ? (
                          <img src={clinic.logo} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" type="button" className="text-xs">Changer le logo</Button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cname">Nom de l'établissement</Label>
                      <Input id="cname" value={clinic?.name || ""} onChange={e => clinic && setClinic({...clinic, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxid">Identifiant Fiscal (NIF/RCCM)</Label>
                      <Input id="taxid" value={clinic?.taxId || ""} onChange={e => clinic && setClinic({...clinic, taxId: e.target.value})} placeholder="RCCM CG-BZV-..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email" className="pl-9" value={clinic?.email || ""} onChange={e => clinic && setClinic({...clinic, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" className="pl-9" value={clinic?.phone || ""} onChange={e => clinic && setClinic({...clinic, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Adresse du siège</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-[34px] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="address" className="pl-9" value={clinic?.address || ""} onChange={e => clinic && setClinic({...clinic, address: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="web">Site Web</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="web" className="pl-9" value={clinic?.website || ""} onChange={e => clinic && setClinic({...clinic, website: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t pt-6">
                  <Button type="submit" className="gap-2 px-8">
                    <Save className="h-4 w-4" /> Mettre à jour la clinique
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="pt-4">
           <Card className="border-none shadow-md bg-white max-w-2xl">
              <CardHeader className="bg-muted/30 border-b">
                 <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Informations Personnelles</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                 <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>Nom complet</Label>
                          <Input value={userProfile?.name || ""} onChange={e => userProfile && setUserProfile({...userProfile, name: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <Label>Email (Identifiant)</Label>
                          <Input value={userProfile?.email || ""} disabled />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label>Spécialité / Fonction</Label>
                          <Input value={userProfile?.specialty || ""} onChange={e => userProfile && setUserProfile({...userProfile, specialty: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <Label>Numéro de téléphone</Label>
                          <Input value={userProfile?.phone || ""} onChange={e => userProfile && setUserProfile({...userProfile, phone: e.target.value})} />
                       </div>
                    </div>
                    <div className="flex justify-end pt-4">
                       <Button type="submit" variant="default">Enregistrer le profil</Button>
                    </div>
                 </form>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="security" className="pt-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                   <CardTitle className="text-sm font-bold uppercase tracking-wider">Changement de Mot de passe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                      <Label>Ancien mot de passe</Label>
                      <Input type="password" />
                   </div>
                   <div className="space-y-2">
                      <Label>Nouveau mot de passe</Label>
                      <Input type="password" />
                   </div>
                   <Button variant="outline" className="w-full">Réinitialiser le mot de passe</Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white">
                <CardHeader>
                   <CardTitle className="text-sm font-bold uppercase tracking-wider">Double Authentification (2FA)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                      <div>
                         <p className="text-sm font-bold">Statut Actuel</p>
                         <p className="text-xs text-muted-foreground">Désactivé</p>
                      </div>
                      <Button variant="outline" size="sm">Activer 2FA</Button>
                   </div>
                   <p className="text-xs text-muted-foreground italic">Sécurisez votre accès avec une application d'authentification ou par SMS.</p>
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="billing" className="pt-4">
           <Card className="border-none shadow-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-8 space-y-6">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-2">OFFRE PREMIUM</Badge>
                       <h3 className="text-2xl font-black">Plan Kiam Professionnel</h3>
                       <p className="text-sm opacity-80 italic">Renouvellement le 10/05/2026</p>
                    </div>
                    <div className="text-right">
                       <p className="text-4xl font-black">45.000 <span className="text-lg">CFA</span></p>
                       <p className="text-xs opacity-70">par mois / clinique</p>
                    </div>
                 </div>

                 <Separator className="bg-white/10" />

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><Bell className="h-4 w-4" /></div>
                       <p className="text-xs">Support 24/7 Illimité</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><HardDrive className="h-4 w-4" /></div>
                       <p className="text-xs">Stockage Cloud 100 Go</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><User className="h-4 w-4" /></div>
                       <p className="text-xs">Utilisateurs Illimités</p>
                    </div>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <Button variant="secondary" className="font-bold">Factures d'abonnement</Button>
                    <Button variant="outline" className="text-white border-white/30 bg-white/10 hover:bg-white/20">Changer de plan</Button>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
