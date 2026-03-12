import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { getImplementationChecklist, getImplementationProgress, type ChecklistItem } from "@/lib/implementationEngine";

interface Props {
  companyId: string;
  refreshKey: number;
}

const phaseLabels: Record<string, string> = {
  onboarding: "Onboarding",
  pre_implementation: "Pré-Implementação",
  implementation: "Implementação",
};

const phaseColors: Record<string, string> = {
  onboarding: "text-primary",
  pre_implementation: "text-amber-500",
  implementation: "text-emerald-500",
};

export function ImplementationChecklist({ companyId, refreshKey }: Props) {
  const checklist = useMemo(() => getImplementationChecklist(companyId), [companyId, refreshKey]);
  const progress = useMemo(() => getImplementationProgress(companyId), [companyId, refreshKey]);

  const grouped = useMemo(() => {
    const map: Record<string, ChecklistItem[]> = {};
    checklist.forEach(item => {
      if (!map[item.phase]) map[item.phase] = [];
      map[item.phase].push(item);
    });
    return map;
  }, [checklist]);

  const phases = ["onboarding", "pre_implementation", "implementation"];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ClipboardList size={18} className="text-primary" />
          Checklist da Implementação MVP
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground">{progress}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {phases.map(phase => {
          const items = grouped[phase] || [];
          const completedCount = items.filter(i => i.completed).length;
          return (
            <div key={phase}>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("text-xs font-bold uppercase tracking-wider", phaseColors[phase])}>
                  {phaseLabels[phase]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {completedCount}/{items.length}
                </span>
              </div>
              <div className="space-y-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
                      item.completed ? "bg-success/5" : "bg-muted/30"
                    )}
                  >
                    {item.completed ? (
                      <CheckCircle2 size={16} className="text-success shrink-0" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm",
                      item.completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
