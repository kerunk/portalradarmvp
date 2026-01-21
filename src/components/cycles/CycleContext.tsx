import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Target } from "lucide-react";

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
  M: "Mindset",
  V: "Valores",
  P: "Práticas",
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
          <h2 className="text-xl font-display font-bold text-foreground">
            {name}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
          <Clock size={16} />
          <span>{estimatedDuration}</span>
        </div>
      </div>

      <p className="text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-2">
        <Users size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Impacta:</span>
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
