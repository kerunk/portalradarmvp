import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
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
  getState, 
  generateSmartAlerts, 
  recalculateActionStatuses,
  type SmartAlert 
} from "@/lib/storage";

const mockPhases = [
  { id: "1", name: "Fase 1: Diagnóstico", status: "completed" as const },
  { id: "2", name: "Fase 2: Sensibilização", status: "completed" as const },
  { id: "3", name: "Fase 3: Implementação", status: "in-progress" as const, progress: 65 },
  { id: "4", name: "Fase 4: Consolidação", status: "pending" as const },
  { id: "5", name: "Fase 5: Sustentação", status: "pending" as const },
];

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Recalculate statuses on mount
  useEffect(() => {
    recalculateActionStatuses();
    setAlerts(generateSmartAlerts());
  }, [refreshKey]);

  const progressData = useMemo(() => {
    const state = getState();
    
    let totalActions = 0;
    let completedActions = 0;
    let inProgressActions = 0;
    let delayedCount = 0;

    Object.values(state.cycles).forEach(cycleState => {
      cycleState.factors.forEach(factor => {
        factor.actions.forEach(action => {
          if (action.enabled) {
            totalActions++;
            if (action.status === "completed") completedActions++;
            else if (action.status === "in_progress") inProgressActions++;
            else if (action.status === "delayed") delayedCount++;
          }
        });
      });
    });

    const pendingActions = totalActions - completedActions - inProgressActions - delayedCount;

    return {
      total: totalActions || 32,
      completed: completedActions || 24,
      inProgress: inProgressActions || 5,
      delayed: delayedCount || 2,
      pending: Math.max(0, pendingActions) || 1,
    };
  }, [refreshKey]);

  const handleAlertDismissed = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do programa MVP - Empresa Alpha">
      <div className="space-y-6 animate-fade-in">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Adesão ao Programa" value="78%" icon={Target} trend={{ value: 5, label: "vs. mês anterior" }} variant="success" />
          <MetricCard title="Participação Liderança" value="82%" icon={Users} trend={{ value: 8, label: "vs. mês anterior" }} variant="default" />
          <MetricCard title="Ações Concluídas" value={`${progressData.completed}/${progressData.total}`} subtitle={`${Math.round((progressData.completed / progressData.total) * 100)}% do plano`} icon={CheckCircle} variant="success" />
          <MetricCard title="Índice de Percepção" value="7.2" subtitle="de 10 pontos" icon={TrendingUp} trend={{ value: -2, label: "vs. mês anterior" }} variant="warning" />
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
                alerts={alerts} 
                onAlertDismissed={handleAlertDismissed}
                maxAlerts={4}
              />
            </div>
            <PhaseProgress phases={mockPhases} />
          </div>

          <div className="space-y-6">
            <MaturityGauge currentLevel={2} score={58} />
            <LeadershipParticipation leaders={mockLeaders} overallParticipation={82} />
          </div>
        </div>

        <RecentActivities activities={mockActivities} />
      </div>
    </AppLayout>
  );
}