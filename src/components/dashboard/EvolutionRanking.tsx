import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnrichedCompanies } from "@/lib/portfolioUtils";

interface EvolutionRankingProps {
  refreshKey?: number;
}

export function EvolutionRanking({ refreshKey }: EvolutionRankingProps) {
  const navigate = useNavigate();

  const ranked = useMemo(() => {
    const enriched = getEnrichedCompanies();
    return [...enriched]
      .sort((a, b) => {
        // Sort by maturity desc, then completed actions desc
        if (b.riskData.maturityScore !== a.riskData.maturityScore)
          return b.riskData.maturityScore - a.riskData.maturityScore;
        return b.riskData.completedActions - a.riskData.completedActions;
      })
      .slice(0, 5);
  }, [refreshKey]);

  const medalColors = [
    "bg-amber-500/15 text-amber-500 border-amber-500/30",
    "bg-muted text-muted-foreground border-border",
    "bg-orange-500/15 text-orange-600 border-orange-500/30",
  ];

  return (
    <Card className="p-5">
      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
        <Trophy size={18} className="text-amber-500" />
        Ranking de Evolução da Carteira
      </h3>

      {ranked.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma empresa cadastrada</p>
      ) : (
        <div className="space-y-2">
          {ranked.map((ec, i) => (
            <div
              key={ec.company.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/empresas/${ec.company.id}`)}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border",
                i < 3 ? medalColors[i] : "bg-muted text-muted-foreground border-border"
              )}>
                {i + 1}º
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ec.company.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ec.riskData.completedActions} ações concluídas · {ec.riskData.closedCycles} ciclos encerrados
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-12 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${ec.riskData.maturityScore}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{ec.riskData.maturityScore}%</span>
                </div>
                <ArrowRight size={12} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
