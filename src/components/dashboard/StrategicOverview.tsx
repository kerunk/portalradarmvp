import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Building2, ShieldCheck, ShieldAlert, AlertTriangle,
  TrendingUp, Rocket, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnrichedCompanies } from "@/lib/portfolioUtils";

interface StrategicOverviewProps {
  refreshKey?: number;
}

export function StrategicOverview({ refreshKey }: StrategicOverviewProps) {
  const stats = useMemo(() => {
    const enriched = getEnrichedCompanies();
    const total = enriched.length;
    const healthy = enriched.filter(e => e.riskLevel === "healthy").length;
    const warning = enriched.filter(e => e.riskLevel === "warning").length;
    const risk = enriched.filter(e => e.riskLevel === "risk").length;
    const avgMaturity = total > 0
      ? Math.round(enriched.reduce((s, e) => s + e.riskData.maturityScore, 0) / total)
      : 0;
    const evolving = enriched.filter(e => e.riskData.maturityScore >= 50).length;
    const activeCycles = enriched.reduce((s, e) => s + e.riskData.cyclesInProgress, 0);

    return { total, healthy, warning, risk, avgMaturity, evolving, activeCycles };
  }, [refreshKey]);

  const items = [
    { label: "Total de Empresas", value: stats.total, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Saudáveis", value: stats.healthy, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Atenção", value: stats.warning, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Em Risco", value: stats.risk, icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Maturidade Média", value: `${stats.avgMaturity}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Em Evolução", value: stats.evolving, icon: Rocket, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Ciclos Ativos", value: stats.activeCycles, icon: Target, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <Card className="p-5">
      <h3 className="font-medium text-foreground mb-1 flex items-center gap-2">
        <Target size={18} className="text-primary" />
        Visão Estratégica da Carteira MVP
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Panorama consolidado da implementação</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="text-center p-3 rounded-xl border border-border/50">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2", item.bg)}>
                <Icon size={16} className={item.color} />
              </div>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
