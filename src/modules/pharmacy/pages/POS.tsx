import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, CreditCard,
  FileText, Search, AlertTriangle, Printer, ScanBarcode,
  Check, Settings, X, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function POS() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [medications, setMedications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    pharmacy_name: "Pharmacie", address: "", phone: "",
    tva_enabled: false, tva_rate: 18, ca_enabled: false, ca_rate: 5,
    receipt_footer: "Merci de votre visite ! Les médicaments ne sont ni repris ni échangés.",
    currency: "CFA"
  });

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isCredit, setIsCredit] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({ doctor_name: "", patient_name: "", notes: "" });

  // ── Tax overrides (can be toggled per sale) ────────────────────────────────
  const [tvaActive, setTvaActive] = useState(false);
  const [caActive, setCaActive] = useState(false);

  // ── Caisse ─────────────────────────────────────────────────────────────────
  const [isCaisseOpen, setIsCaisseOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("10000");

  // ── Barcode ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Receipt ────────────────────────────────────────────────────────────────
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  // Sync toggles when settings load
  useEffect(() => {
    setTvaActive(!!settings.tva_enabled);
    setCaActive(!!settings.ca_enabled);
  }, [settings.tva_enabled, settings.ca_enabled]);

  // ── Keyboard barcode scanner (wedge scanner) ───────────────────────────────
  // Barcode scanners send chars very quickly (< 30 ms between chars) then press Enter.
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only if focus is NOT in another input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "Enter") {
        const code = barcodeBuffer.current.trim();
        barcodeBuffer.current = "";
        if (code.length >= 6) {
          handleBarcodeDetected(code);
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimer.current);
        // Reset buffer if no char arrives within 100ms (human typing)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ""; }, 100);
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [medications]);

  const handleBarcodeDetected = useCallback((code: string) => {
    const med = medications.find(m =>
      m.barcode === code || m.code_product === code || m.barcode?.trim() === code.trim()
    );
    if (med) {
      addToCart(med);
      toast({ title: "✅ Produit scanné", description: `${med.name} ajouté au panier` });
    } else {
      toast({ variant: "destructive", title: "Code-barres inconnu", description: `Code: ${code}` });
    }
  }, [medications]);

  // When typing in search field — detect barcode (6+ chars, no space)
  useEffect(() => {
    if (searchTerm.length >= 6 && !searchTerm.includes(" ")) {
      const med = medications.find(m =>
        m.barcode === searchTerm || m.code_product === searchTerm
      );
      if (med) {
        addToCart(med);
        setSearchTerm("");
        toast({ title: "✅ Produit scanné", description: `${med.name} ajouté au panier` });
      }
    }
  }, [searchTerm, medications]);

  // ──────────────────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const [meds, custs, caisse, settingsData] = await Promise.all([
        apiRequest("pharmacy.php?action=list_medications"),
        apiRequest("pharmacy.php?action=list_customers"),
        apiRequest("pharmacy.php?action=caisse_status"),
        apiRequest("pharmacy.php?action=get_settings"),
      ]);
      setMedications(meds);
      setCustomers(custs);
      if (settingsData && !settingsData.error) setSettings(settingsData);
      setIsCaisseOpen(!!caisse?.isOpen);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("pharmacy.php?action=open_caisse", {
        method: "POST",
        body: JSON.stringify({ opening_balance: parseFloat(openingBalance) })
      });
      toast({ title: "Caisse ouverte" });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  // ── Cart management ────────────────────────────────────────────────────────
  const addToCart = (med: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === med.id && i.unit === "boîte");
      if (existing) {
        return prev.map(i =>
          i.id === med.id && i.unit === "boîte"
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        id: med.id, name: med.name, dci: med.dci,
        unit: "boîte", unitPrice: parseFloat(med.price || 0),
        quantity: 1, maxStock: parseInt(med.stock || 0)
      }];
    });
  };

  const updateQuantity = (id: string, unit: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => !(i.id === id && i.unit === unit))); return; }
    setCart(prev => prev.map(i => {
      if (i.id === id && i.unit === unit) {
        if (qty > i.maxStock) {
          toast({ variant: "destructive", title: "Stock insuffisant", description: `Seulement ${i.maxStock} disponibles.` });
          return i;
        }
        return { ...i, quantity: qty };
      }
      return i;
    }));
  };

  const updateUnit = (id: string, oldUnit: string, newUnit: string) => {
    const med = medications.find(m => m.id === id);
    if (!med) return;
    const factors: Record<string, number> = { "boîte": 1, "plaquette": 0.25, "comprimé": 0.025 };
    const unitPrice = parseFloat(med.price || 0) * (factors[newUnit] || 1);
    setCart(prev => prev.map(i => i.id === id && i.unit === oldUnit ? { ...i, unit: newUnit, unitPrice } : i));
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tvaAmount = tvaActive ? subtotal * (parseFloat(settings.tva_rate) / 100) : 0;
  const caAmount = caActive ? subtotal * (parseFloat(settings.ca_rate) / 100) : 0;
  const total = subtotal + tvaAmount + caAmount;

  const copayRate = selectedCustomer?.reimbursement_rate ? parseFloat(selectedCustomer.reimbursement_rate) : 0;
  const insuranceAmount = (total * copayRate) / 100;
  const patientAmount = total - insuranceAmount;

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!isCaisseOpen) {
      toast({ variant: "destructive", title: "Caisse fermée", description: "Ouvrez la caisse avant d'encaisser." });
      return;
    }
    try {
      // Save prescription if filled
      if (prescriptionForm.patient_name) {
        await apiRequest("pharmacy.php?action=save_prescription", {
          method: "POST",
          body: JSON.stringify(prescriptionForm)
        });
      }

      const payload = {
        type: "invoice",
        customer_id: selectedCustomer?.id || null,
        insurance_id: selectedCustomer?.type === "insurance" || selectedCustomer?.type === "mutuelle" ? selectedCustomer.id : null,
        total_ht: subtotal,
        tax_rate: tvaActive ? parseFloat(settings.tva_rate) : 0,
        total_ttc: total,
        status: isCredit ? "pending" : "paid",
        payment_method: paymentMethod,
        insurance_amount: insuranceAmount,
        patient_amount: patientAmount,
        notes: `POS Vente comptoir. Patient: ${prescriptionForm.patient_name || selectedCustomer?.name || "Passant"}${tvaActive ? ` | TVA ${settings.tva_rate}%` : ""}${caActive ? ` | CA ${settings.ca_rate}%` : ""}`,
        items: cart.map(i => ({
          medication_id: i.id,
          quantity: i.quantity,
          unit_type: i.unit,
          unit_price: i.unitPrice,
          total_price: i.unitPrice * i.quantity
        }))
      };

      const result = await apiRequest("pharmacy.php?action=save_doc", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Fetch full receipt data from server
      const receiptData = await apiRequest("pharmacy.php?action=generate_receipt", {
        method: "POST",
        body: JSON.stringify({ doc_id: result.id })
      });

      setLastReceipt({
        doc: receiptData.doc,
        settings: receiptData.settings,
        items: cart,
        tvaActive, tvaAmount, caActive, caAmount,
        subtotal, total, insuranceAmount, patientAmount,
        customerName: selectedCustomer?.name || "Passant",
        paymentMethod
      });

      toast({ title: "✅ Vente validée", description: `Facture ${result.id} enregistrée.` });
      setCart([]);
      setSelectedCustomer(null);
      setPrescriptionForm({ doctor_name: "", patient_name: "", notes: "" });
      setIsReceiptOpen(true);
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  const printReceipt = () => {
    const content = document.getElementById("receipt-content")?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win?.document.write(`
      <html><head><title>Reçu - ${lastReceipt?.doc?.doc_number || ""}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 320px; margin: 0 auto; padding: 12px; }
        .flex { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .border-dashed { border-bottom: 1px dashed #000; margin: 6px 0; padding-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 2px 0; vertical-align: top; }
        th { border-bottom: 1px dashed #000; }
        .right { text-align: right; }
        .big { font-size: 14px; }
        .small { font-size: 10px; color: #555; }
      </style>
      </head><body>${content}
      <script>window.onload=function(){window.print();window.close();}<\/script>
      </body></html>
    `);
    win?.document.close();
  };

  const filteredMeds = medications.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.dci && m.dci.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.barcode && m.barcode.includes(searchTerm))
  );

  const currency = settings.currency || "CFA";

  return (
    <div className="space-y-4">
      {/* CAISSE CLOSED OVERLAY */}
      {!isCaisseOpen && (
        <Card className="border border-amber-200 bg-amber-50/50 max-w-md mx-auto mt-12 shadow-lg">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto animate-bounce" />
            <CardTitle className="text-lg font-bold text-amber-800 mt-2">Caisse fermée</CardTitle>
            <CardDescription>Ouvrez une session de caisse pour commencer à enregistrer des ventes.</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <form onSubmit={handleOpenCaisse} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Encaisse de départ ({currency})</Label>
                <Input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="text-center font-mono font-bold" />
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold">Ouvrir la Caisse</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isCaisseOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ═══ LEFT: CATALOG ═══════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-3">
            {/* Search / Barcode */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-pulse" />
              <Input
                ref={searchRef}
                placeholder="Rechercher ou scanner code-barres EAN-13..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-11 text-sm font-medium"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ScanBarcode className="h-3 w-3" />
              Scanner physique supporté : pointez la caméra ou branchez votre lecteur USB/Bluetooth.
            </p>

            <Card className="border-none shadow-md">
              <CardContent className="p-0 max-h-[62vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit / DCI</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMeds.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-10 italic">
                          Aucun médicament trouvé.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredMeds.map(m => (
                      <TableRow key={m.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <div className="font-bold text-slate-800 text-xs">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground">{m.dci || "—"}</div>
                          {m.barcode && (
                            <div className="text-[9px] font-mono text-slate-400 mt-0.5">{m.barcode}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{m.form} {m.dosage}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={m.stock <= m.threshold ? "destructive" : "outline"} className="text-[10px]">
                            {m.stock} {m.unit}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono font-bold text-emerald-600">
                          {Number(m.price).toLocaleString()} {currency}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            disabled={m.stock <= 0}
                            onClick={() => addToCart(m)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2 text-[10px]"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Ajouter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* ═══ RIGHT: CART ═════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="py-3 border-b bg-emerald-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800">
                  <ShoppingCart className="h-4 w-4" /> Panier Officine
                  {cart.length > 0 && <Badge className="ml-auto bg-emerald-600">{cart.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Customer */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Client / Convention</Label>
                  <Select value={selectedCustomer?.id || "passant"} onValueChange={v => {
                    setSelectedCustomer(v === "passant" ? null : customers.find(c => c.id === v));
                  }}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Client Passant" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passant">Client Passant (Sans convention)</SelectItem>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.type !== "individual" ? `(${c.type?.toUpperCase()} – ${c.reimbursement_rate}%)` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cart items */}
                <div className="max-h-[28vh] overflow-y-auto border rounded-xl bg-slate-50 p-2 space-y-1">
                  {cart.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-10 italic">Panier vide — ajoutez des produits.</p>
                  ) : cart.map(item => (
                    <div key={item.id + item.unit} className="flex justify-between items-center py-1.5 border-b last:border-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        <div className="flex gap-2 items-center mt-0.5">
                          <select value={item.unit} onChange={e => updateUnit(item.id, item.unit, e.target.value)}
                            className="text-[9px] bg-white border rounded px-1 py-0.5">
                            <option value="boîte">Boîte</option>
                            <option value="plaquette">Plaquette</option>
                            <option value="comprimé">Comprimé</option>
                          </select>
                          <span className="text-[10px] text-muted-foreground font-mono">{Number(item.unitPrice).toLocaleString()} {currency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.id, item.unit, item.quantity - 1)} className="h-6 w-6"><Minus className="h-3 w-3" /></Button>
                        <span className="text-xs font-mono font-bold w-5 text-center">{item.quantity}</span>
                        <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.id, item.unit, item.quantity + 1)} className="h-6 w-6"><Plus className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setCart(c => c.filter(i => !(i.id === item.id && i.unit === item.unit)))} className="h-6 w-6 text-rose-400 hover:text-rose-700"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prescription */}
                <div className="border border-dashed p-3 rounded-xl space-y-2 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" /> Ordonnance (optionnel)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Nom du Médecin" value={prescriptionForm.doctor_name} onChange={e => setPrescriptionForm({ ...prescriptionForm, doctor_name: e.target.value })} className="h-8 text-xs" />
                    <Input placeholder="Nom du Patient" value={prescriptionForm.patient_name} onChange={e => setPrescriptionForm({ ...prescriptionForm, patient_name: e.target.value })} className="h-8 text-xs" />
                  </div>
                </div>

                {/* ── TVA / CA TOGGLES ── */}
                <div className="border rounded-xl p-3 space-y-2 bg-slate-50">
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1"><Settings className="h-3 w-3" /> Taxes pour cette vente</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setTvaActive(!tvaActive)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${tvaActive ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${tvaActive ? "translate-x-5" : ""}`} />
                      </div>
                      <span className="text-xs font-medium">TVA {settings.tva_rate}%</span>
                      {tvaActive && <span className="text-[10px] text-emerald-600 font-mono">+{Number(tvaAmount).toLocaleString()}</span>}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setCaActive(!caActive)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${caActive ? "bg-blue-500" : "bg-slate-300"}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${caActive ? "translate-x-5" : ""}`} />
                      </div>
                      <span className="text-xs font-medium">CA {settings.ca_rate}%</span>
                      {caActive && <span className="text-[10px] text-blue-600 font-mono">+{Number(caAmount).toLocaleString()}</span>}
                    </label>
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-1.5 border-t pt-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sous-total HT</span>
                    <span className="font-mono">{Number(subtotal).toLocaleString()} {currency}</span>
                  </div>
                  {tvaActive && (
                    <div className="flex justify-between text-xs text-emerald-700">
                      <span>TVA ({settings.tva_rate}%)</span>
                      <span className="font-mono">+{Number(tvaAmount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                  {caActive && (
                    <div className="flex justify-between text-xs text-blue-700">
                      <span>CA ({settings.ca_rate}%)</span>
                      <span className="font-mono">+{Number(caAmount).toLocaleString()} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-2">
                    <span>Total TTC</span>
                    <span className="font-mono text-emerald-700">{Number(total).toLocaleString()} {currency}</span>
                  </div>
                  {copayRate > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-emerald-800">
                        <span>Assurance ({copayRate}%)</span>
                        <span className="font-mono">−{Number(insuranceAmount).toLocaleString()} {currency}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-slate-700">
                        <span>Ticket modérateur (patient)</span>
                        <span className="font-mono">{Number(patientAmount).toLocaleString()} {currency}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment & Submit */}
                <div className="space-y-2">
                  <div className="flex gap-3 items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={isCredit} onChange={e => setIsCredit(e.target.checked)} className="rounded" />
                      <span className="text-xs font-bold">Vente à Crédit</span>
                    </label>
                    {!isCredit && (
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                        className="text-xs border rounded h-8 px-2 ml-auto">
                        <option value="Cash">Cash</option>
                        <option value="Virement">Virement</option>
                        <option value="Chèque">Chèque</option>
                        <option value="Mobile Money">Mobile Money</option>
                      </select>
                    )}
                  </div>
                  <Button
                    disabled={cart.length === 0}
                    onClick={handleCheckout}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-sm rounded-xl"
                  >
                    <Check className="h-4 w-4 mr-2" /> Valider & Encaisser
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ DIALOG: RECEIPT ═══════════════════════════════════════════════════ */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Printer className="h-4 w-4" /> Reçu de Paiement
            </DialogTitle>
          </DialogHeader>

          {lastReceipt && (
            <div id="receipt-content" className="bg-white p-4 font-mono text-xs text-slate-800 border rounded-lg shadow-inner space-y-3">
              {/* Header */}
              <div className="center border-dashed pb-3">
                <div className="bold text-sm">{lastReceipt.settings?.pharmacy_name || "PHARMACIE"}</div>
                {lastReceipt.settings?.address && <div>{lastReceipt.settings.address}</div>}
                {lastReceipt.settings?.phone && <div>Tél: {lastReceipt.settings.phone}</div>}
                <div className="small mt-1">════════════════════════</div>
                <div className="bold">REÇU DE VENTE</div>
                <div>N° {lastReceipt.doc?.doc_number || "—"}</div>
                <div>{new Date(lastReceipt.doc?.created_at || Date.now()).toLocaleString("fr-FR")}</div>
              </div>

              {/* Client & Mode */}
              <div className="border-dashed pb-2">
                <div className="flex"><span>CLIENT&nbsp;&nbsp;:</span><span style={{ marginLeft: "auto" }}>{lastReceipt.customerName}</span></div>
                <div className="flex"><span>PAIEMENT:</span><span style={{ marginLeft: "auto" }}>{lastReceipt.paymentMethod}</span></div>
                {lastReceipt.doc?.status === "pending" && (
                  <div className="flex"><span>STATUT&nbsp;&nbsp;:</span><span style={{ marginLeft: "auto" }}>CRÉDIT</span></div>
                )}
              </div>

              {/* Items */}
              <div className="border-dashed pb-2">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px dashed #000" }}>
                      <th className="text-left" style={{ paddingBottom: 3 }}>Qté</th>
                      <th className="text-left" style={{ paddingBottom: 3 }}>Produit</th>
                      <th className="right" style={{ paddingBottom: 3 }}>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastReceipt.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ paddingTop: 2, verticalAlign: "top" }}>{item.quantity}×</td>
                        <td style={{ paddingTop: 2 }}>{item.name} ({item.unit})</td>
                        <td className="right" style={{ paddingTop: 2 }}>{Number(item.unitPrice * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1 border-dashed pb-2">
                <div className="flex"><span>S/TOTAL HT&nbsp;:</span><span style={{ marginLeft: "auto" }}>{Number(lastReceipt.subtotal).toLocaleString()} {currency}</span></div>
                {lastReceipt.tvaActive && (
                  <div className="flex"><span>TVA ({lastReceipt.settings?.tva_rate || 18}%)&nbsp;:</span><span style={{ marginLeft: "auto" }}>+{Number(lastReceipt.tvaAmount).toLocaleString()} {currency}</span></div>
                )}
                {lastReceipt.caActive && (
                  <div className="flex"><span>CA ({lastReceipt.settings?.ca_rate || 5}%)&nbsp;:</span><span style={{ marginLeft: "auto" }}>+{Number(lastReceipt.caAmount).toLocaleString()} {currency}</span></div>
                )}
                <div className="flex bold" style={{ borderTop: "1px dashed #000", paddingTop: 4 }}>
                  <span>TOTAL TTC&nbsp;&nbsp;&nbsp;&nbsp;:</span>
                  <span style={{ marginLeft: "auto" }}>{Number(lastReceipt.total).toLocaleString()} {currency}</span>
                </div>
                {lastReceipt.insuranceAmount > 0 && (
                  <>
                    <div className="flex"><span>ASSURANCE&nbsp;&nbsp;&nbsp;:</span><span style={{ marginLeft: "auto" }}>−{Number(lastReceipt.insuranceAmount).toLocaleString()} {currency}</span></div>
                    <div className="flex bold"><span>RESTE À PAYER:</span><span style={{ marginLeft: "auto" }}>{Number(lastReceipt.patientAmount).toLocaleString()} {currency}</span></div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="center small" style={{ paddingTop: 6 }}>
                <div>════════════════════════</div>
                <div>{lastReceipt.settings?.receipt_footer || "Merci de votre visite !"}</div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)} className="flex-1"><X className="h-4 w-4 mr-1" /> Fermer</Button>
            <Button onClick={printReceipt} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white"><Printer className="h-4 w-4 mr-1" /> Imprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
