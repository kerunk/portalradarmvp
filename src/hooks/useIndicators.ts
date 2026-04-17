/**
 * useIndicators.ts
 * Calcula GlobalIndicators e CycleIndicators direto do Supabase,
 * substituindo obterIndicadoresGlobais() e obterIndicadoresTodosCiclos()
 * do governance.ts (que usam localStorage).
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCycleActions, fetchCycleStates, fetchTurmas, fetchRecords,
  type CycleAction, type CycleState, type Turma, type DBRecord,
} from "@/lib/db";
import { CYCLE_IDS } from "@/lib/constants";
import { mvpCycles } from "@/data/mvpCycles";

// ── Tipos (mesmos do governance.ts para compatibilidade) ──────────────────────
export type CycleStatus = "not_started" | "in_progress" | "ready_to_close" | "closed";

export interface GlobalIndicators {
  totalCycles: number;
  closedCycles: number;
  cyclesInProgress: number;
  cyclesReadyToClose: number;
  totalActions: number;
  completedActions: number;
  delayedActions: number;
  pendingActions: number;
  inProgressActions: number;
  overallCompletionPercent: number;
  totalTurmas: number;
  completedTurmas: number;
  totalParticipants: number;
  totalRecords: number;
  decisionsWithActions: number;
  averageCycleDurationDays: number | null;
  actionBacklog: number;
  decisionConversionRate: number;
}

export interface CycleIndicators {
  cycleId: string;
  phaseName: string;
  status: CycleStatus;
  totalActions: number;
  completedActions: number;
  delayedActions: number;
  completionPercent: number;
  turmasTotal: number;
  turmasCompleted: number;
  recordsCount: number;
  decisionsCount: number;
  daysActive: number | null;
  isLocked: boolean;
}

export interface ActionData {
  cycleId: string;
  factorId: string;
  actionId: string;
  title: string;
  factorName: string;
  responsible: string;
  dueDate: string | null;
  status: string;
  isDelayed: boolean;
}

// ── Helper: status derivado ───────────────────────────────────────────────────
function deriveStatus(
  cs: CycleState | undefined,
  actions: CycleAction[],
  turmas: Turma[]
): CycleStatus {
  if (!cs) return "not_started";
  if (cs.closureStatus === "closed") return "closed";

  const enabled = actions.filter(a => a.enabled);
  const completed = enabled.filter(a => a.status === "completed").length;
  const pct = enabled.length > 0 ? (completed / enabled.length) * 100 : 0;
  const completedTurmas = turmas.filter(t => t.status === "completed").length;

  if (pct >= 80 && completedTurmas >= 1) return "ready_to_close";
  if (enabled.some(a => a.status === "in_progress" || a.status === "completed")) return "in_progress";
  return cs.closureStatus === "not_started" ? "not_started" : "in_progress";
}

function isDelayedFn(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed") return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  return due < today;
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function useIndicators(refreshTrigger = 0) {
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const [loading, setLoading] = useState(true);
  const [globalIndicators, setGlobalIndicators] = useState<GlobalIndicators | null>(null);
  const [cycleIndicators, setCycleIndicators] = useState<CycleIndicators[]>([]);
  const [allActions, setAllActions] = useState<ActionData[]>([]);

  const calculate = useCallback(async () => {
    setLoading(true);
    if (!companyId) {
      // Admin MVP sem empresa ativa: retorna indicadores zerados em vez de travar em loading
      setGlobalIndicators({
        totalCycles: CYCLE_IDS.length,
        closedCycles: 0, cyclesInProgress: 0, cyclesReadyToClose: 0,
        totalActions: 0, completedActions: 0, delayedActions: 0,
        pendingActions: 0, inProgressActions: 0,
        overallCompletionPercent: 0,
        totalTurmas: 0, completedTurmas: 0, totalParticipants: 0,
        totalRecords: 0, decisionsWithActions: 0,
        averageCycleDurationDays: null,
        actionBacklog: 0, decisionConversionRate: 0,
      });
      setCycleIndicators(CYCLE_IDS.map(cycleId => {
        const cycleDef = mvpCycles.find(c => c.id === cycleId);
        return {
          cycleId,
          phaseName: cycleDef?.phaseName || "MVP",
          status: "not_started" as CycleStatus,
          totalActions: 0, completedActions: 0, delayedActions: 0,
          completionPercent: 0,
          turmasTotal: 0, turmasCompleted: 0,
          recordsCount: 0, decisionsCount: 0,
          daysActive: null,
          isLocked: CYCLE_IDS.indexOf(cycleId) > 0,
        };
      }));
      setAllActions([]);
      setLoading(false);
      return;
    }

    const [actions, states, turmas, records] = await Promise.all([
      fetchCycleActions(companyId),
      fetchCycleStates(companyId),
      fetchTurmas(companyId),
      fetchRecords(companyId),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);

    // ── Indicadores globais ────────────────────────────────────────────────────
    let totalActions = 0, completedActions = 0, delayedActions = 0;
    let pendingActions = 0, inProgressActions = 0;
    let closedCycles = 0, cyclesInProgress = 0, cyclesReadyToClose = 0;
    let totalCycleDays = 0, cyclesWithDuration = 0;

    const cycleIndicatorsList: CycleIndicators[] = [];

    for (const cycleId of CYCLE_IDS) {
      const cs = states[cycleId];
      const cycleActions = actions.filter(a => a.cycleId === cycleId);
      const cycleTurmas = turmas.filter(t => t.cycleId === cycleId);
      const cycleRecords = records.filter(r => r.cycleId === cycleId);
      const enabled = cycleActions.filter(a => a.enabled);

      const status = deriveStatus(cs, enabled, cycleTurmas);

      if (status === "closed") {
        closedCycles++;
        if (cs?.startDate && cs?.closedAt) {
          const days = Math.ceil(
            (new Date(cs.closedAt).getTime() - new Date(cs.startDate).getTime()) / 86400000
          );
          totalCycleDays += days; cyclesWithDuration++;
        }
      } else if (status === "ready_to_close") {
        cyclesReadyToClose++;
      } else if (status === "in_progress") {
        cyclesInProgress++;
      }

      let cTotal = 0, cCompleted = 0, cDelayed = 0;
      for (const a of enabled) {
        cTotal++; totalActions++;
        const delayed = isDelayedFn(a.dueDate, a.status);
        if (a.status === "completed") { cCompleted++; completedActions++; }
        else if (delayed || a.status === "delayed") { cDelayed++; delayedActions++; }
        else if (a.status === "in_progress") inProgressActions++;
        else pendingActions++;
      }

      const daysActive = cs?.startDate
        ? Math.ceil((
            (cs.closedAt ? new Date(cs.closedAt) : new Date()).getTime() -
            new Date(cs.startDate).getTime()
          ) / 86400000)
        : null;

      const cycleDef = mvpCycles.find(c => c.id === cycleId);

      // isLocked: ciclo anterior não encerrado (exceto M1)
      const idx = CYCLE_IDS.indexOf(cycleId);
      const prevId = idx > 0 ? CYCLE_IDS[idx - 1] : null;
      const prevState = prevId ? states[prevId] : null;
      const isLocked = idx > 0 && prevState?.closureStatus !== "closed";

      cycleIndicatorsList.push({
        cycleId,
        phaseName: cycleDef?.phaseName || "MVP",
        status,
        totalActions: cTotal,
        completedActions: cCompleted,
        delayedActions: cDelayed,
        completionPercent: cTotal > 0 ? Math.round((cCompleted / cTotal) * 100) : 0,
        turmasTotal: cycleTurmas.length,
        turmasCompleted: cycleTurmas.filter(t => t.status === "completed").length,
        recordsCount: cycleRecords.length,
        decisionsCount: cycleRecords.filter(r => r.type === "decision").length,
        daysActive,
        isLocked,
      });
    }

    const totalTurmas = turmas.length;
    const completedTurmas = turmas.filter(t => t.status === "completed").length;
    const totalParticipants = turmas.reduce((s, t) => s + (t.participants?.length || 0), 0);
    const totalRecords = records.length;
    const decisions = records.filter(r => r.type === "decision");
    const decisionsWithActions = decisions.filter(r => r.createsActions && r.linkedActionIds?.length > 0).length;

    const global: GlobalIndicators = {
      totalCycles: CYCLE_IDS.length,
      closedCycles, cyclesInProgress, cyclesReadyToClose,
      totalActions, completedActions, delayedActions, pendingActions, inProgressActions,
      overallCompletionPercent: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      totalTurmas, completedTurmas, totalParticipants, totalRecords,
      decisionsWithActions,
      averageCycleDurationDays: cyclesWithDuration > 0 ? Math.round(totalCycleDays / cyclesWithDuration) : null,
      actionBacklog: pendingActions + inProgressActions + delayedActions,
      decisionConversionRate: decisions.length > 0 ? Math.round((decisionsWithActions / decisions.length) * 100) : 0,
    };

    // ── AllActions para tabela de prazos ──────────────────────────────────────
    const actionRows: ActionData[] = actions
      .filter(a => a.enabled)
      .map(a => {
        const cycleDef = mvpCycles.find(c => c.id === a.cycleId);
        const factorDef = cycleDef?.successFactors.find(f => f.id === a.factorId);
        const actionDef = factorDef?.actions.find(x => x.id === a.actionId);
        const delayed = isDelayedFn(a.dueDate, a.status);
        return {
          cycleId: a.cycleId,
          factorId: a.factorId,
          actionId: a.actionId,
          title: actionDef?.title || a.title || a.actionId,
          factorName: factorDef?.name || a.factorId,
          responsible: a.responsible || "Não atribuído",
          dueDate: a.dueDate,
          status: delayed ? "delayed" : a.status,
          isDelayed: delayed,
        };
      });

    setGlobalIndicators(global);
    setCycleIndicators(cycleIndicatorsList);
    setAllActions(actionRows);
    setLoading(false);
  }, [companyId, refreshTrigger]);

  useEffect(() => { calculate(); }, [calculate]);

  return { loading, globalIndicators, cycleIndicators, allActions, refresh: calculate };
}
