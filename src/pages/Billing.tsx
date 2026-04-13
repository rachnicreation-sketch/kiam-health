import { Receipt, Plus, Search, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";

const invoices = [
  { id: "F-2026-001", patient: "Marie Dupont", date: "13/04/2026", amount: "45 000 FCFA", status: "Payée" },
  { id: "F-2026-002", patient: "Jean Koné", date: "12/04/2026", amount: "120 000 FCFA", status: "En attente" },
  { id: "F-2026-003", patient: "Awa Traoré", date: "11/04/2026", amount: "35 000 FCFA", status: "Payée" },
  { id: "F-2026-004", patient: "Ibrahim Diallo", date: "10/04/2026", amount: "85 000 FCFA", status: "En retard" },
  { id: "F-2026-005", patient: "Fatou Camara", date: "09/04/2026", amount: "250 000 FCFA", status: "Payée" },
];

export default function Billing() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Facturation
          </h1>
          <p className="text-muted-foreground text-sm">Suivi des factures et paiements</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Revenus du mois" value="6.2M FCFA" icon={TrendingUp} iconClassName="bg-success/10 text-success" change="+15%" changeType="positive" />
        <StatCard title="En attente" value="205K FCFA" icon={Clock} iconClassName="bg-warning/10 text-warning" />
        <StatCard title="Factures payées" value="42" icon={CheckCircle} iconClassName="bg-success/10 text-success" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher une facture..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs text-muted-foreground">{inv.id}</TableCell>
                  <TableCell className="font-medium">{inv.patient}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="font-medium">{inv.amount}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "Payée" ? "outline" : inv.status === "En retard" ? "destructive" : "secondary"}>
                      {inv.status}
                    </Badge>
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
