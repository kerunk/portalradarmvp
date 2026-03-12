// Portfolio management utilities
// Implementation stage, risk score, cycle delay, timeline events

import { getCompanies, getState, setActiveCompany, type CompanyState } from './storage';
import { CYCLE_IDS, type CycleId } from './constants';
import { getCompanyRiskData, type CompanyRiskData } from './adminNotifications';

// ============================================================
// IMPLEMENTATION STAGE
// ============================================================

export type ImplementationStage = "onboarding" | "implementacao" | "consolidacao" | "finalizado";

export const STAGE_LABELS: Record<ImplementationStage, string> = {
  onboarding: "Onboarding",
  implementacao: "Implementação",
  consolidacao: "Consolidação",
  finalizado: "Finalizado",
};

export const STAGE_COLORS: Record<ImplementationStage, string> = {
  onboarding: "bg-muted text-muted-foreground border-border",
  implementacao: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  consolidacao: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  finalizado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function getCompanyStage(company: CompanyState): ImplementationStage {
  if (company.onboardingStatus !== "completed") return "onboarding";

  setActiveCompany(company.id);
  const state = getState();

  let closedCycles = 0;
  let hasAnyCycle = false;

  CYCLE_IDS.forEach(cid => {
    const cs = state.cycles[cid];
    if (cs) {
      hasAnyCycle = true;
      if (cs.closureStatus === "closed") closedCycles++;
    }
  });

  setActiveCompany(null);

  if (closedCycles >= 9) return "finalizado";
  if (closedCycles >= 4) return "consolidacao";
  if (hasAnyCycle) return "implementacao";
  return "onboarding";
}

// ============================================================
// RISK SCORE
// ============================================================

export type RiskLevel = "healthy" | "warning" | "risk";

export const RISK_LABELS: Record<RiskLevel, string> = {
  healthy: "Saudável",
  warning: "Atenção",
  risk: "Risco",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  risk: "bg-destructive/15 text-destructive border-destructive/30",
};

export function calculateRiskLevel(data: CompanyRiskData): RiskLevel {
  const coverage = data.totalEmployees > 0
    ? (data.trainedCount / data.totalEmployees) * 100 : 0;

  // Risk criteria
  if (data.delayedActions >= 3 || coverage < 5) return "risk";
  if (data.delayedActions >= 1 || coverage < 15 || data.maturityScore < 20) return "warning";
  return "healthy";
}

// ============================================================
// CYCLE DELAY DETECTION
// ============================================================

export interface CycleDelayInfo {
  cycleId: string;
  daysActive: number;
  isDelayed: boolean; // > 40 days
  startDate: string | null;
}

export function getCycleDelays(companyId: string): CycleDelayInfo[] {
  setActiveCompany(companyId);
  const state = getState();
  const delays: CycleDelayInfo[] = [];

  CYCLE_IDS.forEach(cid => {
    const cs = state.cycles[cid];
    if (!cs || cs.closureStatus === "closed") return;

    // Check if cycle has any activity (started)
    const hasActivity = cs.factors.some(f => f.actions.some(a => a.enabled));
    if (!hasActivity && !cs.startDate) return;

    const startDate = cs.startDate || null;
    let daysActive = 0;

    if (startDate) {
      daysActive = Math.ceil((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    } else if (hasActivity) {
      // Estimate from earliest action creation
      let earliest: Date | null = null;
      cs.factors.forEach(f => f.actions.forEach(a => {
        if (a.createdAt) {
          const d = new Date(a.createdAt);
          if (!earliest || d < earliest) earliest = d;
        }
      }));
      if (earliest) {
        daysActive = Math.ceil((Date.now() - earliest.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    delays.push({
      cycleId: cid,
      daysActive,
      isDelayed: daysActive > 40,
      startDate,
    });
  });

  setActiveCompany(null);
  return delays;
}

// ============================================================
// COMPANY TIMELINE EVENTS
// ============================================================

export interface TimelineEvent {
  date: string;
  label: string;
  type: "creation" | "onboarding" | "turma" | "cycle_start" | "cycle_close" | "action";
}

export function getCompanyTimeline(companyId: string): TimelineEvent[] {
  const companies = getCompanies();
  const company = companies.find(c => c.id === companyId);
  if (!company) return [];

  const events: TimelineEvent[] = [];

  // Company creation
  events.push({
    date: company.createdAt,
    label: "Empresa criada",
    type: "creation",
  });

  // Onboarding
  if (company.onboardingStatus === "completed" || company.onboardingStatus === "in_progress") {
    events.push({
      date: company.createdAt, // approximate
      label: company.onboardingStatus === "completed" ? "Onboarding concluído" : "Onboarding em andamento",
      type: "onboarding",
    });
  }

  setActiveCompany(companyId);
  const state = getState();

  // Employees registered
  if (state.employees.length > 0) {
    events.push({
      date: company.createdAt,
      label: `Base populacional cadastrada (${state.employees.length} colaboradores)`,
      type: "onboarding",
    });
  }

  // Turmas
  state.turmas
    .filter(t => t.status === "completed")
    .sort((a, b) => (a.trainingDate || a.startDate || "").localeCompare(b.trainingDate || b.startDate || ""))
    .forEach(t => {
      const dateStr = t.trainingDate || t.startDate || company.createdAt;
      events.push({
        date: dateStr,
        label: `Turma "${t.name}" realizada (${t.cycleId})`,
        type: "turma",
      });
    });

  // Cycle events
  CYCLE_IDS.forEach(cid => {
    const cs = state.cycles[cid];
    if (!cs) return;

    if (cs.startDate) {
      events.push({
        date: cs.startDate,
        label: `Ciclo ${cid} iniciado`,
        type: "cycle_start",
      });
    }

    if (cs.closureStatus === "closed" && cs.closedAt) {
      events.push({
        date: cs.closedAt,
        label: `Ciclo ${cid} concluído`,
        type: "cycle_close",
      });
    }
  });

  setActiveCompany(null);

  // Sort chronologically
  events.sort((a, b) => a.date.localeCompare(b.date));

  return events;
}

// ============================================================
// LAST ACTIVITY CALCULATION
// ============================================================

export function getLastActivityLabel(days: number | null): string {
  if (days === null) return "Sem atividade";
  if (days === 0) return "Hoje";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

// ============================================================
// COMPANIES PER MANAGER
// ============================================================

export function getCompaniesForManager(email: string): CompanyState[] {
  const companies = getCompanies();
  return companies.filter(c => c.ownerEmail?.toLowerCase() === email.toLowerCase());
}

export function getCompanyCountForManager(email: string): number {
  return getCompaniesForManager(email).length;
}

// ============================================================
// PIPELINE STATS
// ============================================================

export interface PipelineStats {
  onboarding: number;
  implementacao: number;
  consolidacao: number;
  finalizado: number;
}

export function getPipelineStats(): PipelineStats {
  const companies = getCompanies();
  const stats: PipelineStats = { onboarding: 0, implementacao: 0, consolidacao: 0, finalizado: 0 };
  companies.forEach(c => {
    stats[getCompanyStage(c)]++;
  });
  return stats;
}

// ============================================================
// ENRICHED COMPANY DATA (for lists & portfolio)
// ============================================================

export interface EnrichedCompany {
  company: CompanyState;
  riskData: CompanyRiskData;
  riskLevel: RiskLevel;
  stage: ImplementationStage;
  currentCycle: string;
  lastActivityDays: number | null;
  cycleDelays: CycleDelayInfo[];
}

export function getEnrichedCompanies(): EnrichedCompany[] {
  const companies = getCompanies();
  return companies.map(c => {
    const riskData = getCompanyRiskData(c);
    const riskLevel = calculateRiskLevel(riskData);
    const stage = getCompanyStage(c);
    const cycleDelays = getCycleDelays(c.id);

    // Find current cycle
    setActiveCompany(c.id);
    const state = getState();
    let currentCycle = "—";
    for (let i = CYCLE_IDS.length - 1; i >= 0; i--) {
      const cid = CYCLE_IDS[i];
      const cs = state.cycles[cid];
      if (cs && (cs.closureStatus === "closed" || cs.factors.some(f => f.actions.some(a => a.enabled)))) {
        currentCycle = cid;
        break;
      }
    }
    setActiveCompany(null);

    return {
      company: c,
      riskData,
      riskLevel,
      stage,
      currentCycle,
      lastActivityDays: riskData.lastActivityDays,
      cycleDelays,
    };
  });
}
