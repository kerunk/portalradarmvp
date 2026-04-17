import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CycleIdentity } from "@/components/cycles/CycleIdentity";
import { CycleIntroduction } from "@/components/cycles/CycleIntroduction";
import { CycleExpectations } from "@/components/cycles/CycleExpectations";
import { CycleTurmas } from "@/components/cycles/CycleTurmas";
import { CycleClosureDialog } from "@/components/cycles/CycleClosureDialog";
import { CycleStatusBadge } from "@/components/cycles/CycleStatusBadge";
import { CycleProgressHeader } from "@/components/cycles/CycleProgressHeader";
import { AdvanceCycleDialog } from "@/components/cycles/AdvanceCycleDialog";
import { PendingDecisions } from "@/components/cycles/PendingDecisions";
import { CreateActionFromTemplateDialog, type NewActionData } from "@/components/cycles/CreateActionFromTemplateDialog";
import { useAuth } from "@/contexts/AuthContext";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { mvpCycles, type MVPCycle, getModuleNumber, SUCCESS_FACTOR_DESCRIPTIONS } from "@/data/mvpCycles";
import { getEffectiveSuccessFactors } from "@/lib/globalSuccessFactors";
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
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { generateCycleSummaryPDF, generateCycleClosurePDF } from "@/lib/pdfGenerator";
import { NEXT_CYCLE, type CycleId } from "@/lib/constants";

// ── Hook Supabase ──────────────────────────────────────────────────────────────
import { useCycleData, type FactorAction, type LocalCycleState } from "@/hooks/useCycleData";
import { fetchPopulation } from "@/lib/db";

// ── Governance (só lê dados já carregados — sem tocar no localStorage) ─────────
// obterGovernancaDeCiclo ainda usa getState internamente.
// Para não remover a governança completamente enquanto migramos,
// derivamos o status direto do LocalCycleState que vem do Supabase.
function deriveGovernance(cs: LocalCycleState | undefined) {
  if (!cs) return { status: "not_started" as const, isLocked: false, closureNotes: "" };
  return {
    status: cs.closureStatus as "not_started" | "in_progress" | "ready_to_close" | "closed",
    isLocked: cs.lockedForEditing,
    closureNotes: cs.closureNotes,
    startDate: cs.startDate,
    closedAt: cs.closedAt,
  };
}

// ── Constantes visuais ─────────────────────────────────────────────────────────
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

