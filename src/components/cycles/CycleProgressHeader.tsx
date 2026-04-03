import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Lock,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Award,
  Users,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CycleState, TurmaState } from "@/lib/storage";
import type { CycleGovernance } from "@/lib/governance";

interface CycleProgressHeaderProps {
  cycleId: string;
  cycleTitle: string;
  phase: "M" | "V" | "P";
  cycleState: CycleState | null;
  governance: CycleGovernance | null;
  isStarted: boolean;
  turmas: TurmaState[];
  totalEmployees: number;
  /** Total enabled actions in success factors */
  totalFactorActions: number;
  /** Completed actions in success factors */
  completedFactorActions: number;
  /** Disabled-with-reason (treated) actions */
  treatedFactorActions: number;
  onStartCycle: () => void;
  onCloseCycle: () => void;
  isCycleLocked: boolean;
  onNavigateTraining?: () => void;
  onNavigateFactors?: () => void;
}

export function CycleProgressHeader({
  cycleId,
  cycleTitle,
  phase,
  cycleState,
  governance,
  isStarted,
  turmas,
  totalEmployees,
  totalFactorActions,
  completedFactorActions,
  treatedFactorActions,
  onStartCycle,
  onCloseCycle,
  isCycleLocked,
  onNavigateTraining,
  onNavigateFactors,
}: CycleProgressHeaderProps) {
  const progress = useMemo(() => {
    // 1. Training coverage (70% weight)
    const cycleTurmas = turmas.filter(t => t.cycleId === cycleId);
    const trainedSet = new Set<string>();
    cycleTurmas.forEach(turma => {
      if (turma.attendance) {
        Object.entries(turma.attendance).forEach(([participantId, status]) => {
          if (status === "present") trainedSet.add(participantId);
        });
      }
      if (turma.status === "completed" && (!turma.attendance || Object.keys(turma.attendance).length === 0)) {
        turma.participants.forEach(p => trainedSet.add(p.id));
      }
    });
    const trainingPercent = totalEmployees > 0
      ? Math.min(100, Math.round((trainedSet.size / totalEmployees) * 100))
      : 0;

    // 2. Success Factors (30% weight) — completed + treated / total
    const factorsDone = completedFactorActions + treatedFactorActions;
    const factorsPercent = totalFactorActions > 0
      ? Math.min(100, Math.round((factorsDone / totalFactorActions) * 100))
      : 0;

    // Weighted total
    const weighted = Math.round(trainingPercent * 0.7 + factorsPercent * 0.3);

    return {
      total: Math.min(100, weighted),
      training: trainingPercent,
      factors: factorsPercent,
      trainedCount: trainedSet.size,
      factorsDone,
      isReadyToAdvance: weighted >= 85,
    };
  }, [cycleId, turmas, totalEmployees, totalFactorActions, completedFactorActions, treatedFactorActions]);

  const phaseGradient = {
    M: "from-blue-500 to-blue-600",
    V: "from-amber-500 to-amber-600",
    P: "from-emerald-500 to-emerald-600",
  }[phase];

  const phaseColor = {
    M: "text-blue-600",
    V: "text-amber-600",
    P: "text-emerald-600",
  }[phase];

  const phaseBg = {
    M: "bg-blue-500/10",
    V: "bg-amber-500/10",
    P: "bg-emerald-500/10",
  }[phase];

  // Not started state
  if (!isStarted) {
    return (
      <Card className="p-8 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Play className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Iniciar Ciclo {cycleId}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
              {cycleTitle}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique abaixo para dar início ao ciclo. As ações, turmas e práticas ficarão disponíveis para execução.
            </p>
          </div>
          <Button
            size="lg"
            onClick={onStartCycle}
            disabled={isCycleLocked}
            className={cn("gap-2 text-lg px-8 py-6 bg-gradient-to-r shadow-lg hover:shadow-xl transition-all", phaseGradient)}
          >
            <Play className="h-5 w-5" />
            Iniciar Ciclo {cycleId}
          </Button>
          {isCycleLocked && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="h-4 w-4" />
              Encerre o ciclo anterior para liberar este ciclo.
            </p>
          )}
        </div>
      </Card>
    );
  }

  const isClosed = governance?.status === "closed";

  return (
    <Card className="p-6 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", phaseBg)}>
            {isClosed ? (
              <CheckCircle2 className={cn("h-6 w-6", phaseColor)} />
            ) : (
              <TrendingUp className={cn("h-6 w-6", phaseColor)} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">
              Progresso do Ciclo {cycleId}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {cycleState?.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Início: {format(new Date(cycleState.startDate), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {isClosed && cycleState?.closedAt && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Encerrado: {format(new Date(cycleState.closedAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isClosed && !isCycleLocked && (
            <Button onClick={onCloseCycle} variant="outline" className="gap-2">
              <Lock className="h-4 w-4" />
              Encerrar Ciclo
            </Button>
          )}
        </div>
      </div>

      {/* Main progress bar with 85% marker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Progresso Consolidado</span>
          <span className={cn(
            "text-2xl font-bold",
            progress.total >= 85 ? "text-success" : phaseColor
          )}>
            {progress.total}%
          </span>
        </div>
        
        <div className="relative">
          <div className="relative h-5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                progress.total >= 85 ? "from-success to-emerald-400" : phaseGradient
              )}
              style={{ width: `${progress.total}%` }}
            />
          </div>
          
          <div
            className="absolute top-0 h-5 w-0.5 bg-foreground/60"
            style={{ left: "85%" }}
          />
          <div
            className="absolute -top-5 text-[10px] font-semibold text-muted-foreground"
            style={{ left: "85%", transform: "translateX(-50%)" }}
          >
            85%
          </div>
        </div>
      </div>

      {/* Two breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          onClick={onNavigateTraining}
          className={cn(
            "p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 space-y-1 transition-all",
            onNavigateTraining && "cursor-pointer hover:bg-blue-500/10 hover:border-blue-500/30 hover:shadow-sm active:scale-[0.98]"
          )}
          role={onNavigateTraining ? "button" : undefined}
          tabIndex={onNavigateTraining ? 0 : undefined}
          onKeyDown={onNavigateTraining ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigateTraining(); } } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
              <Users className="h-3.5 w-3.5" />
              Treinamento (peso 70%)
            </div>
            {onNavigateTraining && <ChevronRight className="h-3.5 w-3.5 text-blue-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">{progress.training}%</span>
            <span className="text-xs text-muted-foreground">
              {progress.trainedCount}/{totalEmployees} colaboradores
            </span>
          </div>
          <Progress value={progress.training} className="h-1.5" />
        </div>

        <div
          onClick={onNavigateFactors}
          className={cn(
            "p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-1 transition-all",
            onNavigateFactors && "cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/30 hover:shadow-sm active:scale-[0.98]"
          )}
          role={onNavigateFactors ? "button" : undefined}
          tabIndex={onNavigateFactors ? 0 : undefined}
          onKeyDown={onNavigateFactors ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigateFactors(); } } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
              <Sparkles className="h-3.5 w-3.5" />
              Fatores de Sucesso (peso 30%)
            </div>
            {onNavigateFactors && <ChevronRight className="h-3.5 w-3.5 text-amber-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">{progress.factors}%</span>
            <span className="text-xs text-muted-foreground">
              {progress.factorsDone}/{totalFactorActions} ações tratadas
            </span>
          </div>
          <Progress value={progress.factors} className="h-1.5" />
        </div>
      </div>

      {/* Ready to advance message */}
      {progress.isReadyToAdvance && !isClosed && (
        <Alert className="border-success/30 bg-success/5">
          <Award className="h-4 w-4 text-success" />
          <AlertDescription className="text-success font-medium">
            🎉 Você já possui progresso suficiente para iniciar o próximo ciclo!
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
