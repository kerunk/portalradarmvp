// Operational Events System
// Logs key platform events for admin notifications

const EVENTS_KEY = "mvp_operational_events";
const DISMISSED_EVENTS_KEY = "mvp_operational_events_dismissed";

export type OperationalEventType =
  | "company_created"
  | "company_deleted"
  | "company_deactivated"
  | "company_reactivated"
  | "company_manager_changed"
  | "onboarding_started"
  | "onboarding_completed"
  | "risk_status_changed";

export interface OperationalEvent {
  id: string;
  type: OperationalEventType;
  title: string;
  message: string;
  companyId?: string;
  companyName?: string;
  managerName?: string;
  managerEmail?: string;
  createdAt: string;
}

export function getOperationalEvents(): OperationalEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveOperationalEvents(events: OperationalEvent[]): void {
  try {
    // Keep only last 50 events to avoid storage bloat
    const trimmed = events.slice(-50);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function addOperationalEvent(event: Omit<OperationalEvent, "id" | "createdAt">): void {
  const events = getOperationalEvents();
  events.push({
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  });
  saveOperationalEvents(events);
}

export function getDismissedEventIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function dismissOperationalEvent(id: string): void {
  const dismissed = getDismissedEventIds();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_EVENTS_KEY, JSON.stringify(dismissed));
  }
}

export function dismissAllOperationalEvents(ids: string[]): void {
  const dismissed = getDismissedEventIds();
  const merged = [...new Set([...dismissed, ...ids])];
  localStorage.setItem(DISMISSED_EVENTS_KEY, JSON.stringify(merged));
}

export function getActiveOperationalEvents(): OperationalEvent[] {
  const events = getOperationalEvents();
  const dismissed = getDismissedEventIds();
  return events.filter(e => !dismissed.includes(e.id));
}

// ============================================================
// Event emitters — call these from business logic
// ============================================================

export function emitCompanyCreated(companyName: string, companyId: string, managerName?: string, managerEmail?: string): void {
  addOperationalEvent({
    type: "company_created",
    title: "Nova empresa criada",
    message: managerName
      ? `${companyName} foi criada por ${managerName}.`
      : `${companyName} foi criada.`,
    companyId,
    companyName,
    managerName,
    managerEmail,
  });
}

export function emitManagerChanged(companyName: string, companyId: string, newManagerName: string, newManagerEmail: string): void {
  addOperationalEvent({
    type: "company_manager_changed",
    title: "Gerente responsável alterado",
    message: `${companyName} agora é responsabilidade de ${newManagerName}.`,
    companyId,
    companyName,
    managerName: newManagerName,
    managerEmail: newManagerEmail,
  });
}

export function emitOnboardingStarted(companyName: string, companyId: string): void {
  addOperationalEvent({
    type: "onboarding_started",
    title: "Onboarding iniciado",
    message: `${companyName} iniciou o processo de onboarding.`,
    companyId,
    companyName,
  });
}

export function emitOnboardingCompleted(companyName: string, companyId: string): void {
  addOperationalEvent({
    type: "onboarding_completed",
    title: "Onboarding concluído",
    message: `${companyName} concluiu o onboarding com sucesso.`,
    companyId,
    companyName,
  });
}
