import { useState, useEffect } from "react";
import { 
  Pill, Plus, Search, AlertTriangle, DollarSign, Package, 
  ShoppingCart, Download, Clock, History, FileText, CheckCircle2, 
  XCircle, Truck, RefreshCw, BarChart3, AlertCircle, Layers 
} from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function Pharmacy() {
  const { user, clinic } = useAuth();
  const { toast } = useToast();
  
  // Data States
  const [medications, setMedications] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [internalRequests, setInternalRequests] = useState<any[]>([]);
  const [administrations, setAdministrations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // View/Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "catalog" | "requests" | "administer" | "audit">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog Controls
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Forms
  const [medForm, setMedForm] = useState({
    name: "", category: "Médicaments", unit: "boîte", threshold: "5", price: "0",
    code_product: "", barcode: "", dci: "", form: "", dosage: "", presentation: "",
    brand: "", supplier: "", price_buy: "0", stock_max: "100", storage_location: "", description: ""
  });

  const [batchForm, setBatchForm] = useState({
    medication_id: "", batch_number: "", mfg_date: "", expiry_date: "", quantity: "", price_buy: "", supplier: ""
  });

  const [requestForm, setRequestForm] = useState({
    service_name: "Urgences", notes: "", items: [{ medication_id: "", quantity: "1" }]
  });

  const [administerForm, setAdministerForm] = useState({
    patient_id: "", medication_id: "", quantity: "1", notes: ""
  });

  const [auditForm, setAuditForm] = useState({
    medication_id: "", qty_real: "", reason: "error", notes: ""
  });

  useEffect(() => {
    if (user?.clinicId) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [medsData, batchesData, patsData, reqsData, adminsData, statsData] = await Promise.all([
        apiRequest("pharmacy.php?action=list_medications"),
        apiRequest("pharmacy.php?action=list_batches"),
        apiRequest("patients.php?action=list&clinicId=" + user?.clinicId),
        apiRequest("pharmacy.php?action=list_internal_requests"),
        apiRequest("pharmacy.php?action=list_administrations"),
        apiRequest("pharmacy.php?action=stats")
      ]);
      setMedications(medsData);
      setBatches(batchesData);
      setPatients(patsData);
      setInternalRequests(reqsData);
      setAdministrations(adminsData);
      setStats(statsData);
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de récupérer les données pharmacie." });
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Add/Update Medication
  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("pharmacy.php?action=save_medication", {
        method: "POST",
        body: JSON.stringify(medForm)
      });
      toast({ title: "Succès", description: "Produit enregistré dans le catalogue clinique." });
      setIsAddMedOpen(false);
      loadData();
      resetMedForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  // 2. Add Batch/Lot
  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.medication_id || !batchForm.batch_number || !batchForm.expiry_date || !batchForm.quantity) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires." });
      return;
    }
    try {
      await apiRequest("pharmacy.php?action=save_batch", {
        method: "POST",
        body: JSON.stringify(batchForm)
      });
      toast({ title: "Lot enregistré", description: "Nouveau lot ajouté à l'inventaire clinique." });
      setIsAddBatchOpen(false);
      loadData();
      setBatchForm({ medication_id: "", batch_number: "", mfg_date: "", expiry_date: "", quantity: "", price_buy: "", supplier: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  // 3. Department Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("pharmacy.php?action=save_internal_request", {
        method: "POST",
        body: JSON.stringify({
          service_name: requestForm.service_name,
          notes: requestForm.notes,
          items: requestForm.items.map(i => ({ medication_id: i.medication_id, quantity: parseInt(i.quantity) }))
        })
      });
      toast({ title: "Demande créée", description: "La demande d'approvisionnement interne a été envoyée." });
      setIsNewRequestOpen(false);
      loadData();
      setRequestForm({ service_name: "Urgences", notes: "", items: [{ medication_id: "", quantity: "1" }] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const handleUpdateReqStatus = async (id: string, status: string) => {
    try {
      await apiRequest("pharmacy.php?action=update_internal_request_status", {
        method: "POST",
        body: JSON.stringify({ id, status })
      });
      toast({ title: "Statut mis à jour", description: `La demande est désormais: ${status}` });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  // 4. Administer to Patient
  const handleAdminister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!administerForm.patient_id || !administerForm.medication_id || !administerForm.quantity) return;
    
    const med = medications.find(m => m.id === administerForm.medication_id);
    if (!med || med.stock < parseInt(administerForm.quantity)) {
      toast({ variant: "destructive", title: "Stock insuffisant", description: "Le stock de ce médicament est insuffisant." });
      return;
    }

    try {
      await apiRequest("pharmacy.php?action=administer_medication", {
        method: "POST",
        body: JSON.stringify({
          patient_id: administerForm.patient_id,
          medication_id: administerForm.medication_id,
          medication_name: med.name,
          quantity: parseInt(administerForm.quantity),
          notes: administerForm.notes
        })
      });
      toast({ title: "Médicament administré", description: "Stock mis à jour et facturation ajoutée au patient." });
      loadData();
      setAdministerForm({ patient_id: "", medication_id: "", quantity: "1", notes: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  // 5. Stock Physical Audit
  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.medication_id || !auditForm.qty_real) return;
    const med = medications.find(m => m.id === auditForm.medication_id);
    if (!med) return;

    const theoretical = parseInt(med.stock);
    const real = parseInt(auditForm.qty_real);
    const discrepancy = real - theoretical;

    try {
      // Create a stock adjustment request
      await apiRequest("inventory.php?action=stock_adj", {
        method: "PUT",
        body: JSON.stringify({
          id: auditForm.medication_id,
          adjustment: discrepancy,
          reason: `Audit physique (${auditForm.reason}): ${auditForm.notes}`
        })
      });

      // Update local medications table
      await apiRequest("medications.php", {
        method: "PUT",
        body: JSON.stringify({
          id: auditForm.medication_id,
          stock_adjustment: discrepancy
        })
      });

      toast({ title: "Audit enregistré", description: `Écart de stock de ${discrepancy} corrigé.` });
      setIsAuditOpen(false);
      loadData();
      setAuditForm({ medication_id: "", qty_real: "", reason: "error", notes: "" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const resetMedForm = () => {
    setMedForm({
      name: "", category: "Médicaments", unit: "boîte", threshold: "5", price: "0",
      code_product: "", barcode: "", dci: "", form: "", dosage: "", presentation: "",
      brand: "", supplier: "", price_buy: "0", stock_max: "100", storage_location: "", description: ""
    });
  };

  const handleExport = () => {
    exportToCSV(medications, "Inventaire_Pharmacie_Clinique");
  };

  const filteredMeds = medications.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.dci && m.dci.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Expiration Check for alert count
  const today = new Date();
  const warningDate = new Date();
  warningDate.setMonth(today.getMonth() + 3); // 3 months warning
  
  const expiredBatches = batches.filter(b => new Date(b.expiry_date) < today && b.remaining_qty > 0);
  const warningBatches = batches.filter(b => {
    const exp = new Date(b.expiry_date);
    return exp >= today && exp <= warningDate && b.remaining_qty > 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-cyan-800">
            <Pill className="h-7 w-7 text-cyan-600 animate-pulse" />
            Pharmacie Clinique Interne
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestion exclusive des stocks, lots et distributions de l'établissement hospitalier.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {(["dashboard", "catalog", "requests", "administer", "audit"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab 
                  ? "bg-white text-cyan-800 shadow-sm shadow-cyan-900/10" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "dashboard" ? "Dashboard" :
               tab === "catalog" ? "Produits & Lots" :
               tab === "requests" ? "Demandes Services" :
               tab === "administer" ? "Administrations" : "Audits & Pertes"}
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          TAB 1: DASHBOARD
          ──────────────────────────────────────────────────────── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Références en Stock" 
              value={String(medications.length)} 
              icon={Pill} 
              iconClassName="bg-cyan-100 text-cyan-700" 
            />
            <StatCard 
              title="Stock Bas Alertes" 
              value={String(stats?.low_stock || 0)} 
              icon={AlertTriangle} 
              iconClassName="bg-amber-100 text-amber-600" 
              changeType={stats?.low_stock > 0 ? "negative" : "positive"}
              change="Action requise"
            />
            <StatCard 
              title="Lots Expirés" 
              value={String(expiredBatches.length)} 
              icon={AlertCircle} 
              iconClassName="bg-rose-100 text-rose-600" 
              changeType={expiredBatches.length > 0 ? "negative" : "neutral"}
              change={`${warningBatches.length} sous 3 mois`}
            />
            <StatCard 
              title="Administrations du Jour" 
              value={String(administrations.filter(a => new Date(a.administered_at).toDateString() === new Date().toDateString()).length)} 
              icon={Clock} 
              iconClassName="bg-indigo-100 text-indigo-600" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expiration Alerts */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Alertes Péremption
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {expiredBatches.length === 0 && warningBatches.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Aucune alerte de péremption active.</p>
                ) : (
                  <>
                    {expiredBatches.map(b => (
                      <div key={b.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{b.medication_name || "Médicament"}</p>
                          <p className="text-[10px] text-muted-foreground">Lot: {b.batch_number} | Exp: {b.expiry_date}</p>
                        </div>
                        <Badge variant="destructive" className="text-[9px] uppercase font-bold">EXPIRÉ</Badge>
                      </div>
                    ))}
                    {warningBatches.map(b => (
                      <div key={b.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{b.medication_name || "Médicament"}</p>
                          <p className="text-[10px] text-muted-foreground">Lot: {b.batch_number} | Exp: {b.expiry_date}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold border-amber-500 text-amber-600 bg-amber-50">PROCHE</Badge>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Service consumption stats */}
            <Card className="lg:col-span-2 border-none shadow-md bg-white">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-cyan-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-600" /> Historique récent des administrations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase">Patient</TableHead>
                      <TableHead className="text-[10px] uppercase">Produit</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Qté</TableHead>
                      <TableHead className="text-[10px] uppercase text-right">Date & Heure</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {administrations.slice(0, 5).map(a => (
                      <TableRow key={a.id} className="text-xs">
                        <TableCell className="font-bold">{a.patient_name} {a.patient_first_name}</TableCell>
                        <TableCell>{a.medication_name}</TableCell>
                        <TableCell className="text-right font-mono font-bold">x{a.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{new Date(a.administered_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {administrations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground italic">Aucune administration récente.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          TAB 2: CATALOG & LOTS
          ──────────────────────────────────────────────────────── */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom commercial ou DCI..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-9 bg-white"
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={() => setIsAddMedOpen(true)} className="gap-2 bg-cyan-700 hover:bg-cyan-800 text-white">
                <Plus className="h-4 w-4" /> Nouveau produit
              </Button>
              <Button onClick={() => setIsAddBatchOpen(true)} variant="outline" className="gap-2 border-cyan-600 text-cyan-700 hover:bg-cyan-50">
                <Layers className="h-4 w-4" /> Réceptionner Lot
              </Button>
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-cyan-800">
                Inventaire Général de la Pharmacie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code & Produit</TableHead>
                    <TableHead>DCI / Catégorie</TableHead>
                    <TableHead>Forme / Dosage</TableHead>
                    <TableHead>Emplacement</TableHead>
                    <TableHead className="text-right">Stock Actuel</TableHead>
                    <TableHead className="text-right">Seuil Alerte</TableHead>
                    <TableHead className="text-right">Prix Unitaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeds.map(m => (
                    <TableRow key={m.id} className="hover:bg-muted/10">
                      <TableCell>
                        <div className="font-bold text-slate-800">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{m.code_product || m.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium text-slate-600">{m.dci || "--"}</div>
                        <div className="text-[10px] text-muted-foreground">{m.category}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.form} {m.dosage}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {m.storage_location || "Non défini"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={m.stock <= m.threshold ? "destructive" : "secondary"} className="text-xs font-bold">
                          {m.stock} {m.unit}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">{m.threshold}</TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold text-cyan-700">{Number(m.price).toLocaleString()} FCFA</TableCell>
                    </TableRow>
                  ))}
                  {filteredMeds.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">Aucun produit trouvé.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          TAB 3: INTERNAL REQUESTS
          ──────────────────────────────────────────────────────── */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Demandes de Services</h2>
              <p className="text-xs text-muted-foreground">Suivi des commandes internes envoyées par les départements hospitaliers.</p>
            </div>
            <Button onClick={() => setIsNewRequestOpen(true)} className="gap-2 bg-cyan-700 hover:bg-cyan-800 text-white">
              <Plus className="h-4 w-4" /> Créer Demande Interne
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {internalRequests.map(req => (
              <Card key={req.id} className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition">
                <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-cyan-600" /> Service : {req.service_name}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-mono">
                      Ref: {req.id} | Créé par {req.created_by} le {new Date(req.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div>
                    <Badge className={`text-[10px] uppercase font-black ${
                      req.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'prepared' ? 'bg-indigo-100 text-indigo-800' :
                      req.status === 'validated' ? 'bg-blue-100 text-blue-800' :
                      req.status === 'refused' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status === 'pending' ? 'EN ATTENTE' :
                       req.status === 'validated' ? 'VALIDÉE' :
                       req.status === 'prepared' ? 'PRÉPARÉE' :
                       req.status === 'delivered' ? 'LIVRÉE' : 'REFUSÉE'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Items list */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Produits commandés :</p>
                    {req.items && req.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-dashed pb-1 last:border-0 last:pb-0">
                        <span className="font-bold text-slate-700">{it.medication_name}</span>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-black text-cyan-800">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {req.notes && (
                    <div className="p-2 bg-slate-50 border rounded text-[11px] text-slate-600">
                      <strong>Notes:</strong> {req.notes}
                    </div>
                  )}

                  {/* Actions depending on status */}
                  <div className="flex gap-2 justify-end border-t pt-3">
                    {req.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleUpdateReqStatus(req.id, 'validated')} className="bg-blue-600 text-white text-[11px] h-8">Valider</Button>
                        <Button size="sm" onClick={() => handleUpdateReqStatus(req.id, 'refused')} variant="destructive" className="text-[11px] h-8">Refuser</Button>
                      </>
                    )}
                    {req.status === 'validated' && (
                      <Button size="sm" onClick={() => handleUpdateReqStatus(req.id, 'prepared')} className="bg-indigo-600 text-white text-[11px] h-8">Marquer Préparée</Button>
                    )}
                    {req.status === 'prepared' && (
                      <Button size="sm" onClick={() => handleUpdateReqStatus(req.id, 'delivered')} className="bg-emerald-600 text-white text-[11px] h-8">Confirmer la Livraison</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {internalRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground italic">Aucune demande de service enregistrée.</div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          TAB 4: ADMINISTER TO PATIENT
          ──────────────────────────────────────────────────────── */}
      {activeTab === "administer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-none shadow-md bg-white h-fit">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-cyan-800 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Servir un Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleAdminister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Sélectionner Patient *</Label>
                  <Select required value={administerForm.patient_id} onValueChange={v => setAdministerForm({...administerForm, patient_id: v})}>
                    <SelectTrigger className="text-xs h-9 bg-white"><SelectValue placeholder="Choisir patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} {p.first_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Choisir Médicament / Article *</Label>
                  <Select required value={administerForm.medication_id} onValueChange={v => setAdministerForm({...administerForm, medication_id: v})}>
                    <SelectTrigger className="text-xs h-9 bg-white"><SelectValue placeholder="Sélectionner produit" /></SelectTrigger>
                    <SelectContent>
                      {medications.filter(m => m.stock > 0).map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.stock} en stock)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Quantité à administrer *</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    required 
                    value={administerForm.quantity} 
                    onChange={e => setAdministerForm({...administerForm, quantity: e.target.value})} 
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Commentaires / Prescripteur</Label>
                  <Input 
                    value={administerForm.notes} 
                    onChange={e => setAdministerForm({...administerForm, notes: e.target.value})} 
                    placeholder="ex: Prescription Dr. Diop"
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="bg-cyan-50 border border-cyan-200 text-[10px] text-cyan-800 p-3 rounded-lg leading-relaxed font-medium">
                  Cette action va automatiquement soustraire les quantités en stock suivant la méthode FIFO (les lots les plus anciens en premier), ajouter les actes à la facture patient correspondante et journaliser l'écriture comptable OHADA.
                </div>

                <Button type="submit" className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold h-9">
                  Valider l'Administration & Facturer
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-md bg-white">
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-cyan-800 flex items-center gap-2">
                <History className="h-4 w-4" /> Historique Général des Administrations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead className="text-right">Tarif Unitaire</TableHead>
                    <TableHead className="text-right">Servi le</TableHead>
                    <TableHead className="text-right">Par</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {administrations.map(a => (
                    <TableRow key={a.id} className="text-xs">
                      <TableCell className="font-bold">{a.patient_name} {a.patient_first_name}</TableCell>
                      <TableCell>{a.medication_name}</TableCell>
                      <TableCell className="text-right font-mono font-bold">x{a.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-cyan-700">{Number(a.price_sell).toLocaleString()} CFA</TableCell>
                      <TableCell className="text-right text-muted-foreground">{new Date(a.administered_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right italic text-muted-foreground">{a.administered_by}</TableCell>
                    </TableRow>
                  ))}
                  {administrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">Aucune administration enregistrée.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          TAB 5: STOCK AUDIT
          ──────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-none shadow-md bg-white h-fit">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-cyan-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Enregistrer un Écart
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleAudit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Sélectionner Produit *</Label>
                  <Select required value={auditForm.medication_id} onValueChange={v => setAuditForm({...auditForm, medication_id: v})}>
                    <SelectTrigger className="text-xs h-9 bg-white"><SelectValue placeholder="Choisir produit" /></SelectTrigger>
                    <SelectContent>
                      {medications.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.stock} théorique)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Quantité réelle constatée (Audit physique) *</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    required 
                    value={auditForm.qty_real} 
                    onChange={e => setAuditForm({...auditForm, qty_real: e.target.value})} 
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Motif de l'écart *</Label>
                  <Select required value={auditForm.reason} onValueChange={v => setAuditForm({...auditForm, reason: v})}>
                    <SelectTrigger className="text-xs h-9 bg-white"><SelectValue placeholder="Motif" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="theft">Vol / Disparition</SelectItem>
                      <SelectItem value="damage">Produit cassé / détérioré</SelectItem>
                      <SelectItem value="expired">Péremption</SelectItem>
                      <SelectItem value="error">Erreur de saisie</SelectItem>
                      <SelectItem value="other">Autre / Perte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Notes / Explication</Label>
                  <Input 
                    value={auditForm.notes} 
                    onChange={e => setAuditForm({...auditForm, notes: e.target.value})} 
                    placeholder="Détails additionnels..."
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <Button type="submit" className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold h-9">
                  Valider l'ajustement physique
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-md bg-white">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-cyan-800 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Rapport d'Écarts et Pertes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Ajustement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Motif & Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Let's show recent adjustments by mapping logs */}
                  {medications.filter(m => m.stock <= m.threshold).map((m, i) => (
                    <TableRow key={i} className="text-xs">
                      <TableCell className="font-bold">{m.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 font-bold bg-amber-50">
                          STOCK BAS ({m.stock} restant)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">Recommandé</TableCell>
                      <TableCell className="italic text-slate-500">Réapprovisionnement suggéré avant rupture complète.</TableCell>
                    </TableRow>
                  ))}
                  {medications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground italic">Aucun écart critique détecté.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          DIALOGS
          ──────────────────────────────────────────────────────── */}
      
      {/* DIALOG 1: NEW MEDICATION */}
      <Dialog open={isAddMedOpen} onOpenChange={setIsAddMedOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouveau Produit Pharmaceutique (Clinique)</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveMedication} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom Commercial *</Label>
                <Input required value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">DCI (Dénomination Commune) *</Label>
                <Input required value={medForm.dci} onChange={e => setMedForm({...medForm, dci: e.target.value})} className="h-9 text-xs" placeholder="ex: Paracétamol" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Catégorie *</Label>
                <Select required value={medForm.category} onValueChange={v => setMedForm({...medForm, category: v})}>
                  <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Médicaments">Médicaments</SelectItem>
                    <SelectItem value="Consommables médicaux">Consommables médicaux</SelectItem>
                    <SelectItem value="Réactifs de laboratoire">Réactifs de laboratoire</SelectItem>
                    <SelectItem value="Produits d'imagerie">Produits d'imagerie</SelectItem>
                    <SelectItem value="Dispositifs médicaux">Dispositifs médicaux</SelectItem>
                    <SelectItem value="Produits de stérilisation">Produits de stérilisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Forme Pharmaceutique</Label>
                <Input value={medForm.form} onChange={e => setMedForm({...medForm, form: e.target.value})} className="h-9 text-xs" placeholder="ex: Comprimé, Sirop" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dosage</Label>
                <Input value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})} className="h-9 text-xs" placeholder="ex: 500 mg, 10%" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Présentation / Emballage</Label>
                <Input value={medForm.presentation} onChange={e => setMedForm({...medForm, presentation: e.target.value})} className="h-9 text-xs" placeholder="ex: Boîte de 20, Flacon 100ml" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Code Produit (Interne)</Label>
                <Input value={medForm.code_product} onChange={e => setMedForm({...medForm, code_product: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Code Barre</Label>
                <Input value={medForm.barcode} onChange={e => setMedForm({...medForm, barcode: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Emplacement de Stockage</Label>
                <Input value={medForm.storage_location} onChange={e => setMedForm({...medForm, storage_location: e.target.value})} className="h-9 text-xs" placeholder="ex: Rayon A2" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stock Min</Label>
                <Input type="number" value={medForm.threshold} onChange={e => setMedForm({...medForm, threshold: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stock Max</Label>
                <Input type="number" value={medForm.stock_max} onChange={e => setMedForm({...medForm, stock_max: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Laboratoire / Marque</Label>
                <Input value={medForm.brand} onChange={e => setMedForm({...medForm, brand: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Prix Public Clinique (CFA) *</Label>
                <Input type="number" required value={medForm.price} onChange={e => setMedForm({...medForm, price: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold h-9">
              Enregistrer au Catalogue
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: RECEIVE BATCH / LOT */}
      <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Réceptionner / Entrée de Lot (Batches)</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBatch} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Sélectionner Produit *</Label>
              <Select required value={batchForm.medication_id} onValueChange={v => setBatchForm({...batchForm, medication_id: v})}>
                <SelectTrigger className="h-9 text-xs bg-white"><SelectValue placeholder="Choisir produit" /></SelectTrigger>
                <SelectContent>
                  {medications.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.dci})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Numéro de Lot *</Label>
                <Input required value={batchForm.batch_number} onChange={e => setBatchForm({...batchForm, batch_number: e.target.value})} className="h-9 text-xs" placeholder="ex: LOT-A23" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantité reçue *</Label>
                <Input type="number" min={1} required value={batchForm.quantity} onChange={e => setBatchForm({...batchForm, quantity: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date de fabrication</Label>
                <Input type="date" value={batchForm.mfg_date} onChange={e => setBatchForm({...batchForm, mfg_date: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date d'expiration *</Label>
                <Input type="date" required value={batchForm.expiry_date} onChange={e => setBatchForm({...batchForm, expiry_date: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Prix d'achat unitaire (CFA)</Label>
                <Input type="number" value={batchForm.price_buy} onChange={e => setBatchForm({...batchForm, price_buy: e.target.value})} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fournisseur</Label>
                <Input value={batchForm.supplier} onChange={e => setBatchForm({...batchForm, supplier: e.target.value})} className="h-9 text-xs" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold h-9">
              Confirmer la Réception du Lot
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: NEW INTERNAL REQUEST */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer une demande d'approvisionnement interne</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Hôpital Demandeur *</Label>
              <Select required value={requestForm.service_name} onValueChange={v => setRequestForm({...requestForm, service_name: v})}>
                <SelectTrigger className="h-9 text-xs bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urgences">Urgences</SelectItem>
                  <SelectItem value="Médecine générale">Médecine générale</SelectItem>
                  <SelectItem value="Pédiatrie">Pédiatrie</SelectItem>
                  <SelectItem value="Chirurgie">Chirurgie</SelectItem>
                  <SelectItem value="Maternité">Maternité</SelectItem>
                  <SelectItem value="Réanimation">Réanimation</SelectItem>
                  <SelectItem value="Hospitalisation">Hospitalisation</SelectItem>
                  <SelectItem value="Laboratoire">Laboratoire</SelectItem>
                  <SelectItem value="Imagerie">Imagerie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 border p-3 rounded-lg">
              <Label className="text-xs font-bold">Produit commandé :</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Select required value={requestForm.items[0].medication_id} onValueChange={v => {
                    const newItems = [...requestForm.items];
                    newItems[0].medication_id = v;
                    setRequestForm({...requestForm, items: newItems});
                  }}>
                    <SelectTrigger className="h-9 text-xs bg-white"><SelectValue placeholder="Produit" /></SelectTrigger>
                    <SelectContent>
                      {medications.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input 
                    type="number" 
                    min={1} 
                    required 
                    value={requestForm.items[0].quantity} 
                    onChange={e => {
                      const newItems = [...requestForm.items];
                      newItems[0].quantity = e.target.value;
                      setRequestForm({...requestForm, items: newItems});
                    }}
                    placeholder="Qté" 
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Commentaires</Label>
              <Input value={requestForm.notes} onChange={e => setRequestForm({...requestForm, notes: e.target.value})} className="h-9 text-xs" />
            </div>

            <Button type="submit" className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold h-9">
              Envoyer la Demande
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
