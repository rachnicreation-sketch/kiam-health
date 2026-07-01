import { useState, useEffect } from "react";
import {
  Settings, Save, Building2, Phone, Mail, Hash, Percent, FileText, MonitorSmartphone, Shield, Plus, Trash2, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function PharmacySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [form, setForm] = useState({
    pharmacy_name: "",
    address: "",
    phone: "",
    email: "",
    rccm: "",
    contribuable: "",
    tva_enabled: false,
    tva_rate: "18",
    ca_enabled: false,
    ca_rate: "5",
    receipt_footer: "Merci de votre visite !",
    currency: "CFA"
  });

  // Registers
  const [registers, setRegisters] = useState<any[]>([]);
  const [regDialog, setRegDialog] = useState(false);
  const [regForm, setRegForm] = useState({ id: "", name: "" });

  // Roles
  const [roles, setRoles] = useState<any[]>([]);
  const [roleDialog, setRoleDialog] = useState(false);
  const [roleForm, setRoleForm] = useState({ id: "", name: "", description: "", permissions: [] as string[] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [setRes, regRes, roleRes] = await Promise.all([
        apiRequest("pharmacy.php?action=get_settings"),
        apiRequest("pharmacy.php?action=list_registers"),
        apiRequest("pharmacy.php?action=list_roles")
      ]);
      
      if (setRes && !setRes.error) {
        setForm({
          pharmacy_name: setRes.pharmacy_name || "",
          address: setRes.address || "",
          phone: setRes.phone || "",
          email: setRes.email || "",
          rccm: setRes.rccm || "",
          contribuable: setRes.contribuable || "",
          tva_enabled: !!setRes.tva_enabled,
          tva_rate: String(setRes.tva_rate || "18"),
          ca_enabled: !!setRes.ca_enabled,
          ca_rate: String(setRes.ca_rate || "5"),
          receipt_footer: setRes.receipt_footer || "Merci de votre visite !",
          currency: setRes.currency || "CFA"
        });
      }
      setRegisters(regRes || []);
      setRoles(roleRes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("pharmacy.php?action=save_settings", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          tva_enabled: form.tva_enabled ? 1 : 0,
          ca_enabled: form.ca_enabled ? 1 : 0,
          tva_rate: parseFloat(form.tva_rate),
          ca_rate: parseFloat(form.ca_rate)
        })
      });
      toast({ title: "✅ Succès", description: "Paramètres mis à jour." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRegister = async () => {
    if (!regForm.name) return;
    try {
      await apiRequest("pharmacy.php?action=save_register", {
        method: "POST",
        body: JSON.stringify(regForm)
      });
      toast({ title: "✅ Succès", description: "Caisse enregistrée." });
      setRegDialog(false);
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleDeleteRegister = async (id: string) => {
    if (!confirm("Supprimer cette caisse ?")) return;
    try {
      await apiRequest("pharmacy.php?action=delete_register", {
        method: "POST",
        body: JSON.stringify({ id })
      });
      toast({ title: "✅ Succès", description: "Caisse supprimée." });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleSaveRole = async () => {
    if (!roleForm.name) return;
    try {
      await apiRequest("pharmacy.php?action=save_role", {
        method: "POST",
        body: JSON.stringify(roleForm)
      });
      toast({ title: "✅ Succès", description: "Rôle enregistré." });
      setRoleDialog(false);
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Supprimer ce rôle ?")) return;
    try {
      await apiRequest("pharmacy.php?action=delete_role", {
        method: "POST",
        body: JSON.stringify({ id })
      });
      toast({ title: "✅ Succès", description: "Rôle supprimé." });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const Toggle = ({ value, onChange, color = "emerald" }: any) => (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${value ? `bg-${color}-500` : "bg-slate-300"}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${value ? "translate-x-6" : ""}`} />
      </button>
      <span className={`text-sm font-semibold ${value ? `text-${color}-700` : "text-slate-500"}`}>
        {value ? "Activé" : "Désactivé"}
      </span>
    </div>
  );

  const PERMISSION_LIST = [
    { key: "pos_sale", label: "Effectuer des ventes (Caisse)" },
    { key: "manage_inventory", label: "Gérer le stock / Inventaires" },
    { key: "manage_procurement", label: "Achats & Réceptions" },
    { key: "view_reports", label: "Voir les rapports" },
    { key: "manage_users", label: "Gérer les utilisateurs" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-600" /> Paramètres & Administration
        </h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general"><Building2 className="w-4 h-4 mr-2" /> Général</TabsTrigger>
          <TabsTrigger value="registers"><MonitorSmartphone className="w-4 h-4 mr-2" /> Caisses</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="w-4 h-4 mr-2" /> Rôles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <Card className="border-none shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" /> Informations de l'Officine
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nom de la Pharmacie *</Label>
                    <Input required value={form.pharmacy_name} onChange={e => setForm({ ...form, pharmacy_name: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Devise</Label>
                    <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full h-9 border rounded-md px-3 text-sm">
                      <option value="CFA">CFA (FCFA)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Adresse</Label>
                  <Textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="text-sm resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Téléphone</Label>
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Email</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Percent className="h-4 w-4 text-emerald-600" /> Configuration des Taxes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className={`border-2 rounded-xl p-4 transition-all ${form.tva_enabled ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">TVA</p>
                    </div>
                    <Toggle value={form.tva_enabled} onChange={(v: boolean) => setForm({ ...form, tva_enabled: v })} color="emerald" />
                  </div>
                  {form.tva_enabled && (
                    <div className="flex items-center gap-3">
                      <Label className="text-xs font-bold whitespace-nowrap">Taux TVA (%)</Label>
                      <Input type="number" min="0" max="100" step="0.01" value={form.tva_rate} onChange={e => setForm({ ...form, tva_rate: e.target.value })} className="h-9 text-sm w-32" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Enregistrement..." : "Sauvegarder"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="registers">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-sm font-bold">Postes de Caisse (Multi-Caisses)</CardTitle>
              <Button onClick={() => { setRegForm({ id: "", name: "" }); setRegDialog(true); }} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Plus className="w-4 h-4 mr-1" /> Nouvelle Caisse
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Nom de la Caisse</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registers.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">Aucune caisse configurée</TableCell></TableRow>
                  ) : registers.map(reg => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.name}</TableCell>
                      <TableCell>{reg.status === 'open' ? <span className="text-emerald-600 font-bold">Ouverte</span> : <span className="text-slate-500">Fermée</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setRegForm(reg); setRegDialog(true); }}><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRegister(reg.id)} disabled={reg.status === 'open'}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <CardTitle className="text-sm font-bold">Rôles Utilisateurs</CardTitle>
              <Button onClick={() => { setRoleForm({ id: "", name: "", description: "", permissions: [] }); setRoleDialog(true); }} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Plus className="w-4 h-4 mr-1" /> Nouveau Rôle
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">Aucun rôle personnalisé</TableCell></TableRow>
                  ) : roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{role.description}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setRoleForm(role); setRoleDialog(true); }} disabled={role.is_system === 1}><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)} disabled={role.is_system === 1}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Dialog */}
      <Dialog open={regDialog} onOpenChange={setRegDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{regForm.id ? "Modifier la caisse" : "Nouvelle Caisse"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de la Caisse</Label>
              <Input value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} placeholder="Ex: Caisse Principale" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveRegister} className="bg-emerald-600 hover:bg-emerald-700 text-white">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{roleForm.id ? "Modifier le Rôle" : "Nouveau Rôle"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du Rôle</Label>
              <Input value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="Ex: Pharmacien Assistant" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="Que fait ce rôle ?" />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-2 border rounded-md p-3 max-h-48 overflow-y-auto bg-slate-50">
                {PERMISSION_LIST.map(p => {
                  const has = roleForm.permissions.includes(p.key);
                  return (
                    <label key={p.key} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="checkbox" 
                        checked={has}
                        onChange={(e) => {
                          if (e.target.checked) setRoleForm({...roleForm, permissions: [...roleForm.permissions, p.key]});
                          else setRoleForm({...roleForm, permissions: roleForm.permissions.filter(k => k !== p.key)});
                        }}
                        className="rounded text-emerald-600"
                      />
                      {p.label}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveRole} className="bg-emerald-600 hover:bg-emerald-700 text-white">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
