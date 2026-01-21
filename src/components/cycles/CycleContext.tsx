import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Info } from "lucide-react";

interface CycleContextProps {
  cycleId: string;
  name: string;
  description: string;
  impactedGroups: string[];
  estimatedDuration: string;
  phase: "M" | "V" | "P";
}

const phaseColors = {
  M: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  V: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  P: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

const phaseLabels = {
  M: "Monitorar",
  V: "Validar",
  P: "Perpetuar",
};

const phaseDescriptions = {
  M: "Fase de consciência e diagnóstico",
  V: "Fase de comprovação e reforço",
  P: "Fase de sustentabilidade e autonomia",
};

export function CycleContext({
  cycleId,
  name,
  description,
  impactedGroups,
  estimatedDuration,
  phase,
}: CycleContextProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-2">
      {/* Header with phase and cycle ID */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge
              variant="outline"
              className={`text-sm font-semibold px-3 py-1 ${phaseColors[phase]}`}
            >
              {phaseLabels[phase]}
            </Badge>
            <span className="text-2xl font-display font-bold text-primary">
              {cycleId}
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            {name}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Info size={14} />
            {phaseDescriptions[phase]}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            <Clock size={16} />
            <span>{estimatedDuration}</span>
          </div>
          <span className="text-xs text-muted-foreground italic">
            Ciclo metodológico, não mês cronológico
          </span>
        </div>
      </div>

      {/* Context description */}
      <div className="bg-secondary/30 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
          Contexto do Ciclo
        </h4>
        <p className="text-muted-foreground leading-relaxed text-sm">
          {description}
        </p>
      </div>

      {/* Impacted groups */}
      <div className="flex items-center gap-2">
        <Users size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Público impactado:</span>
        <div className="flex flex-wrap gap-2">
          {impactedGroups.map((group) => (
            <Badge key={group} variant="secondary" className="text-xs">
              {group}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
