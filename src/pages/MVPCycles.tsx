import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CycleIdentity } from "@/components/cycles/CycleIdentity";
import { CycleIntroduction } from "@/components/cycles/CycleIntroduction";
import { CycleExpectations } from "@/components/cycles/CycleExpectations";
import { CycleTurmas, type Turma } from "@/components/cycles/CycleTurmas";
import { CycleClosureDialog } from "@/components/cycles/CycleClosureDialog";
import { CycleStatusBadge } from "@/components/cycles/CycleStatusBadge";
import { CycleProgressHeader } from "@/components/cycles/CycleProgressHeader";
import { useAuth } from "@/contexts/AuthContext";
import { getPopulation } from "@/lib/companyStorage";
import { AdvanceCycleDialog } from "@/components/cycles/AdvanceCycleDialog";
import { BestPracticesShelf } from "@/components/cycles/BestPracticesShelf";
import { getBestPracticesByCycle } from "@/data/bestPractices";
import { PendingDecisions } from "@/components/cycles/PendingDecisions";
import { 
  CreateActionFromTemplateDialog,
  type NewActionData,
} from "@/components/cycles/CreateActionFromTemplateDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { mvpCycles, type MVPCycle, getModuleNumber } from "@/data/mvpCycles";
import {
  getState,
  setState,
  getCycleState,
  setCycleState,
  getTurmas,
  setTurmas,
  getRecords,
  isActionDelayed,
  addRecord,
  updateRecord,
  type CycleState,
  type CycleFactorState,
  type CycleFactorAction,
  type TurmaState,
  type RecordState,
} from "@/lib/storage";
import { NEXT_CYCLE, type CycleId } from "@/lib/constants";
import { 
  obterGovernancaDeCiclo, 
  avaliarEncerramentoDeCiclo,
  criarAcoesDeDecisao,
  type CycleGovernance,
} from "@/lib/governance";
import { generateCycleSummaryPDF, generateCycleClosurePDF } from "@/lib/pdfGenerator";
import { cn } from "@/lib/utils";
import {
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  Clock,
  Target,
  CheckCircle2,
  ListChecks,
  CalendarIcon,
  User,
  FileDown,
  Lock,
  LockOpen,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

const iconColors: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  amber: "bg-amber-500/10 text-amber-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  purple: "bg-purple-500/10 text-purple-600",
  rose: "bg-rose-500/10 text-rose-600",
};

