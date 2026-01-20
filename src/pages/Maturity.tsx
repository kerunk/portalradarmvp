import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaturityLevel {
  level: number;
  name: string;
  description: string;
  status: "completed" | "current" | "locked";
  criteria: {
    name: string;
    completed: boolean;
    description: string;
  }[];
}

const maturityLevels: MaturityLevel[] = [
  {
    level: 1,
    name: "Inicial",
    description: "Primeiros passos do programa estabelecidos",
    status: "completed",
    criteria: [
      { name: "Diagnóstico realizado", completed: true, description: "Pesquisa inicial e entrevistas concluídas" },
      { name: "Núcleo formado", completed: true, description: "Equipe de sustentação definida" },
      { name: "Plano aprovado", completed: true, description: "Plano de implementação validado pela diretoria" },
      { name: "Kick-off realizado", completed: true, description: "Evento de lançamento do programa" },
    ],
  },
  {
    level: 2,
    name: "Em Desenvolvimento",
    description: "Ações sendo implementadas e cultura em construção",
    status: "current",
    criteria: [
      { name: "70% de adesão", completed: true, description: "Colaboradores engajados no programa" },
      { name: "80% da liderança participando", completed: true, description: "Líderes ativos nos rituais" },
      { name: "Rituais estabelecidos", completed: true, description: "Reuniões diárias acontecendo" },
      { name: "Evidências registradas", completed: false, description: "80% das ações com evidências" },
      { name: "Percepção positiva", completed: false, description: "Índice de percepção acima de 7.5" },
    ],
  },
  {
    level: 3,
    name: "Consolidado",
    description: "Programa estável e rodando de forma consistente",
    status: "locked",
    criteria: [
      { name: "85% de adesão", completed: false, description: "Alta participação geral" },
      { name: "90% da liderança ativa", completed: false, description: "Liderança totalmente engajada" },
      { name: "Cultura perceptível", completed: false, description: "Colaboradores percebem mudança" },
      { name: "Indicadores estáveis", completed: false, description: "3 meses com indicadores positivos" },
    ],
  },
  {
    level: 4,
    name: "Sustentado",
    description: "Cultura incorporada e autossustentável",
    status: "locked",
    criteria: [
      { name: "Autonomia total", completed: false, description: "Programa roda sem intervenção MVP" },
      { name: "Multiplicadores formados", completed: false, description: "Líderes replicando o modelo" },
      { name: "Inovação contínua", completed: false, description: "Novas iniciativas surgindo organicamente" },
      { name: "Resultados de negócio", completed: false, description: "Impacto mensurável em KPIs" },
    ],
  },
];

export default function Maturity() {
  const currentLevel = maturityLevels.find((l) => l.status === "current")!;
  const completedCriteria = currentLevel.criteria.filter((c) => c.completed).length;
  const progressPercentage = Math.round(
    (completedCriteria / currentLevel.criteria.length) * 100
  );

  const statusConfig = {
    completed: {
      icon: CheckCircle2,
      color: "bg-success text-success-foreground",
      borderColor: "border-success",
    },
    current: {
      icon: Circle,
      color: "bg-primary text-primary-foreground",
      borderColor: "border-primary",
    },
    locked: {
      icon: Lock,
      color: "bg-muted text-muted-foreground",
      borderColor: "border-border",
    },
  };

  return (
    <AppLayout
      title="Maturidade"
      subtitle="Acompanhe a evolução do programa"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Current Status */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nível Atual</p>
              <h2 className="text-2xl font-display font-bold text-foreground mt-1">
                Nível {currentLevel.level}: {currentLevel.name}
              </h2>
              <p className="text-muted-foreground mt-1">{currentLevel.description}</p>
            </div>
            <div className="text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                <span className="text-3xl font-display font-bold text-primary">
                  {progressPercentage}%
                </span>
                <span className="text-sm text-muted-foreground">
                  para o próximo nível
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>
                {completedCriteria} de {currentLevel.criteria.length} critérios
              </span>
              <span>Nível {currentLevel.level + 1}: {maturityLevels[currentLevel.level]?.name || "Máximo"}</span>
            </div>
          </div>
        </Card>

        {/* Level Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {maturityLevels.map((level) => {
            const config = statusConfig[level.status];
            const Icon = config.icon;
            const completedCount = level.criteria.filter((c) => c.completed).length;

            return (
              <Card
                key={level.level}
                className={cn(
                  "p-5 transition-all",
                  level.status === "current" && "ring-2 ring-primary ring-offset-2",
                  level.status === "locked" && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      config.color
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nível {level.level}</p>
                    <h3 className="font-semibold text-foreground">{level.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {level.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Critérios</span>
                    <span className="font-medium">
                      {completedCount}/{level.criteria.length}
                    </span>
                  </div>
                  <Progress
                    value={(completedCount / level.criteria.length) * 100}
                    className="h-1.5"
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Current Level Criteria */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Critérios do Nível {currentLevel.level}: {currentLevel.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentLevel.criteria.map((criterion, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  criterion.completed
                    ? "bg-success/5 border-success/30"
                    : "bg-muted/50 border-border"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                      criterion.completed
                        ? "bg-success text-success-foreground"
                        : "bg-muted border-2 border-border"
                    )}
                  >
                    {criterion.completed ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Circle size={14} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        criterion.completed ? "text-success" : "text-foreground"
                      )}
                    >
                      {criterion.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {criterion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
