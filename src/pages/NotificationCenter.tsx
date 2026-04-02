import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, AlertTriangle, TrendingDown, Milestone, Check,
  Building2, Clock, Archive, Filter, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  dismissAdminNotification,
  dismissAllAdminNotifications,
} from "@/lib/adminNotifications";
import { dismissAlert } from "@/lib/storage";
import { getVisibleAlertsForUser, type UnifiedAlert } from "@/lib/alertVisibility";

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

// Notification history storage
function getNotificationHistory(): { id: string; title: string; message: string; priority: string; companyName?: string; dismissedAt: string }[] {
  try {
    return JSON.parse(localStorage.getItem("mvp_notification_history") || "[]");
  } catch { return []; }
}

function addToHistory(n: AdminNotification) {
  const history = getNotificationHistory();
  history.unshift({
    id: n.id,
    title: n.title,
    message: n.message,
    priority: n.priority,
    companyName: n.companyName,
    dismissedAt: new Date().toISOString(),
  });
  localStorage.setItem("mvp_notification_history", JSON.stringify(history.slice(0, 100)));
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { isAdminMVP } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("active");

  const notifications = useMemo(() => generateAdminNotifications(), [refreshKey]);
  const history = useMemo(() => getNotificationHistory(), [refreshKey]);

  const criticalCount = notifications.filter(n => n.priority === "critical").length;
  const warningCount = notifications.filter(n => n.priority === "warning").length;
  const insightCount = notifications.filter(n => n.priority === "insight").length;

  const handleDismiss = (notification: AdminNotification) => {
    addToHistory(notification);
    dismissAdminNotification(notification.id);
    setRefreshKey(k => k + 1);
  };

  const handleDismissAll = () => {
    notifications.forEach(n => addToHistory(n));
    dismissAllAdminNotifications(notifications.map(n => n.id));
    setRefreshKey(k => k + 1);
  };

  const handleNavigate = (notification: AdminNotification) => {
    if (notification.companyId) {
      navigate(`/empresas/${notification.companyId}`);
    } else if (notification.navigateTo) {
      navigate(notification.navigateTo);
    }
  };

  return (
    <AppLayout title="Central de Notificações" subtitle="Alertas e monitoramento da implementação">
      <div className="space-y-6 animate-fade-in">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Críticos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{warningCount}</p>
                <p className="text-sm text-muted-foreground">Atenção</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{insightCount}</p>
                <p className="text-sm text-muted-foreground">Insights</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Archive size={20} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{history.length}</p>
                <p className="text-sm text-muted-foreground">Histórico</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="active" className="gap-1">
                <Bell size={14} /> Ativos
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 ml-1">{notifications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <Archive size={14} /> Histórico
              </TabsTrigger>
            </TabsList>
            {activeTab === "active" && notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDismissAll}>
                <Check size={14} className="mr-1" /> Marcar todas como lidas
              </Button>
            )}
          </div>

          <TabsContent value="active">
            <Card className="p-0">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhuma notificação pendente</p>
                  <p className="text-sm mt-1">Todos os alertas foram resolvidos</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleNavigate(n)}
                    >
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", priorityStyles[n.priority])}>
                        <AlertTriangle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{n.title}</p>
                          <Badge variant="outline" className={cn("text-[10px]", priorityStyles[n.priority])}>
                            {priorityLabels[n.priority].emoji} {priorityLabels[n.priority].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                        {n.companyName && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Building2 size={12} className="text-muted-foreground/60" />
                            <span className="text-xs text-muted-foreground/60">{n.companyName}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleDismiss(n); }}
                      >
                        <Check size={14} className="mr-1" /> Lida
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-0">
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Archive size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum histórico</p>
                  <p className="text-sm mt-1">Alertas lidos aparecerão aqui</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {history.map((h, i) => (
                    <div key={`${h.id}-${i}`} className="flex items-start gap-4 p-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        h.priority === "critical" ? "bg-destructive/10 text-destructive" :
                        h.priority === "warning" ? "bg-warning/10 text-warning" :
                        "bg-primary/10 text-primary"
                      )}>
                        <Check size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{h.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{h.message}</p>
                        {h.companyName && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 size={10} className="text-muted-foreground/60" />
                            <span className="text-[10px] text-muted-foreground/60">{h.companyName}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(h.dismissedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