const statusConfig = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: Clock },
  in_progress: { label: "Em andamento", color: "bg-warning/10 text-warning", icon: Target },
  completed: { label: "Concluído", color: "bg-success/10 text-success", icon: CheckCircle2 },
  delayed: { label: "Atrasado", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

function initializeCycleState(cycle: MVPCycle, started: boolean = false): CycleState {
  return {
    factors: cycle.successFactors.map(factor => ({
      id: factor.id,
      actions: factor.actions.map(action => ({
        id: action.id,
        enabled: true,
        disabledReason: "",
        responsible: "",
        dueDate: null,
        status: "pending" as const,
        observation: "",
      })),
    })),
    closureStatus: "not_started",
    startDate: started ? new Date().toISOString() : undefined,
  };
}

export default function MVPCycles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  
  const highlightActionId = searchParams.get("highlight");
  const fromAlert = searchParams.get("fromAlert") === "true";
  
  const [selectedCycleId, setSelectedCycleIdRaw] = useState(() => {
    return searchParams.get("cycle") || "M1";
  });
  
  // Update URL when switching cycles for smooth navigation
  const setSelectedCycleId = useCallback((id: string) => {
    setSelectedCycleIdRaw(id);
    setSearchParams({ cycle: id }, { replace: true });
    setHighlightedId(null);
  }, [setSearchParams]);
  
  const [cycleStates, setCycleStates] = useState<Record<string, CycleState>>({});
  const [turmas, setTurmasState] = useState<TurmaState[]>([]);
  const [openFactors, setOpenFactors] = useState<string[]>([]);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [cycleGovernance, setCycleGovernance] = useState<CycleGovernance | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(highlightActionId);

  // Load state from localStorage
  useEffect(() => {
    const state = getState();
    const loadedCycleStates: Record<string, CycleState> = {};
    
    mvpCycles.forEach(cycle => {
      const saved = state.cycles[cycle.id];
      if (saved) {
        loadedCycleStates[cycle.id] = saved;
      } else {
        loadedCycleStates[cycle.id] = initializeCycleState(cycle);
      }
    });
    
    setCycleStates(loadedCycleStates);
    setTurmasState(state.turmas);
  }, [refreshKey]);

  // Update governance when cycle changes
  useEffect(() => {
    const governance = obterGovernancaDeCiclo(selectedCycleId);
    setCycleGovernance(governance);
  }, [selectedCycleId, cycleStates, refreshKey]);

  // Save cycle state with debounce
  const saveCycleState = useCallback((cycleId: string, cycleState: CycleState) => {
    setCycleState(cycleId, cycleState);
  }, []);

  const currentCycle = mvpCycles.find(c => c.id === selectedCycleId)!;
  const currentCycleState = cycleStates[selectedCycleId];
  const isCycleLocked = cycleGovernance?.status === 'closed' || cycleGovernance?.isLocked;
  const isCycleStarted = !!(currentCycleState?.startDate);

  // Calculate data for progress header — use real population from companyStorage
  const totalEmployees = useMemo(() => {
    if (!companyId) return 0;
    return getPopulation(companyId).filter(m => m.active).length;
  }, [companyId, refreshKey]);
  
  const totalPracticesData = useMemo(() => {
    const shelfPractices = getBestPracticesByCycle(selectedCycleId);
    const available = shelfPractices.length;
    const records = getRecords().filter(r => r.cycleId === selectedCycleId && r.tags?.includes("melhor-prática"));
    return { used: Math.min(records.length, available), available };
  }, [selectedCycleId, refreshKey]);

  const nextCycleId = NEXT_CYCLE[selectedCycleId as CycleId];

  // Handle starting a cycle
  const handleStartCycle = useCallback(() => {
    const cycle = mvpCycles.find(c => c.id === selectedCycleId);
    if (!cycle) return;

    const newState = initializeCycleState(cycle, true);
    setCycleStates(prev => ({ ...prev, [selectedCycleId]: newState }));
    saveCycleState(selectedCycleId, newState);
    
    // Create audit record
    const now = new Date().toISOString();
    addRecord({
      id: `rec-cycle-start-${Date.now()}`,
      companyId: "company-1",
      date: now.split("T")[0],
      cycleId: selectedCycleId,
      type: "observation",
      status: "closed",
      title: `Ciclo ${selectedCycleId} iniciado`,
      description: `O ciclo ${selectedCycleId} foi formalmente iniciado.`,
      owner: "",
      tags: ["ciclo-iniciado"],
      createdAt: now,
      updatedAt: now,
    });

    toast({ title: `Ciclo ${selectedCycleId} iniciado!`, description: "As ações e turmas estão disponíveis para execução." });
    setRefreshKey(k => k + 1);
  }, [selectedCycleId, saveCycleState, toast]);

  // Handle advancing to next cycle with justification
  const handleAdvanceWithJustification = useCallback((justification: string) => {
    if (!nextCycleId) return;
    
    // Record the justification
    const now = new Date().toISOString();
    addRecord({
      id: `rec-advance-${Date.now()}`,
      companyId: "company-1",
      date: now.split("T")[0],
      cycleId: selectedCycleId,
      type: "decision",
      status: "closed",
      title: `Avanço antecipado para ${nextCycleId}`,
      description: `Justificativa: ${justification}`,
      owner: "",
      tags: ["avanço-antecipado"],
      createdAt: now,
      updatedAt: now,
    });

    // Switch to next cycle
    setSelectedCycleId(nextCycleId);
    toast({ title: `Navegando para ${nextCycleId}`, description: "Justificativa registrada com sucesso." });
  }, [nextCycleId, selectedCycleId, setSelectedCycleId, toast]);

  // Auto-open factor and scroll to highlighted action from alert
  useEffect(() => {
    if (!highlightActionId || !currentCycleState) return;
    
    for (const factor of currentCycleState.factors) {
      const hasAction = factor.actions.some(a => a.id === highlightActionId);
      if (hasAction && !openFactors.includes(factor.id)) {
        setOpenFactors(prev => [...prev, factor.id]);
      }
    }

    const timer = setTimeout(() => {
      const el = document.getElementById(`action-${highlightActionId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 500);

    const clearTimer = setTimeout(() => setHighlightedId(null), 5000);
    return () => { clearTimeout(timer); clearTimeout(clearTimer); };
  }, [highlightActionId, currentCycleState]);

  // Get active actions (enabled ones)
  const activeActions = useMemo(() => {
    if (!currentCycleState) return [];
    
    const actions: Array<{
      id: string;
      factorId: string;
      factorName: string;
      title: string;
      bestPractice: string;
      action: CycleFactorAction;
      isDelayed: boolean;
    }> = [];

    currentCycleState.factors.forEach(factorState => {
      const factorDef = currentCycle.successFactors.find(f => f.id === factorState.id);
      if (!factorDef) return;

      factorState.actions.forEach(actionState => {
        if (!actionState.enabled) return;
        const actionDef = factorDef.actions.find(a => a.id === actionState.id);
        if (!actionDef) return;

        const isDelayed = isActionDelayed(actionState.dueDate, actionState.status);
        actions.push({
          id: actionState.id,
          factorId: factorState.id,
          factorName: factorDef.name,
          title: actionDef.title,
          bestPractice: actionDef.bestPractice,
          action: actionState,
          isDelayed,
        });
      });
    });

    return actions;
  }, [currentCycleState, currentCycle]);

  const cycleProgress = useMemo(() => {
    const total = activeActions.length;
    const completed = activeActions.filter(a => a.action.status === "completed").length;
    const delayed = activeActions.filter(a => a.isDelayed).length;
    return {
      total,
      completed,
      delayed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [activeActions]);

  const handleToggleAction = (factorId: string, actionId: string, enabled: boolean) => {
    if (isCycleLocked) {
      toast({ 
        title: "Ciclo bloqueado", 
        description: "Este ciclo está encerrado ou bloqueado para edição.",
        variant: "destructive" 
      });
      return;
    }

    setCycleStates(prev => {
      const updated = {
        ...prev,
        [selectedCycleId]: {
          ...prev[selectedCycleId],
          factors: prev[selectedCycleId].factors.map(f =>
            f.id === factorId
              ? {
                  ...f,
                  actions: f.actions.map(a =>
                    a.id === actionId ? { ...a, enabled } : a
                  ),
                }
              : f
          ),
        },
      };
      saveCycleState(selectedCycleId, updated[selectedCycleId]);

      // If disabling action with reason, create a decision record
      if (!enabled) {
        const actionState = prev[selectedCycleId].factors
          .find(f => f.id === factorId)?.actions
          .find(a => a.id === actionId);
        
        if (actionState?.disabledReason) {
          const factorDef = currentCycle.successFactors.find(f => f.id === factorId);
          const actionDef = factorDef?.actions.find(a => a.id === actionId);
          
          if (actionDef) {
            const now = new Date().toISOString();
            const newRecord: RecordState = {
              id: `rec-decision-${Date.now()}`,
              companyId: "company-1",
              date: now.split("T")[0],
              cycleId: selectedCycleId,
              factorId: factorId,
              type: "decision",
              status: "open",
              title: `Ação desativada: ${actionDef.title}`,
              description: `Motivo: ${actionState.disabledReason}`,
              owner: "",
              tags: ["ação-desativada"],
              createdAt: now,
              updatedAt: now,
            };
            addRecord(newRecord);
          }
        }
      }

      return updated;
    });
  };

  const handleUpdateAction = (factorId: string, actionId: string, updates: Partial<CycleFactorAction>) => {
    if (isCycleLocked && !updates.observation) {
      toast({ 
        title: "Ciclo bloqueado", 
        description: "Este ciclo está encerrado ou bloqueado para edição.",
        variant: "destructive" 
      });
      return;
    }

    setCycleStates(prev => {
      const updated = {
        ...prev,
        [selectedCycleId]: {
          ...prev[selectedCycleId],
          factors: prev[selectedCycleId].factors.map(f =>
            f.id === factorId
              ? {
                  ...f,
                  actions: f.actions.map(a =>
                    a.id === actionId ? { ...a, ...updates } : a
                  ),
                }
              : f
          ),
        },
      };
      saveCycleState(selectedCycleId, updated[selectedCycleId]);
      return updated;
    });
  };

  // Create action from best practice or decision
  const handleCreateActionFromTemplate = (actionData: NewActionData) => {
    if (isCycleLocked) {
      toast({ 
        title: "Ciclo bloqueado", 
        description: "Este ciclo está encerrado. Não é possível criar novas ações.",
        variant: "destructive" 
      });
      return;
    }

    const cycleId = actionData.cycleId;
    const factorId = actionData.factorId;
    
    // Create new action in the cycle state
    const newActionId = `custom-action-${Date.now()}`;
    const newAction: CycleFactorAction = {
      id: newActionId,
      title: actionData.title || actionData.description || "",
      enabled: true,
      disabledReason: "",
      responsible: actionData.responsible,
      dueDate: actionData.dueDate,
      status: "pending",
      observation: actionData.description || "",
      sourceDecisionId: actionData.sourceDecisionId,
      createdAt: new Date().toISOString(),
    };

    setCycleStates(prev => {
      const cycleState = prev[cycleId];
      if (!cycleState) return prev;

      const factorIndex = cycleState.factors.findIndex(f => f.id === factorId);
      if (factorIndex === -1) {
        // Factor doesn't exist, create it
        const updated = {
          ...prev,
          [cycleId]: {
            ...cycleState,
            factors: [
              ...cycleState.factors,
              {
                id: factorId,
                actions: [newAction],
              },
            ],
          },
        };
        saveCycleState(cycleId, updated[cycleId]);
        return updated;
      }

      const updated = {
        ...prev,
        [cycleId]: {
          ...cycleState,
          factors: cycleState.factors.map((f, i) =>
            i === factorIndex
              ? { ...f, actions: [...f.actions, newAction] }
              : f
          ),
        },
      };
      saveCycleState(cycleId, updated[cycleId]);
      return updated;
    });

    // If from best practice, create observation record
    if (actionData.sourceBestPracticeId) {
      const now = new Date().toISOString();
      const newRecord: RecordState = {
        id: `rec-practice-${Date.now()}`,
        companyId: "company-1",
        date: now.split("T")[0],
        cycleId: cycleId,
        type: "observation",
        status: "closed",
        title: `Prática aplicada: ${actionData.title}`,
        description: `Ação criada a partir da melhor prática ID: ${actionData.sourceBestPracticeId}`,
        owner: actionData.responsible,
        tags: ["melhor-prática"],
        createdAt: now,
        updatedAt: now,
      };
      addRecord(newRecord);
    }

    toast({ title: "Ação criada!", description: actionData.title });
    setRefreshKey(k => k + 1);
  };

  // Create action from decision and link
  const handleCreateActionFromDecision = (actionData: NewActionData, decisionId: string) => {
    handleCreateActionFromTemplate({ ...actionData, sourceDecisionId: decisionId });
    
    // Update decision record with linked action
    const state = getState();
    const decision = state.records.find(r => r.id === decisionId);
    if (decision) {
      updateRecord(decisionId, {
        createsActions: true,
        linkedActionIds: [...(decision.linkedActionIds || []), `custom-action-${Date.now()}`],
      });
    }
  };

  // Turma handlers
  const handleAddTurma = (turma: Omit<TurmaState, "id">) => {
    const newTurma: TurmaState = {
      ...turma,
      id: `turma-${Date.now()}`,
      startDate: turma.startDate ? turma.startDate : null,
      endDate: turma.endDate ? turma.endDate : null,
    };
    const updated = [...turmas, newTurma];
    setTurmasState(updated);
    setTurmas(updated);
  };

  const handleUpdateTurma = (turmaId: string, updates: Partial<TurmaState>) => {
    const updated = turmas.map(t => t.id === turmaId ? { ...t, ...updates } : t);
    setTurmasState(updated);
    setTurmas(updated);
  };

  const handleDeleteTurma = (turmaId: string) => {
    const updated = turmas.filter(t => t.id !== turmaId);
    setTurmasState(updated);
    setTurmas(updated);
  };

  const handleExportPDF = () => {
    generateCycleSummaryPDF(
      currentCycle.id,
      currentCycle.title,
      currentCycle.phaseName,
      currentCycle.context,
      currentCycle.expectations,
      activeActions.map(a => ({
        title: a.title,
        factorName: a.factorName,
        status: a.isDelayed ? "delayed" : a.action.status,
        observation: a.action.observation,
        responsible: a.action.responsible,
        dueDate: a.action.dueDate,
      }))
    );
    toast({ title: "PDF gerado!", description: "O resumo do ciclo foi baixado." });
  };

  const handleCloseCycle = () => {
    setRefreshKey(k => k + 1);
    setIsClosureDialogOpen(false);
    toast({ 
      title: "Ciclo encerrado!", 
      description: `${selectedCycleId} foi encerrado com sucesso.` 
    });
  };

  const handleExportClosurePDF = () => {
    const cycleTurmas = turmas.filter(t => t.cycleId === selectedCycleId);
    
    generateCycleClosurePDF(
      selectedCycleId,
      currentCycle.title,
      currentCycle.phaseName,
      cycleProgress.percentage,
      cycleTurmas.filter(t => t.status === 'completed').length,
      cycleTurmas.length,
      activeActions.map(a => ({
        title: a.title,
        factorName: a.factorName,
        status: a.isDelayed ? 'delayed' : a.action.status,
        observation: a.action.observation,
        responsible: a.action.responsible,
        dueDate: a.action.dueDate,
      })),
      cycleGovernance?.closureNotes || ""
    );
    toast({ title: "PDF de encerramento gerado!" });
  };

  if (!currentCycleState) {
    return <AppLayout title="Ciclos MVP" subtitle="Carregando..."><div /></AppLayout>;
  }

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
          
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-1 rounded mr-1">Monitorar</span>
            {cycleIds.slice(0, 3).map(id => {
              const gov = obterGovernancaDeCiclo(id);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all relative",
                    selectedCycleId === id ? phaseColors.M.active : phaseColors.M.inactive,
                    gov.isLocked && "opacity-50"
                  )}
                >
                  {gov.status === 'closed' && (
                    <Lock size={10} className="absolute -top-1 -right-1 text-success" />
                  )}
                  {id}
                </button>
              );
            })}
            <div className="w-px h-8 bg-border mx-2" />
            <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded mr-1">Validar</span>
            {cycleIds.slice(3, 6).map(id => {
              const gov = obterGovernancaDeCiclo(id);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all relative",
                    selectedCycleId === id ? phaseColors.V.active : phaseColors.V.inactive,
                    gov.isLocked && "opacity-50"
                  )}
                >
                  {gov.status === 'closed' && (
                    <Lock size={10} className="absolute -top-1 -right-1 text-success" />
                  )}
                  {id}
                </button>
              );
            })}
            <div className="w-px h-8 bg-border mx-2" />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded mr-1">Perpetuar</span>
            {cycleIds.slice(6, 9).map(id => {
              const gov = obterGovernancaDeCiclo(id);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all relative",
                    selectedCycleId === id ? phaseColors.P.active : phaseColors.P.inactive,
                    gov.isLocked && "opacity-50"
                  )}
                >
                  {gov.status === 'closed' && (
                    <Lock size={10} className="absolute -top-1 -right-1 text-success" />
                  )}
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cycle Progress Header - Start / Progress / Close */}
        <CycleProgressHeader
          cycleId={selectedCycleId}
          cycleTitle={currentCycle.title}
          phase={currentCycle.phase}
          cycleState={currentCycleState}
          governance={cycleGovernance}
          isStarted={isCycleStarted}
          turmas={turmas}
          totalEmployees={totalEmployees}
          activeActionsCount={cycleProgress.total}
          completedActionsCount={cycleProgress.completed}
          totalPracticesUsed={totalPracticesData.used}
          totalPracticesAvailable={totalPracticesData.available}
          onStartCycle={handleStartCycle}
          onCloseCycle={() => setIsClosureDialogOpen(true)}
          isCycleLocked={!!isCycleLocked}
          onNavigateTraining={() => navigate(`/turmas?cycle=${selectedCycleId}`)}
          onNavigatePractices={() => {
            const el = document.getElementById("practices-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onNavigateActions={() => {
            const el = document.getElementById("actions-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        {/* Cycle Header with export actions */}
        {isCycleStarted && (
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Módulo {currentCycle.moduleNumber ?? getModuleNumber(currentCycle.id)}: {currentCycle.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fase {currentCycle.phaseName} ({currentCycle.id}) • {currentCycle.estimatedDuration}
                  </p>
                </div>
                {cycleGovernance && (
                  <CycleStatusBadge 
                    status={cycleGovernance.status} 
                    isLocked={cycleGovernance.isLocked}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportPDF} className="gap-2">
                  <FileDown size={16} />
                  Exportar PDF
                </Button>
                
                {cycleGovernance?.status === 'closed' && (
                  <Button variant="outline" onClick={handleExportClosurePDF} className="gap-2">
                    <FileDown size={16} />
                    PDF de Encerramento
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content only visible after cycle is started */}
        {isCycleStarted && (
          <>
        {/* Locked cycle warning */}
        {isCycleLocked && (
          <Alert className={cycleGovernance?.status === 'closed' ? "border-success/50 bg-success/5" : ""}>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              {cycleGovernance?.status === 'closed' 
                ? `Este ciclo foi encerrado formalmente${cycleGovernance?.closedAt ? ` em ${format(new Date(cycleGovernance.closedAt), "dd/MM/yyyy", { locale: ptBR })}` : ""}. Apenas observações podem ser editadas.`
                : "Este ciclo está bloqueado. Encerre o ciclo anterior para liberar a edição."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Delayed alert */}
        {cycleProgress.delayed > 0 && !isCycleLocked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {cycleProgress.delayed} ação(ões) atrasada(s) neste ciclo. Verifique os prazos abaixo.
            </AlertDescription>
          </Alert>
        )}

        {/* Block 1: Identity */}
        <CycleIdentity
          cycleId={currentCycle.id}
          moduleTitle={currentCycle.title}
          moduleNumber={currentCycle.moduleNumber ?? getModuleNumber(currentCycle.id)}
          phaseName={currentCycle.phaseName}
          phase={currentCycle.phase}
          estimatedDuration={currentCycle.estimatedDuration}
          impactedGroups={currentCycle.impactedGroups}
        />

        {/* Block 2: Context */}
        <CycleIntroduction description={currentCycle.context} />

        {/* Block 3: Expectations */}
        <CycleExpectations
          whatHappens={currentCycle.expectations.whatHappens}
          expectedResults={currentCycle.expectations.expectedResults}
          successCriteria={currentCycle.expectations.successCriteria}
        />

        {/* Best Practices Shelf */}
        <div id="practices-section">
          <BestPracticesShelf 
            cycleId={selectedCycleId}
            onCreateAction={handleCreateActionFromTemplate}
          />
        </div>

        {/* Pending Decisions */}
        <PendingDecisions
          cycleId={selectedCycleId}
          onCreateAction={handleCreateActionFromDecision}
        />

        {/* Block 4: Success Factors */}
        <Card className="p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            Fatores de Sucesso do Ciclo
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure as ações que serão executadas. Ações ON exigem prazo e responsável.
            {isCycleLocked && " (Somente leitura)"}
          </p>

          <div className="space-y-3">
            {currentCycle.successFactors.map(factor => {
              const factorState = currentCycleState.factors.find(f => f.id === factor.id);
              if (!factorState) return null;
              
              const isOpen = openFactors.includes(factor.id);
              const activeCount = factorState.actions.filter(a => a.enabled).length;

              return (
                <Collapsible
                  key={factor.id}
                  open={isOpen}
                  onOpenChange={() => setOpenFactors(prev =>
                    prev.includes(factor.id) ? prev.filter(id => id !== factor.id) : [...prev, factor.id]
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      "w-full flex items-center justify-between p-4 rounded-lg border transition-all hover:bg-secondary/50",
                      isOpen && "bg-secondary/30 border-primary/30"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", iconColors[factor.color])}>
                          {factor.icon}
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-foreground">{factor.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={activeCount === factor.actions.length ? "default" : "secondary"} className="text-xs">
                              {activeCount}/{factor.actions.length} ações ativas
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isOpen ? <ChevronDown size={20} className="text-muted-foreground" /> : <ChevronRight size={20} className="text-muted-foreground" />}
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-2 ml-4 space-y-3 border-l-2 border-border pl-4">
                      {factor.actions.map(actionDef => {
                        const actionState = factorState.actions.find(a => a.id === actionDef.id);
                        if (!actionState) return null;

                        return (
                          <div key={actionDef.id} id={`action-${actionDef.id}`} className={cn(
                            "p-4 rounded-lg border transition-all duration-500",
                            actionState.enabled ? "bg-success/5 border-success/20" : "bg-muted/30 border-muted",
                            highlightedId === actionDef.id && "ring-2 ring-primary shadow-lg"
                          )}>
                            {fromAlert && highlightedId === actionDef.id && (
                              <Badge variant="secondary" className="text-[10px] mb-2">
                                Item aberto a partir de alerta do sistema
                              </Badge>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                              <Switch
                                checked={actionState.enabled}
                                onCheckedChange={(checked) => handleToggleAction(factor.id, actionDef.id, checked)}
                                disabled={isCycleLocked}
                              />
                              <span className={cn("font-medium", actionState.enabled ? "text-foreground" : "text-muted-foreground")}>
                                {actionDef.title}
                              </span>
                            </div>

                            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 p-2 rounded mb-3">
                              <Lightbulb size={14} className="text-warning mt-0.5" />
                              <span>{actionDef.bestPractice}</span>
                            </div>

                            {actionState.enabled ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Responsável</label>
                                  <div className="relative">
                                    <User size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                      placeholder="Nome do responsável"
                                      value={actionState.responsible}
                                      onChange={e => handleUpdateAction(factor.id, actionDef.id, { responsible: e.target.value })}
                                      className="pl-8 h-9"
                                      disabled={isCycleLocked}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Prevista</label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        className={cn("w-full justify-start text-left h-9", !actionState.dueDate && "text-muted-foreground")}
                                        disabled={isCycleLocked}
                                      >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {actionState.dueDate ? format(new Date(actionState.dueDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={actionState.dueDate ? new Date(actionState.dueDate) : undefined}
                                        onSelect={date => handleUpdateAction(factor.id, actionDef.id, { dueDate: date?.toISOString() || null })}
                                        className="pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Observações</label>
                                  <Textarea
                                    placeholder="Observações sobre esta ação..."
                                    value={actionState.observation}
                                    onChange={e => handleUpdateAction(factor.id, actionDef.id, { observation: e.target.value })}
                                    className="min-h-[50px] text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-1 text-xs text-warning mb-1">
                                  <AlertCircle size={12} />
                                  <span>Motivo para não executar (obrigatório)</span>
                                </div>
                                <Textarea
                                  placeholder="Explique por que esta ação não será executada..."
                                  value={actionState.disabledReason}
                                  onChange={e => handleUpdateAction(factor.id, actionDef.id, { disabledReason: e.target.value })}
                                  className="min-h-[60px] text-sm"
                                  disabled={isCycleLocked}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </Card>

        {/* Block 5: Active Actions */}
        <Card id="actions-section" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <ListChecks size={20} className="text-primary" />
              Ações do Ciclo ({activeActions.length})
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{cycleProgress.completed}/{cycleProgress.total} concluídas</span>
              <Progress value={cycleProgress.percentage} className="w-24 h-2" />
              <span className="text-sm font-semibold text-primary">{cycleProgress.percentage}%</span>
            </div>
          </div>

          {activeActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks size={48} className="mx-auto mb-3 opacity-30" />
              <p>Nenhuma ação ativa. Ative ações nos Fatores de Sucesso acima.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeActions.map(({ id, factorId, factorName, title, action, isDelayed }) => {
                const displayStatus = isDelayed ? "delayed" : action.status;
                const config = statusConfig[displayStatus];
                const StatusIcon = config.icon;

                return (
                  <div key={id} id={`action-${id}`} className={cn(
                    "p-4 rounded-lg border-l-4 bg-card border transition-all duration-500",
                    displayStatus === "completed" && "border-l-success",
                    displayStatus === "in_progress" && "border-l-warning",
                    displayStatus === "pending" && "border-l-muted",
                    displayStatus === "delayed" && "border-l-destructive",
                    highlightedId === id && "ring-2 ring-primary shadow-lg bg-primary/5"
                  )}>
                    {fromAlert && highlightedId === id && (
                      <Badge variant="secondary" className="text-[10px] mb-2">
                        Item aberto a partir de alerta do sistema
                      </Badge>
                    )}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <span className="font-medium text-foreground">{title}</span>
                        <p className="text-xs text-muted-foreground">{factorName} • {action.responsible || "Sem responsável"}</p>
                      </div>
                      <Select
                        value={action.status}
                        onValueChange={(value) => handleUpdateAction(factorId, id, { status: value as any })}
                        disabled={isCycleLocked}
                      >
                        <SelectTrigger className={cn("w-[150px] h-9", config.color)}>
                          <div className="flex items-center gap-2">
                            <StatusIcon size={14} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in_progress">Em andamento</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {action.dueDate && (
                      <p className={cn("text-xs", isDelayed ? "text-destructive font-medium" : "text-muted-foreground")}>
                        Prazo: {format(new Date(action.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        {isDelayed && " (ATRASADO)"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Block 6: Turmas */}
        <CycleTurmas
          cycleId={selectedCycleId}
          cycleName={currentCycle.title}
          turmas={turmas.filter(t => t.cycleId === selectedCycleId) as any}
          onAddTurma={handleAddTurma as any}
          onUpdateTurma={handleUpdateTurma as any}
          onDeleteTurma={handleDeleteTurma}
          isLocked={isCycleLocked}
        />

        {/* Next cycle advance button */}
        {nextCycleId && cycleGovernance?.status !== 'closed' && (
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Próximo passo</p>
                <p className="text-xs text-muted-foreground">
                  {cycleProgress.percentage >= 85 
                    ? `Você pode avançar para o ciclo ${nextCycleId}.`
                    : `Atinja 85% de progresso para avançar ao ${nextCycleId} sem restrições.`
                  }
                </p>
              </div>
              <Button
                variant={cycleProgress.percentage >= 85 ? "default" : "outline"}
                className="gap-2"
                onClick={() => {
                  if (cycleProgress.percentage >= 85) {
                    setSelectedCycleId(nextCycleId);
                  } else {
                    setIsAdvanceDialogOpen(true);
                  }
                }}
              >
                Ir para {nextCycleId}
              </Button>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Cycle Closure Dialog */}
      <CycleClosureDialog
        isOpen={isClosureDialogOpen}
        onClose={() => setIsClosureDialogOpen(false)}
        cycleId={selectedCycleId}
        cycleTitle={currentCycle.title}
        onCycleClosed={handleCloseCycle}
        onExportPDF={handleExportClosurePDF}
      />

      {/* Advance Cycle Dialog */}
      {nextCycleId && (
        <AdvanceCycleDialog
          isOpen={isAdvanceDialogOpen}
          onClose={() => setIsAdvanceDialogOpen(false)}
          currentCycleId={selectedCycleId}
          nextCycleId={nextCycleId}
          currentProgress={cycleProgress.percentage}
          onConfirm={handleAdvanceWithJustification}
        />
      )}
    </AppLayout>
  );
}
