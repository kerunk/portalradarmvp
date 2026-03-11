import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "./MetricCard";
import { SmartAlerts } from "./SmartAlerts";
import { MaturityGaugePremium } from "./MaturityGaugePremium";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Target, TrendingUp, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { getCompanies } from "@/lib/storage";
import { obterIndicadoresGlobais, obterIndicadoresTodosCiclos } from "@/lib/governance";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  refreshKey: number;
  onAlertDismissed: () => void;
}

export function AdminDashboard({ refreshKey, onAlertDismissed }: AdminDashboardProps) {
  const navigate = useNavigate();

  const companies = useMemo(() => getCompanies(), [refreshKey]);
  const globalIndicators = useMemo(() => obterIndicadoresGlobais(), [refreshKey]);
  const cycleIndicators = useMemo(() => obterIndicadoresTodosCiclos(), [refreshKey]);

  const companiesCompleted = companies.filter(c => c.onboardingStatus === "completed").length;
  const companiesPending = companies.filter(c => c.onboardingStatus !== "completed").length;

  // Determine current phase
  const currentPhase = (() => {
    const pCycles = cycleIndicators.filter(c => c.cycleId.startsWith("P"));
    const vCycles = cycleIndicators.filter(c => c.cycleId.startsWith("V"));
    if (pCycles.some(c => c.status === "in_progress" || c.status === "ready_to_close")) return "Perpetuar";
    if (vCycles.some(c => c.status === "in_progress" || c.status === "ready_to_close")) return "Validar";
    return "Monitorar";
  })();

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

      {/* Company overview metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Empresas Ativas" value={companiesCompleted} icon={Building2} subtitle={`${companiesPending} pendentes`} variant="default" />
        <MetricCard title="Total de Ciclos" value={`${globalIndicators.closedCycles}/${globalIndicators.totalCycles}`} icon={Target} subtitle={`${globalIndicators.cyclesReadyToClose} prontos para encerrar`} variant={globalIndicators.closedCycles > 0 ? "success" : "default"} />
        <MetricCard title="Ações Globais" value={`${globalIndicators.completedActions}/${globalIndicators.totalActions}`} icon={CheckCircle} subtitle={`${globalIndicators.overallCompletionPercent}% concluído`} variant="success" />
        <MetricCard title="Taxa Decisão→Ação" value={`${globalIndicators.decisionConversionRate}%`} icon={TrendingUp} subtitle={`${globalIndicators.decisionsWithActions} decisões convertidas`} variant={globalIndicators.decisionConversionRate >= 50 ? "success" : "warning"} />
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
            <div className="space-y-3">
              {companies.map(company => {
                const statusColors = {
                  completed: "bg-success/15 text-success",
                  in_progress: "bg-warning/15 text-warning",
                  not_started: "bg-muted text-muted-foreground",
                };
                const statusLabels = {
                  completed: "Ativa",
                  in_progress: "Onboarding",
                  not_started: "Pendente",
                };
                return (
                  <div key={company.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{company.name}</p>
                        <p className="text-xs text-muted-foreground">{company.sector} · {company.employees} colaboradores</p>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", statusColors[company.onboardingStatus])}>
                      {statusLabels[company.onboardingStatus]}
                    </Badge>
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
          <MaturityGaugePremium score={globalIndicators.overallCompletionPercent} />
        </div>
      </div>
    </div>
  );
}
