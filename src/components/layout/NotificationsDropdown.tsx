import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, TrendingDown, Milestone, Check, Building2, Clock, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  dismissAdminNotification,
  dismissAllAdminNotifications,
} from "@/lib/adminNotifications";
import { dismissAlert } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { getVisibleAlertsForUser, type UnifiedAlert } from "@/lib/alertVisibility";

const severityStyles: Record<string, string> = {
  critical: "text-destructive bg-destructive/10",
  warning: "text-warning bg-warning/10",
  info: "text-primary bg-primary/10",
};

const severityLabels: Record<string, { emoji: string; label: string }> = {
  critical: { emoji: "🔴", label: "Crítico" },
  warning: { emoji: "🟡", label: "Atenção" },
  info: { emoji: "🔵", label: "Info" },
};

const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  warning: Clock,
  info: CheckCircle2,
};

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const { user, isCliente } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const alerts = useMemo(() => getVisibleAlertsForUser(user), [refreshKey, user]);
  const unreadCount = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === "critical").length;

  const handleDismiss = (e: React.MouseEvent, alert: UnifiedAlert) => {
    e.stopPropagation();
    if (alert.type === "smart") {
      // Smart alerts use governance dismiss
      const rawId = alert.id.replace("smart-", "");
      dismissAlert(rawId);
    } else {
      dismissAdminNotification(alert.id);
    }
    setRefreshKey(k => k + 1);
  };

  const handleDismissAll = () => {
    alerts.forEach(a => {
      if (a.type === "smart") {
        dismissAlert(a.id.replace("smart-", ""));
      } else {
        dismissAdminNotification(a.id);
      }
    });
    setRefreshKey(k => k + 1);
  };

  const handleNavigate = (alert: UnifiedAlert) => {
    if (alert.navigateTo) {
      navigate(alert.navigateTo);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute top-1 right-1 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center",
              criticalCount > 0
                ? "bg-destructive text-destructive-foreground"
                : "bg-accent text-accent-foreground"
            )}>
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{isCliente ? "Alertas" : "Alertas Estratégicos"}</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={handleDismissAll} className="text-xs text-primary hover:underline font-normal">
                Limpar
              </button>
            )}
            <button onClick={() => navigate("/notificacoes")} className="text-xs text-primary hover:underline font-normal">
              Ver todas →
            </button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Priority summary */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
            {(["critical", "warning", "info"] as const).map(s => {
              const count = alerts.filter(a => a.severity === s).length;
              if (count === 0) return null;
              return (
                <Badge key={s} variant="outline" className={cn("text-[10px] gap-1", severityStyles[s])}>
                  {severityLabels[s].emoji} {count} {severityLabels[s].label}
                </Badge>
              );
            })}
          </div>
        )}

        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum alerta pendente
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {alerts.slice(0, 10).map((alert) => {
                const Icon = severityIcons[alert.severity] || AlertTriangle;
                return (
                  <button
                    key={alert.id}
                    onClick={() => handleNavigate(alert)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group text-left"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", severityStyles[alert.severity])}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        <span className="text-[10px]">{severityLabels[alert.severity]?.emoji}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                      {alert.companyName && !isCliente && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Building2 size={10} className="text-muted-foreground/60" />
                          <span className="text-[10px] text-muted-foreground/60">{alert.companyName}</span>
                        </div>
                      )}
                    </div>
                    {alert.dismissible && (
                      <button
                        onClick={(e) => handleDismiss(e, alert)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                        title="Marcar como lida"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
