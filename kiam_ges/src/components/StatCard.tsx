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
    <div className={cn("relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/40 rounded-2xl p-5 hover:shadow-2xl hover:bg-white/80 transition-all duration-500 hover:-translate-y-1 group", className)} onClick={onClick}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10 flex items-start justify-between">
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
