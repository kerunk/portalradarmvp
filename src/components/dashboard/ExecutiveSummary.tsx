import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveSummaryProps {
  companyName: string;
  populationTotal: number;
  nucleoCount: number;
  facilitatorsCount: number;
  turmasRealizadas: number;
  closedCycles: number;
  totalCycles: number;
  completionPercent: number;
  delayedActions: number;
  coveragePercent: number;
}

function getSummaryMessage(props: ExecutiveSummaryProps): { message: string; icon: typeof Sparkles; variant: "success" | "progress" | "attention" | "start" } {
  const { populationTotal, closedCycles, completionPercent, delayedActions, turmasRealizadas, coveragePercent, nucleoCount } = props;

  if (populationTotal === 0) {
    return { message: "Configure a base populacional para iniciar o programa MVP.", icon: Clock, variant: "start" };
  }
  if (nucleoCount === 0) {
    return { message: "Base populacional configurada — defina o núcleo de sustentação para avançar.", icon: TrendingUp, variant: "start" };
  }
  if (turmasRealizadas === 0 && closedCycles === 0) {
    return { message: "Estrutura configurada — pronto para criar turmas e iniciar treinamentos.", icon: Sparkles, variant: "start" };
  }
  if (delayedActions > 3) {
    return { message: `Atenção: ${delayedActions} ações atrasadas requerem ação imediata do núcleo.`, icon: AlertTriangle, variant: "attention" };
  }
  if (completionPercent >= 80 && coveragePercent >= 70) {
    return { message: "Programa em estágio avançado — maturidade e cobertura em evolução consistente.", icon: CheckCircle2, variant: "success" };
  }
  return { message: `Implementação em evolução — ${closedCycles} ciclos encerrados, ${coveragePercent}% de cobertura do programa.`, icon: TrendingUp, variant: "progress" };
}

const variantStyles = {
  success: "from-success/10 via-success/5 to-transparent border-success/20",
  progress: "from-primary/10 via-primary/5 to-transparent border-primary/20",
  attention: "from-warning/10 via-warning/5 to-transparent border-warning/20",
  start: "from-primary/8 via-primary/4 to-transparent border-primary/15",
};

const iconVariantStyles = {
  success: "bg-success/15 text-success",
  progress: "bg-primary/15 text-primary",
  attention: "bg-warning/15 text-warning",
  start: "bg-primary/10 text-primary",
};

export function ExecutiveSummary(props: ExecutiveSummaryProps) {
  const { message, icon: Icon, variant } = getSummaryMessage(props);

  return (
    <div className={cn(
      "relative rounded-xl border bg-gradient-to-r p-5 overflow-hidden",
      variantStyles[variant]
    )}>
      <div className="flex items-center gap-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            Resumo Executivo — {props.companyName}
          </p>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
