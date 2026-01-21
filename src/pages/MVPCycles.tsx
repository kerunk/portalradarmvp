import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CycleIdentity } from "@/components/cycles/CycleIdentity";
import { CycleIntroduction } from "@/components/cycles/CycleIntroduction";
import { CycleExpectations } from "@/components/cycles/CycleExpectations";
import {
  SuccessFactorActions,
  type SuccessFactor,
} from "@/components/cycles/SuccessFactorActions";
import {
  ActiveActions,
  type ActiveAction,
  type ActionStatus,
} from "@/components/cycles/ActiveActions";
import { CycleTurmas, type Turma } from "@/components/cycles/CycleTurmas";
import { cyclesData } from "@/data/cyclesData";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const cycleIds = ["M1", "M2", "M3", "V1", "V2", "V3", "P1", "P2", "P3"];

const phaseColors = {
  M: {
    active: "bg-blue-600 text-white border-blue-600",
    inactive: "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20",
  },
  V: {
    active: "bg-amber-600 text-white border-amber-600",
    inactive: "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20",
  },
  P: {
    active: "bg-emerald-600 text-white border-emerald-600",
    inactive: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20",
  },
};

export default function MVPCycles() {
  const [selectedCycleId, setSelectedCycleId] = useState("M1");

  // State for success factors per cycle
  const [cycleFactors, setCycleFactors] = useState<Record<string, SuccessFactor[]>>(() => {
    const initial: Record<string, SuccessFactor[]> = {};
    cyclesData.forEach((cycle) => {
      initial[cycle.id] = JSON.parse(JSON.stringify(cycle.successFactors));
    });
    return initial;
  });

  // State for action statuses and observations
  const [actionStatuses, setActionStatuses] = useState<
    Record<string, { status: ActionStatus; observation: string }>
  >({});

  // State for turmas
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const currentCycle = cyclesData.find((c) => c.id === selectedCycleId)!;
  const currentFactors = cycleFactors[selectedCycleId] || [];

  // Derive active actions from enabled actions in factors
  const activeActions: ActiveAction[] = useMemo(() => {
    const actions: ActiveAction[] = [];
    currentFactors.forEach((factor) => {
      factor.actions
        .filter((a) => a.enabled)
        .forEach((action) => {
          const key = `${selectedCycleId}-${factor.id}-${action.id}`;
          const saved = actionStatuses[key] || { status: "planned", observation: "" };
          actions.push({
            id: key,
            factorName: factor.name,
            title: action.title,
            status: saved.status,
            observation: saved.observation,
          });
        });
    });
    return actions;
  }, [currentFactors, selectedCycleId, actionStatuses]);

  // Calculate progress for dashboard integration
  const cycleProgress = useMemo(() => {
    const totalActions = activeActions.length;
    const completedActions = activeActions.filter(a => a.status === "completed").length;
    const inProgressActions = activeActions.filter(a => a.status === "in_progress").length;
    const delayedTurmas = turmas.filter(t => t.cycleId === selectedCycleId && t.status === "delayed").length;
    
    return {
      total: totalActions,
      completed: completedActions,
      inProgress: inProgressActions,
      percentage: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      hasDelayedTurmas: delayedTurmas > 0,
    };
  }, [activeActions, turmas, selectedCycleId]);

  const handleToggleAction = (factorId: string, actionId: string, enabled: boolean) => {
    setCycleFactors((prev) => ({
      ...prev,
      [selectedCycleId]: prev[selectedCycleId].map((factor) =>
        factor.id === factorId
          ? {
              ...factor,
              actions: factor.actions.map((action) =>
                action.id === actionId
                  ? { ...action, enabled, disabledReason: enabled ? "" : action.disabledReason }
                  : action
              ),
            }
          : factor
      ),
    }));
  };

  const handleUpdateReason = (factorId: string, actionId: string, reason: string) => {
    setCycleFactors((prev) => ({
      ...prev,
      [selectedCycleId]: prev[selectedCycleId].map((factor) =>
        factor.id === factorId
          ? {
              ...factor,
              actions: factor.actions.map((action) =>
                action.id === actionId ? { ...action, disabledReason: reason } : action
              ),
            }
          : factor
      ),
    }));
  };

  const handleStatusChange = (actionId: string, status: ActionStatus) => {
    setActionStatuses((prev) => ({
      ...prev,
      [actionId]: { ...prev[actionId], status, observation: prev[actionId]?.observation || "" },
    }));
  };

  const handleObservationChange = (actionId: string, observation: string) => {
    setActionStatuses((prev) => ({
      ...prev,
      [actionId]: { ...prev[actionId], observation, status: prev[actionId]?.status || "planned" },
    }));
  };

  // Turma handlers
  const handleAddTurma = (turma: Omit<Turma, "id">) => {
    const newTurma: Turma = {
      ...turma,
      id: `turma-${Date.now()}`,
    };
    setTurmas((prev) => [...prev, newTurma]);
  };

  const handleUpdateTurma = (turmaId: string, updates: Partial<Turma>) => {
    setTurmas((prev) =>
      prev.map((t) => (t.id === turmaId ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTurma = (turmaId: string) => {
    setTurmas((prev) => prev.filter((t) => t.id !== turmaId));
  };

  return (
    <AppLayout
      title="Ciclos MVP"
      subtitle="Centro de execução da metodologia. Cada ciclo representa uma etapa completa do programa (~30 dias)."
    >
      <div className="space-y-6 animate-fade-in">
        {/* Cycle Navigation */}
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Navegue entre os ciclos metodológicos MVP: <strong>M</strong>onitorar → <strong>V</strong>alidar → <strong>P</strong>erpetuar
            </span>
          </div>
          
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {/* Phase: Monitorar */}
            <div className="flex items-center gap-1 mr-2">
              <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-1 rounded whitespace-nowrap">
                Monitorar
              </span>
            </div>
            {cycleIds.slice(0, 3).map((id) => {
              const isSelected = selectedCycleId === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all text-sm border-2",
                    isSelected ? phaseColors.M.active : phaseColors.M.inactive
                  )}
                >
                  {id}
                </button>
              );
            })}

            <div className="w-px h-8 bg-border mx-2" />

            {/* Phase: Validar */}
            <div className="flex items-center gap-1 mr-2">
              <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded whitespace-nowrap">
                Validar
              </span>
            </div>
            {cycleIds.slice(3, 6).map((id) => {
              const isSelected = selectedCycleId === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all text-sm border-2",
                    isSelected ? phaseColors.V.active : phaseColors.V.inactive
                  )}
                >
                  {id}
                </button>
              );
            })}

            <div className="w-px h-8 bg-border mx-2" />

            {/* Phase: Perpetuar */}
            <div className="flex items-center gap-1 mr-2">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded whitespace-nowrap">
                Perpetuar
              </span>
            </div>
            {cycleIds.slice(6, 9).map((id) => {
              const isSelected = selectedCycleId === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all text-sm border-2",
                    isSelected ? phaseColors.P.active : phaseColors.P.inactive
                  )}
                >
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert for delayed turmas */}
        {cycleProgress.hasDelayedTurmas && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Existem turmas atrasadas neste ciclo. Verifique a seção de Turmas abaixo.
            </AlertDescription>
          </Alert>
        )}

        {/* BLOCK 1: Cycle Identity */}
        <CycleIdentity
          cycleId={currentCycle.id}
          moduleTitle={currentCycle.moduleTitle}
          phaseName={currentCycle.phaseName}
          phase={currentCycle.phase}
          estimatedDuration={currentCycle.estimatedDuration}
          impactedGroups={currentCycle.impactedGroups}
        />

        {/* BLOCK 2: Context Introduction */}
        <CycleIntroduction description={currentCycle.shortDescription} />

        {/* BLOCK 3: Expectations */}
        <CycleExpectations
          whatHappens={currentCycle.expectations.whatHappens}
          expectedResults={currentCycle.expectations.expectedResults}
          successCriteria={currentCycle.expectations.successCriteria}
        />

        {/* BLOCK 4: Success Factors (Interactive) */}
        <SuccessFactorActions
          factors={currentFactors}
          onToggleAction={handleToggleAction}
          onUpdateReason={handleUpdateReason}
        />

        {/* BLOCK 5: Active Actions Status */}
        <ActiveActions
          actions={activeActions}
          onStatusChange={handleStatusChange}
          onObservationChange={handleObservationChange}
        />

        {/* BLOCK 6: Turmas (Mobile Classes) */}
        <CycleTurmas
          cycleId={selectedCycleId}
          cycleName={currentCycle.moduleTitle}
          turmas={turmas}
          onAddTurma={handleAddTurma}
          onUpdateTurma={handleUpdateTurma}
          onDeleteTurma={handleDeleteTurma}
        />

        {/* Progress Summary for Dashboard Integration */}
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Progresso do Ciclo {selectedCycleId}</p>
              <p className="text-xs text-muted-foreground">
                {cycleProgress.completed}/{cycleProgress.total} ações concluídas • {cycleProgress.inProgress} em andamento
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{cycleProgress.percentage}%</p>
              <p className="text-xs text-muted-foreground">Conclusão</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center py-4">
          Os dados deste ciclo alimentam automaticamente o Dashboard, Indicadores e Relatórios. 
          Navegue livremente entre os ciclos metodológicos.
        </p>
      </div>
    </AppLayout>
  );
}
