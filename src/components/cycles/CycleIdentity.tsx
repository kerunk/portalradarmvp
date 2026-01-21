import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CycleIdentityProps {
  cycleId: string;
  moduleTitle: string;
  moduleNumber?: number;
  phaseName: string;
  phase: "M" | "V" | "P";
  estimatedDuration: string;
  impactedGroups: string[];
}

const phaseConfig = {
  M: {
    label: "Monitorar",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    bgGradient: "from-blue-500/5 to-blue-600/10",
    iconColor: "text-blue-600",
  },
  V: {
    label: "Validar",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    bgGradient: "from-amber-500/5 to-amber-600/10",
    iconColor: "text-amber-600",
  },
  P: {
    label: "Perpetuar",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    bgGradient: "from-emerald-500/5 to-emerald-600/10",
    iconColor: "text-emerald-600",
  },
};

export function CycleIdentity({
  cycleId,
  moduleTitle,
  moduleNumber,
  phaseName,
  phase,
  estimatedDuration,
  impactedGroups,
}: CycleIdentityProps) {
  const config = phaseConfig[phase];

  return (
    <Card className={cn("p-6 border-l-4 bg-gradient-to-r", config.bgGradient, {
      "border-l-blue-500": phase === "M",
      "border-l-amber-500": phase === "V",
      "border-l-emerald-500": phase === "P",
    })}>
      <div className="flex flex-col gap-4">
        {/* Header with Cycle ID and Phase */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-xl",
              config.color
            )}>
              {cycleId}
            </div>
            <div>
              <Badge className={cn("mb-1", config.color)}>
                <Layers size={12} className="mr-1" />
                Fase {phaseName}
              </Badge>
              <h2 className="text-xl font-display font-semibold text-foreground">
                {moduleNumber ? `Módulo ${moduleNumber}: ` : ""}{moduleTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={16} className={config.iconColor} />
            <span>Duração: <strong className="text-foreground">{estimatedDuration}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} className={config.iconColor} />
            <span>Público: </span>
            <div className="flex flex-wrap gap-1">
              {impactedGroups.map((group, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  {group}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
