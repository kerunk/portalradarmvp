import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { PhaseProgress } from "@/components/dashboard/PhaseProgress";
import { LeadershipParticipation } from "@/components/dashboard/LeadershipParticipation";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { MaturityGauge } from "@/components/dashboard/MaturityGauge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, Target, Users, TrendingUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getState, getDelayedActions } from "@/lib/storage";
import { useMemo } from "react";

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

  const { alerts, progressData } = useMemo(() => {
    const delayedActions = getDelayedActions();
    const state = getState();
    
    // Calculate progress from all cycles
    let totalActions = 0;
    let completedActions = 0;
    let inProgressActions = 0;
    let delayedCount = delayedActions.length;

    Object.values(state.cycles).forEach(cycleState => {
      cycleState.factors.forEach(factor => {
        factor.actions.forEach(action => {
          if (action.enabled) {
            totalActions++;
            if (action.status === "completed") completedActions++;
            else if (action.status === "in_progress") inProgressActions++;
          }
        });
      });
    });

    const pendingActions = totalActions - completedActions - inProgressActions - delayedCount;

    const alerts = [];
    
    alerts.push({
      id: "1",
      type: "warning" as const,
      title: "Baixa participação em pesquisa",
      description: "Apenas 45% dos colaboradores responderam a pesquisa de percepção",
      action: () => navigate("/indicadores?tab=participacao"),
    });

    if (delayedCount > 0) {
      const firstDelayed = delayedActions[0];
      alerts.push({
        id: "2",
        type: "danger" as const,
        title: `${delayedCount} ação(ões) atrasada(s)`,
        description: `${firstDelayed.action.id} no ciclo ${firstDelayed.cycleId}`,
        action: () => navigate(`/ciclos?cycle=${firstDelayed.cycleId}`),
      });
    }

    alerts.push({
      id: "3",
      type: "info" as const,
      title: "Nova fase disponível",
      description: "A Fase 3 pode ser iniciada após aprovação",
      action: () => navigate("/ciclos"),
    });

    return {
      alerts,
      progressData: {
        total: totalActions || 32,
        completed: completedActions || 24,
        inProgress: inProgressActions || 5,
        delayed: delayedCount || 2,
        pending: pendingActions || 1,
      },
    };
  }, [navigate]);

  const typeStyles = {
    warning: "bg-warning/10 border-warning/20 text-warning",
    danger: "bg-destructive/10 border-destructive/20 text-destructive",
    info: "bg-primary/10 border-primary/20 text-primary",
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
              
              {/* Clickable Alerts */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Alertas</h3>
                  <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-full font-medium">
                    {alerts.length} pendentes
                  </span>
                </div>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={alert.action}
                      className={cn(
                        "w-full p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity text-left",
                        typeStyles[alert.type]
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={16} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
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
