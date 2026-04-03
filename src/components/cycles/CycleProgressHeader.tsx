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
  ListChecks,
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
  activeActionsCount: number;
  completedActionsCount: number;
  totalPracticesUsed: number;
  totalPracticesAvailable: number;
  onStartCycle: () => void;
  onCloseCycle: () => void;
  isCycleLocked: boolean;
  onNavigateTraining?: () => void;
  onNavigatePractices?: () => void;
  onNavigateActions?: () => void;
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
  activeActionsCount,
  completedActionsCount,
  totalPracticesUsed,
  totalPracticesAvailable,
  onStartCycle,
  onCloseCycle,
  isCycleLocked,
}: CycleProgressHeaderProps) {
  // Calculate weighted progress
  const progress = useMemo(() => {
    // 1. Training coverage (70% weight) - UNIQUE people trained / total active employees
    const cycleTurmas = turmas.filter(t => t.cycleId === cycleId);
    const trainedSet = new Set<string>();
    cycleTurmas.forEach(turma => {
      // Only count participants marked "present" in attendance records
      if (turma.attendance) {
        Object.entries(turma.attendance).forEach(([participantId, status]) => {
          if (status === "present") trainedSet.add(participantId);
        });
      }
      // For completed turmas without attendance data, count participants as trained
      if (turma.status === "completed" && (!turma.attendance || Object.keys(turma.attendance).length === 0)) {
        turma.participants.forEach(p => trainedSet.add(p.id));
      }
    });
    const trainingPercent = totalEmployees > 0
      ? Math.min(100, Math.round((trainedSet.size / totalEmployees) * 100))
      : 0;

    // 2. Practices executed (20% weight)
    const practicesPercent = totalPracticesAvailable > 0
      ? Math.min(100, Math.round((totalPracticesUsed / totalPracticesAvailable) * 100))
      : 0;

    // 3. Actions completed (10% weight)
    const actionsPercent = activeActionsCount > 0
      ? Math.min(100, Math.round((completedActionsCount / activeActionsCount) * 100))
      : 0;

    // Weighted total
    const weighted = Math.round(
      trainingPercent * 0.7 + practicesPercent * 0.2 + actionsPercent * 0.1
    );

    return {
      total: Math.min(100, weighted),
      training: trainingPercent,
      practices: practicesPercent,
      actions: actionsPercent,
      trainedCount: trainedSet.size,
      isReadyToAdvance: weighted >= 85,
    };
  }, [cycleId, turmas, totalEmployees, totalPracticesUsed, totalPracticesAvailable, activeActionsCount, completedActionsCount]);

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

  // Not started state - show prominent start button
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

  // Started state - show progress bar and status
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
          {/* Progress bar */}
          <div className="relative h-5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                progress.total >= 85 ? "from-success to-emerald-400" : phaseGradient
              )}
              style={{ width: `${progress.total}%` }}
            />
          </div>
          
          {/* 85% milestone marker */}
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

      {/* Breakdown cards - clickable shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          onClick={onNavigatePractices}
          className={cn(
            "p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-1 transition-all",
            onNavigatePractices && "cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/30 hover:shadow-sm active:scale-[0.98]"
          )}
          role={onNavigatePractices ? "button" : undefined}
          tabIndex={onNavigatePractices ? 0 : undefined}
          onKeyDown={onNavigatePractices ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigatePractices(); } } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
              <Sparkles className="h-3.5 w-3.5" />
              Práticas (peso 20%)
            </div>
            {onNavigatePractices && <ChevronRight className="h-3.5 w-3.5 text-amber-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">{progress.practices}%</span>
            <span className="text-xs text-muted-foreground">
              {totalPracticesUsed}/{totalPracticesAvailable} executadas
            </span>
          </div>
          <Progress value={progress.practices} className="h-1.5" />
        </div>

        <div
          onClick={onNavigateActions}
          className={cn(
            "p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15 space-y-1 transition-all",
            onNavigateActions && "cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:shadow-sm active:scale-[0.98]"
          )}
          role={onNavigateActions ? "button" : undefined}
          tabIndex={onNavigateActions ? 0 : undefined}
          onKeyDown={onNavigateActions ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigateActions(); } } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
              <ListChecks className="h-3.5 w-3.5" />
              Ações (peso 10%)
            </div>
            {onNavigateActions && <ChevronRight className="h-3.5 w-3.5 text-emerald-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">{progress.actions}%</span>
            <span className="text-xs text-muted-foreground">
              {completedActionsCount}/{activeActionsCount} concluídas
            </span>
          </div>
          <Progress value={progress.actions} className="h-1.5" />
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
