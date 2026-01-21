import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CycleContext } from "@/components/cycles/CycleContext";
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
import { cyclesData } from "@/data/cyclesData";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

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

  return (
    <AppLayout
      title="Ciclos MVP"
      subtitle="Área central de execução da metodologia. Cada ciclo representa uma etapa completa do programa (~30 dias)."
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

        {/* BLOCK 1: Cycle Identity & Context */}
        <CycleContext
          cycleId={currentCycle.id}
          name={currentCycle.name}
          description={currentCycle.description}
          impactedGroups={currentCycle.impactedGroups}
          estimatedDuration={currentCycle.estimatedDuration}
          phase={currentCycle.phase}
        />

        {/* BLOCK 2: Expectations */}
        <CycleExpectations
          whatHappens={currentCycle.expectations.whatHappens}
          expectedResults={currentCycle.expectations.expectedResults}
          successCriteria={currentCycle.expectations.successCriteria}
        />

        {/* BLOCK 3: Success Factors (Interactive) */}
        <SuccessFactorActions
          factors={currentFactors}
          onToggleAction={handleToggleAction}
          onUpdateReason={handleUpdateReason}
        />

        {/* BLOCK 4: Active Actions Status */}
        <ActiveActions
          actions={activeActions}
          onStatusChange={handleStatusChange}
          onObservationChange={handleObservationChange}
        />

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center py-4">
          As alterações são salvas automaticamente. Navegue livremente entre os ciclos metodológicos.
        </p>
      </div>
    </AppLayout>
  );
}
