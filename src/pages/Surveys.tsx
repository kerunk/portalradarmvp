import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  BarChart3,
  Play,
  Eye,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Survey {
  id: string;
  title: string;
  description: string;
  audience: "employees" | "leadership";
  status: "active" | "completed" | "draft";
  responses: number;
  totalTarget: number;
  createdAt: string;
  closesAt?: string;
}

const mockSurveys: Survey[] = [
  {
    id: "1",
    title: "Pesquisa de Percepção - Janeiro",
    description: "Avaliação mensal da percepção dos colaboradores sobre o programa",
    audience: "employees",
    status: "active",
    responses: 145,
    totalTarget: 320,
    createdAt: "2025-01-15",
    closesAt: "2025-01-31",
  },
  {
    id: "2",
    title: "Check-in de Liderança",
    description: "Acompanhamento semanal das atividades da liderança",
    audience: "leadership",
    status: "active",
    responses: 18,
    totalTarget: 24,
    createdAt: "2025-01-20",
  },
  {
    id: "3",
    title: "Pesquisa de Percepção - Dezembro",
    description: "Avaliação mensal da percepção dos colaboradores sobre o programa",
    audience: "employees",
    status: "completed",
    responses: 289,
    totalTarget: 320,
    createdAt: "2024-12-15",
    closesAt: "2024-12-31",
  },
  {
    id: "4",
    title: "Avaliação de Treinamento",
    description: "Feedback sobre o workshop de liderança comportamental",
    audience: "leadership",
    status: "completed",
    responses: 22,
    totalTarget: 24,
    createdAt: "2025-01-10",
  },
];

const statusConfig = {
  active: {
    label: "Ativa",
    color: "bg-success/10 text-success",
    icon: Play,
  },
  completed: {
    label: "Concluída",
    color: "bg-primary/10 text-primary",
    icon: CheckCircle2,
  },
  draft: {
    label: "Rascunho",
    color: "bg-muted text-muted-foreground",
    icon: Clock,
  },
};

const audienceConfig = {
  employees: {
    label: "Colaboradores",
    icon: Users,
    color: "text-primary",
  },
  leadership: {
    label: "Liderança",
    icon: UserCheck,
    color: "text-success",
  },
};

export default function Surveys() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredSurveys = mockSurveys.filter((survey) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return survey.status === "active";
    if (activeTab === "completed") return survey.status === "completed";
    return true;
  });

  return (
    <AppLayout
      title="Pesquisas"
      subtitle="Gerencie pesquisas de percepção e check-ins"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Play size={20} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">2</p>
                <p className="text-sm text-muted-foreground">Pesquisas Ativas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">163</p>
                <p className="text-sm text-muted-foreground">Respostas Hoje</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <BarChart3 size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">47%</p>
                <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Pesquisas Concluídas</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions and Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="active">Ativas</TabsTrigger>
              <TabsTrigger value="completed">Concluídas</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button className="btn-primary-gradient">
            <Plus size={16} className="mr-2" />
            Nova Pesquisa
          </Button>
        </div>

        {/* Surveys List */}
        <div className="space-y-4">
          {filteredSurveys.map((survey) => {
            const status = statusConfig[survey.status];
            const audience = audienceConfig[survey.audience];
            const StatusIcon = status.icon;
            const AudienceIcon = audience.icon;
            const responseRate = Math.round((survey.responses / survey.totalTarget) * 100);

            return (
              <Card key={survey.id} className="p-5 hover:shadow-elevated transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1",
                            status.color
                          )}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 bg-secondary text-secondary-foreground"
                          )}
                        >
                          <AudienceIcon size={12} />
                          {audience.label}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mt-2">{survey.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
                  </div>

                  {/* Progress */}
                  <div className="lg:w-48">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Respostas</span>
                      <span className="font-medium text-foreground">
                        {survey.responses}/{survey.totalTarget}
                      </span>
                    </div>
                    <Progress value={responseRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {responseRate}% de participação
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye size={14} className="mr-1" />
                      Ver
                    </Button>
                    {survey.status === "active" && (
                      <Button variant="outline" size="sm">
                        <Copy size={14} className="mr-1" />
                        Link
                      </Button>
                    )}
                    {survey.status === "completed" && (
                      <Button variant="outline" size="sm">
                        <BarChart3 size={14} className="mr-1" />
                        Resultados
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
