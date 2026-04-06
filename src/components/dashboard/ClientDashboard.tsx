import { useMemo, useEffect } from "react";
import { MetricCard } from "./MetricCard";
import { ProgressCard } from "./ProgressCard";
import { SmartAlerts } from "./SmartAlerts";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { CoverageDonut } from "./CoverageDonut";
import { CultureScoreGauge } from "./CultureScoreGauge";
import { MaturityGaugePremium } from "./MaturityGaugePremium";
import { ProgramTimeline } from "./ProgramTimeline";
import { ProgramEvolutionChart } from "./ProgramEvolutionChart";
import { CulturalMaturityRadar } from "./CulturalMaturityRadar";
import { ImplementationTimeline } from "./ImplementationTimeline";
import { SmartRecommendations } from "./SmartRecommendations";
import { FirstStepsGuide } from "./FirstStepsGuide";
import { ImplementationChecklist } from "./ImplementationChecklist";
import { ImplementationJourney } from "./ImplementationJourney";
import { ClientSuggestions } from "./ClientSuggestions";

import { Card } from "@/components/ui/card";
import { Users, Target, CheckCircle, TrendingUp, GraduationCap, Shield, UserCheck, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPopulationStats, getPopulation } from "@/lib/companyStorage";
import { obterIndicadoresGlobais, obterIndicadoresTodosCiclos } from "@/lib/governance";
import { getState, setActiveCompany } from "@/lib/storage";
import { generateInsights, calculateCultureScore } from "@/lib/reportData";

interface ClientDashboardProps {
  companyId: string;
  companyName: string;
  refreshKey: number;
  onAlertDismissed: () => void;
}

