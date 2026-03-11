import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface ProgramTimelineProps {
  phases: Array<{
    id: string;
    name: string;
    cycles: string[];
    status: "completed" | "in-progress" | "pending";
    progress: number;
  }>;
}

export function ProgramTimeline({ phases }: ProgramTimelineProps) {
  return (
    <div className="metric-card">
      <h3 className="font-medium text-foreground mb-5">Linha do Tempo do Programa</h3>
      <div className="flex items-start gap-0">
        {phases.map((phase, i) => {
          const isLast = i === phases.length - 1;
          return (
            <div key={phase.id} className="flex-1 relative">
              {/* Connector line */}
              {!isLast && (
                <div className={cn(
                  "absolute top-3 left-1/2 right-0 h-0.5 z-0",
                  phase.status === "completed" ? "bg-success" : "bg-border"
                )} />
              )}
              {i > 0 && (
                <div className={cn(
                  "absolute top-3 left-0 right-1/2 h-0.5 z-0",
                  phases[i - 1].status === "completed" ? "bg-success" : "bg-border"
                )} />
              )}

              <div className="flex flex-col items-center relative z-10">
                {/* Icon */}
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2",
                  phase.status === "completed" && "bg-success border-success text-white",
                  phase.status === "in-progress" && "bg-primary border-primary text-white",
                  phase.status === "pending" && "bg-card border-border text-muted-foreground",
                )}>
                  {phase.status === "completed" && <CheckCircle2 size={14} />}
                  {phase.status === "in-progress" && <Loader2 size={14} className="animate-spin" />}
                  {phase.status === "pending" && <Circle size={10} />}
                </div>

                {/* Phase label */}
                <p className={cn(
                  "text-xs font-semibold mt-2",
                  phase.status === "pending" ? "text-muted-foreground" : "text-foreground"
                )}>
                  {phase.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {phase.cycles.join(" · ")}
                </p>

                {/* Mini progress */}
                {phase.status === "in-progress" && (
                  <div className="w-12 h-1 rounded-full bg-muted mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${phase.progress}%` }} />
                  </div>
                )}
                {phase.status === "completed" && (
                  <span className="text-[10px] text-success font-medium mt-1">100%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
