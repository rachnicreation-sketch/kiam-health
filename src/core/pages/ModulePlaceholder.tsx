import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface ModulePlaceholderProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function ModulePlaceholder({ 
  title = "Module", 
  description = "Ce module est en cours de développement.", 
  icon: Icon = Construction 
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          {title}
        </h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Construction className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold text-muted-foreground">Module en cours de développement</h2>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-md">
            Ce module sera bientôt disponible. Contactez Matiaba Firm pour plus d'informations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
