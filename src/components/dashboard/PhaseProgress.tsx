import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase {
  id: string;
  name: string;
  status: "completed" | "in-progress" | "pending";
  progress?: number;
}

interface PhaseProgressProps {
  phases: Phase[];
}

export function PhaseProgress({ phases }: PhaseProgressProps) {
  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success",
      label: "Concluída",
    },
    "in-progress": {
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary",
      label: "Em andamento",
    },
    pending: {
      icon: Circle,
      color: "text-muted-foreground",
      bg: "bg-muted",
      label: "Pendente",
    },
  };

  return (
    <div className="metric-card">
      <h3 className="font-medium text-foreground mb-6">Fases do Programa</h3>

      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />

        <div className="space-y-4">
          {phases.map((phase, index) => {
            const config = statusConfig[phase.status];
            const Icon = config.icon;

            return (
              <div key={phase.id} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center z-10",
                    phase.status === "completed"
                      ? "bg-success"
                      : phase.status === "in-progress"
                      ? "bg-primary"
                      : "bg-muted border-2 border-border"
                  )}
                >
                  <Icon
                    size={14}
                    className={cn(
                      phase.status === "pending"
                        ? "text-muted-foreground"
                        : "text-white"
                    )}
                  />
                </div>

                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "font-medium",
                        phase.status === "pending"
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {phase.name}
                    </p>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        phase.status === "completed"
                          ? "bg-success/15 text-success"
                          : phase.status === "in-progress"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {config.label}
                    </span>
                  </div>

                  {phase.status === "in-progress" && phase.progress !== undefined && (
                    <div className="mt-2">
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {phase.progress}% concluído
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
