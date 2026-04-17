/**
 * useSmartAlerts.ts
 * Gera alertas inteligentes para o dashboard do cliente a partir
 * dos dados do Supabase — substitui gerarAlertasInteligentes() do governance.ts.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCycleActions, fetchCycleStates, fetchTurmas, fetchRecords } from "@/lib/db";
import { mvpCycles } from "@/data/mvpCycles";
import { CYCLE_IDS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;
const DISMISSED_KEY = (companyId: string) => `mvp_alerts_dismissed_${companyId}`;

export interface SmartAlert {
  id: string;
  type: "delayed_action" | "cycle_ready" | "turma_delayed" | "action_missing_info" | "record_without_action";
  severity: "danger" | "warning" | "info";
  title: string;
  description: string;
  cycleId?: string;
  actionId?: string;
  turmaId?: string;
  recordId?: string;
  navigateTo: string;
  createdAt: string;
  autoResolves: boolean;
  responsible?: string;
  dueDate?: string;
}

function getDismissed(companyId: string): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY(companyId)) || "[]"); }
  catch { return []; }
}

function saveDismissed(companyId: string, ids: string[]) {
  try { localStorage.setItem(DISMISSED_KEY(companyId), JSON.stringify(ids)); }
  catch {}
}

export function useSmartAlerts(refreshTrigger = 0) {
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>(() => getDismissed(companyId));

  const generate = useCallback(async () => {
    if (!companyId) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [actions, states, turmas, records] = await Promise.all([
      fetchCycleActions(companyId),
      fetchCycleStates(companyId),
      fetchTurmas(companyId),
      fetchRecords(companyId),
    ]);

    const now = new Date().toISOString();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const result: SmartAlert[] = [];

    // 1. Ações atrasadas (due_date < hoje, não concluídas)
    for (const action of actions) {
      if (!action.enabled || !action.dueDate || action.status === "completed") continue;
      const cycleState = states[action.cycleId];
      if (cycleState?.closureStatus === "closed") continue;

      const due = new Date(action.dueDate); due.setHours(0, 0, 0, 0);
      if (due >= today) continue;

      const cycleDef = mvpCycles.find(c => c.id === action.cycleId);
      const factorDef = cycleDef?.successFactors.find(f => f.id === action.factorId);
      const actionDef = factorDef?.actions.find(a => a.id === action.actionId);
      const title = actionDef?.title || action.title || `Ação do ciclo ${action.cycleId}`;
      const dueFmt = new Date(action.dueDate).toLocaleDateString("pt-BR");

      result.push({
        id: `delayed-${action.cycleId}-${action.actionId}`,
        type: "delayed_action",
        severity: "danger",
        title: `Ação atrasada: ${title}`,
        description: `Ciclo ${action.cycleId} · ${factorDef?.name || "Fator"} · Prazo: ${dueFmt}`,
        cycleId: action.cycleId,
        actionId: action.actionId,
        navigateTo: `/ciclos?cycle=${action.cycleId}`,
        createdAt: now,
        autoResolves: true,
        responsible: action.responsible || undefined,
        dueDate: action.dueDate,
      });
    }

    // 2. Turmas atrasadas
    for (const turma of turmas) {
      if (turma.status === "completed" || !turma.endDate) continue;
      const end = new Date(turma.endDate); end.setHours(0, 0, 0, 0);
      if (end >= today) continue;

      result.push({
        id: `turma-delayed-${turma.id}`,
        type: "turma_delayed",
        severity: "warning",
        title: `Turma "${turma.name}" atrasada`,
        description: `Ciclo ${turma.cycleId} · Prazo: ${new Date(turma.endDate).toLocaleDateString("pt-BR")}`,
        cycleId: turma.cycleId,
        turmaId: turma.id,
        navigateTo: `/turmas?cycle=${turma.cycleId}`,
        createdAt: now,
        autoResolves: true,
      });
    }

    // 3. Ciclos prontos para encerrar (≥80% ações concluídas + ≥1 turma concluída)
    for (const cycleId of CYCLE_IDS) {
      const cs = states[cycleId];
      if (!cs || cs.closureStatus === "closed") continue;

      const cycleActions = actions.filter(a => a.cycleId === cycleId && a.enabled);
      if (cycleActions.length === 0) continue;

      const completed = cycleActions.filter(a => a.status === "completed").length;
      const pct = Math.round((completed / cycleActions.length) * 100);
      const completedTurmas = turmas.filter(t => t.cycleId === cycleId && t.status === "completed").length;

      if (pct >= 80 && completedTurmas >= 1) {
        result.push({
          id: `cycle-ready-${cycleId}`,
          type: "cycle_ready",
          severity: "info",
          title: `Ciclo ${cycleId} pronto para encerrar`,
          description: `${pct}% das ações concluídas · ${completedTurmas} turma(s) finalizada(s)`,
          cycleId,
          navigateTo: `/ciclos?cycle=${cycleId}`,
          createdAt: now,
          autoResolves: true,
        });
      }
    }

    // 4. Ações sem responsável ou prazo (por ciclo ativo)
    const missingByCycle: Record<string, number> = {};
    for (const action of actions) {
      const cs = states[action.cycleId];
      if (!cs || cs.closureStatus === "closed") continue;
      if (!action.enabled) continue;
      if (!action.responsible || !action.dueDate) {
        missingByCycle[action.cycleId] = (missingByCycle[action.cycleId] || 0) + 1;
      }
    }
    for (const [cycleId, count] of Object.entries(missingByCycle)) {
      if (count === 0) continue;
      const cycleDef = mvpCycles.find(c => c.id === cycleId);
      result.push({
        id: `missing-info-${cycleId}`,
        type: "action_missing_info",
        severity: "warning",
        title: `${count} ação(ões) sem prazo ou responsável`,
        description: `${cycleDef?.title || `Ciclo ${cycleId}`} — Complete as informações para melhor controle`,
        cycleId,
        navigateTo: `/ciclos?cycle=${cycleId}`,
        createdAt: now,
        autoResolves: true,
      });
    }

    // 5. Riscos abertos sem ação vinculada
    for (const rec of records) {
      if (rec.type !== "risk" || rec.status !== "open") continue;
      if (rec.linkedActionIds?.length > 0) continue;
      result.push({
        id: `risk-no-action-${rec.id}`,
        type: "record_without_action",
        severity: "warning",
        title: `Risco sem ação: ${rec.title}`,
        description: "Considere criar ações para mitigar este risco",
        recordId: rec.id,
        cycleId: rec.cycleId || undefined,
        navigateTo: `/registros?type=risk`,
        createdAt: now,
        autoResolves: true,
      });
    }

    // Ordena: danger → warning → info
    const order = { danger: 0, warning: 1, info: 2 };
    result.sort((a, b) => order[a.severity] - order[b.severity]);

    setAlerts(result);
    setLoading(false);
  }, [companyId, refreshTrigger]);

  useEffect(() => { generate(); }, [generate]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = [...prev, id];
      saveDismissed(companyId, next);
      return next;
    });
  }, [companyId]);

  const activeAlerts = alerts.filter(a => !dismissed.includes(a.id));

  return { alerts: activeAlerts, allAlerts: alerts, loading, dismiss, refresh: generate };
}
