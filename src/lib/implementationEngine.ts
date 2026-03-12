// Implementation Guidance Engine
// Checklist, next action, progress %, completion forecast

import { getCompanies, setActiveCompany, getState, type CompanyState } from './storage';
import { CYCLE_IDS, type CycleId } from './constants';
import { getNucleo, getPopulation, getOrgStructure, getPopulationStats } from './companyStorage';

// ============================================================
// CHECKLIST
// ============================================================

export interface ChecklistItem {
  id: string;
  label: string;
  phase: "onboarding" | "pre_implementation" | "implementation";
  completed: boolean;
  order: number;
}

export function getImplementationChecklist(companyId: string): ChecklistItem[] {
  const nucleo = getNucleo(companyId);
  const population = getPopulation(companyId);
  const orgStructure = getOrgStructure(companyId);

  setActiveCompany(companyId);
  const state = getState();

  const hasTurmas = state.turmas.length > 0;
  const hasOrgStructure = orgStructure.sectors.length > 0 || orgStructure.units.length > 0;

  // Check which cycles have been started
  const cycleStarted: Record<string, boolean> = {};
  CYCLE_IDS.forEach(cid => {
    const cs = state.cycles[cid];
    if (!cs) { cycleStarted[cid] = false; return; }
    const hasActivity = cs.closureStatus !== "not_started" ||
      cs.startDate ||
      cs.factors.some(f => f.actions.some(a => a.enabled));
    cycleStarted[cid] = !!hasActivity;
  });

  // Check if first cycle has planning (any action enabled)
  const m1State = state.cycles["M1"];
  const hasM1Planning = m1State ? m1State.factors.some(f => f.actions.some(a => a.enabled)) : false;

  setActiveCompany(null);

  const items: ChecklistItem[] = [
    // Onboarding
    { id: "nucleo", label: "Núcleo de sustentação definido", phase: "onboarding", completed: nucleo.length > 0, order: 1 },
    { id: "population", label: "Base populacional cadastrada", phase: "onboarding", completed: population.length > 0, order: 2 },

    // Pre-implementation
    { id: "org_structure", label: "Estrutura organizacional validada", phase: "pre_implementation", completed: hasOrgStructure, order: 3 },
    { id: "first_turma", label: "Primeira turma criada", phase: "pre_implementation", completed: hasTurmas, order: 4 },
    { id: "first_cycle_plan", label: "Planejamento do primeiro ciclo", phase: "pre_implementation", completed: hasM1Planning, order: 5 },

    // Implementation - each cycle
    ...CYCLE_IDS.map((cid, idx) => ({
      id: `cycle_${cid}`,
      label: `Ciclo ${cid} iniciado`,
      phase: "implementation" as const,
      completed: cycleStarted[cid],
      order: 6 + idx,
    })),
  ];

  return items;
}

// ============================================================
// NEXT RECOMMENDED ACTION
// ============================================================

export function getNextRecommendedAction(companyId: string): string {
  const checklist = getImplementationChecklist(companyId);
  const firstIncomplete = checklist.find(item => !item.completed);

  if (!firstIncomplete) return "Metodologia consolidada — parabéns!";

  const actionMap: Record<string, string> = {
    nucleo: "Definir o Núcleo de Sustentação",
    population: "Cadastrar a base populacional",
    org_structure: "Cadastrar a estrutura organizacional",
    first_turma: "Criar a primeira turma de treinamento",
    first_cycle_plan: "Planejar o primeiro ciclo (M1)",
    cycle_M1: "Iniciar o Ciclo M1",
    cycle_M2: "Iniciar o Ciclo M2",
    cycle_M3: "Iniciar o Ciclo M3",
    cycle_V1: "Iniciar o Ciclo V1",
    cycle_V2: "Iniciar o Ciclo V2",
    cycle_V3: "Iniciar o Ciclo V3",
    cycle_P1: "Iniciar o Ciclo P1",
    cycle_P2: "Iniciar o Ciclo P2",
    cycle_P3: "Iniciar o Ciclo P3",
  };

  return actionMap[firstIncomplete.id] || firstIncomplete.label;
}

// ============================================================
// IMPLEMENTATION PROGRESS %
// ============================================================

export function getImplementationProgress(companyId: string): number {
  const checklist = getImplementationChecklist(companyId);
  const completed = checklist.filter(c => c.completed).length;
  return Math.round((completed / checklist.length) * 100);
}

