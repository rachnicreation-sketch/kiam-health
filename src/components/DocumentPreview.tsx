import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Download, 
  Mail, 
  FileText, 
  Building2, 
  Stethoscope, 
  FlaskConical,
  Receipt
} from "lucide-react";
import { Clinic, Patient } from "@/lib/mock-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DocumentPreviewProps {
  type: 'invoice' | 'prescription' | 'lab';
  data: any;
  clinic: Clinic | null;
  patient: Patient | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreview({ type, data, clinic, patient, isOpen, onOpenChange }: DocumentPreviewProps) {
  const getTitle = () => {
    switch(type) {
      case 'invoice': return "Facture Médicale";
      case 'prescription': return "Ordonnance Médicale";
      case 'lab': return "Résultats d'Analyses";
      default: return "Document";
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = getTitle();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text(clinic?.name || "Kiam Health", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(clinic?.address || "", 20, 27);
    doc.text(`Tél: ${clinic?.phone || ""}`, 20, 32);
    doc.text(clinic?.email || "", 20, 37);
    
    // Document Title
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(1);
    doc.line(20, 45, 190, 45);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text(title.toUpperCase(), 20, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Réf: ${data?.id || "N/A"}`, 20, 62);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 150, 62);
    
    // Patient Info
    doc.setFillColor(245, 247, 250);
    doc.rect(20, 70, 170, 25, 'F');
    doc.setTextColor(40);
    doc.setFontSize(11);
    doc.text("PATIENT(E):", 25, 78);
    doc.text(`${patient?.name} ${patient?.firstName}`.toUpperCase(), 25, 85);
    doc.text(`ID: ${patient?.id}`, 25, 90);
    
    doc.text("MÉDECIN:", 120, 78);
    doc.text("DR. MATIABA FIRMIN", 120, 85);
    
    // Content
    if (type === 'invoice') {
      const tableData = data?.items?.map((item: any) => [item.description, `${item.amount.toLocaleString()} CFA`]) || [];
      autoTable(doc, {
        startY: 105,
        head: [['Description', 'Montant']],
        body: tableData,
        foot: [['TOTAL À PAYER', `${data?.total?.toLocaleString()} CFA`]],
        theme: 'striped',
        headStyles: { fillColor: [0, 102, 204] },
        footStyles: { fillColor: [40, 44, 52], textColor: [255, 255, 255] }
      });
    } else if (type === 'prescription') {
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text("MÉDICAMENTS & POSOLOGIE:", 20, 110);
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(data?.prescription || "", 160);
      doc.text(splitText, 20, 120);
    } else if (type === 'lab') {
      autoTable(doc, {
        startY: 105,
        head: [['Analyse', 'Résultat', 'Unité', 'Référence']],
        body: [[data?.testName, data?.result, data?.unit, data?.normativeValue]],
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204] }
      });
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Ce document est une pièce officielle de l'établissement.", 20, pageHeight - 20);
    doc.text(`Généré par Kiam Health le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, pageHeight - 15);
    
    doc.save(`${title}_${data?.id || "doc"}.pdf`);
  };

  const Icon = type === 'invoice' ? Receipt : type === 'prescription' ? Stethoscope : FlaskConical;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">
        <DialogHeader className="p-4 bg-white border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" /> Aperture de Document
          </DialogTitle>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleDownloadPDF}>
                <Download className="h-3 w-3" /> Télécharger PDF
             </Button>
             <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => window.print()}>
                <Printer className="h-3 w-3" /> Imprimer
             </Button>
          </div>
        </DialogHeader>

        <div className="p-8 flex justify-center overflow-y-auto max-h-[80vh]">
          {/* Virtual A4 Page */}
          <div className="w-full bg-white shadow-xl min-h-[800px] p-12 relative font-sans text-slate-800">
             
             {/* Header Section */}
             <div className="flex justify-between items-start border-b-2 border-primary pb-8">
                <div className="flex gap-4 items-center">
                   {clinic?.logo ? (
                     <img src={clinic.logo} alt="Logo" className="h-20 w-20 object-contain" />
                   ) : (
                     <div className="h-20 w-20 bg-primary/10 rounded flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-primary" />
                     </div>
                   )}
                   <div className="space-y-1">
                      <h2 className="text-xl font-black text-primary uppercase leading-tight">{clinic?.name}</h2>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{clinic?.taxId}</p>
                   </div>
                </div>
                <div className="text-right space-y-1">
                   <p className="text-xs font-bold">{clinic?.address}</p>
                   <p className="text-xs font-medium">Tél: {clinic?.phone}</p>
                   <p className="text-xs text-muted-foreground">{clinic?.email}</p>
                   <p className="text-xs text-primary font-bold">{clinic?.website}</p>
                </div>
             </div>

             {/* Document Title & Reference */}
             <div className="mt-10 mb-8 border-b py-4 flex justify-between items-end">
                <div>
                   <h1 className="text-2xl font-black uppercase text-slate-900">{getTitle()}</h1>
                   <p className="text-xs text-muted-foreground">Réf: {data?.id || 'NO-REF'}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold uppercase">Date de délivrance</p>
                   <p className="text-sm font-black">{format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
             </div>

             {/* Patient Info */}
             <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-4 rounded-lg border">
                <div>
                   <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Patient(e)</p>
                   <p className="text-sm font-black uppercase">{patient?.name} {patient?.firstName}</p>
                   <p className="text-xs">ID: {patient?.id}</p>
                   <p className="text-xs">Tél: {patient?.phone}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Médecin / Responsable</p>
                   <p className="text-sm font-bold">DR. MATIABA FIRM</p>
                   <p className="text-xs italic text-muted-foreground">Médecine Générale</p>
                </div>
             </div>

             {/* Content Area */}
             <div className="min-h-[300px]">
                {type === 'invoice' && (
                  <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b-2 border-slate-200">
                          <th className="py-3 text-[10px] uppercase font-bold">Description des Actes / Produits</th>
                          <th className="py-3 text-[10px] uppercase font-bold text-right">Montant (FCFA)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                       {data?.items?.map((item: any, idx: number) => (
                         <tr key={idx}>
                            <td className="py-4 text-sm">{item.description}</td>
                            <td className="py-4 text-sm font-mono font-bold text-right">{item.amount.toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                    <tfoot>
                       <tr className="border-t-2 border-slate-900">
                          <td className="py-6 text-xl font-black uppercase">TOTAL À PAYER</td>
                          <td className="py-6 text-2xl font-black font-mono text-right">{data?.total?.toLocaleString()} CFA</td>
                       </tr>
                    </tfoot>
                  </table>
                )}

                {type === 'prescription' && (
                  <div className="space-y-6">
                     <div className="flex items-center gap-2 mb-4 border-b pb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase">Médicaments & Posologie</span>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 min-h-[200px] font-serif italic text-lg whitespace-pre-wrap">
                        {data?.prescription}
                     </div>
                  </div>
                )}

                {type === 'lab' && (
                  <div className="space-y-6">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b-2">
                              <th className="py-2 text-[10px] uppercase">Analyse réalisée</th>
                              <th className="py-2 text-[10px] uppercase text-center">Résultat</th>
                              <th className="py-2 text-[10px] uppercase text-center">Unité</th>
                              <th className="py-2 text-[10px] uppercase text-right">Valeurs de Référence</th>
                           </tr>
                        </thead>
                        <tbody>
                           <tr className="border-b">
                              <td className="py-4 font-bold text-sm">{data?.testName}</td>
                              <td className="py-4 text-center text-sm font-black text-primary">{data?.result}</td>
                              <td className="py-4 text-center text-xs text-muted-foreground">{data?.unit}</td>
                              <td className="py-4 text-right text-xs font-mono">{data?.normativeValue}</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
                )}
             </div>

             {/* Footer Signature */}
             <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                <div className="text-[10px] text-muted-foreground max-w-[250px]">
                   <p className="font-bold">NOTE LÉGALE :</p>
                   <p>Ce document est une pièce officielle de l'établissement {clinic?.name}. Toute falsification est passible de poursuites.</p>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-bold uppercase mb-4 text-muted-foreground underline">Le Responsable de l'établissement</p>
                   {/* Digital Stamp Simulation */}
                   <div className="h-20 w-20 border-4 border-blue-900/30 rounded-full flex items-center justify-center p-1 mx-auto rotate-12 -mt-2">
                      <div className="h-full w-full border-2 border-blue-900/20 rounded-full flex items-center justify-center text-[8px] font-black text-blue-900/50 text-center leading-tight uppercase">
                         CERTIFIÉ<br/>DOCUMENT<br/>OFFICIEL
                      </div>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
