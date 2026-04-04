import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pause, Building2, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnrichedCompanies, getLastActivityLabel } from "@/lib/portfolioUtils";
import type { CompanyState } from "@/lib/storage";

interface StalledCompaniesProps {
  refreshKey?: number;
  companies?: CompanyState[];
}

export function StalledCompanies({ refreshKey, companies }: StalledCompaniesProps) {
  const navigate = useNavigate();

  const stalled = useMemo(() => {
    const enriched = getEnrichedCompanies(undefined, undefined, companies);
    return enriched
      .filter(ec => {
        if (ec.lastActivityDays === null) return ec.company.onboardingStatus === "completed";
        return ec.lastActivityDays >= 30;
      })
      .sort((a, b) => (b.lastActivityDays ?? 999) - (a.lastActivityDays ?? 999));
  }, [refreshKey, companies]);

  const critical = stalled.filter(ec => (ec.lastActivityDays ?? 999) >= 45);
  const attention = stalled.filter(ec => {
    const d = ec.lastActivityDays ?? 999;
    return d >= 30 && d < 45;
  });

  return (
    <Card className="p-5">
      <h3 className="font-medium text-foreground mb-1 flex items-center gap-2">
        <Pause size={18} className="text-amber-500" />
        Empresas com Implementação Parada
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Empresas sem atividade nos últimos 30+ dias
      </p>

      {stalled.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Pause size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Todas as empresas estão ativas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {critical.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle size={12} /> Crítico (45+ dias)
              </p>
              {critical.map(ec => (
                <StalledRow key={ec.company.id} ec={ec} severity="critical" onClick={() => navigate(`/empresas/${ec.company.id}`)} />
              ))}
            </div>
          )}
          {attention.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
                Atenção (30–44 dias)
              </p>
              {attention.map(ec => (
                <StalledRow key={ec.company.id} ec={ec} severity="warning" onClick={() => navigate(`/empresas/${ec.company.id}`)} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function StalledRow({ ec, severity, onClick }: { ec: any; severity: "critical" | "warning"; onClick: () => void }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors mb-1.5",
        severity === "critical"
          ? "bg-destructive/5 border-destructive/15 hover:bg-destructive/8"
          : "bg-amber-500/5 border-amber-500/15 hover:bg-amber-500/8"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        severity === "critical" ? "bg-destructive/10" : "bg-amber-500/10"
      )}>
        <Building2 size={12} className={severity === "critical" ? "text-destructive" : "text-amber-500"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{ec.company.name}</p>
      </div>
      <Badge variant="outline" className={cn("text-xs",
        severity === "critical" ? "border-destructive/30 text-destructive" : "border-amber-500/30 text-amber-500"
      )}>
        {getLastActivityLabel(ec.lastActivityDays)}
      </Badge>
      <ArrowRight size={12} className="text-muted-foreground shrink-0" />
    </div>
  );
}
