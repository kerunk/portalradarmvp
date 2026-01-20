import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { PhaseProgress } from "@/components/dashboard/PhaseProgress";
import { LeadershipParticipation } from "@/components/dashboard/LeadershipParticipation";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { MaturityGauge } from "@/components/dashboard/MaturityGauge";
import {
  Target,
  Users,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

// Mock data
const mockAlerts = [
  {
    id: "1",
    type: "warning" as const,
    title: "Baixa participação em pesquisa",
    description: "Apenas 45% dos colaboradores responderam a pesquisa de percepção",
  },
  {
    id: "2",
    type: "danger" as const,
    title: "Ação atrasada",
    description: "Workshop de liderança está 5 dias atrasado",
  },
  {
    id: "3",
    type: "info" as const,
    title: "Nova fase disponível",
    description: "A Fase 3 pode ser iniciada após aprovação",
  },
];

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
  {
    id: "1",
    type: "document" as const,
    title: "Relatório mensal enviado",
    description: "Relatório de progresso de Janeiro",
    user: "Ana Martins",
    time: "Há 2 horas",
  },
  {
    id: "2",
    type: "image" as const,
    title: "Evidência registrada",
    description: "Fotos do workshop de liderança",
    user: "Carlos Silva",
    time: "Há 5 horas",
  },
  {
    id: "3",
    type: "task" as const,
    title: "Ação concluída",
    description: "Treinamento de integração finalizado",
    user: "Pedro Costa",
    time: "Ontem",
  },
  {
    id: "4",
    type: "survey" as const,
    title: "Pesquisa respondida",
    description: "Check-in semanal da liderança",
    user: "Juliana Alves",
    time: "Ontem",
  },
];

export default function Dashboard() {
  return (
    <AppLayout
      title="Dashboard"
      subtitle="Visão geral do programa MVP - Empresa Alpha"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Adesão ao Programa"
            value="78%"
            icon={Target}
            trend={{ value: 5, label: "vs. mês anterior" }}
            variant="success"
          />
          <MetricCard
            title="Participação Liderança"
            value="82%"
            icon={Users}
            trend={{ value: 8, label: "vs. mês anterior" }}
            variant="default"
          />
          <MetricCard
            title="Ações Concluídas"
            value="24/32"
            subtitle="75% do plano"
            icon={CheckCircle}
            variant="success"
          />
          <MetricCard
            title="Índice de Percepção"
            value="7.2"
            subtitle="de 10 pontos"
            icon={TrendingUp}
            trend={{ value: -2, label: "vs. mês anterior" }}
            variant="warning"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress and Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProgressCard
                title="Progresso do Plano"
                progress={24}
                total={32}
                items={[
                  { label: "Concluídas", value: 24, color: "success" },
                  { label: "Em andamento", value: 5, color: "primary" },
                  { label: "Atrasadas", value: 2, color: "danger" },
                  { label: "Pendentes", value: 1, color: "warning" },
                ]}
              />
              <AlertCard alerts={mockAlerts} />
            </div>

            {/* Phases */}
            <PhaseProgress phases={mockPhases} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <MaturityGauge currentLevel={2} score={58} />
            <LeadershipParticipation
              leaders={mockLeaders}
              overallParticipation={82}
            />
          </div>
        </div>

        {/* Recent Activities */}
        <RecentActivities activities={mockActivities} />
      </div>
    </AppLayout>
  );
}
