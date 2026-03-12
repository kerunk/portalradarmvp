import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import {
  getPipelineStats,
  STAGE_LABELS,
  STAGE_COLORS,
  type ImplementationStage,
} from "@/lib/portfolioUtils";
import { cn } from "@/lib/utils";

interface ImplementationPipelineProps {
  refreshKey?: number;
}

const stageOrder: ImplementationStage[] = ["onboarding", "implementacao", "consolidacao", "finalizado"];

export function ImplementationPipeline({ refreshKey }: ImplementationPipelineProps) {
  const stats = useMemo(() => getPipelineStats(), [refreshKey]);
  const total = stageOrder.reduce((s, k) => s + stats[k], 0);

  return (
    <Card className="p-5">
      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
        <Layers size={18} className="text-primary" />
        Pipeline de Implementação
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stageOrder.map(stage => (
          <div
            key={stage}
            className={cn(
              "rounded-xl border p-4 text-center",
              STAGE_COLORS[stage]
            )}
          >
            <p className="text-3xl font-bold text-foreground">{stats[stage]}</p>
            <p className="text-sm mt-1">{STAGE_LABELS[stage]}</p>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="mt-4 flex h-3 rounded-full overflow-hidden bg-muted">
          {stageOrder.map(stage => {
            const pct = (stats[stage] / total) * 100;
            if (pct === 0) return null;
            const bgMap: Record<ImplementationStage, string> = {
              onboarding: "bg-muted-foreground/40",
              implementacao: "bg-blue-500",
              consolidacao: "bg-amber-500",
              finalizado: "bg-emerald-500",
            };
            return (
              <div key={stage} className={cn("h-full transition-all", bgMap[stage])} style={{ width: `${pct}%` }} />
            );
          })}
        </div>
      )}
    </Card>
  );
}
