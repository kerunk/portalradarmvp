import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, ArrowRight, Clock, CheckCircle2, Users,
  FileText, Lock, AlertCircle, X, CalendarCheck, User, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";

interface SmartAlertsProps {
  onAlertDismissed?: () => void;
  maxAlerts?: number;
  refreshTrigger?: number;
}

const alertIcons = {
  delayed_action:       AlertTriangle,
  cycle_ready:          CheckCircle2,
  cycle_blocked:        Lock,
  turma_delayed:        Clock,
  record_without_action:FileText,
  low_participation:    Users,
  action_missing_info:  AlertCircle,
  consultant_reminder:  CalendarCheck,
};

const severityStyles = {
  danger:  "bg-destructive/10 border-destructive/20 text-destructive",
  warning: "bg-warning/10 border-warning/20 text-warning",
  info:    "bg-primary/10 border-primary/20 text-primary",
};

export function SmartAlerts({ onAlertDismissed, maxAlerts = 5, refreshTrigger = 0 }: SmartAlertsProps) {
  const navigate = useNavigate();
  const { alerts, loading, dismiss } = useSmartAlerts(refreshTrigger);

  const displayed = alerts.slice(0, maxAlerts);

  const handleNavigate = (alert: (typeof alerts)[0]) => {
    const url = new URL(alert.navigateTo, window.location.origin);
    if (alert.actionId) url.searchParams.set("highlight", alert.actionId);
    url.searchParams.set("fromAlert", "true");
    navigate(url.pathname + url.search);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismiss(id);
    onAlertDismissed?.();
  };

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Carregando alertas...</p>
      </Card>
    );
  }

  if (displayed.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success" />
          <p className="text-sm text-muted-foreground">Nenhum alerta ativo no momento.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Alertas do Programa</h3>
        <Badge variant="secondary" className="text-xs">
          {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </Badge>
      </div>

      <div className="space-y-3">
        {displayed.map(alert => {
          const Icon = alertIcons[alert.type] || AlertTriangle;
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
                    {alert.autoResolves && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 -mr-1"
                        onClick={e => handleDismiss(e, alert.id)}
                      >
                        <X size={12} />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {alert.cycleId && (
                      <Badge variant="outline" className="text-xs">Ciclo {alert.cycleId}</Badge>
                    )}
                    {alert.responsible && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <User size={10} />{alert.responsible}
                      </Badge>
                    )}
                    {alert.dueDate && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Calendar size={10} />
                        {new Date(alert.dueDate).toLocaleDateString("pt-BR")}
                      </Badge>
                    )}
                  </div>
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
