import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lightbulb, ArrowRight } from "lucide-react";

interface SmartRecommendationsProps {
  coveragePercent: number;
  completionPercent: number;
  delayedActions: number;
  facilitators: number;
  nucleoCount: number;
  turmasRealizadas: number;
  closedCycles: number;
  totalCycles: number;
}

interface Recommendation {
  priority: "high" | "medium" | "low";
  text: string;
}

export function SmartRecommendations(props: SmartRecommendationsProps) {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];

    if (props.coveragePercent < 30) {
      recs.push({ priority: "high", text: "Ampliar turmas M1 e M2 para aumentar a cobertura do programa." });
    }
    if (props.completionPercent < 30) {
      recs.push({ priority: "high", text: "Aumentar a frequência de práticas mensais para consolidar novos comportamentos." });
    }
    if (props.facilitators < 2) {
      recs.push({ priority: "high", text: "Fortalecer o núcleo de facilitadores — considere habilitar mais profissionais." });
    }
    if (props.delayedActions > 3) {
      recs.push({ priority: "high", text: "Priorizar a execução das ações atrasadas para manter engajamento." });
    }
    if (props.nucleoCount === 0) {
      recs.push({ priority: "high", text: "Constituir o Núcleo de Sustentação para garantir governança." });
    }
    if (props.turmasRealizadas === 0) {
      recs.push({ priority: "medium", text: "Iniciar os treinamentos — as turmas são fundamentais para o programa." });
    }
    if (props.coveragePercent >= 30 && props.coveragePercent < 60) {
      recs.push({ priority: "medium", text: "Expandir os treinamentos para atingir 60% de cobertura da base." });
    }
    if (props.closedCycles > 0 && props.closedCycles < props.totalCycles) {
      recs.push({ priority: "low", text: "Manter ritmo de encerramento dos ciclos para avançar nas fases." });
    }
    if (props.coveragePercent >= 60) {
      recs.push({ priority: "low", text: "Programa em boa evolução. Manter disciplina nos rituais e treinamentos." });
    }

    return recs.slice(0, 5);
  }, [props]);

  if (recommendations.length === 0) return null;

  const priorityConfig = {
    high: { dot: "bg-destructive", text: "text-destructive", label: "Alta" },
    medium: { dot: "bg-warning", text: "text-warning", label: "Média" },
    low: { dot: "bg-success", text: "text-success", label: "Baixa" },
  };

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <Lightbulb size={18} className="text-warning" /> Recomendações do Sistema
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Ações sugeridas para evolução do programa</p>

      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const config = priorityConfig[rec.priority];
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", config.dot)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{rec.text}</p>
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider flex-shrink-0", config.text)}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
