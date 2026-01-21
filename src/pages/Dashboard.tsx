import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { PhaseProgress } from "@/components/dashboard/PhaseProgress";
import { LeadershipParticipation } from "@/components/dashboard/LeadershipParticipation";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { MaturityGauge } from "@/components/dashboard/MaturityGauge";
import { SmartAlerts } from "@/components/dashboard/SmartAlerts";
import { Target, Users, TrendingUp, CheckCircle } from "lucide-react";
import { 
  obterIndicadoresGlobais,
  obterIndicadoresTodosCiclos,
} from "@/lib/governance";
import { recalculateActionStatuses } from "@/lib/storage";

export default function Dashboard() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  // Recalculate statuses on mount
  useEffect(() => {
    recalculateActionStatuses();
  }, []);

  // Get real indicators from governance layer
  const { globalIndicators, phaseProgress } = useMemo(() => {
    const global = obterIndicadoresGlobais();
    const cycleIndicators = obterIndicadoresTodosCiclos();
    
    // Build phase progress data
    const phases = [
      {
        id: "M",
        name: "Fase Monitorar (M1-M3)",
        status: (() => {
          const mCycles = cycleIndicators.filter(c => c.cycleId.startsWith('M'));
          const allClosed = mCycles.every(c => c.status === 'closed');
          const anyInProgress = mCycles.some(c => c.status === 'in_progress' || c.status === 'ready_to_close');
          if (allClosed) return 'completed' as const;
          if (anyInProgress) return 'in-progress' as const;
          return 'pending' as const;
        })(),
        progress: (() => {
          const mCycles = cycleIndicators.filter(c => c.cycleId.startsWith('M'));
          const avgCompletion = mCycles.reduce((sum, c) => sum + c.completionPercent, 0) / (mCycles.length || 1);
          return Math.round(avgCompletion);
        })(),
      },
      {
        id: "V",
        name: "Fase Validar (V1-V3)",
        status: (() => {
          const vCycles = cycleIndicators.filter(c => c.cycleId.startsWith('V'));
          const allClosed = vCycles.every(c => c.status === 'closed');
          const anyInProgress = vCycles.some(c => c.status === 'in_progress' || c.status === 'ready_to_close');
          if (allClosed) return 'completed' as const;
          if (anyInProgress) return 'in-progress' as const;
          return 'pending' as const;
        })(),
        progress: (() => {
          const vCycles = cycleIndicators.filter(c => c.cycleId.startsWith('V'));
          const avgCompletion = vCycles.reduce((sum, c) => sum + c.completionPercent, 0) / (vCycles.length || 1);
          return Math.round(avgCompletion);
        })(),
      },
      {
        id: "P",
        name: "Fase Perpetuar (P1-P3)",
        status: (() => {
          const pCycles = cycleIndicators.filter(c => c.cycleId.startsWith('P'));
          const allClosed = pCycles.every(c => c.status === 'closed');
          const anyInProgress = pCycles.some(c => c.status === 'in_progress' || c.status === 'ready_to_close');
          if (allClosed) return 'completed' as const;
          if (anyInProgress) return 'in-progress' as const;
          return 'pending' as const;
        })(),
        progress: (() => {
          const pCycles = cycleIndicators.filter(c => c.cycleId.startsWith('P'));
          const avgCompletion = pCycles.reduce((sum, c) => sum + c.completionPercent, 0) / (pCycles.length || 1);
          return Math.round(avgCompletion);
        })(),
      },
    ];

    return { globalIndicators: global, phaseProgress: phases };
  }, [refreshKey]);

  // Mock data for components that still need it
  const mockLeaders = [
    { id: "1", name: "Carlos Silva", role: "Diretor de Operações", participation: 92 },
    { id: "2", name: "Ana Martins", role: "Gerente de RH", participation: 88 },
    { id: "3", name: "Pedro Costa", role: "Coordenador de Produção", participation: 75 },
    { id: "4", name: "Juliana Alves", role: "Supervisora Comercial", participation: 68 },
  ];

  const mockActivities = [
    { id: "1", type: "document" as const, title: "Relatório mensal enviado", description: "Relatório de progresso de Janeiro", user: "Ana Martins", time: "Há 2 horas" },
    { id: "2", type: "task" as const, title: "Ação concluída", description: "Treinamento de integração finalizado", user: "Pedro Costa", time: "Ontem" },
    { id: "3", type: "survey" as const, title: "Pesquisa respondida", description: "Check-in semanal da liderança", user: "Juliana Alves", time: "Ontem" },
  ];

  const handleAlertDismissed = () => {
    setRefreshKey(k => k + 1);
  };

  const progressData = {
    total: globalIndicators.totalActions || 1,
    completed: globalIndicators.completedActions,
    inProgress: globalIndicators.inProgressActions,
    delayed: globalIndicators.delayedActions,
    pending: globalIndicators.pendingActions,
  };

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do programa MVP - Empresa Alpha">
      <div className="space-y-6 animate-fade-in">
        {/* Metrics Row - Using real indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Ciclos Encerrados" 
            value={`${globalIndicators.closedCycles}/${globalIndicators.totalCycles}`} 
            icon={Target} 
            subtitle={`${globalIndicators.cyclesReadyToClose} prontos para encerrar`}
            variant={globalIndicators.closedCycles > 0 ? "success" : "default"} 
          />
          <MetricCard 
            title="Turmas Concluídas" 
            value={`${globalIndicators.completedTurmas}/${globalIndicators.totalTurmas}`} 
            icon={Users} 
            subtitle={`${globalIndicators.totalParticipants} participantes`}
            variant="default" 
          />
          <MetricCard 
            title="Ações Concluídas" 
            value={`${globalIndicators.completedActions}/${globalIndicators.totalActions}`} 
            subtitle={`${globalIndicators.overallCompletionPercent}% do plano`} 
            icon={CheckCircle} 
            variant="success" 
          />
          <MetricCard 
            title="Taxa Decisão→Ação" 
            value={`${globalIndicators.decisionConversionRate}%`} 
            subtitle={`${globalIndicators.decisionsWithActions} decisões com ações`}
            icon={TrendingUp} 
            variant={globalIndicators.decisionConversionRate >= 50 ? "success" : "warning"} 
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              {/* Smart Alerts Component */}
              <SmartAlerts 
                onAlertDismissed={handleAlertDismissed}
                maxAlerts={4}
                refreshTrigger={refreshKey}
              />
            </div>
            <PhaseProgress phases={phaseProgress} />
          </div>

          <div className="space-y-6">
            <MaturityGauge currentLevel={2} score={globalIndicators.overallCompletionPercent} />
            <LeadershipParticipation leaders={mockLeaders} overallParticipation={82} />
          </div>
        </div>

        <RecentActivities activities={mockActivities} />
      </div>
    </AppLayout>
  );
}