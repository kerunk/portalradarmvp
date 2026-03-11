import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, TrendingDown, Milestone, Check, Building2 } from "lucide-react";
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
  generateAdminNotifications,
  dismissAdminNotification,
  dismissAllAdminNotifications,
  type AdminNotification,
  type AdminNotificationPriority,
  type AdminNotificationType,
} from "@/lib/adminNotifications";

const typeIcons: Record<AdminNotificationType, typeof AlertTriangle> = {
  risk: AlertTriangle,
  opportunity: TrendingDown,
  milestone: Milestone,
};

const priorityStyles: Record<AdminNotificationPriority, string> = {
  critical: "text-destructive bg-destructive/10",
  warning: "text-warning bg-warning/10",
  insight: "text-primary bg-primary/10",
};

const priorityLabels: Record<AdminNotificationPriority, { emoji: string; label: string }> = {
  critical: { emoji: "🔴", label: "Crítico" },
  warning: { emoji: "🟡", label: "Atenção" },
  insight: { emoji: "🔵", label: "Insight" },
};

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const notifications = useMemo(() => generateAdminNotifications(), [refreshKey]);
  const unreadCount = notifications.length;

  const criticalCount = notifications.filter(n => n.priority === 'critical').length;

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismissAdminNotification(id);
    setRefreshKey(k => k + 1);
  };

  const handleDismissAll = () => {
    dismissAllAdminNotifications(notifications.map(n => n.id));
    setRefreshKey(k => k + 1);
  };

  const handleNavigate = (notification: AdminNotification) => {
    if (notification.navigateTo) {
      navigate(notification.navigateTo);
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
          <span>Alertas Estratégicos</span>
          {unreadCount > 0 && (
            <button onClick={handleDismissAll} className="text-xs text-primary hover:underline font-normal">
              Marcar todas como lidas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Priority summary */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
            {(['critical', 'warning', 'insight'] as AdminNotificationPriority[]).map(p => {
              const count = notifications.filter(n => n.priority === p).length;
              if (count === 0) return null;
              return (
                <Badge key={p} variant="outline" className={cn("text-[10px] gap-1", priorityStyles[p])}>
                  {priorityLabels[p].emoji} {count} {priorityLabels[p].label}
                </Badge>
              );
            })}
          </div>
        )}

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum alerta estratégico pendente
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNavigate(n)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group text-left"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", priorityStyles[n.priority])}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <span className="text-[10px]">{priorityLabels[n.priority].emoji}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      {n.companyName && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Building2 size={10} className="text-muted-foreground/60" />
                          <span className="text-[10px] text-muted-foreground/60">{n.companyName}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDismiss(e, n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                      title="Marcar como lida"
                    >
                      <Check size={14} />
                    </button>
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
