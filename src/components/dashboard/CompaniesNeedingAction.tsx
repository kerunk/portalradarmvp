import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, Building2, ArrowRight } from "lucide-react";
import { getCompanies } from "@/lib/storage";
import { getNextRecommendedAction, getImplementationProgress } from "@/lib/implementationEngine";

interface Props {
  refreshKey: number;
}

export function CompaniesNeedingAction({ refreshKey }: Props) {
  const navigate = useNavigate();

  const companiesWithActions = useMemo(() => {
    const companies = getCompanies().filter(c => c.active !== false);
    return companies
      .map(c => ({
        company: c,
        nextAction: getNextRecommendedAction(c.id),
        progress: getImplementationProgress(c.id),
      }))
      .filter(c => c.progress < 100)
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 8);
  }, [refreshKey]);

  if (companiesWithActions.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-500" />
          Empresas que Precisam de Ação
        </h3>
        <Badge variant="outline" className="text-xs">{companiesWithActions.length}</Badge>
      </div>

      <div className="space-y-2">
        {companiesWithActions.map(({ company, nextAction, progress }) => (
          <div
            key={company.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate(`/empresas/${company.id}`)}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
              <p className="text-xs text-muted-foreground truncate">→ {nextAction}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground w-7 text-right">{progress}%</span>
            </div>
            <ArrowRight size={12} className="text-muted-foreground shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}
