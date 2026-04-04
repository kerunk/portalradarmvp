import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight, ShieldAlert, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnrichedCompanies, type EnrichedCompany } from "@/lib/portfolioUtils";
import type { CompanyState } from "@/lib/storage";

const USERS_MGMT_KEY = "mvp_managed_users_v2";

interface ManagerStats {
  id: string;
  name: string;
  email: string;
  companies: EnrichedCompany[];
  avgMaturity: number;
  riskCount: number;
  totalCompanies: number;
}

interface ManagerRankingProps {
  refreshKey?: number;
  companies?: CompanyState[];
}

export function ManagerRanking({ refreshKey, companies }: ManagerRankingProps) {
  const navigate = useNavigate();

  const managers = useMemo((): ManagerStats[] => {
    let users: any[] = [];
    try {
      users = JSON.parse(localStorage.getItem(USERS_MGMT_KEY) || "[]");
    } catch {}

    const gerentUsers = users.filter((u: any) => u.role === "gerente_conta" && u.active !== false);
    const enriched = getEnrichedCompanies(undefined, undefined, companies);

    return gerentUsers.map((u: any) => {
      const managerCompanies = enriched.filter(
        ec => ec.company.ownerEmail?.toLowerCase() === u.email.toLowerCase()
      );
      const avgMaturity = managerCompanies.length > 0
        ? Math.round(managerCompanies.reduce((s, c) => s + c.riskData.maturityScore, 0) / managerCompanies.length)
        : 0;
      const riskCount = managerCompanies.filter(c => c.riskLevel === "risk").length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        companies: managerCompanies,
        avgMaturity,
        riskCount,
        totalCompanies: managerCompanies.length,
      };
    }).sort((a, b) => b.avgMaturity - a.avgMaturity);
  }, [refreshKey, companies]);

  return (
    <Card className="p-5">
      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
        <Users size={18} className="text-primary" />
        Desempenho dos Gerentes de Conta
      </h3>

      {managers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum gerente de conta cadastrado</p>
      ) : (
        <div className="space-y-0">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
            <div className="col-span-4">Gerente</div>
            <div className="col-span-2 text-center">Empresas</div>
            <div className="col-span-3 text-center">Maturidade Média</div>
            <div className="col-span-2 text-center">Em Risco</div>
            <div className="col-span-1"></div>
          </div>
          {managers.map(m => (
            <div
              key={m.id}
              className="grid grid-cols-12 gap-2 items-center px-3 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/carteira/${m.id}`)}
            >
              <div className="col-span-4">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <div className="col-span-2 text-center">
                <Badge variant="outline" className="text-xs">{m.totalCompanies}</Badge>
              </div>
              <div className="col-span-3 flex items-center justify-center gap-1">
                <div className="w-12 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${m.avgMaturity}%` }} />
                </div>
                <span className="text-xs font-medium">{m.avgMaturity}%</span>
              </div>
              <div className="col-span-2 text-center">
                {m.riskCount > 0 ? (
                  <Badge className="bg-destructive/15 text-destructive text-xs gap-1">
                    <ShieldAlert size={10} /> {m.riskCount}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="col-span-1 text-right">
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
