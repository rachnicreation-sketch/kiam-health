import { Users, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const patients = [
  { id: "P-001", name: "Marie Dupont", age: 34, gender: "F", phone: "+223 70 12 34 56", lastVisit: "12/04/2026", status: "Actif" },
  { id: "P-002", name: "Jean Koné", age: 52, gender: "M", phone: "+223 76 98 76 54", lastVisit: "11/04/2026", status: "Hospitalisé" },
  { id: "P-003", name: "Awa Traoré", age: 28, gender: "F", phone: "+223 66 45 67 89", lastVisit: "10/04/2026", status: "Actif" },
  { id: "P-004", name: "Ibrahim Diallo", age: 45, gender: "M", phone: "+223 79 23 45 67", lastVisit: "09/04/2026", status: "Actif" },
  { id: "P-005", name: "Fatou Camara", age: 61, gender: "F", phone: "+223 65 78 90 12", lastVisit: "08/04/2026", status: "Sorti" },
  { id: "P-006", name: "Moussa Sidibé", age: 39, gender: "M", phone: "+223 74 56 78 90", lastVisit: "07/04/2026", status: "Actif" },
];

export default function Patients() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Patients
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des dossiers patients</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau patient
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un patient..." className="pl-10" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="hidden md:table-cell">Âge</TableHead>
                <TableHead className="hidden md:table-cell">Sexe</TableHead>
                <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
                <TableHead className="hidden lg:table-cell">Dernière visite</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.age}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.gender}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{p.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{p.lastVisit}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Hospitalisé" ? "default" : p.status === "Sorti" ? "secondary" : "outline"}>
                      {p.status}
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
