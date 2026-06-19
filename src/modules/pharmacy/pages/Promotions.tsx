import { useState, useEffect } from "react";
import {
  Tag, Plus, Trash2, Edit2, Calendar, Percent, Gift, ShoppingBag, ToggleLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function Promotions() {
  const { toast } = useToast();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const [form, setForm] = useState({
    id: "", name: "", type: "percentage" as string,
    value: "", buy_qty: "", free_qty: "",
    applies_to: "all", target_id: "",
    min_purchase: "", start_date: "", end_date: "", is_active: 1
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("pharmacy.php?action=list_promotions");
      setPromos(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => setForm({
    id: "", name: "", type: "percentage", value: "", buy_qty: "", free_qty: "",
    applies_to: "all", target_id: "", min_purchase: "", start_date: "", end_date: "", is_active: 1
  });

  const openEdit = (p: any) => {
    setForm({
      id: p.id, name: p.name, type: p.type,
      value: String(p.value), buy_qty: String(p.buy_qty || ""),
      free_qty: String(p.free_qty || ""),
      applies_to: p.applies_to, target_id: p.target_id || "",
      min_purchase: String(p.min_purchase || ""),
      start_date: p.start_date, end_date: p.end_date,
      is_active: p.is_active ? 1 : 0
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      toast({ variant: "destructive", title: "Erreur", description: "Nom, dates de début et de fin requis." });
      return;
    }
    try {
      const payload: any = { ...form, value: parseFloat(form.value) || 0, min_purchase: parseFloat(form.min_purchase) || 0 };
      if (!form.id) delete payload.id;
      if (form.buy_qty) payload.buy_qty = parseInt(form.buy_qty);
      if (form.free_qty) payload.free_qty = parseInt(form.free_qty);

      await apiRequest("pharmacy.php?action=save_promotion", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      toast({ title: "✅ Promotion enregistrée" });
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette promotion ?")) return;
    try {
      await apiRequest("pharmacy.php?action=delete_promotion", {
        method: "POST", body: JSON.stringify({ id })
      });
      toast({ title: "✅ Promotion supprimée" });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "percentage": return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><Percent className="w-3 h-3 mr-1" /> Pourcentage</Badge>;
      case "fixed_amount": return <Badge className="bg-purple-100 text-purple-700 border-purple-200"><Tag className="w-3 h-3 mr-1" /> Montant fixe</Badge>;
      case "buy_x_get_y": return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Gift className="w-3 h-3 mr-1" /> X acheté Y offert</Badge>;
      default: return <Badge>{t}</Badge>;
    }
  };

  const isActive = (p: any) => {
    const now = new Date().toISOString().split("T")[0];
    return p.is_active && p.start_date <= now && p.end_date >= now;
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Tag className="h-5 w-5 text-emerald-600" /> Promotions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Créez des réductions, offres spéciales et promotions saisonnières.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nouvelle Promotion
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Aucune promotion</TableCell></TableRow>
              ) : promos.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{typeLabel(p.type)}</TableCell>
                  <TableCell className="font-bold">
                    {p.type === "percentage" ? `${p.value}%` : p.type === "fixed_amount" ? `${parseFloat(p.value).toLocaleString()} CFA` : `${p.buy_qty} + ${p.free_qty} offert`}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(p.start_date).toLocaleDateString("fr-FR")} → {new Date(p.end_date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {isActive(p) ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Modifier la Promotion" : "Nouvelle Promotion"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom de la Promotion *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Soldes de Noël" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Montant Fixe (CFA)</SelectItem>
                    <SelectItem value="buy_x_get_y">X acheté = Y offert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type !== "buy_x_get_y" ? (
                <div className="space-y-2">
                  <Label>Valeur {form.type === "percentage" ? "(%)" : "(CFA)"}</Label>
                  <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Acheter (X)</Label>
                    <Input type="number" value={form.buy_qty} onChange={e => setForm({ ...form, buy_qty: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Offrir (Y)</Label>
                    <Input type="number" value={form.free_qty} onChange={e => setForm({ ...form, free_qty: e.target.value })} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de Début *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date de Fin *</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Achat Minimum (CFA)</Label>
              <Input type="number" value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: e.target.value })} placeholder="0 = pas de minimum" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
