/**
 * useCycleData.ts
 * Hook central para MVPCycles.tsx.
 * Carrega estados de ciclo e ações do Supabase e expõe funções de escrita.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCycleStates, upsertCycleState,
  fetchCycleActions, upsertCycleAction, deleteCycleAction,
  fetchTurmas, upsertTurma, deleteTurmaDB,
  insertRecord, updateRecord as updateRecordDB, fetchRecords,
  type CycleState, type CycleAction, type Turma, type DBRecord,
} from "@/lib/db";
import { mvpCycles, type MVPCycle } from "@/data/mvpCycles";
import { getEffectiveSuccessFactors } from "@/lib/globalSuccessFactors";
import { CYCLE_IDS } from "@/lib/constants";

// ── Tipos locais compatíveis com MVPCycles.tsx ───────────────────────────────

export type ActionStatus = "pending" | "in_progress" | "completed" | "delayed";

export interface FactorAction {
  id: string;           // action_id da tabela (ex: "lead-1") ou uuid se custom
  dbId?: string;        // id UUID da linha na tabela cycle_actions
  title: string;
  enabled: boolean;
  disabledReason: string;
  responsible: string;
  dueDate: string | null;
  status: ActionStatus;
  observation: string;
  sourceDecisionId?: string | null;
  isCustom?: boolean;
}

export interface FactorState {
  id: string;           // factor_id (ex: "leadership")
  actions: FactorAction[];
}

export interface LocalCycleState {
  cycleId: string;
  closureStatus: CycleState["closureStatus"];
  startDate?: string;
  closedAt?: string;
  closureNotes: string;
  lockedForEditing: boolean;
  factors: FactorState[];   // actions carregadas das cycle_actions
}

// ── Helper ───────────────────────────────────────────────────────────────────

function isDelayed(dueDate: string | null, status: ActionStatus): boolean {
  if (!dueDate || status === "completed") return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  return due < today;
}

function buildFactors(
  cycle: MVPCycle,
  dbActions: CycleAction[]
): FactorState[] {
  const effectiveFactors = getEffectiveSuccessFactors(cycle.id);

  return effectiveFactors.map(factor => {
    // Template actions from methodology
    const templateActions: FactorAction[] = factor.actions.map(a => {
      const saved = dbActions.find(
        db => db.factorId === factor.id && db.actionId === a.id && !db.actionId.startsWith("custom-")
      );
      const status: ActionStatus = saved
        ? (saved.status as ActionStatus)
        : "pending";
      return {
        id: a.id,
        dbId: saved?.id,
        title: saved?.title || a.title,
        enabled: saved ? saved.enabled : true,
        disabledReason: saved?.disabledReason ?? "",
        responsible: saved?.responsible ?? "",
        dueDate: saved?.dueDate ?? null,
        status: isDelayed(saved?.dueDate ?? null, status) && status !== "completed" ? "delayed" : status,
        observation: saved?.observation ?? "",
        sourceDecisionId: saved?.sourceDecisionId ?? null,
      };
    });

    // Custom actions (actionId starts with "custom-")
    const customActions: FactorAction[] = dbActions
      .filter(db => db.factorId === factor.id && db.actionId.startsWith("custom-"))
      .map(db => ({
        id: db.actionId,
        dbId: db.id,
        title: db.title,
        enabled: db.enabled,
        disabledReason: db.disabledReason,
        responsible: db.responsible,
        dueDate: db.dueDate,
        status: isDelayed(db.dueDate, db.status as ActionStatus) && db.status !== "completed"
          ? "delayed"
          : (db.status as ActionStatus),
        observation: db.observation,
        sourceDecisionId: db.sourceDecisionId,
        isCustom: true,
      }));

    return { id: factor.id, actions: [...templateActions, ...customActions] };
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCycleData() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";

  const [loading, setLoading] = useState(true);
  const [cycleStates, setCycleStates] = useState<Record<string, LocalCycleState>>({});
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [records, setRecords] = useState<DBRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchCycleStates(companyId),
      fetchCycleActions(companyId),
      fetchTurmas(companyId),
      fetchRecords(companyId),
    ]).then(([states, actions, ts, recs]) => {
      if (cancelled) return;
      const built: Record<string, LocalCycleState> = {};
      for (const cycle of mvpCycles) {
        const s = states[cycle.id];
        const cycleActions = actions.filter(a => a.cycleId === cycle.id);
        built[cycle.id] = {
          cycleId: cycle.id,
          closureStatus: s?.closureStatus ?? "not_started",
          startDate: s?.startDate,
          closedAt: s?.closedAt,
          closureNotes: s?.closureNotes ?? "",
          lockedForEditing: s?.lockedForEditing ?? false,
          factors: buildFactors(cycle, cycleActions),
        };
      }
      setCycleStates(built);
      setTurmas(ts);
      setRecords(recs);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [companyId, refreshKey]);

  // ── Escrita: estado de ciclo ──────────────────────────────────────────────

  const startCycle = useCallback(async (cycleId: string) => {
    const state: CycleState = {
      companyId, cycleId,
      closureStatus: "in_progress",
      startDate: new Date().toISOString(),
      closureNotes: "",
      lockedForEditing: false,
    };
    await upsertCycleState(state);
    reload();
  }, [companyId, reload]);

  const closeCycle = useCallback(async (cycleId: string, notes: string) => {
    const existing = cycleStates[cycleId];
    const state: CycleState = {
      companyId, cycleId,
      closureStatus: "closed",
      startDate: existing?.startDate,
      closedAt: new Date().toISOString(),
      closureNotes: notes,
      lockedForEditing: true,
    };
    await upsertCycleState(state);
    reload();
  }, [companyId, cycleStates, reload]);

  // ── Escrita: ações ────────────────────────────────────────────────────────

  const saveAction = useCallback(async (
    cycleId: string,
    factorId: string,
    action: FactorAction
  ) => {
    await upsertCycleAction({
      id: action.dbId,
      companyId,
      cycleId,
      factorId,
      actionId: action.id,
      title: action.title,
      enabled: action.enabled,
      disabledReason: action.disabledReason,
      responsible: action.responsible,
      dueDate: action.dueDate,
      status: action.status,
      observation: action.observation,
      sourceDecisionId: action.sourceDecisionId ?? null,
    });
    reload();
  }, [companyId, reload]);

  const updateAction = useCallback(async (
    cycleId: string,
    factorId: string,
    actionId: string,
    updates: Partial<FactorAction>
  ) => {
    const factor = cycleStates[cycleId]?.factors.find(f => f.id === factorId);
    const action = factor?.actions.find(a => a.id === actionId);
    if (!action) return;
    await saveAction(cycleId, factorId, { ...action, ...updates });
  }, [cycleStates, saveAction]);

  const createCustomAction = useCallback(async (
    cycleId: string,
    factorId: string,
    data: { title: string; responsible?: string; dueDate?: string | null; observation?: string; sourceDecisionId?: string }
  ) => {
    const customId = `custom-${Date.now()}`;
    await upsertCycleAction({
      companyId,
      cycleId,
      factorId,
      actionId: customId,
      title: data.title,
      enabled: true,
      disabledReason: "",
      responsible: data.responsible ?? "",
      dueDate: data.dueDate ?? null,
      status: "pending",
      observation: data.observation ?? "",
      sourceDecisionId: data.sourceDecisionId ?? null,
    });
    reload();
  }, [companyId, reload]);

  const deleteCustomAction = useCallback(async (dbId: string) => {
    await deleteCycleAction(dbId);
    reload();
  }, [reload]);

  // ── Escrita: turmas ───────────────────────────────────────────────────────

  const saveTurma = useCallback(async (turma: Partial<Turma> & { cycleId: string; name: string; facilitator: string }) => {
    await upsertTurma(companyId, turma);
    reload();
  }, [companyId, reload]);

  const removeTurma = useCallback(async (id: string) => {
    await deleteTurmaDB(id);
    reload();
  }, [reload]);

  // ── Escrita: registros ────────────────────────────────────────────────────

  const addRecord = useCallback(async (r: Omit<DBRecord, "id" | "companyId" | "createdAt" | "updatedAt">) => {
    await insertRecord(companyId, r);
    reload();
  }, [companyId, reload]);

  const editRecord = useCallback(async (id: string, updates: Partial<DBRecord>) => {
    await updateRecordDB(id, updates);
    reload();
  }, [reload]);

  return {
    loading,
    cycleStates,
    turmas,
    records,
    reload,
    startCycle,
    closeCycle,
    saveAction,
    updateAction,
    createCustomAction,
    deleteCustomAction,
    saveTurma,
    removeTurma,
    addRecord,
    editRecord,
  };
}
