import { DollarSign, Plus, Search, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const invoices = [
  { id: "FAC-001", guest: "Martin Dupont", room: "101", checkIn: "2026-06-28", checkOut: "2026-07-01", nights: 3, total: "135 000", paid: "135 000", status: "paid" },
  { id: "FAC-002", guest: "Sophie Laurent", room: "205", checkIn: "2026-07-01", checkOut: "2026-07-03", nights: 2, total: "120 000", paid: "0", status: "pending" },
  { id: "FAC-003", guest: "Client Inconnu", room: "308", checkIn: "2026-06-25", checkOut: "2026-06-27", nights: 2, total: "90 000", paid: "45 000", status: "partial" },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid: { label: "Payé", cls: "bg-green-100 text-green-700" },
  pending: { label: "En attente", cls: "bg-orange-100 text-orange-700" },
  partial: { label: "Partiel", cls: "bg-blue-100 text-blue-700" },
};

export default function HotelBilling() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturation</h1>
          <p className="text-slate-500 text-sm">Gestion des factures et paiements séjours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exporter</Button>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Nouvelle Facture</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "CA ce mois", value: "8 450 000 FCFA", cls: "text-blue-600" },
          { label: "Factures payées", value: invoices.filter(i => i.status === 'paid').length, cls: "text-green-600" },
          { label: "En attente", value: invoices.filter(i => i.status !== 'paid').length, cls: "text-orange-500" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Rechercher une facture..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Chambre</TableHead>
                <TableHead>Séjour</TableHead>
                <TableHead>Nuits</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="font-medium">{inv.guest}</TableCell>
                  <TableCell>Ch. {inv.room}</TableCell>
                  <TableCell className="text-xs text-slate-500">{inv.checkIn} → {inv.checkOut}</TableCell>
                  <TableCell>{inv.nights}</TableCell>
                  <TableCell className="font-semibold">{inv.total} F</TableCell>
                  <TableCell className="text-green-600">{inv.paid} F</TableCell>
                  <TableCell><Badge className={statusConfig[inv.status].cls}>{statusConfig[inv.status].label}</Badge></TableCell>
                  <TableCell><Button size="icon" variant="ghost" className="h-8 w-8"><FileText className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
