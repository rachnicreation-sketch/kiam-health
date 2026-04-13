import { Stethoscope, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const consultations = [
  { id: 1, patient: "Marie Dupont", doctor: "Dr. Keita", date: "13/04/2026", time: "09:30", motif: "Douleurs abdominales", status: "En cours" },
  { id: 2, patient: "Jean Koné", doctor: "Dr. Coulibaly", date: "13/04/2026", time: "10:00", motif: "Suivi diabète", status: "Planifié" },
  { id: 3, patient: "Awa Traoré", doctor: "Dr. Diarra", date: "13/04/2026", time: "10:30", motif: "Bilan prénatal", status: "Planifié" },
  { id: 4, patient: "Ibrahim Diallo", doctor: "Dr. Keita", date: "13/04/2026", time: "11:00", motif: "Consultation cardiologique", status: "Planifié" },
  { id: 5, patient: "Fatou Camara", doctor: "Dr. Traoré", date: "12/04/2026", time: "14:00", motif: "Contrôle post-op", status: "Terminé" },
  { id: 6, patient: "Moussa Sidibé", doctor: "Dr. Coulibaly", date: "12/04/2026", time: "15:00", motif: "Fièvre persistante", status: "Terminé" },
];

export default function Consultations() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Consultations
          </h1>
          <p className="text-muted-foreground text-sm">Suivi des consultations médicales</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle consultation
        </Button>
      </div>

      <div className="grid gap-3">
        {consultations.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground">{c.time}</p>
                  <p className="text-xs text-muted-foreground">{c.date}</p>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.patient}</p>
                <p className="text-sm text-muted-foreground">{c.motif}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{c.doctor}</p>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                    c.status === "En cours"
                      ? "bg-primary/10 text-primary"
                      : c.status === "Terminé"
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
