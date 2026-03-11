import { useState, useMemo } from "react";
import { Bell, Users, AlertTriangle, FileText, Lightbulb, Rocket, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getState } from "@/lib/storage";
import { obterIndicadoresGlobais } from "@/lib/governance";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: "turma" | "alert" | "action" | "report" | "insight";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const DISMISSED_KEY = "mvp_notifications_dismissed";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch { return []; }
}

function dismissNotification(id: string) {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

function generateNotifications(): Notification[] {
  const notifications: Notification[] = [];
  const state = getState();
  const indicators = obterIndicadoresGlobais();
  const dismissed = getDismissed();

  // Turmas criadas recentemente
  const turmas = state.turmas || [];
  if (turmas.length > 0) {
    const latest = turmas[turmas.length - 1];
    const id = `turma-${latest.id}`;
    if (!dismissed.includes(id)) {
      notifications.push({
        id,
        type: "turma",
        title: "Nova turma criada",
        message: `Turma "${latest.name}" foi criada com sucesso.`,
        time: "Recente",
        read: false,
      });
    }
  }

  // Ações atrasadas
  if (indicators.delayedActions > 0) {
    const id = `delayed-${indicators.delayedActions}`;
    if (!dismissed.includes(id)) {
      notifications.push({
        id,
        type: "alert",
        title: "Ações atrasadas",
        message: `Existem ${indicators.delayedActions} ações com prazo vencido que precisam de atenção.`,
        time: "Agora",
        read: false,
      });
    }
  }

  // Insight de cobertura
  const totalPop = state.population?.length || 0;
  const trainedIds = new Set<string>();
  turmas.forEach(t => {
    if (t.attendance) {
      Object.entries(t.attendance).forEach(([id, status]) => {
        if (status === "present") trainedIds.add(id);
      });
    }
  });
  const coverage = totalPop > 0 ? Math.round((trainedIds.size / totalPop) * 100) : 0;

  if (coverage < 30 && totalPop > 0) {
    const id = "insight-low-coverage";
    if (!dismissed.includes(id)) {
      notifications.push({
        id,
        type: "insight",
        title: "Cobertura baixa",
        message: `Apenas ${coverage}% da base foi treinada. Considere ampliar as turmas.`,
        time: "Insight",
        read: false,
      });
    }
  }

  // Ciclos prontos para encerrar
  if (indicators.cyclesReadyToClose > 0) {
    const id = `cycles-ready-${indicators.cyclesReadyToClose}`;
    if (!dismissed.includes(id)) {
      notifications.push({
        id,
        type: "action",
        title: "Ciclos prontos para encerrar",
        message: `${indicators.cyclesReadyToClose} ciclo(s) têm todas as ações concluídas e podem ser encerrados.`,
        time: "Agora",
        read: false,
      });
    }
  }

  return notifications;
}

const iconMap = {
  turma: Users,
  alert: AlertTriangle,
  action: Rocket,
  report: FileText,
  insight: Lightbulb,
};

const colorMap = {
  turma: "text-primary bg-primary/10",
  alert: "text-destructive bg-destructive/10",
  action: "text-success bg-success/10",
  report: "text-primary bg-primary/10",
  insight: "text-warning bg-warning/10",
};

export function NotificationsDropdown() {
  const [refreshKey, setRefreshKey] = useState(0);
  const notifications = useMemo(() => generateNotifications(), [refreshKey]);
  const unreadCount = notifications.length;

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setRefreshKey(k => k + 1);
  };

  const handleDismissAll = () => {
    notifications.forEach(n => dismissNotification(n.id));
    setRefreshKey(k => k + 1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <button onClick={handleDismissAll} className="text-xs text-primary hover:underline font-normal">
              Marcar todas como lidas
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação pendente
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((n) => {
                const Icon = iconMap[n.type];
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorMap[n.type])}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1 block">{n.time}</span>
                    </div>
                    <button
                      onClick={() => handleDismiss(n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                      title="Marcar como lida"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
