import { useMemo, useEffect, useState } from "react";
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
import { fetchCompanyOperationalData, calculateCycleProgress } from "@/lib/supabaseDataService";
import { CYCLE_IDS } from "@/lib/constants";

interface ClientDashboardProps {
  companyId: string;
  companyName: string;
  refreshKey: number;
  onAlertDismissed: () => void;
}

export function ClientDashboard({ companyId, companyName, refreshKey, onAlertDismissed }: ClientDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [opData, setOpData] = useState<Awaited<ReturnType<typeof fetchCompanyOperationalData>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCompanyOperationalData(companyId).then(data => {
      if (!cancelled) {
        setOpData(data);
        setLoading(false);
        console.log("[DataSource] ClientDashboard loaded from Supabase for company:", companyId);
      }
    });
    return () => { cancelled = true; };
  }, [companyId, refreshKey]);

  if (loading || !opData) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  const activePopulation = opData.populationTotal;
  const coveragePercent = opData.coveragePercent;
  const maturityScore = opData.maturityScore;

  // Culture score (simplified — derive from operational data)
  const cultureScore = {
    score: Math.round(
      (coveragePercent * 0.3) +
      (opData.overallCompletionPercent * 0.3) +
      (maturityScore * 0.4)
    ),
  };

  // Phase progress for timeline
  const timelinePhases = useMemo(() => {
    const buildPhase = (id: string, name: string, cycleIds: string[]) => {
      const cycleStates = opData.cycleStates.filter(c => cycleIds.includes(c.cycle_id));
      const allClosed = cycleStates.length === cycleIds.length && cycleStates.every(c => c.closure_status === "closed");
      const anyActive = cycleStates.some(c => c.closure_status === "in_progress" || c.closure_status === "ready_to_close");
      
      // Calculate progress per cycle using 70/30 rule
      const cycleProgresses = cycleIds.map(cid => {
        const actions = opData.cycleActions.filter(a => a.cycle_id === cid && a.enabled);
        const completed = actions.filter(a => a.status === "completed").length;
        return calculateCycleProgress(activePopulation, opData.pessoasTreinadas, actions.length, completed);
      });
      const avgProgress = cycleProgresses.reduce((s, p) => s + p, 0) / (cycleProgresses.length || 1);

      return {
        id, name, cycles: cycleIds,
        status: allClosed ? "completed" as const : anyActive ? "in-progress" as const : "pending" as const,
        progress: Math.round(avgProgress),
      };
    };
    return [
      buildPhase("M", "Monitorar", ["M1", "M2", "M3"]),
      buildPhase("V", "Validar", ["V1", "V2", "V3"]),
      buildPhase("P", "Perpetuar", ["P1", "P2", "P3"]),
    ];
  }, [opData, activePopulation]);

  const progressData = {
    total: opData.enabledActions || 1,
    completed: opData.completedActions,
    inProgress: opData.inProgressActions,
    delayed: opData.delayedActions,
    pending: opData.pendingActions,
  };

  // Decision conversion rate
  const decisions = opData.records.filter(r => r.type === "decision");
  const decisionsWithActions = decisions.filter(r => r.creates_actions && (r.linked_action_ids?.length || 0) > 0).length;
  const decisionConversionRate = decisions.length > 0
    ? Math.round((decisionsWithActions / decisions.length) * 100)
    : 0;

  const cyclesReadyToClose = opData.cycleStates.filter(c => c.closure_status === "ready_to_close").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* First Steps Guide */}
      <FirstStepsGuide completedSteps={
        [
          ...(opData.sectorsCount > 0 || opData.unitsCount > 0 ? [1] : []),
          ...(activePopulation > 0 ? [2] : []),
          ...(opData.nucleoCount > 0 ? [3] : []),
          ...(opData.turmasTotal > 0 ? [4] : []),
          ...(opData.completedActions > 0 ? [5] : []),
        ]
      } />

      {/* Executive Summary */}
      <ExecutiveSummary
        companyName={companyName}
        populationTotal={activePopulation}
        nucleoCount={opData.nucleoCount}
        facilitatorsCount={opData.facilitatorsCount}
        turmasRealizadas={opData.turmasRealizadas}
        closedCycles={opData.closedCycles}
        totalCycles={opData.totalCycles}
        completionPercent={opData.overallCompletionPercent}
        delayedActions={opData.delayedActions}
        coveragePercent={coveragePercent}
      />

      {/* Row 1: People & Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Base Populacional" value={activePopulation} icon={Users} subtitle={`${opData.sectorsCount} setores · ${opData.unitsCount} unidades`} variant="default" tooltip="Total de colaboradores ativos cadastrados na base populacional da empresa." />
        <MetricCard title="Núcleo de Sustentação" value={opData.nucleoCount} icon={Shield} subtitle={`${opData.leadersCount} lideranças`} variant="default" tooltip="Membros do núcleo que conduzem e sustentam o programa na organização." />
        <MetricCard title="Facilitadores" value={opData.facilitatorsCount} icon={UserCheck} subtitle="habilitados" variant={opData.facilitatorsCount > 0 ? "success" : "default"} tooltip="Facilitadores habilitados para aplicar turmas e práticas do programa MVP." />
        <MetricCard title="Turmas Realizadas" value={`${opData.turmasRealizadas}/${opData.turmasTotal}`} icon={GraduationCap} subtitle={`${opData.pessoasTreinadas} pessoas treinadas`} variant="default" tooltip="Turmas de treinamento concluídas em relação ao total planejado." />
      </div>

      {/* Row 2: Execution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Ciclos Encerrados" value={`${opData.closedCycles}/${opData.totalCycles}`} icon={Target} subtitle={`${cyclesReadyToClose} prontos para encerrar`} variant={opData.closedCycles > 0 ? "success" : "default"} tooltip="Ciclos MVP finalizados." />
        <MetricCard title="Ações Concluídas" value={`${opData.completedActions}/${opData.enabledActions}`} icon={CheckCircle} subtitle={`${opData.overallCompletionPercent}% do plano`} variant="success" tooltip="Ações práticas executadas em relação ao total planejado." />
        <MetricCard title="Ações Atrasadas" value={opData.delayedActions} icon={AlertTriangle} subtitle={`${opData.pendingActions + opData.inProgressActions + opData.delayedActions} no backlog`} variant={opData.delayedActions > 0 ? "danger" : "default"} tooltip="Ações com prazo vencido." />
        <MetricCard title="Taxa Decisão→Ação" value={`${decisionConversionRate}%`} icon={TrendingUp} subtitle={`${decisionsWithActions} decisões convertidas`} variant={decisionConversionRate >= 50 ? "success" : "warning"} tooltip="Percentual de decisões convertidas em ações concretas." />
      </div>

      {/* Row 3: Culture Score + Coverage + Maturity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <CultureScoreGauge score={cultureScore.score} />
        <CoverageDonut
          title="Cobertura do Programa"
          value={opData.pessoasTreinadas}
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
          completionPercent={opData.overallCompletionPercent}
          delayedActions={opData.delayedActions}
          facilitators={opData.facilitatorsCount}
          nucleoCount={opData.nucleoCount}
          turmasRealizadas={opData.turmasRealizadas}
          closedCycles={opData.closedCycles}
          totalCycles={opData.totalCycles}
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
          completionPercent={opData.overallCompletionPercent}
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
        completionPercent={opData.overallCompletionPercent}
        delayedActions={opData.delayedActions}
        closedCycles={opData.closedCycles}
        turmasRealizadas={opData.turmasRealizadas}
        nucleoCount={opData.nucleoCount}
        facilitators={opData.facilitatorsCount}
        totalActions={opData.enabledActions}
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
  const insights = useMemo(() => {
    const result: Array<{ type: "positive" | "warning" | "reinforcement"; message: string }> = [];
    if (props.coveragePercent >= 70) result.push({ type: "positive", message: `Cobertura de treinamento em ${props.coveragePercent}% — excelente abrangência.` });
    else if (props.coveragePercent < 20 && props.totalActions > 0) result.push({ type: "warning", message: `Cobertura de treinamento em apenas ${props.coveragePercent}%. Considere ampliar turmas.` });
    if (props.delayedActions > 0) result.push({ type: "warning", message: `${props.delayedActions} ações atrasadas precisam de atenção imediata.` });
    if (props.closedCycles >= 3) result.push({ type: "positive", message: `${props.closedCycles} ciclos concluídos — fase de consolidação atingida.` });
    if (props.nucleoCount === 0 && props.totalActions > 0) result.push({ type: "reinforcement", message: "Defina membros do Núcleo de Sustentação para garantir continuidade." });
    if (props.facilitators === 0 && props.totalActions > 0) result.push({ type: "reinforcement", message: "Habilite facilitadores para conduzir treinamentos." });
    if (props.completionPercent >= 80) result.push({ type: "positive", message: `${props.completionPercent}% das ações concluídas — programa em alta performance.` });
    return result;
  }, [props]);

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
