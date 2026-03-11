import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "./MetricCard";
import { SmartAlerts } from "./SmartAlerts";
import { MaturityGaugePremium } from "./MaturityGaugePremium";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Target, TrendingUp, CheckCircle, AlertTriangle, BarChart3, Rocket, GraduationCap, Zap } from "lucide-react";
import { getCompanies, setActiveCompany, getState } from "@/lib/storage";
import { obterIndicadoresGlobais, obterIndicadoresTodosCiclos } from "@/lib/governance";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  refreshKey: number;
  onAlertDismissed: () => void;
}

// Helper to get per-company consolidated data
function getCompanyConsolidatedData(companyId: string) {
  // Temporarily switch context to read company data
  setActiveCompany(companyId);
  const state = getState();
  
  const totalEmployees = state.employees.length;
  const totalTurmas = state.turmas.length;
  const activeTurmas = state.turmas.filter(t => t.status === "in_progress" || t.status === "planned").length;
  
  let totalActions = 0;
  let completedActions = 0;
  let cyclesInProgress = 0;
  let cyclesClosed = 0;
  
  Object.entries(state.cycles).forEach(([_, cycleState]) => {
    if (cycleState.closureStatus === "closed") cyclesClosed++;
    else if (cycleState.factors.some(f => f.actions.some(a => a.enabled))) cyclesInProgress++;
    
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled) {
          totalActions++;
          if (action.status === "completed") completedActions++;
        }
      });
    });
  });

  // Calculate a simple maturity score
  const maturityScore = Math.min(100, Math.round(
    (totalEmployees > 0 ? 15 : 0) +
    (cyclesClosed * 10) +
    (totalActions > 0 ? (completedActions / totalActions) * 40 : 0) +
    (totalTurmas > 0 ? Math.min(20, totalTurmas * 5) : 0)
  ));
  
  // Reset active company
  setActiveCompany(null);
  
  return { totalEmployees, totalTurmas, activeTurmas, totalActions, completedActions, cyclesInProgress, cyclesClosed, maturityScore };
}

