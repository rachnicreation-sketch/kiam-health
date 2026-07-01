import { useState, useEffect } from "react";
import { 
  FileText, Plus, Search, Eye, RefreshCw, Printer, 
  CheckCircle, ArrowLeftRight, Clock, FileDown 
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-service";

export default function Documents() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [docs, setDocs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"quote" | "invoice" | "purchase_order" | "delivery_slip">("invoice");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest(`pharmacy.php?action=list_docs&type=${activeTab}`);
      setDocs(data);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les documents." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = (doc: any) => {
    setSelectedDoc(doc);
    setIsDetailOpen(true);
  };

  const exportPDF = () => {
    if (!selectedDoc) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Kiam - ${activeTab === 'invoice' ? 'Facture' : activeTab === 'quote' ? 'Devis' : activeTab === 'purchase_order' ? 'Bon de Commande' : 'Bon de Livraison'}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Numéro: ${selectedDoc.doc_number}`, 14, 32);
    doc.text(`Date: ${new Date(selectedDoc.created_at).toLocaleString()}`, 14, 38);
    doc.text(`Client/Tiers: ${selectedDoc.customer_name || 'Client Passant'}`, 14, 44);
    
    // @ts-ignore
    doc.autoTable({
      startY: 55,
      head: [['Article', 'Quantité', 'Prix Unitaire', 'Total']],
      body: selectedDoc.items ? selectedDoc.items.map((i: any) => [
        i.medication_name,
        i.quantity,
        `${Number(i.unit_price).toLocaleString()} CFA`,
        `${Number(i.total_price).toLocaleString()} CFA`
      ]) : [],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY || 55;
    doc.setFontSize(14);
    doc.text(`Total TTC: ${Number(selectedDoc.total_ttc).toLocaleString()} CFA`, 14, finalY + 15);
    
    doc.save(`${selectedDoc.doc_number}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Gestion Documentaire</h1>
          <p className="text-xs text-muted-foreground">Registre des devis, factures de ventes, bons de commande achats et bons de livraison.</p>
        </div>
        
        {/* Document Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(["invoice", "quote", "purchase_order", "delivery_slip"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab 
                  ? "bg-white text-emerald-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "invoice" ? "Factures" :
               tab === "quote" ? "Devis" :
               tab === "purchase_order" ? "Commandes Achat" : "Bons Livraison"}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-md bg-white">
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Registre des {
              activeTab === 'invoice' ? 'Factures Ventes' :
              activeTab === 'quote' ? 'Devis Clients' :
              activeTab === 'purchase_order' ? 'Bons de Commande Achat' : 'Bons de Livraison'
            }
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro Doc</TableHead>
                <TableHead>Client / Tiers</TableHead>
                <TableHead>Total HT</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>Mode Paiement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map(d => (
                <TableRow key={d.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-mono text-xs font-bold">{d.doc_number}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-800">{d.customer_name || "Client Passant"}</TableCell>
                  <TableCell className="text-xs font-mono">{Number(d.total_ht).toLocaleString()} CFA</TableCell>
                  <TableCell className="text-xs font-mono font-bold text-emerald-700">{Number(d.total_ttc).toLocaleString()} CFA</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline">{d.payment_method || "--"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      d.status === 'paid' || d.status === 'delivered' || d.status === 'accepted' ? 'bg-emerald-100 text-emerald-800 text-[10px] font-bold' :
                      d.status === 'pending' || d.status === 'shipped' || d.status === 'sent' ? 'bg-amber-100 text-amber-800 text-[10px] font-bold' :
                      'bg-slate-100 text-slate-800 text-[10px] font-bold'
                    }>
                      {d.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => handleOpenDetail(d)} size="sm" variant="outline" className="h-7 text-[10px] gap-1.5 px-2">
                      <Eye className="h-3 w-3" /> Ouvrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {docs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 italic">Aucun document dans ce registre.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG: DETAIL VIEWER */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Détail du Document</DialogTitle></DialogHeader>
          {selectedDoc && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between border-b pb-3 text-xs">
                <div>
                  <p className="font-black text-slate-700">NUMÉRO : {selectedDoc.doc_number}</p>
                  <p className="text-muted-foreground mt-1">Date: {new Date(selectedDoc.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">{selectedDoc.status}</Badge>
                </div>
              </div>

              <div className="text-xs space-y-1">
                <p><strong>Destinataire :</strong> {selectedDoc.customer_name || "Client Passant"}</p>
                <p><strong>Notes :</strong> {selectedDoc.notes || "Aucune note."}</p>
              </div>

              <div className="border rounded-xl overflow-hidden bg-slate-50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDoc.items && selectedDoc.items.map((it: any, i: number) => (
                      <TableRow key={i} className="text-xs">
                        <TableCell className="font-bold">{it.medication_name}</TableCell>
                        <TableCell className="text-right font-mono">x{it.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{Number(it.unit_price).toLocaleString()} CFA</TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-700">{Number(it.total_price).toLocaleString()} CFA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={exportPDF}>
                  <FileDown className="h-4 w-4" /> Exporter PDF
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => setIsDetailOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