export function ClientDashboard({ companyId, companyName, refreshKey, onAlertDismissed }: ClientDashboardProps) {
  // Set active company synchronously before any data reads
  setActiveCompany(companyId);
  useEffect(() => {
    setActiveCompany(companyId);
    return () => { setActiveCompany(null); };
  }, [companyId]);

  // Load company from Supabase for onboarding gate
  const [companyFromDB, setCompanyFromDB] = useState<CompanyOnboardingRow | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCompany(true);
    fetchCompanyOnboarding(companyId)
      .then(company => {
        if (!cancelled) {
          console.log("[Portal] onboarding_status recebido do banco:", company?.onboarding_status ?? "not_found");
          const destination = isOnboardingCompleted(company?.onboarding_status) ? "/dashboard" : "/onboarding";
          console.log("[Portal] redirect decidido para:", destination);
          setCompanyFromDB(company);
          setLoadingCompany(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error("[Portal] error loading onboarding status:", error);
          setCompanyFromDB(null);
          setLoadingCompany(false);
        }
      });
    return () => { cancelled = true; };
  }, [companyId, refreshKey]);

  const onboardingCompleted = isOnboardingCompleted(companyFromDB?.onboarding_status);

  // All hooks must be called unconditionally (React rules), but guard reads with company scope
  const popStats = useMemo(() => { setActiveCompany(companyId); return getPopulationStats(companyId); }, [companyId, refreshKey]);
  const globalIndicators = useMemo(() => { setActiveCompany(companyId); return obterIndicadoresGlobais(); }, [companyId, refreshKey]);
  const cycleIndicators = useMemo(() => { setActiveCompany(companyId); return obterIndicadoresTodosCiclos(); }, [companyId, refreshKey]);

  const trainingStats = useMemo(() => {
    setActiveCompany(companyId);
    const state = getState();
    const turmas = state.turmas;
    const turmasRealizadas = turmas.filter(t => t.status === "completed").length;
    const trainedIds = new Set<string>();
    turmas.forEach(t => {
      if (t.attendance) {
        Object.entries(t.attendance).forEach(([id, status]) => {
          if (status === "present") trainedIds.add(id);
        });
      }
    });
    const totalPresences = turmas.reduce((sum, t) => {
      if (!t.attendance) return sum;
      return sum + Object.values(t.attendance).filter(s => s === "present").length;
    }, 0);
    return { turmasTotal: turmas.length, turmasRealizadas, pessoasTreinadas: trainedIds.size, totalPresences };
  }, [companyId, refreshKey]);

  const activePopulation = popStats.total;
  const coveragePercent = activePopulation > 0 ? Math.round((trainingStats.pessoasTreinadas / activePopulation) * 100) : 0;

  // Culture Score
  const cultureScore = useMemo(() => calculateCultureScore(companyId), [companyId, refreshKey]);

  // Phase progress for timeline
  const timelinePhases = useMemo(() => {
    const buildPhase = (id: string, name: string, cycleIds: string[]) => {
      const cycles = cycleIndicators.filter(c => cycleIds.includes(c.cycleId));
      const allClosed = cycles.every(c => c.status === "closed");
      const anyActive = cycles.some(c => c.status === "in_progress" || c.status === "ready_to_close");
      const avgProgress = cycles.reduce((s, c) => s + c.completionPercent, 0) / (cycles.length || 1);
      return { id, name, cycles: cycleIds, status: allClosed ? "completed" as const : anyActive ? "in-progress" as const : "pending" as const, progress: Math.round(avgProgress) };
    };
    return [
      buildPhase("M", "Monitorar", ["M1", "M2", "M3"]),
      buildPhase("V", "Validar", ["V1", "V2", "V3"]),
      buildPhase("P", "Perpetuar", ["P1", "P2", "P3"]),
    ];
  }, [cycleIndicators]);

  // Maturity score
  const maturityScore = useMemo(() => {
    const popScore = activePopulation > 0 ? 15 : 0;
    const nucleoScore = popStats.nucleoCount > 0 ? 10 : 0;
    const facScore = popStats.facilitators > 0 ? 5 : 0;
    const cycleScore = Math.min(30, (globalIndicators.closedCycles / globalIndicators.totalCycles) * 30);
    const actionScore = Math.min(25, (globalIndicators.overallCompletionPercent / 100) * 25);
    const coverageScore = Math.min(15, (coveragePercent / 100) * 15);
    return Math.round(popScore + nucleoScore + facScore + cycleScore + actionScore + coverageScore);
  }, [activePopulation, popStats, globalIndicators, coveragePercent]);

  const progressData = {
    total: globalIndicators.totalActions || 1,
    completed: globalIndicators.completedActions,
    inProgress: globalIndicators.inProgressActions,
    delayed: globalIndicators.delayedActions,
    pending: globalIndicators.pendingActions,
  };

  // Gate: block portal while loading or if onboarding not started
  if (loadingCompany) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando dados da empresa...</p>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return <OnboardingGate companyName={companyName} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* First Steps Guide */}
      <FirstStepsGuide completedSteps={
        [
          ...(popStats.sectors > 0 || popStats.units > 0 ? [1] : []),
          ...(activePopulation > 0 ? [2] : []),
          ...(popStats.nucleoCount > 0 ? [3] : []),
          ...(trainingStats.turmasTotal > 0 ? [4] : []),
          ...(globalIndicators.completedActions > 0 ? [5] : []),
        ]
      } />

      {/* Executive Summary */}
      <ExecutiveSummary
        companyName={companyName}
        populationTotal={activePopulation}
        nucleoCount={popStats.nucleoCount}
        facilitatorsCount={popStats.facilitators}
        turmasRealizadas={trainingStats.turmasRealizadas}
        closedCycles={globalIndicators.closedCycles}
        totalCycles={globalIndicators.totalCycles}
        completionPercent={globalIndicators.overallCompletionPercent}
        delayedActions={globalIndicators.delayedActions}
        coveragePercent={coveragePercent}
      />

      {/* Row 1: People & Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Base Populacional" value={activePopulation} icon={Users} subtitle={`${popStats.sectors} setores · ${popStats.units} unidades`} variant="default" tooltip="Total de colaboradores ativos cadastrados na base populacional da empresa." />
        <MetricCard title="Núcleo de Sustentação" value={popStats.nucleoCount} icon={Shield} subtitle={`${popStats.leaders} lideranças`} variant="default" tooltip="Membros do núcleo que conduzem e sustentam o programa na organização." />
        <MetricCard title="Facilitadores" value={popStats.facilitators} icon={UserCheck} subtitle="habilitados" variant={popStats.facilitators > 0 ? "success" : "default"} tooltip="Facilitadores habilitados para aplicar turmas e práticas do programa MVP." />
        <MetricCard title="Turmas Realizadas" value={`${trainingStats.turmasRealizadas}/${trainingStats.turmasTotal}`} icon={GraduationCap} subtitle={`${trainingStats.pessoasTreinadas} pessoas treinadas`} variant="default" tooltip="Turmas de treinamento concluídas em relação ao total planejado." />
      </div>

      {/* Row 2: Execution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Ciclos Encerrados" value={`${globalIndicators.closedCycles}/${globalIndicators.totalCycles}`} icon={Target} subtitle={`${globalIndicators.cyclesReadyToClose} prontos para encerrar`} variant={globalIndicators.closedCycles > 0 ? "success" : "default"} tooltip="Ciclos MVP finalizados. Cada ciclo encerrado indica progresso na implementação." />
        <MetricCard title="Ações Concluídas" value={`${globalIndicators.completedActions}/${globalIndicators.totalActions}`} icon={CheckCircle} subtitle={`${globalIndicators.overallCompletionPercent}% do plano`} variant="success" tooltip="Ações práticas executadas em relação ao total planejado no programa." />
        <MetricCard title="Ações Atrasadas" value={globalIndicators.delayedActions} icon={AlertTriangle} subtitle={`${globalIndicators.actionBacklog} no backlog`} variant={globalIndicators.delayedActions > 0 ? "danger" : "default"} tooltip="Ações com prazo vencido que precisam de atenção imediata." />
        <MetricCard title="Taxa Decisão→Ação" value={`${globalIndicators.decisionConversionRate}%`} icon={TrendingUp} subtitle={`${globalIndicators.decisionsWithActions} decisões convertidas`} variant={globalIndicators.decisionConversionRate >= 50 ? "success" : "warning"} tooltip="Percentual de decisões tomadas nos ciclos que foram convertidas em ações concretas. Acima de 50% é considerado saudável." />
      </div>

      {/* Row 3: Culture Score + Coverage + Maturity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <CultureScoreGauge score={cultureScore.score} />
        <CoverageDonut
          title="Cobertura do Programa"
          value={trainingStats.pessoasTreinadas}
          total={activePopulation}
          label="colaboradores treinados da base ativa"
          color={coveragePercent >= 70 ? "success" : coveragePercent >= 40 ? "warning" : "primary"}
        />
        <MaturityGaugePremium score={maturityScore} />
        <SmartAlerts onAlertDismissed={onAlertDismissed} maxAlerts={4} refreshTrigger={refreshKey} />
      </div>

      {/* Row 4: Progress + Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressCard
          title="Progresso do Plano"
          progress={progressData.completed}
          total={progressData.total}
          items={[
            { label: "Concluídas", value: progressData.completed, color: "success" },
            { label: "Em andamento", value: progressData.inProgress, color: "primary" },
            { label: "Atrasadas", value: progressData.delayed, color: "danger" },
            { label: "Pendentes", value: progressData.pending, color: "warning" },
          ]}
        />
        <SmartRecommendations
          coveragePercent={coveragePercent}
          completionPercent={globalIndicators.overallCompletionPercent}
          delayedActions={globalIndicators.delayedActions}
          facilitators={popStats.facilitators}
          nucleoCount={popStats.nucleoCount}
          turmasRealizadas={trainingStats.turmasRealizadas}
          closedCycles={globalIndicators.closedCycles}
          totalCycles={globalIndicators.totalCycles}
        />
      </div>

      {/* Row 5: Implementation Journey + Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImplementationJourney companyId={companyId} refreshKey={refreshKey} />
        <ImplementationChecklist companyId={companyId} refreshKey={refreshKey} />
      </div>

      {/* Row 6: Client Suggestions */}
      <ClientSuggestions companyId={companyId} refreshKey={refreshKey} />

      {/* Row 7: Evolution Chart + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgramEvolutionChart
          coveragePercent={coveragePercent}
          completionPercent={globalIndicators.overallCompletionPercent}
          maturityScore={maturityScore}
        />
        <CulturalMaturityRadar companyId={companyId} refreshKey={refreshKey} />
      </div>

      {/* Row 8: Timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgramTimeline phases={timelinePhases} />
        <ImplementationTimeline refreshKey={refreshKey} />
      </div>

      {/* Row 9: Program Insights */}
      <InsightsPanel
        coveragePercent={coveragePercent}
        completionPercent={globalIndicators.overallCompletionPercent}
        delayedActions={globalIndicators.delayedActions}
        closedCycles={globalIndicators.closedCycles}
        turmasRealizadas={trainingStats.turmasRealizadas}
        nucleoCount={popStats.nucleoCount}
        facilitators={popStats.facilitators}
        totalActions={globalIndicators.totalActions}
      />
    </div>
  );
}