export function getImplementationProgressLabel(percent: number): string {
  if (percent === 0) return "Início";
  if (percent <= 15) return "Onboarding";
  if (percent <= 35) return "Pré-Implementação";
  if (percent <= 65) return "Ciclos Iniciais";
  if (percent < 100) return "Ciclos Avançados";
  return "Consolidado";
}

// ============================================================
// JOURNEY STAGE (visual)
// ============================================================

export type JourneyStage = "onboarding" | "pre_implementation" | "implementation" | "consolidation";

export const JOURNEY_STAGES: { id: JourneyStage; label: string; minProgress: number }[] = [
  { id: "onboarding", label: "Onboarding", minProgress: 0 },
  { id: "pre_implementation", label: "Pré-Implementação", minProgress: 15 },
  { id: "implementation", label: "Implementação", minProgress: 36 },
  { id: "consolidation", label: "Consolidação", minProgress: 80 },
];

export function getCurrentJourneyStage(progress: number): JourneyStage {
  for (let i = JOURNEY_STAGES.length - 1; i >= 0; i--) {
    if (progress >= JOURNEY_STAGES[i].minProgress) return JOURNEY_STAGES[i].id;
  }
  return "onboarding";
}

// ============================================================
// COMPLETION FORECAST
// ============================================================

export function getCompletionForecast(companyId: string): { monthsRemaining: number; label: string } {
  const companies = getCompanies();
  const company = companies.find(c => c.id === companyId);
  if (!company) return { monthsRemaining: 0, label: "—" };

  setActiveCompany(companyId);
  const state = getState();

  let closedCycles = 0;
  let inProgressCycles = 0;
  CYCLE_IDS.forEach(cid => {
    const cs = state.cycles[cid];
    if (!cs) return;
    if (cs.closureStatus === "closed") closedCycles++;
    else if (cs.closureStatus !== "not_started" || cs.startDate || cs.factors.some(f => f.actions.some(a => a.enabled))) {
      inProgressCycles++;
    }
  });

  setActiveCompany(null);

  const totalCycles = 9;
  const remaining = totalCycles - closedCycles;

  if (remaining <= 0) return { monthsRemaining: 0, label: "Concluído" };

  // Estimate: each cycle ~1 month. If we have history, use velocity.
  const createdDate = new Date(company.createdAt);
  const monthsElapsed = Math.max(1, Math.ceil((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  if (closedCycles > 0) {
    const velocity = closedCycles / monthsElapsed; // cycles per month
    const monthsRemaining = Math.ceil(remaining / Math.max(velocity, 0.1));
    return {
      monthsRemaining,
      label: monthsRemaining === 1 ? "~1 mês restante" : `~${monthsRemaining} meses restantes`,
    };
  }

  // No cycles closed yet — estimate based on total
  return {
    monthsRemaining: remaining,
    label: `~${remaining} meses restantes`,
  };
}

// ============================================================
// CLIENT SUGGESTIONS
// ============================================================

export function getClientSuggestions(companyId: string): string[] {
  const checklist = getImplementationChecklist(companyId);
  const suggestions: string[] = [];
  
  const incomplete = checklist.filter(c => !c.completed);
  
  // Take up to 3 next actions
  incomplete.slice(0, 3).forEach(item => {
    const map: Record<string, string> = {
      nucleo: "Definir o Núcleo de Sustentação para garantir governança",
      population: "Cadastrar a base populacional da empresa",
      org_structure: "Validar a estrutura organizacional",
      first_turma: "Criar a primeira turma de treinamento",
      first_cycle_plan: "Planejar as ações do ciclo M1",
      cycle_M1: "Iniciar o Ciclo M1 — Conceito MVP e Radar Pessoal",
      cycle_M2: "Iniciar o Ciclo M2 — Radar Social",
      cycle_M3: "Iniciar o Ciclo M3 — Liderança em Movimento",
      cycle_V1: "Iniciar o Ciclo V1 — Da Atenção à Validação",
      cycle_V2: "Iniciar o Ciclo V2 — Validação Coletiva",
      cycle_V3: "Iniciar o Ciclo V3 — Liderança em Ação",
      cycle_P1: "Iniciar o Ciclo P1 — Do Hábito à Identidade",
      cycle_P2: "Iniciar o Ciclo P2 — O Legado MVP",
      cycle_P3: "Iniciar o Ciclo P3 — Cultura Viva",
    };
    suggestions.push(map[item.id] || item.label);
  });

  return suggestions;
}
