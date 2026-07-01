import { useState, useEffect } from "react";
import { 
  Truck, Plus, Search, Phone, Mail, MapPin,
  ArrowLeft, Trash2, Edit2, Package, ShieldCheck, 
  ShieldAlert, Award, FileText, CreditCard, DollarSign, 
  ExternalLink, MessageSquare, AlertTriangle, Building
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api-service";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Suppliers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "orders" | "balance">("info");
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    payment_terms: "immediate",
    rating: "average",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, [user, searchTerm, ratingFilter]);

  const loadData = async () => {
    if (!user?.clinicId) return;
    setIsLoading(true);
    try {
      const data = await api.procurement.suppliers(user.clinicId, searchTerm, ratingFilter);
      setSuppliers(data);
      const bal = await api.procurement.supplierBalance(user.clinicId);
      setBalanceSheet(bal);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les fournisseurs." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Champs requis", description: "Veuillez entrer une raison sociale." });
      return;
    }
    
    try {
      if (formData.id) {
        await api.procurement.updateSupplier({ ...formData, clinicId: user.clinicId });
        toast({ title: "Fournisseur mis à jour", description: `${formData.name} a été modifié avec succès.` });
      } else {
        await api.procurement.createSupplier({ ...formData, clinicId: user.clinicId });
        toast({ title: "Fournisseur créé", description: `${formData.name} a été enregistré dans le système.` });
      }
      setIsAddOpen(false);
      loadData();
      resetForm();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'enregistrement du partenaire." });
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      contact_name: "",
      phone: "",
      email: "",
      address: "",
      payment_terms: "immediate",
      rating: "average",
      notes: ""
    });
  };

  const handleEdit = (supplier: any) => {
    setFormData({
      id: supplier.id,
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      payment_terms: supplier.payment_terms || "immediate",
      rating: supplier.rating || "average",
      notes: supplier.notes || ""
    });
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ? Cette action est irréversible et vérifiera les commandes en cours.")) return;
    try {
      await api.procurement.deleteSupplier(user.clinicId, id);
      toast({ title: "Fournisseur supprimé", description: "Le fournisseur a été retiré de la base." });
      loadData();
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action impossible", description: error.message || "Ce fournisseur possède des commandes actives." });
    }
  };

  const viewDetail = async (supplierId: string) => {
    try {
      const detail = await api.procurement.supplier(user.clinicId, supplierId);
      setSelectedSupplier(detail);
      setDetailTab("info");
      setIsDetailOpen(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les détails du fournisseur." });
    }
  };

  // Helper translations and colors
  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "reliable":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold uppercase text-[9px] px-2 py-0.5 gap-1"><Award className="w-3 h-3" /> Fiable</Badge>;
      case "at_risk":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-bold uppercase text-[9px] px-2 py-0.5 gap-1"><ShieldAlert className="w-3 h-3" /> À Risque</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold uppercase text-[9px] px-2 py-0.5 gap-1"><ShieldCheck className="w-3 h-3" /> Moyen</Badge>;
    }
  };

  const getPaymentTermsLabel = (term: string) => {
    switch (term) {
      case "30_days": return "30 Jours Fin de Mois";
      case "60_days": return "60 Jours";
      case "cash": return "Comptant à la livraison";
      default: return "Paiement immédiat";
    }
  };

  // Aggregated KPIs
  const totalSuppliers = suppliers.length;
  const reliableCount = suppliers.filter(s => s.rating === 'reliable').length;
  const riskyCount = suppliers.filter(s => s.rating === 'at_risk').length;
  const totalOutstanding = balanceSheet.reduce((acc, curr) => acc + parseFloat(curr.balance_due || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/erp')} className="rounded-2xl bg-white shadow-sm border border-slate-100">
             <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <Truck className="h-8 w-8 text-indigo-600" /> Annuaire des Fournisseurs
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Notation de fiabilité, conditions de paiement et historique financier complet.</p>
          </div>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2 text-white shadow-lg shadow-indigo-100 h-11 px-6 rounded-xl border-none">
              <Plus className="w-4 h-4" /> Nouveau Partenaire
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl bg-white rounded-[2.5rem] p-8 border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{formData.id ? "Modifier la Fiche Fournisseur" : "Nouveau Partenaire Commercial"}</DialogTitle>
              <DialogDescription>Saisissez les coordonnées professionnelles et les paramètres financiers.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-5 pt-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Raison Sociale *</Label>
                <Input className="h-12 rounded-xl bg-slate-50 border-none text-slate-900 font-semibold" placeholder="Ex: SOGEDIS S.A." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nom du Contact</Label>
                <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Ex: M. Jean M'Vouta" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Téléphone</Label>
                <Input className="h-12 rounded-xl bg-slate-50 border-none font-mono" placeholder="+242 06 000 0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Adresse Email</Label>
                <Input className="h-12 rounded-xl bg-slate-50 border-none" type="email" placeholder="contact@fournisseur.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Siège Social / Adresse</Label>
                <Input className="h-12 rounded-xl bg-slate-50 border-none" placeholder="Brazzaville, Congo" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Conditions de Paiement</Label>
                <select 
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-sm text-slate-700 font-semibold focus:outline-none"
                  value={formData.payment_terms}
                  onChange={e => setFormData({...formData, payment_terms: e.target.value})}
                >
                  <option value="immediate">Paiement Immédiat</option>
                  <option value="cash">Comptant à la réception</option>
                  <option value="30_days">30 Jours Fin de Mois</option>
                  <option value="60_days">60 Jours Net</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fiabilité / Classement</Label>
                <select 
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-sm text-slate-700 font-semibold focus:outline-none"
                  value={formData.rating}
                  onChange={e => setFormData({...formData, rating: e.target.value})}
                >
                  <option value="reliable">Fiable (Excellent)</option>
                  <option value="average">Moyen (Régulier)</option>
                  <option value="at_risk">À risque (Livraisons en retard/Prix instables)</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Notes Internes</Label>
                <Textarea className="rounded-2xl bg-slate-50 border-none min-h-[80px]" placeholder="Précisions de négociation, remises régulières..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>
            <div className="pt-6">
              <Button className="w-full h-14 bg-indigo-600 font-black text-white rounded-2xl shadow-xl shadow-indigo-100" onClick={handleSave}>
                {formData.id ? "METTRE À JOUR LA FICHE" : "ENREGISTRER LE FOURNISSEUR"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Truck className="w-7 h-7" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Fournisseurs Actifs</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalSuppliers}</h3>
          </div>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Award className="w-7 h-7" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Classés Fiables</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{reliableCount}</h3>
          </div>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600"><ShieldAlert className="w-7 h-7" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Profils à Risque</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{riskyCount}</h3>
          </div>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><CreditCard className="w-7 h-7" /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400">Encours Total Dû</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{Number(totalOutstanding).toLocaleString()} <span className="text-xs">CFA</span></h3>
          </div>
        </Card>
      </div>

      {/* Main Panel */}
      <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-slate-50/50 border-b p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Rechercher par raison sociale..." 
                  className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 focus:outline-none"
                value={ratingFilter}
                onChange={e => setRatingFilter(e.target.value)}
              >
                <option value="">Tous les classements</option>
                <option value="reliable">Fiables</option>
                <option value="average">Moyens</option>
                <option value="at_risk">À risque</option>
              </select>
            </div>
            
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{suppliers.length} fournisseurs répertoriés</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="border-slate-100">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 p-6">Fournisseur / Raison Sociale</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fiabilité</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Direct</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conditions de Règlement</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Commandes</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Solde Dû</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right p-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center opacity-25">
                      <Truck className="h-16 w-16 mb-3 text-slate-400" />
                      <p className="font-black uppercase tracking-widest text-slate-500">Aucun fournisseur trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((sup) => (
                  <TableRow key={sup.id} className="group hover:bg-slate-50/50 border-slate-100 transition-colors cursor-pointer" onClick={() => viewDetail(sup.id)}>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm uppercase group-hover:bg-indigo-100 transition-colors">
                          {sup.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{sup.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wider">ID: {sup.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRatingBadge(sup.rating)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                          <Phone className="h-3 w-3 text-slate-400" /> {sup.phone || 'N/A'}
                        </div>
                        {sup.email && (
                          <a href={`mailto:${sup.email}`} className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 hover:underline">
                            <Mail className="h-3 w-3" /> {sup.email}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {getPaymentTermsLabel(sup.payment_terms)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-black text-slate-700">
                      {sup.total_orders || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-black text-amber-600">
                      {Number(sup.balance_due || 0).toLocaleString()} <span className="text-[9px]">CFA</span>
                    </TableCell>
                    <TableCell className="text-right p-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleEdit(sup)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(sup.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl bg-white rounded-[2.5rem] p-8 border-none">
          {selectedSupplier && (
            <>
              <DialogHeader className="flex flex-row items-center gap-4 justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg uppercase">
                    {selectedSupplier.name.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl font-black text-slate-900 uppercase">{selectedSupplier.name}</DialogTitle>
                      {getRatingBadge(selectedSupplier.rating)}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Identifiant unique: {selectedSupplier.id}</p>
                  </div>
                </div>
              </DialogHeader>

              {/* Tabs */}
              <div className="flex gap-2 border-b pt-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setDetailTab("info")} 
                  className={`rounded-none border-b-2 px-4 pb-2 h-10 font-bold uppercase text-[10px] tracking-widest ${detailTab === "info" ? "border-indigo-600 text-indigo-600 bg-transparent" : "border-transparent text-slate-400"}`}
                >
                  Informations
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setDetailTab("orders")} 
                  className={`rounded-none border-b-2 px-4 pb-2 h-10 font-bold uppercase text-[10px] tracking-widest ${detailTab === "orders" ? "border-indigo-600 text-indigo-600 bg-transparent" : "border-transparent text-slate-400"}`}
                >
                  Historique Achats ({selectedSupplier.orders?.length || 0})
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setDetailTab("balance")} 
                  className={`rounded-none border-b-2 px-4 pb-2 h-10 font-bold uppercase text-[10px] tracking-widest ${detailTab === "balance" ? "border-indigo-600 text-indigo-600 bg-transparent" : "border-transparent text-slate-400"}`}
                >
                  Balance Financière
                </Button>
              </div>

              {/* Tab Content */}
              <div className="pt-6 min-h-[300px]">
                {detailTab === "info" && (
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="p-5 border-none bg-slate-50/50 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Building className="w-4 h-4 text-indigo-500" /> Fiche Administrative</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Responsable / Contact</p>
                          <p className="text-sm font-bold text-slate-700">{selectedSupplier.contact_name || "Non spécifié"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Téléphone Mobile</p>
                          <p className="text-sm font-bold text-slate-700 font-mono">{selectedSupplier.phone || "Non spécifié"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Adresse de messagerie</p>
                          <p className="text-sm font-bold text-slate-700">{selectedSupplier.email || "Non spécifié"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Adresse Postale / Siège</p>
                          <p className="text-sm font-bold text-slate-700">{selectedSupplier.address || "Non spécifié"}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5 border-none bg-slate-50/50 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-indigo-500" /> Modalités Financières</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Délai de règlement négocié</p>
                          <p className="text-sm font-bold text-indigo-600 bg-indigo-50 w-fit px-3 py-1 rounded-xl mt-1">
                            {getPaymentTermsLabel(selectedSupplier.payment_terms)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-slate-400">Notes Internes</p>
                          <p className="text-xs font-medium text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl min-h-[80px] mt-1.5">
                            {selectedSupplier.notes || "Aucun commentaire rédigé."}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {detailTab === "orders" && (
                  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100">
                          <TableHead className="text-[9px] font-black uppercase text-slate-400">N° Commande</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-slate-400">Date d'émission</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-slate-400">Statut Commande</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-slate-400 text-right">Montant TTC</TableHead>
                          <TableHead className="text-[9px] font-black uppercase text-slate-400">Statut Réception</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!selectedSupplier.orders || selectedSupplier.orders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-40 text-center opacity-30 text-xs font-bold uppercase">Aucune commande historique</TableCell>
                          </TableRow>
                        ) : (
                          selectedSupplier.orders.map((ord: any) => (
                            <TableRow key={ord.id} className="border-slate-100 hover:bg-slate-50/30">
                              <TableCell className="font-mono text-xs font-bold text-indigo-600">{ord.order_number}</TableCell>
                              <TableCell className="text-xs font-medium text-slate-500">{new Date(ord.created_at).toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[9px] uppercase font-bold px-2 py-0">
                                  {ord.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs font-black text-slate-800">
                                {Number(ord.total_ttc).toLocaleString()} CFA
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-[8px] uppercase font-black px-1.5 py-0 ${ord.receipt_status === 'validated' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {ord.receipt_status || 'En attente'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {detailTab === "balance" && (
                  <div className="space-y-6">
                    {/* Supplier Balance Info Card */}
                    {(() => {
                      const stats = balanceSheet.find(b => b.id === selectedSupplier.id) || {
                        total_invoiced: 0,
                        total_paid: 0,
                        balance_due: 0,
                        invoice_count: 0
                      };
                      return (
                        <div className="grid grid-cols-3 gap-6">
                          <Card className="p-5 border-none bg-slate-50/50 rounded-2xl flex flex-col justify-between">
                            <p className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-indigo-500" /> Total Facturé</p>
                            <h3 className="text-xl font-black text-slate-900 mt-2 font-mono">{Number(stats.total_invoiced).toLocaleString()} <span className="text-[10px]">CFA</span></h3>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{stats.invoice_count} Factures</p>
                          </Card>
                          <Card className="p-5 border-none bg-emerald-50/30 rounded-2xl flex flex-col justify-between">
                            <p className="text-[9px] font-black uppercase text-emerald-700 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Total Réglé</p>
                            <h3 className="text-xl font-black text-emerald-600 mt-2 font-mono">{Number(stats.total_paid).toLocaleString()} <span className="text-[10px]">CFA</span></h3>
                            <p className="text-[9px] text-emerald-400 font-bold mt-1 uppercase">Crédit apuré</p>
                          </Card>
                          <Card className="p-5 border-none bg-amber-50/40 rounded-2xl flex flex-col justify-between">
                            <p className="text-[9px] font-black uppercase text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Reste à payer</p>
                            <h3 className="text-xl font-black text-amber-600 mt-2 font-mono">{Number(stats.balance_due).toLocaleString()} <span className="text-[10px]">CFA</span></h3>
                            <p className="text-[9px] text-amber-400 font-bold mt-1 uppercase">Solde Débiteur</p>
                          </Card>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
