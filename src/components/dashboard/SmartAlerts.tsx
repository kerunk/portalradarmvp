import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Users, 
  FileText,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type SmartAlert, dismissAlert } from "@/lib/storage";

interface SmartAlertsProps {
  alerts: SmartAlert[];
  onAlertDismissed?: () => void;
  maxAlerts?: number;
}

const alertIcons = {
  delayed_action: AlertTriangle,
  low_participation: Users,
  cycle_ready: CheckCircle2,
  decision_pending: FileText,
  turma_delayed: Clock,
};

const severityStyles = {
  danger: "bg-destructive/10 border-destructive/20 text-destructive",
  warning: "bg-warning/10 border-warning/20 text-warning",
  info: "bg-primary/10 border-primary/20 text-primary",
};

export function SmartAlerts({ alerts, onAlertDismissed, maxAlerts = 5 }: SmartAlertsProps) {
  const navigate = useNavigate();

  const displayedAlerts = alerts.slice(0, maxAlerts);

  const handleNavigate = (alert: SmartAlert) => {
    navigate(alert.navigateTo);
  };

  const handleDismiss = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    dismissAlert(alertId);
    onAlertDismissed?.();
  };

  if (displayedAlerts.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="font-medium text-foreground mb-4">Alertas Inteligentes</h3>
        <div className="text-center py-6 text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum alerta no momento</p>
          <p className="text-xs mt-1">O sistema está funcionando normalmente</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Alertas Inteligentes</h3>
        <Badge variant="destructive" className="text-xs">
          {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
        </Badge>
      </div>

      <div className="space-y-3">
        {displayedAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          
          return (
            <button
              key={alert.id}
              onClick={() => handleNavigate(alert)}
              className={cn(
                "w-full p-3 rounded-lg border cursor-pointer transition-all text-left group",
                "hover:opacity-90 hover:shadow-sm",
                severityStyles[alert.severity]
              )}
            >
              <div className="flex items-start gap-3">
                <Icon size={16} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 -mr-1"
                      onClick={(e) => handleDismiss(e, alert.id)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  {alert.cycleId && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Ciclo {alert.cycleId}
                    </Badge>
                  )}
                </div>
                <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {alerts.length > maxAlerts && (
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-sm"
          onClick={() => navigate("/indicadores?tab=deadlines")}
        >
          Ver todos os {alerts.length} alertas
        </Button>
      )}
    </Card>
  );
}