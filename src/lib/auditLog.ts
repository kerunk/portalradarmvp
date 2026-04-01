// ============================================================
// Centralized Audit Log
// Records all administrative actions for traceability
// ============================================================

const AUDIT_LOG_KEY = "mvp_audit_log";
const MAX_AUDIT_ENTRIES = 200;

export type AuditAction =
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_activated"
  | "user_deactivated"
  | "company_created"
  | "company_updated"
  | "company_deleted"
  | "company_activated"
  | "company_deactivated"
  | "company_reassigned"
  | "portfolio_transferred"
  | "password_changed"
  | "login_success"
  | "login_failed"
  | "login_locked";

export type EntityType =
  | "user"
  | "company"
  | "turma"
  | "action"
  | "cycle"
  | "record";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorName: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityLabel: string;
  details?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
}

export function getAuditLog(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addAuditEntry(
  entry: Omit<AuditEntry, "id" | "timestamp">
): void {
  try {
    const log = getAuditLog();
    log.push({
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
    // Keep only the most recent entries
    const trimmed = log.slice(-MAX_AUDIT_ENTRIES);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Failed to write audit log:", e);
  }
}

// Convenience helpers
export function auditUserAction(
  actorEmail: string,
  actorName: string,
  action: AuditAction,
  targetEmail: string,
  targetName: string,
  details?: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): void {
  addAuditEntry({
    actorEmail,
    actorName,
    action,
    entityType: "user",
    entityId: targetEmail,
    entityLabel: targetName,
    details,
    beforeSnapshot: before,
    afterSnapshot: after,
  });
}

export function auditCompanyAction(
  actorEmail: string,
  actorName: string,
  action: AuditAction,
  companyId: string,
  companyName: string,
  details?: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): void {
  addAuditEntry({
    actorEmail,
    actorName,
    action,
    entityType: "company",
    entityId: companyId,
    entityLabel: companyName,
    details,
    beforeSnapshot: before,
    afterSnapshot: after,
  });
}
