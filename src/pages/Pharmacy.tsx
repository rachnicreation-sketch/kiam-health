import { Pill, Plus, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";

const medications = [
  { name: "Paracétamol 500mg", category: "Antalgique", stock: 1200, unit: "cp", threshold: 200, price: "150 FCFA" },
  { name: "Amoxicilline 500mg", category: "Antibiotique", stock: 340, unit: "gélules", threshold: 100, price: "250 FCFA" },
  { name: "Métformine 850mg", category: "Antidiabétique", stock: 85, unit: "cp", threshold: 100, price: "300 FCFA" },
  { name: "Oméprazole 20mg", category: "IPP", stock: 450, unit: "gélules", threshold: 80, price: "350 FCFA" },
  { name: "Sérum physiologique 500ml", category: "Soluté", stock: 60, unit: "flacons", threshold: 50, price: "1200 FCFA" },
  { name: "Ibuprofène 400mg", category: "AINS", stock: 890, unit: "cp", threshold: 150, price: "200 FCFA" },
];

export default function Pharmacy() {
  const lowStock = medications.filter((m) => m.stock <= m.threshold).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            Pharmacie
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des stocks et délivrances</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter médicament
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total médicaments" value={String(medications.length)} icon={Pill} />
        <StatCard title="Rupture de stock" value={String(lowStock)} icon={AlertTriangle} iconClassName="bg-destructive/10 text-destructive" changeType="negative" change={lowStock > 0 ? "Attention requise" : ""} />
        <StatCard title="Délivrances aujourd'hui" value="23" icon={Pill} iconClassName="bg-success/10 text-success" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un médicament..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Médicament</TableHead>
                <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden lg:table-cell">Prix unitaire</TableHead>
                <TableHead>État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{m.category}</TableCell>
                  <TableCell>{m.stock} {m.unit}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{m.price}</TableCell>
                  <TableCell>
                    <Badge variant={m.stock <= m.threshold ? "destructive" : "outline"}>
                      {m.stock <= m.threshold ? "Stock bas" : "OK"}
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
