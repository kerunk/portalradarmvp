import { Card } from "@/components/ui/card";
import { CheckCircle2, Target, Award } from "lucide-react";

interface CycleExpectationsProps {
  whatHappens: string[];
  expectedResults: string[];
  successCriteria: string[];
}

export function CycleExpectations({
  whatHappens,
  expectedResults,
  successCriteria,
}: CycleExpectationsProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Target size={20} className="text-primary" />
        Expectativas do Ciclo
      </h3>

      <div className="grid gap-6 md:grid-cols-3">
        {/* O que precisa acontecer */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            O que precisa acontecer
          </h4>
          <ul className="space-y-2">
            {whatHappens.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Resultados esperados */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resultados esperados
          </h4>
          <ul className="space-y-2">
            {expectedResults.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <Award size={16} className="text-success mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Critérios de sucesso */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Critérios de sucesso
          </h4>
          <ul className="space-y-2">
            {successCriteria.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <Target size={16} className="text-warning mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