export function AdminDashboard({ refreshKey, onAlertDismissed }: AdminDashboardProps) {
  const navigate = useNavigate();

  const companies = useMemo(() => getCompanies(), [refreshKey]);
  const globalIndicators = useMemo(() => obterIndicadoresGlobais(), [refreshKey]);
  const cycleIndicators = useMemo(() => obterIndicadoresTodosCiclos(), [refreshKey]);

  const companiesCompleted = companies.filter(c => c.onboardingStatus === "completed").length;
  const companiesPending = companies.filter(c => c.onboardingStatus !== "completed").length;

  // Per-company data
  const companyData = useMemo(() => {
    return companies.map(c => ({
      company: c,
      data: getCompanyConsolidatedData(c.id),
    }));
  }, [companies, refreshKey]);

  // Aggregated totals
  const totalEmployeesAll = companyData.reduce((s, c) => s + c.data.totalEmployees, 0);
  const totalTurmasAll = companyData.reduce((s, c) => s + c.data.totalTurmas, 0);
  const activeTurmasAll = companyData.reduce((s, c) => s + c.data.activeTurmas, 0);
  const totalActionsAll = companyData.reduce((s, c) => s + c.data.totalActions, 0);
  const completedActionsAll = companyData.reduce((s, c) => s + c.data.completedActions, 0);
  const avgMaturity = companyData.length > 0
    ? Math.round(companyData.reduce((s, c) => s + c.data.maturityScore, 0) / companyData.length)
    : 0;

  const maturityLevels: Record<string, { label: string; color: string }> = {
    "0": { label: "Inicial", color: "bg-muted text-muted-foreground" },
    "1": { label: "Estruturando", color: "bg-amber-500/15 text-amber-400" },
    "2": { label: "Evoluindo", color: "bg-primary/15 text-primary" },
    "3": { label: "Consolidando", color: "bg-emerald-500/15 text-emerald-400" },
  };

  function getMaturityLevel(score: number) {
    if (score >= 76) return maturityLevels["3"];
    if (score >= 51) return maturityLevels["2"];
    if (score >= 26) return maturityLevels["1"];
    return maturityLevels["0"];
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin summary banner */}
      <div className="relative rounded-xl border border-primary/15 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-5 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              Painel Administrativo MVP
            </p>
            <p className="text-sm font-medium text-foreground">
              {companies.length} empresas na carteira — {companiesCompleted} ativas, {companiesPending} com onboarding pendente.
            </p>
          </div>
        </div>
      </div>

      {/* Top-level consolidated metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Empresas Ativas" value={companiesCompleted} icon={Building2} subtitle={`${companiesPending} pendentes`} variant="default" />
        <MetricCard title="Colaboradores" value={totalEmployeesAll} icon={Users} subtitle="cadastrados no total" variant="default" />
        <MetricCard title="Ciclos MVP" value={`${globalIndicators.closedCycles}/${globalIndicators.totalCycles}`} icon={Rocket} subtitle={`${globalIndicators.cyclesInProgress} em andamento`} variant={globalIndicators.closedCycles > 0 ? "success" : "default"} />
        <MetricCard title="Turmas" value={totalTurmasAll} icon={GraduationCap} subtitle={`${activeTurmasAll} em execução`} variant="default" />
        <MetricCard title="Ações Globais" value={`${completedActionsAll}/${totalActionsAll}`} icon={CheckCircle} subtitle={`${totalActionsAll > 0 ? Math.round((completedActionsAll / totalActionsAll) * 100) : 0}% concluído`} variant="success" />
        <MetricCard title="Taxa Decisão→Ação" value={`${globalIndicators.decisionConversionRate}%`} icon={Zap} subtitle={`${globalIndicators.decisionsWithActions} convertidas`} variant={globalIndicators.decisionConversionRate >= 50 ? "success" : "warning"} />
      </div>

      {/* Company list + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Empresas na Carteira</h3>
              <button onClick={() => navigate("/empresas")} className="text-xs text-primary hover:text-primary/80 font-medium">
                Ver todas →
              </button>
            </div>
            <div className="space-y-0">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
                <div className="col-span-3">Empresa</div>
                <div className="col-span-2">Setor</div>
                <div className="col-span-2 text-center">Colaboradores</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-3 text-center">Maturidade</div>
              </div>
              {companyData.map(({ company, data }) => {
                const statusColors: Record<string, string> = {
                  completed: "bg-emerald-500/15 text-emerald-400",
                  in_progress: "bg-amber-500/15 text-amber-400",
                  not_started: "bg-muted text-muted-foreground",
                };
                const statusLabels: Record<string, string> = {
                  completed: "Ativa",
                  in_progress: "Onboarding",
                  not_started: "Pendente",
                };
                const matLevel = getMaturityLevel(data.maturityScore);
                return (
                  <div key={company.id} className="grid grid-cols-12 gap-2 items-center px-3 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">{company.sector}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-sm font-medium text-foreground">{data.totalEmployees || company.employees}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge className={cn("text-xs", statusColors[company.onboardingStatus])}>
                        {statusLabels[company.onboardingStatus]}
                      </Badge>
                    </div>
                    <div className="col-span-3 flex items-center justify-center gap-2">
                      <div className="flex-1 max-w-[80px] h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${data.maturityScore}%` }}
                        />
                      </div>
                      <Badge className={cn("text-[10px]", matLevel.color)}>
                        {data.maturityScore}% — {matLevel.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {companies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma empresa cadastrada</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <SmartAlerts onAlertDismissed={onAlertDismissed} maxAlerts={4} refreshTrigger={refreshKey} />
          <MaturityGaugePremium score={avgMaturity} />
        </div>
      </div>
    </div>
  );
}
