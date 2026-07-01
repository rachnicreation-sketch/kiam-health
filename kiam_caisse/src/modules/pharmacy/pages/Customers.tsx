import { useState, useEffect } from "react";
import { 
  Users, Plus, Search, ShieldCheck, CreditCard, Mail, 
  Phone, MapPin, Building2, Receipt, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function Customers() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [customerForm, setCustomerForm] = useState({
    type: "individual", name: "", contact_name: "", phone: "", email: "", 
    address: "", credit_limit: "0", company_name: "", insurance_agreement: "", 
    reimbursement_rate: "0", ceiling: "0", status: "active"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiRequest("pharmacy.php?action=list_customers");
      setCustomers(data);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les clients." });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("pharmacy.php?action=save_customer", {
        method: "POST",
        body: JSON.stringify(customerForm)
      });
      toast({ title: "Client enregistré", description: "La fiche client/assurance a été mise à jour." });
      setIsAddOpen(false);
      loadData();
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const resetForm = () => {
    setCustomerForm({
      type: "individual", name: "", contact_name: "", phone: "", email: "", 
      address: "", credit_limit: "0", company_name: "", insurance_agreement: "", 
      reimbursement_rate: "0", ceiling: "0", status: "active"
    });
  };

  const filteredCusts = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm)) || 
    (c.contact_name && c.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Clients & Conventions d'Assurance</h1>
          <p className="text-xs text-muted-foreground">Fichier clients particuliers, mutuelles, compagnies et conventions tiers-payant.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs h-9">
          <Plus className="h-4 w-4" /> Nouveau Client / Partenaire
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Rechercher par nom, téléphone..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="pl-10 h-10 bg-white"
        />
      </div>

      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partenaire</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Coordonnées</TableHead>
                <TableHead className="text-right">Limite de Crédit</TableHead>
                <TableHead className="text-right">Taux Tiers-Payant</TableHead>
                <TableHead className="text-right">Encours Actuel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCusts.map(c => (
                <TableRow key={c.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <div className="font-bold text-slate-800 text-xs">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">{c.contact_name || "--"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      c.type === 'insurance' ? 'destructive' :
                      c.type === 'mutuelle' ? 'secondary' :
                      c.type === 'company' ? 'outline' : 'default'
                    } className="text-[10px] uppercase font-bold">
                      {c.type === 'insurance' ? 'Assurance' :
                       c.type === 'mutuelle' ? 'Mutuelle' :
                       c.type === 'company' ? 'Entreprise' : 'Particulier'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" /> {c.phone || "--"}</div>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px]"><Mail className="h-3 w-3" /> {c.email || "--"}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {c.type === 'company' || c.type === 'individual' ? `${Number(c.credit_limit).toLocaleString()} CFA` : "--"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-700 text-xs">
                    {c.type === 'insurance' || c.type === 'mutuelle' ? `${c.reimbursement_rate}%` : "--"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-rose-600 text-xs">
                    {Number(c.debt_balance).toLocaleString()} CFA
                  </TableCell>
                </TableRow>
              ))}
              {filteredCusts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 italic">Aucun partenaire trouvé.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG: ADD CUSTOMER */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau Partenaire Officine</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Type de Partenaire *</Label>
              <Select value={customerForm.type} onValueChange={v => setCustomerForm({...customerForm, type: v})}>
                <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Particulier / Client</SelectItem>
                  <SelectItem value="company">Entreprise abonnée (Crédit)</SelectItem>
                  <SelectItem value="insurance">Compagnie d'Assurance</SelectItem>
                  <SelectItem value="mutuelle">Mutuelle Santé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nom / Raison Sociale *</Label>
              <Input required value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="h-9 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom du Contact</Label>
                <Input value={customerForm.contact_name} onChange={e => setCustomerForm({...customerForm, contact_name: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone *</Label>
                <Input required value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Adresse Email</Label>
              <Input type="email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="h-9 text-xs" />
            </div>

            {/* Conditional fields based on type */}
            {(customerForm.type === "company" || customerForm.type === "individual") && (
              <div className="space-y-1.5">
                <Label className="text-xs">Limite de Crédit autorisée (CFA)</Label>
                <Input type="number" value={customerForm.credit_limit} onChange={e => setCustomerForm({...customerForm, credit_limit: e.target.value})} className="h-9 text-xs" />
              </div>
            )}

            {(customerForm.type === "insurance" || customerForm.type === "mutuelle") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Taux de remboursement (%)</Label>
                  <Input type="number" min={0} max={100} value={customerForm.reimbursement_rate} onChange={e => setCustomerForm({...customerForm, reimbursement_rate: e.target.value})} className="h-9 text-xs" placeholder="ex: 80" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Plafond annuel (CFA)</Label>
                  <Input type="number" value={customerForm.ceiling} onChange={e => setCustomerForm({...customerForm, ceiling: e.target.value})} className="h-9 text-xs" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
              Enregistrer le Partenaire
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
