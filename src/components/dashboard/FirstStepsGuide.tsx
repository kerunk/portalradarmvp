import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Layers, Database, ShieldCheck, Users, Rocket, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const GUIDE_DISMISSED_KEY = "mvp_first_steps_dismissed";

const steps = [
  {
    id: 1,
    title: "Cadastrar estrutura organizacional",
    description: "Defina os setores e unidades da empresa para organizar a base de colaboradores.",
    icon: Layers,
    href: "/estrutura",
  },
  {
    id: 2,
    title: "Cadastrar base populacional",
    description: "Importe ou cadastre os colaboradores que participarão do programa.",
    icon: Database,
    href: "/base-populacional",
  },
  {
    id: 3,
    title: "Definir núcleo de sustentação",
    description: "Identifique lideranças e facilitadores que conduzirão o programa.",
    icon: ShieldCheck,
    href: "/nucleo",
  },
  {
    id: 4,
    title: "Criar primeira turma",
    description: "Monte a primeira turma de treinamento e defina data e facilitador.",
    icon: Users,
    href: "/turmas",
  },
  {
    id: 5,
    title: "Registrar primeira prática",
    description: "Execute e registre a primeira ação prática do programa MVP.",
    icon: Rocket,
    href: "/ciclos",
  },
];

interface FirstStepsGuideProps {
  completedSteps?: number[];
}

export function FirstStepsGuide({ completedSteps = [] }: FirstStepsGuideProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(GUIDE_DISMISSED_KEY) === "true";
  });
  const navigate = useNavigate();

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(GUIDE_DISMISSED_KEY, "true");
    setDismissed(true);
  };

  const completedCount = completedSteps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground">
            🚀 Guia de Implementação MVP
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Siga estes passos para configurar o programa na sua empresa
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDismiss} className="text-muted-foreground -mt-1 -mr-1">
          <X size={18} />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{completedCount} de {steps.length} passos concluídos</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          return (
            <button
              key={step.id}
              onClick={() => navigate(step.href)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                isCompleted
                  ? "bg-success/5 border border-success/20"
                  : "bg-card border border-border hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 size={20} className="text-success flex-shrink-0" />
              ) : (
                <Circle size={20} className="text-muted-foreground/40 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", isCompleted ? "text-success" : "text-foreground")}>
                  Passo {step.id}: {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground/40 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