function isDelayed(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MVPCycles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const highlightActionId = searchParams.get("highlight");
  const fromAlert = searchParams.get("fromAlert") === "true";

  const [selectedCycleId, setSelectedCycleIdRaw] = useState(() => searchParams.get("cycle") || "M1");
  const setSelectedCycleId = useCallback(
    (id: string) => {
      setSelectedCycleIdRaw(id);
      setSearchParams({ cycle: id }, { replace: true });
      setHighlightedId(null);
    },
    [setSearchParams],
  );

  const [openFactors, setOpenFactors] = useState<string[]>([]);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(highlightActionId);

  // ── Dados do Supabase ────────────────────────────────────────────────────────
  const {
    loading,
    cycleStates,
    turmas,
    records,
    reload,
    startCycle,
    closeCycle,
    updateAction,
    createCustomAction,
    deleteCustomAction,
    saveTurma,
    removeTurma,
    addRecord,
  } = useCycleData();

  // População e núcleo (assíncrono, leve)
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [nucleoList, setNucleoList] = useState<{ id: string; name: string; role: string; sector: string }[]>([]);
  useEffect(() => {
    if (!companyId) return;
    fetchPopulation(companyId).then((pop) => {
      setTotalEmployees(pop.filter((m) => m.active).length);
      setNucleoList(pop.filter((m) => m.nucleo && m.active));
    });
  }, [companyId]);

  // ── Ciclo atual ──────────────────────────────────────────────────────────────
  const currentCycle = useMemo(() => {
    const base = mvpCycles.find((c) => c.id === selectedCycleId)!;
    return { ...base, successFactors: getEffectiveSuccessFactors(selectedCycleId) };
  }, [selectedCycleId]);

  const currentCycleState = cycleStates[selectedCycleId];
  const governance = deriveGovernance(currentCycleState);
  const isCycleLocked = governance.status === "closed" || governance.isLocked;
  const isCycleStarted = !!currentCycleState?.startDate;
  const nextCycleId = NEXT_CYCLE[selectedCycleId as CycleId];

  // ── Progresso ────────────────────────────────────────────────────────────────
  const cycleProgress = useMemo(() => {
    if (!currentCycleState) return { total: 0, completed: 0, treated: 0, delayed: 0, percentage: 0 };
    const effectiveFactors = currentCycle.successFactors;
    let total = 0,
      completed = 0,
      treated = 0,
      delayed = 0;

    currentCycleState.factors.forEach((fs) => {
      const gf = effectiveFactors.find((f) => f.id === fs.id);
      const globalIds = gf ? new Set(gf.actions.map((a) => a.id)) : new Set<string>();
      fs.actions.forEach((a) => {
        if (!globalIds.has(a.id) && !a.isCustom) return;
        total++;
        if (a.enabled) {
          if (a.status === "completed") completed++;
          if (isDelayed(a.dueDate, a.status)) delayed++;
        } else {
          if (a.disabledReason?.trim()) treated++;
        }
      });
    });

    const done = completed + treated;
    return { total, completed, treated, delayed, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [currentCycleState, currentCycle]);

  // ── Ações ativas (para PDF e PendingDecisions) ───────────────────────────────
  const activeActions = useMemo(() => {
    if (!currentCycleState) return [];
    const result: Array<{
      id: string;
      factorId: string;
      factorName: string;
      title: string;
      bestPractice: string;
      action: FactorAction;
      isDelayed: boolean;
    }> = [];
    currentCycleState.factors.forEach((fs) => {
      const fd = currentCycle.successFactors.find((f) => f.id === fs.id);
      if (!fd) return;
      fs.actions.forEach((a) => {
        if (!a.enabled) return;
        const ad = fd.actions.find((x) => x.id === a.id);
        if (!ad && !a.isCustom) return;
        result.push({
          id: a.id,
          factorId: fs.id,
          factorName: fd.name,
          title: ad?.title ?? a.title,
          bestPractice: ad?.bestPractice ?? "",
          action: a,
          isDelayed: isDelayed(a.dueDate, a.status),
        });
      });
    });
    return result;
  }, [currentCycleState, currentCycle]);

  // ── Scroll para action destacada ─────────────────────────────────────────────
  useEffect(() => {
    if (!highlightActionId || !currentCycleState) return;
    currentCycleState.factors.forEach((f) => {
      if (f.actions.some((a) => a.id === highlightActionId) && !openFactors.includes(f.id)) {
        setOpenFactors((prev) => [...prev, f.id]);
      }
    });
    const t1 = setTimeout(() => {
      document.getElementById(`action-${highlightActionId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
    const t2 = setTimeout(() => setHighlightedId(null), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [highlightActionId, currentCycleState]);

  // ── Handlers de ação ─────────────────────────────────────────────────────────
  const handleUpdateAction = useCallback(
    async (factorId: string, actionId: string, updates: Partial<FactorAction>) => {
      if (isCycleLocked && !("observation" in updates)) {
        toast({ title: "Ciclo bloqueado", variant: "destructive" });
        return;
      }
      await updateAction(selectedCycleId, factorId, actionId, updates);
    },
    [isCycleLocked, selectedCycleId, updateAction, toast],
  );

  const handleToggleAction = useCallback(
    async (factorId: string, actionId: string, enabled: boolean) => {
      if (isCycleLocked) {
        toast({ title: "Ciclo bloqueado", variant: "destructive" });
        return;
      }
      await updateAction(selectedCycleId, factorId, actionId, { enabled });
    },
    [isCycleLocked, selectedCycleId, updateAction, toast],
  );

  const handleCreateActionFromTemplate = useCallback(
    async (data: NewActionData, factorId?: string) => {
      const fid = factorId || data.factorId || currentCycle.successFactors[0]?.id;
      if (!fid) return;
      await createCustomAction(selectedCycleId, fid, {
        title: data.title,
        responsible: data.responsible,
        dueDate: data.dueDate,
        observation: data.description,
        sourceDecisionId: data.sourceDecisionId,
      });
      toast({ title: "Ação criada!" });
    },
    [selectedCycleId, currentCycle, createCustomAction, toast],
  );

  // ── Handlers de ciclo ────────────────────────────────────────────────────────
  const handleStartCycle = useCallback(async () => {
    await startCycle(selectedCycleId);
    await addRecord({
      date: new Date().toISOString().split("T")[0],
      cycleId: selectedCycleId,
      factorId: null,
      type: "observation",
      status: "closed",
      title: `Ciclo ${selectedCycleId} iniciado`,
      description: `O ciclo ${selectedCycleId} foi formalmente iniciado.`,
      owner: "",
      tags: ["ciclo-iniciado"],
      createsActions: false,
      linkedActionIds: [],
    });
    toast({ title: `Ciclo ${selectedCycleId} iniciado!` });
  }, [selectedCycleId, startCycle, addRecord, toast]);

  const handleCloseCycle = useCallback(async () => {
    setIsClosureDialogOpen(false);
    toast({ title: "Ciclo encerrado!", description: `${selectedCycleId} foi encerrado com sucesso.` });
    reload();
  }, [selectedCycleId, reload, toast]);

  const handleAdvanceWithJustification = useCallback(
    async (justification: string) => {
      if (!nextCycleId) return;
      await addRecord({
        date: new Date().toISOString().split("T")[0],
        cycleId: selectedCycleId,
        factorId: null,
        type: "decision",
        status: "closed",
        title: `Avanço antecipado para ${nextCycleId}`,
        description: `Justificativa: ${justification}`,
        owner: "",
        tags: ["avanço-antecipado"],
        createsActions: false,
        linkedActionIds: [],
      });
      setSelectedCycleId(nextCycleId);
      toast({ title: `Navegando para ${nextCycleId}` });
    },
    [nextCycleId, selectedCycleId, addRecord, setSelectedCycleId, toast],
  );

  // ── Turmas ───────────────────────────────────────────────────────────────────
  const handleAddTurma = useCallback(
    async (t: any) => {
      await saveTurma({ ...t, companyId });
    },
    [saveTurma, companyId],
  );
  const handleUpdateTurma = useCallback(
    async (id: string, u: any) => {
      const existing = turmas.find((t) => t.id === id);
      if (existing) await saveTurma({ ...existing, ...u });
    },
    [saveTurma, turmas],
  );
  const handleDeleteTurma = useCallback(
    async (id: string) => {
      await removeTurma(id);
    },
    [removeTurma],
  );

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    generateCycleSummaryPDF(
      currentCycle.id,
      currentCycle.title,
      currentCycle.phaseName,
      currentCycle.context,
      currentCycle.expectations,
      activeActions.map((a) => ({
        title: a.title,
        factorName: a.factorName,
        status: a.isDelayed ? "delayed" : a.action.status,
        observation: a.action.observation,
        responsible: a.action.responsible,
        dueDate: a.action.dueDate,
      })),
    );
    toast({ title: "PDF gerado!" });
  };

  const handleExportClosurePDF = () => {
    const cycleTurmas = turmas.filter((t) => t.cycleId === selectedCycleId);
    generateCycleClosurePDF(
      selectedCycleId,
      currentCycle.title,
      currentCycle.phaseName,
      cycleProgress.percentage,
      cycleTurmas.filter((t) => t.status === "completed").length,
      cycleTurmas.length,
      activeActions.map((a) => ({
        title: a.title,
        factorName: a.factorName,
        status: a.isDelayed ? "delayed" : a.action.status,
        observation: a.action.observation,
        responsible: a.action.responsible,
        dueDate: a.action.dueDate,
      })),
      governance.closureNotes || "",
    );
    toast({ title: "PDF de encerramento gerado!" });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout title="Ciclos MVP" subtitle="Carregando dados do Supabase...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  if (!currentCycleState) {
    return (
      <AppLayout title="Ciclos MVP" subtitle="Carregando...">
        <div />
      </AppLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AppLayout
      title="Ciclos MVP"
      subtitle="Centro de execução da metodologia. Cada ciclo representa uma etapa completa do programa (~30 dias)."
    >
      <div className="space-y-6 animate-fade-in">
        {/* Navegação de ciclos */}
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Navegue entre os ciclos: <strong>M</strong>onitorar → <strong>V</strong>alidar → <strong>P</strong>
              erpetuar
            </span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-1 rounded mr-1">Monitorar</span>
            {cycleIds.slice(0, 3).map((id) => {
              const cs = cycleStates[id];
              const gov = deriveGovernance(cs);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all relative",
                    selectedCycleId === id ? phaseColors.M.active : phaseColors.M.inactive,
                    gov.isLocked && "opacity-50",
                  )}
                >
                  {gov.status === "closed" && <Lock size={10} className="absolute -top-1 -right-1 text-success" />}
                  {id}
                </button>
              );
            })}
            <div className="w-px h-8 bg-border mx-2" />
            <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-1 rounded mr-1">Validar</span>
            {cycleIds.slice(3, 6).map((id) => {
              const cs = cycleStates[id];
              const gov = deriveGovernance(cs);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all relative",
                    selectedCycleId === id ? phaseColors.V.active : phaseColors.V.inactive,
                    gov.isLocked && "opacity-50",
                  )}
                >
                  {gov.status === "closed" && <Lock size={10} className="absolute -top-1 -right-1 text-success" />}
                  {id}
                </button>
              );
            })}
            <div className="w-px h-8 bg-border mx-2" />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded mr-1">
              Perpetuar
            </span>
            {cycleIds.slice(6, 9).map((id) => {
              const cs = cycleStates[id];
              const gov = deriveGovernance(cs);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all relative",
                    selectedCycleId === id ? phaseColors.P.active : phaseColors.P.inactive,
                    gov.isLocked && "opacity-50",
                  )}
                >
                  {gov.status === "closed" && <Lock size={10} className="absolute -top-1 -right-1 text-success" />}
                  {id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress header */}
        <CycleProgressHeader
          cycleId={selectedCycleId}
          cycleTitle={currentCycle.title}
          phase={currentCycle.phase}
          cycleState={currentCycleState as any}
          governance={governance as any}
          isStarted={isCycleStarted}
          turmas={turmas.filter((t) => t.cycleId === selectedCycleId) as any}
          totalEmployees={totalEmployees}
          totalFactorActions={cycleProgress.total}
          completedFactorActions={cycleProgress.completed}
          treatedFactorActions={cycleProgress.treated}
          onStartCycle={handleStartCycle}
          onCloseCycle={() => setIsClosureDialogOpen(true)}
          isCycleLocked={!!isCycleLocked}
          onNavigateTraining={() => navigate(`/turmas?cycle=${selectedCycleId}`)}
          onNavigateFactors={() =>
            document.getElementById("factors-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        />

        {isCycleStarted && (
          <>
            {/* Cabeçalho do ciclo */}
            <div className="bg-card rounded-lg p-4 border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground">
                      Módulo {currentCycle.moduleNumber ?? getModuleNumber(selectedCycleId)} — {currentCycle.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <CycleStatusBadge status={governance.status as any} isLocked={governance.isLocked} />
                      {governance.startDate && (
                        <span className="text-xs text-muted-foreground">
                          Iniciado em {format(new Date(governance.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <FileDown size={14} className="mr-1" /> Resumo PDF
                  </Button>
                  {!isCycleLocked && cycleProgress.percentage >= 80 && (
                    <Button size="sm" onClick={() => setIsClosureDialogOpen(true)}>
                      <LockOpen size={14} className="mr-1" /> Encerrar Ciclo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Blocos de conteúdo */}
            <CycleIdentity cycle={currentCycle} />
            <CycleIntroduction cycle={currentCycle} />
            <CycleExpectations cycle={currentCycle} />

            {/* Fatores de Sucesso */}
            <Card id="factors-section" className="p-0 overflow-hidden">
              <div className="p-4 border-b bg-card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks size={18} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Fatores de Sucesso</h3>
                  <Badge variant="secondary" className="text-xs">
                    {cycleProgress.completed + cycleProgress.treated}/{cycleProgress.total} tratadas
                  </Badge>
                </div>
                <Progress value={cycleProgress.percentage} className="w-32 h-2" />
              </div>

              <div className="divide-y divide-border">
                {currentCycle.successFactors.map((factor) => {
                  const factorState = currentCycleState.factors.find((f) => f.id === factor.id);
                  if (!factorState) return null;
                  const isOpen = openFactors.includes(factor.id);
                  const factorCompleted = factorState.actions.filter(
                    (a) => a.enabled && a.status === "completed",
                  ).length;
                  const factorTotal = factorState.actions.filter((a) => a.enabled || a.disabledReason?.trim()).length;

                  return (
                    <Collapsible
                      key={factor.id}
                      open={isOpen}
                      onOpenChange={() =>
                        setOpenFactors((prev) =>
                          prev.includes(factor.id) ? prev.filter((x) => x !== factor.id) : [...prev, factor.id],
                        )
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <div
                          className={cn(
                            "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors",
                            iconColors[factor.color] && "",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{factor.icon}</span>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{factor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {SUCCESS_FACTOR_DESCRIPTIONS[factor.id] || factor.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {factorCompleted}/{factorTotal} concluídas
                            </span>
                            {isOpen ? (
                              <ChevronDown size={16} className="text-muted-foreground" />
                            ) : (
                              <ChevronRight size={16} className="text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3 bg-muted/20">
                          {factor.actions.map((actionDef) => {
                            const actionState = factorState.actions.find((a) => a.id === actionDef.id);
                            if (!actionState) return null;
                            const displayStatus =
                              isDelayed(actionState.dueDate, actionState.status) && actionState.status !== "completed"
                                ? "delayed"
                                : actionState.status;

                            return (
                              <Card
                                key={actionDef.id}
                                id={`action-${actionDef.id}`}
                                className={cn(
                                  "overflow-hidden transition-all duration-500",
                                  actionState.enabled
                                    ? displayStatus === "completed"
                                      ? "border-success/30 bg-success/5"
                                      : displayStatus === "delayed"
                                        ? "border-destructive/30 bg-destructive/5"
                                        : "border-border"
                                    : "border-muted bg-muted/30",
                                  highlightedId === actionDef.id && "ring-2 ring-primary shadow-lg",
                                )}
                              >
                                {fromAlert && highlightedId === actionDef.id && (
                                  <div className="px-4 pt-3">
                                    <Badge variant="secondary" className="text-[10px]">
                                      Item aberto a partir de alerta
                                    </Badge>
                                  </div>
                                )}
                                <div className="p-4 pb-3">
                                  <div className="flex gap-4">
                                    {actionDef.imageUrl && (
                                      <div className="w-24 h-24 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-muted">
                                        <img
                                          src={actionDef.imageUrl}
                                          alt={actionDef.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                        <Switch
                                          checked={actionState.enabled}
                                          onCheckedChange={(v) => handleToggleAction(factor.id, actionDef.id, v)}
                                          disabled={!!isCycleLocked}
                                        />
                                        <span
                                          className={cn(
                                            "font-semibold flex-1 text-sm",
                                            actionState.enabled
                                              ? "text-foreground"
                                              : "text-muted-foreground line-through",
                                          )}
                                        >
                                          {actionDef.title}
                                        </span>
                                        {actionState.enabled && (
                                          <Select
                                            value={actionState.status}
                                            onValueChange={(v) =>
                                              handleUpdateAction(factor.id, actionDef.id, { status: v as any })
                                            }
                                            disabled={!!isCycleLocked}
                                          >
                                            <SelectTrigger
                                              className={cn(
                                                "w-[150px] h-8 text-xs",
                                                statusConfig[displayStatus as keyof typeof statusConfig]?.color,
                                              )}
                                            >
                                              <div className="flex items-center gap-2">
                                                {(() => {
                                                  const Icon =
                                                    statusConfig[displayStatus as keyof typeof statusConfig]?.icon ??
                                                    Clock;
                                                  return <Icon size={12} />;
                                                })()}
                                                <SelectValue />
                                              </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pendente</SelectItem>
                                              <SelectItem value="in_progress">Em andamento</SelectItem>
                                              <SelectItem value="completed">Concluído</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                      {actionDef.description && (
                                        <div className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-md border border-border/50 mb-2">
                                          <p className="font-medium text-foreground/80 text-xs uppercase tracking-wide mb-1">
                                            O que fazer
                                          </p>
                                          <p className="leading-relaxed">{actionDef.description}</p>
                                        </div>
                                      )}
                                      {actionDef.bestPractice && (
                                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded p-2 mb-2">
                                          <Lightbulb size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                          <span>{actionDef.bestPractice}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Campos operacionais */}
                                  {actionState.enabled ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                          Responsável
                                        </label>
                                        <div className="relative">
                                          <User
                                            size={14}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
                                          />
                                          <Select
                                            value={actionState.responsible || ""}
                                            onValueChange={(v) =>
                                              handleUpdateAction(factor.id, actionDef.id, { responsible: v })
                                            }
                                            disabled={!!isCycleLocked}
                                          >
                                            <SelectTrigger className="pl-8 h-9">
                                              <SelectValue placeholder="Selecione o responsável" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {nucleoList.map((m) => (
                                                <SelectItem key={m.id} value={m.name}>
                                                  {m.name} — {m.role || m.sector || "Núcleo"}
                                                </SelectItem>
                                              ))}
                                              {nucleoList.length === 0 && (
                                                <SelectItem value="__empty" disabled>
                                                  Nenhum integrante do núcleo
                                                </SelectItem>
                                              )}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                          Data Prevista
                                        </label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                "w-full justify-start text-left h-9",
                                                !actionState.dueDate && "text-muted-foreground",
                                              )}
                                              disabled={!!isCycleLocked}
                                            >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {actionState.dueDate
                                                ? format(new Date(actionState.dueDate), "dd/MM/yyyy", { locale: ptBR })
                                                : "Selecionar"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                              mode="single"
                                              selected={actionState.dueDate ? new Date(actionState.dueDate) : undefined}
                                              onSelect={(d) =>
                                                handleUpdateAction(factor.id, actionDef.id, {
                                                  dueDate: d?.toISOString() || null,
                                                })
                                              }
                                              className="pointer-events-auto"
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                      <div className="md:col-span-2">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                          Observações
                                        </label>
                                        <Textarea
                                          placeholder="Observações sobre esta ação..."
                                          value={actionState.observation}
                                          onChange={(e) =>
                                            handleUpdateAction(factor.id, actionDef.id, { observation: e.target.value })
                                          }
                                          className="min-h-[50px] text-sm"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-3">
                                      <div className="flex items-center gap-1 text-xs text-warning mb-1">
                                        <AlertCircle size={12} />
                                        <span>Motivo para não executar (obrigatório)</span>
                                      </div>
                                      <Textarea
                                        placeholder="Explique por que esta ação não será executada..."
                                        value={actionState.disabledReason}
                                        onChange={(e) =>
                                          handleUpdateAction(factor.id, actionDef.id, {
                                            disabledReason: e.target.value,
                                          })
                                        }
                                        className="min-h-[60px] text-sm"
                                        disabled={!!isCycleLocked}
                                      />
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}

                          {/* Ações customizadas do fator */}
                          {factorState.actions
                            .filter((a) => a.isCustom)
                            .map((a) => (
                              <Card key={a.id} className="p-4 border-dashed">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    Ação personalizada
                                  </Badge>
                                  <span className="font-medium text-sm flex-1">{a.title}</span>
                                  {!isCycleLocked && a.dbId && (
                                    <Button variant="ghost" size="sm" onClick={() => deleteCustomAction(a.dbId!)}>
                                      <AlertTriangle size={12} className="text-destructive" />
                                    </Button>
                                  )}
                                </div>
                                <Select
                                  value={a.status}
                                  onValueChange={(v) => handleUpdateAction(factor.id, a.id, { status: v as any })}
                                  disabled={!!isCycleLocked}
                                >
                                  <SelectTrigger className="w-[150px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="in_progress">Em andamento</SelectItem>
                                    <SelectItem value="completed">Concluído</SelectItem>
                                  </SelectContent>
                                </Select>
                              </Card>
                            ))}

                          {/* Botão adicionar ação customizada */}
                          {!isCycleLocked && (
                            <CreateActionFromTemplateDialog
                              open={false}
                              onOpenChange={() => {}}
                              onSave={(data) => handleCreateActionFromTemplate(data, factor.id)}
                              title={`Adicionar ação em ${factor.name}`}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full border border-dashed text-muted-foreground hover:text-foreground"
                                >
                                  + Adicionar ação em {factor.name}
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </Card>

            {/* Turmas */}
            <CycleTurmas
              cycleId={selectedCycleId}
              cycleName={currentCycle.title}
              turmas={turmas.filter((t) => t.cycleId === selectedCycleId) as any}
              onAddTurma={handleAddTurma as any}
              onUpdateTurma={handleUpdateTurma as any}
              onDeleteTurma={handleDeleteTurma}
              isLocked={isCycleLocked}
            />

            {/* Próximo ciclo */}
            {nextCycleId && governance.status !== "closed" && (
              <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Próximo passo</p>
                    <p className="text-xs text-muted-foreground">
                      {cycleProgress.percentage >= 85
                        ? `Você pode avançar para o ciclo ${nextCycleId}.`
                        : `Atinja 85% de progresso para avançar ao ${nextCycleId} sem restrições.`}
                    </p>
                  </div>
                  <Button
                    variant={cycleProgress.percentage >= 85 ? "default" : "outline"}
                    onClick={() =>
                      cycleProgress.percentage >= 85 ? setSelectedCycleId(nextCycleId) : setIsAdvanceDialogOpen(true)
                    }
                  >
                    Ir para {nextCycleId}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <CycleClosureDialog
        isOpen={isClosureDialogOpen}
        onClose={() => setIsClosureDialogOpen(false)}
        cycleId={selectedCycleId}
        cycleTitle={currentCycle.title}
        onCycleClosed={handleCloseCycle}
        onExportPDF={handleExportClosurePDF}
      />

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
