import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
  onClick?: () => void;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  iconClassName,
  className,
  onClick
}: StatCardProps) {
  return (
    <div className={cn("stat-card", className)} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", iconClassName || "bg-primary/10")}>
          <Icon className={cn("h-5 w-5", iconClassName ? "text-current" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
