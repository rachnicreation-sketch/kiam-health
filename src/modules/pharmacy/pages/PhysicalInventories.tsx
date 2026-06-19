import { useState, useEffect } from "react";
import { Plus, Check, Save, ArrowRight, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function PhysicalInventories() {
  const { toast } = useToast();
  const [inventories, setInventories] = useState<any[]>([]);
  const [activeInv, setActiveInv] = useState<any>(null);
  const [isStartOpen, setIsStartOpen] = useState(false);

  useEffect(() => {
    loadInventories();
  }, []);

  const loadInventories = async () => {
    try {
      const data = await apiRequest("pharmacy.php?action=list_physical_inventories");
      setInventories(data || []);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les inventaires." });
    }
  };

  const handleStartInventory = async () => {
    try {
      const res = await apiRequest("pharmacy.php?action=start_physical_inventory", { method: "POST" });
      setIsStartOpen(false);
      loadInventories();
      toast({ title: "Succès", description: "Nouvelle campagne d'inventaire démarrée." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleUpdateItem = (itemId: number, actualQty: string) => {
    if (!activeInv) return;
    const qty = parseInt(actualQty) || 0;
    
    const updatedItems = activeInv.items.map((it: any) => {
      if (it.id === itemId) {
        return { ...it, actual_qty: qty, difference: qty - it.expected_qty };
      }
      return it;
    });
    setActiveInv({ ...activeInv, items: updatedItems });
  };

  const handleUpdateReason = (itemId: number, reason: string) => {
    if (!activeInv) return;
    const updatedItems = activeInv.items.map((it: any) => {
      if (it.id === itemId) return { ...it, reason };
      return it;
    });
    setActiveInv({ ...activeInv, items: updatedItems });
  };

  const handleSaveInventory = async (status: string) => {
    if (!activeInv) return;
    try {
      await apiRequest("pharmacy.php?action=save_physical_inventory", {
        method: "POST",
        body: JSON.stringify({
          inventory_id: activeInv.id,
          items: activeInv.items,
          status: status
        })
      });
      toast({ title: "Succès", description: "Inventaire " + (status === 'validated' ? "validé et stocks ajustés." : "sauvegardé.") });
      setActiveInv(null);
      loadInventories();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  if (activeInv) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-xl font-bold">Campagne d'Inventaire #{activeInv.id.substring(0,12)}</h1>
            <p className="text-sm text-slate-500">Saisissez les quantités physiquement comptées dans les rayons.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveInv(null)}>Fermer</Button>
            <Button variant="secondary" onClick={() => handleSaveInventory('draft')} className="gap-2">
              <Save className="h-4 w-4" /> Sauvegarder Brouillon
            </Button>
            <Button onClick={() => handleSaveInventory('validated')} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Check className="h-4 w-4" /> Valider & Ajuster Stocks
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Stock Informatique</TableHead>
                  <TableHead className="text-right w-[150px]">Compté Physique</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                  <TableHead>Justification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeInv.items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">{item.medication_name}</TableCell>
                    <TableCell className="text-right font-mono">{item.expected_qty}</TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number" 
                        min="0"
                        className="h-8 text-right font-mono"
                        value={item.actual_qty}
                        onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                        disabled={activeInv.status === 'validated'}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {item.difference === 0 ? (
                        <span className="text-slate-400">0</span>
                      ) : item.difference > 0 ? (
                        <span className="text-emerald-600">+{item.difference}</span>
                      ) : (
                        <span className="text-rose-600">{item.difference}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input 
                        className="h-8 text-xs" 
                        placeholder="Ex: Cassé, périmé..."
                        value={item.reason || ''}
                        onChange={(e) => handleUpdateReason(item.id, e.target.value)}
                        disabled={activeInv.status === 'validated'}
                      />
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventaires Physiques</h1>
          <p className="text-sm text-muted-foreground">Historique et gestion des comptages de stocks réels.</p>
        </div>
        <Button onClick={() => setIsStartOpen(true)} className="bg-slate-800 gap-2">
          <Plus className="h-4 w-4" /> Démarrer un inventaire
        </Button>
      </div>

      <div className="grid gap-4">
        {inventories.map((inv) => (
          <Card key={inv.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="py-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {inv.id}
                    <Badge variant={inv.status === 'validated' ? 'default' : 'secondary'} className={inv.status === 'validated' ? 'bg-emerald-100 text-emerald-800' : ''}>
                      {inv.status === 'validated' ? 'Validé' : 'Brouillon'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Créé le {new Date(inv.created_at).toLocaleString()} par {inv.user_name || "Système"}
                    {inv.validated_at && ` • Validé le ${new Date(inv.validated_at).toLocaleString()}`}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveInv(inv)} className="gap-2">
                  {inv.status === 'validated' ? 'Consulter' : 'Continuer la saisie'} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
        {inventories.length === 0 && (
          <div className="text-center py-12 text-slate-500 border rounded-lg bg-slate-50">
            Aucun inventaire physique enregistré.
          </div>
        )}
      </div>

      <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Démarrer un nouvel inventaire</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600">
            <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
            <p>Attention: Lors d'une campagne d'inventaire, il est recommandé de suspendre les ventes ou les réceptions de marchandises pour éviter les écarts faussés.</p>
            <p className="mt-2 font-bold text-slate-800">Voulez-vous figer le stock actuel et démarrer le comptage ?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartOpen(false)}>Annuler</Button>
            <Button onClick={handleStartInventory} className="bg-emerald-600 text-white gap-2">
              <Play className="h-4 w-4" /> Figer le stock & Démarrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
