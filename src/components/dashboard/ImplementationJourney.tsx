import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MapPin, ChevronRight } from "lucide-react";
import {
  getImplementationProgress,
  getImplementationProgressLabel,
  getCurrentJourneyStage,
  JOURNEY_STAGES,
  getCompletionForecast,
  getNextRecommendedAction,
} from "@/lib/implementationEngine";

interface Props {
  companyId: string;
  refreshKey: number;
}

export function ImplementationJourney({ companyId, refreshKey }: Props) {
  const progress = useMemo(() => getImplementationProgress(companyId), [companyId, refreshKey]);
  const currentStage = useMemo(() => getCurrentJourneyStage(progress), [progress]);
  const forecast = useMemo(() => getCompletionForecast(companyId), [companyId, refreshKey]);
  const nextAction = useMemo(() => getNextRecommendedAction(companyId), [companyId, refreshKey]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          Jornada da Implementação
        </h3>
        <span className="text-xs text-muted-foreground">{forecast.label}</span>
      </div>

      {/* Journey stages */}
      <div className="flex items-center gap-1 mb-5">
        {JOURNEY_STAGES.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isPast = JOURNEY_STAGES.findIndex(s => s.id === currentStage) > idx;
          return (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-full h-2 rounded-full transition-all",
                    isPast ? "bg-primary" : isActive ? "bg-primary/60" : "bg-muted"
                  )}
                />
                <span className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  isActive ? "text-primary font-bold" : isPast ? "text-foreground" : "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
              </div>
              {idx < JOURNEY_STAGES.length - 1 && (
                <ChevronRight size={12} className="text-muted-foreground/30 mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress + Next action */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
              strokeDasharray={`${progress * 2.64} ${264 - progress * 2.64}`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{progress}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">Próxima ação recomendada</p>
          <p className="text-sm font-medium text-foreground">{nextAction}</p>
          <p className="text-xs text-muted-foreground mt-1">{getImplementationProgressLabel(progress)}</p>
        </div>
      </div>
    </Card>
  );
}
