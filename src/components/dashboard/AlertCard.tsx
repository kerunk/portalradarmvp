import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
}

interface AlertCardProps {
  alerts: Alert[];
}

export function AlertCard({ alerts }: AlertCardProps) {
  const typeStyles = {
    warning: "bg-warning/10 border-warning/20 text-warning",
    danger: "bg-destructive/10 border-destructive/20 text-destructive",
    info: "bg-primary/10 border-primary/20 text-primary",
  };

  const iconStyles = {
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-primary",
  };

  if (alerts.length === 0) {
    return (
      <div className="metric-card">
        <h3 className="font-medium text-foreground mb-4">Alertas</h3>
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Nenhum alerta no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Alertas</h3>
        <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full font-medium">
          {alerts.length} pendentes
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity",
              typeStyles[alert.type]
            )}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className={cn("mt-0.5", iconStyles[alert.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