function InsightsPanel(props: {
  coveragePercent: number;
  completionPercent: number;
  delayedActions: number;
  closedCycles: number;
  turmasRealizadas: number;
  nucleoCount: number;
  facilitators: number;
  totalActions: number;
}) {
  const insights = useMemo(() => generateInsights(props), [props]);

  if (insights.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
        <Lightbulb size={20} className="text-warning" /> Insights do Programa MVP
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Análise automática baseada nos dados reais da implementação.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, i) => {
          const config = {
            positive: { icon: CheckCircle2, bg: "bg-success/10 border-success/30", iconColor: "text-success", label: "Positivo", labelBg: "bg-success/20 text-success" },
            warning: { icon: AlertTriangle, bg: "bg-warning/10 border-warning/30", iconColor: "text-warning", label: "Atenção", labelBg: "bg-warning/20 text-warning" },
            reinforcement: { icon: Lightbulb, bg: "bg-primary/10 border-primary/30", iconColor: "text-primary", label: "Recomendação", labelBg: "bg-primary/20 text-primary" },
          }[insight.type];
          const Icon = config.icon;
          return (
            <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl border", config.bg)}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.labelBg)}>
                <Icon size={16} className={config.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.iconColor)}>{config.label}</span>
                <p className="text-sm text-foreground mt-0.5">{insight.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
