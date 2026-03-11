import { useMemo } from "react";
import { MetricCard } from "./MetricCard";
import { ProgressCard } from "./ProgressCard";
import { SmartAlerts } from "./SmartAlerts";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { CoverageDonut } from "./CoverageDonut";
import { MaturityGaugePremium } from "./MaturityGaugePremium";
import { ProgramTimeline } from "./ProgramTimeline";
import { Users, Target, CheckCircle, TrendingUp, GraduationCap, Shield, UserCheck, AlertTriangle } from "lucide-react";
import { getPopulationStats, getPopulation } from "@/lib/companyStorage";
import { obterIndicadoresGlobais, obterIndicadoresTodosCiclos } from "@/lib/governance";
import { getState } from "@/lib/storage";

interface ClientDashboardProps {
  companyId: string;
  companyName: string;
  refreshKey: number;
  onAlertDismissed: () => void;
}

export function ClientDashboard({ companyId, companyName, refreshKey, onAlertDismissed }: ClientDashboardProps) {
  const popStats = useMemo(() => getPopulationStats(companyId), [companyId, refreshKey]);
  const globalIndicators = useMemo(() => obterIndicadoresGlobais(), [refreshKey]);
  const cycleIndicators = useMemo(() => obterIndicadoresTodosCiclos(), [refreshKey]);

  // Training coverage: unique people with attendance "present" / active population
  const trainingStats = useMemo(() => {
    const state = getState();
    const turmas = state.turmas;
    const turmasRealizadas = turmas.filter(t => t.status === "completed").length;
    
    // Collect unique trained IDs
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

    return {
      turmasTotal: turmas.length,
      turmasRealizadas,
      pessoasTreinadas: trainedIds.size,
      totalPresences,
    };
  }, [refreshKey]);

  const activePopulation = popStats.total;
  const coveragePercent = activePopulation > 0 ? Math.round((trainingStats.pessoasTreinadas / activePopulation) * 100) : 0;

  // Phase progress for timeline
  const timelinePhases = useMemo(() => {
    const buildPhase = (id: string, name: string, cycleIds: string[]) => {
      const cycles = cycleIndicators.filter(c => cycleIds.includes(c.cycleId));
      const allClosed = cycles.every(c => c.status === "closed");
      const anyActive = cycles.some(c => c.status === "in_progress" || c.status === "ready_to_close");
      const avgProgress = cycles.reduce((s, c) => s + c.completionPercent, 0) / (cycles.length || 1);
      return {
        id,
        name,
        cycles: cycleIds,
        status: allClosed ? "completed" as const : anyActive ? "in-progress" as const : "pending" as const,
        progress: Math.round(avgProgress),
      };
    };
    return [
      buildPhase("M", "Monitorar", ["M1", "M2", "M3"]),
      buildPhase("V", "Validar", ["V1", "V2", "V3"]),
      buildPhase("P", "Perpetuar", ["P1", "P2", "P3"]),
    ];
  }, [cycleIndicators]);

  // Maturity score: weighted
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

  return (
    <div className="space-y-6 animate-fade-in">
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
        <MetricCard title="Base Populacional" value={activePopulation} icon={Users} subtitle={`${popStats.sectors} setores · ${popStats.units} unidades`} variant="default" />
        <MetricCard title="Núcleo de Sustentação" value={popStats.nucleoCount} icon={Shield} subtitle={`${popStats.leaders} lideranças`} variant="default" />
        <MetricCard title="Facilitadores" value={popStats.facilitators} icon={UserCheck} subtitle="habilitados" variant={popStats.facilitators > 0 ? "success" : "default"} />
        <MetricCard title="Turmas Realizadas" value={`${trainingStats.turmasRealizadas}/${trainingStats.turmasTotal}`} icon={GraduationCap} subtitle={`${trainingStats.pessoasTreinadas} pessoas treinadas`} variant="default" />
      </div>

      {/* Row 2: Execution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Ciclos Encerrados" value={`${globalIndicators.closedCycles}/${globalIndicators.totalCycles}`} icon={Target} subtitle={`${globalIndicators.cyclesReadyToClose} prontos para encerrar`} variant={globalIndicators.closedCycles > 0 ? "success" : "default"} />
        <MetricCard title="Ações Concluídas" value={`${globalIndicators.completedActions}/${globalIndicators.totalActions}`} icon={CheckCircle} subtitle={`${globalIndicators.overallCompletionPercent}% do plano`} variant="success" />
        <MetricCard title="Ações Atrasadas" value={globalIndicators.delayedActions} icon={AlertTriangle} subtitle={`${globalIndicators.actionBacklog} no backlog`} variant={globalIndicators.delayedActions > 0 ? "danger" : "default"} />
        <MetricCard title="Taxa Decisão→Ação" value={`${globalIndicators.decisionConversionRate}%`} icon={TrendingUp} subtitle={`${globalIndicators.decisionsWithActions} decisões convertidas`} variant={globalIndicators.decisionConversionRate >= 50 ? "success" : "warning"} />
      </div>

      {/* Row 3: Progress + Coverage + Maturity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

      {/* Row 4: Timeline */}
      <ProgramTimeline phases={timelinePhases} />
    </div>
  );
}
