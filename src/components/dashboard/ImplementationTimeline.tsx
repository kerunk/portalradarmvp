import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, GraduationCap, CheckCircle2, Flag, Zap } from "lucide-react";
import { getState } from "@/lib/storage";
import { obterIndicadoresTodosCiclos } from "@/lib/governance";

interface ImplementationTimelineProps {
  refreshKey?: number;
}

interface TimelineEvent {
  date: string;
  label: string;
  type: "start" | "turma" | "practice" | "milestone" | "cycle";
  icon: typeof Calendar;
}

export function ImplementationTimeline({ refreshKey }: ImplementationTimelineProps) {
  const events = useMemo(() => {
    const state = getState();
    const cycleIndicators = obterIndicadoresTodosCiclos();
    const timeline: TimelineEvent[] = [];

    // Program start
    timeline.push({
      date: "Início",
      label: "Programa MVP iniciado",
      type: "start",
      icon: Flag,
    });

    // Completed turmas
    state.turmas
      .filter(t => t.status === "completed")
      .sort((a, b) => (a.trainingDate || a.startDate || "").localeCompare(b.trainingDate || b.startDate || ""))
      .forEach(t => {
        const dateStr = t.trainingDate || t.startDate;
        timeline.push({
          date: dateStr ? new Date(dateStr).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "N/A",
          label: `Turma "${t.name}" realizada (${t.cycleId})`,
          type: "turma",
          icon: GraduationCap,
        });
      });

    // Closed cycles
    cycleIndicators
      .filter(c => c.status === "closed")
      .forEach(c => {
        timeline.push({
          date: "Marco",
          label: `Ciclo ${c.cycleId} — ${c.phaseName} encerrado`,
          type: "cycle",
          icon: CheckCircle2,
        });
      });

    // First completed action
    let hasCompletedAction = false;
    Object.values(state.cycles).forEach(cs => {
      cs.factors.forEach(f => {
        f.actions.forEach(a => {
          if (a.enabled && a.status === "completed" && !hasCompletedAction) {
            hasCompletedAction = true;
            timeline.push({
              date: "Marco",
              label: "Primeira prática executada",
              type: "practice",
              icon: Zap,
            });
          }
        });
      });
    });

    return timeline;
  }, [refreshKey]);

  const typeStyles: Record<string, { bg: string; iconBg: string; line: string }> = {
    start: { bg: "bg-primary/5 border-primary/20", iconBg: "bg-primary/10 text-primary", line: "bg-primary" },
    turma: { bg: "bg-success/5 border-success/20", iconBg: "bg-success/10 text-success", line: "bg-success" },
    practice: { bg: "bg-warning/5 border-warning/20", iconBg: "bg-warning/10 text-warning", line: "bg-warning" },
    milestone: { bg: "bg-accent/5 border-accent/20", iconBg: "bg-accent/10 text-accent", line: "bg-accent" },
    cycle: { bg: "bg-primary/5 border-primary/20", iconBg: "bg-primary/10 text-primary", line: "bg-primary" },
  };

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <Calendar size={18} className="text-primary" /> Linha do Tempo da Implementação
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Eventos e marcos do programa</p>

      <div className="relative space-y-0">
        {events.map((event, i) => {
          const styles = typeStyles[event.type] || typeStyles.milestone;
          const Icon = event.icon;
          const isLast = i === events.length - 1;

          return (
            <div key={i} className="flex gap-3 relative">
              {/* Vertical line */}
              {!isLast && (
                <div className={cn("absolute left-[15px] top-8 w-0.5 h-full", styles.line, "opacity-20")} />
              )}

              {/* Icon */}
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10", styles.iconBg)}>
                <Icon size={14} />
              </div>

              {/* Content */}
              <div className={cn("flex-1 pb-4")}>
                <p className="text-xs font-semibold text-muted-foreground">{event.date}</p>
                <p className="text-sm text-foreground">{event.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
