// ============================================================
// Cycle Audience Rules
// Defines which cycles target which audience
// ============================================================

export type CycleAudience = "all" | "leadership";

export interface CycleAudienceInfo {
  cycleId: string;
  audience: CycleAudience;
  audienceLabel: string;
  audienceDescription: string;
  hasLeadershipTasks: boolean;
  leadershipTasksNote?: string;
}

// M1, M2, V1, V2, P1, P2 → All employees
// M3, V3, P3 → Leadership only
const LEADERSHIP_CYCLES = ["M3", "V3", "P3"];

export function getCycleAudience(cycleId: string): CycleAudienceInfo {
  const isLeadershipCycle = LEADERSHIP_CYCLES.includes(cycleId);
  
  return {
    cycleId,
    audience: isLeadershipCycle ? "leadership" : "all",
    audienceLabel: isLeadershipCycle ? "Liderança" : "Todos os Colaboradores",
    audienceDescription: isLeadershipCycle
      ? "Este módulo é direcionado especificamente para a liderança da organização."
      : "Este módulo é aplicado para todos os colaboradores da organização.",
    hasLeadershipTasks: isLeadershipCycle,
    leadershipTasksNote: isLeadershipCycle
      ? "Além de participar, a liderança terá atividades obrigatórias a executar neste ciclo."
      : undefined,
  };
}

export function isLeadershipCycle(cycleId: string): boolean {
  return LEADERSHIP_CYCLES.includes(cycleId);
}

// Consultant return reminders
// M2 → remind to schedule return for M3
// V2 → remind to schedule return for V3  
// P2 → remind to schedule return for P3
const CONSULTANT_REMINDER_CYCLES: Record<string, string> = {
  M2: "M3",
  V2: "V3",
  P2: "P3",
};

export interface ConsultantReminderInfo {
  currentCycle: string;
  nextCycle: string;
  reminderText: string;
  actionTitle: string;
}

export function getConsultantReminder(cycleId: string): ConsultantReminderInfo | null {
  const nextCycle = CONSULTANT_REMINDER_CYCLES[cycleId];
  if (!nextCycle) return null;

  return {
    currentCycle: cycleId,
    nextCycle,
    reminderText: `O próximo ciclo (${nextCycle}) é de Liderança. É obrigatório agendar o retorno do consultor MVP.`,
    actionTitle: `Agendar retorno do consultor para ${nextCycle}`,
  };
}

export function getAllCycleAudiences(): CycleAudienceInfo[] {
  const cycleIds = ["M1", "M2", "M3", "V1", "V2", "V3", "P1", "P2", "P3"];
  return cycleIds.map(getCycleAudience);
}
