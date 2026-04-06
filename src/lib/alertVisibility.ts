// ============================================================
// Alert Visibility Layer
// Central function to filter alerts/notifications by user role and scope
// ============================================================

import type { User } from "@/contexts/AuthContext";
import type { AdminNotification } from "./adminNotifications";
import type { EnhancedSmartAlert } from "./governance";
import type { OperationalEvent } from "./operationalEvents";
import { generateAdminNotifications } from "./adminNotifications";
import { gerarAlertasInteligentes } from "./governance";
import { getCompanies } from "./storage";
import { getAdminRoleForUser, type AdminRole } from "./permissions";

// Scope for alerts
export type AlertScope = "GLOBAL" | "PORTFOLIO" | "COMPANY";

// Unified alert for display
export interface UnifiedAlert {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  scope: AlertScope;
  companyId?: string;
  companyName?: string;
  navigateTo?: string;
  createdAt: string;
  type: "operational" | "strategic" | "smart";
  dismissible: boolean;
}

// Event types that are ADMIN-ONLY (never show to clients)
const ADMIN_ONLY_EVENT_TYPES: string[] = [
  "company_deactivated",
  "company_reactivated",
  "company_deleted",
  "user_created",
  "user_deleted",
  "user_deactivated",
  "portfolio_transferred",
  "company_manager_changed",
];

/**
 * Central function to get visible alerts for the current user.
 * Respects role, tenant isolation, and portfolio scope.
 */
export function getVisibleAlertsForUser(user: User | null): UnifiedAlert[] {
  if (!user) return [];

  const isClient = user.role === "admin_empresa";

  if (isClient) {
    return getClientAlerts(user);
  }

  // Admin roles
  const adminRole = getAdminRoleForUser(user.email);
  return getAdminAlerts(user, adminRole);
}

/**
 * Client: only sees company-scoped smart alerts (from governance engine)
 * These are already scoped by activeCompany in getState()
 */
function getClientAlerts(user: User): UnifiedAlert[] {
  const smartAlerts = gerarAlertasInteligentes();

  return smartAlerts.map(alert => ({
    id: `smart-${alert.id}`,
    title: alert.title,
    message: alert.description,
    severity: alert.severity === "danger" ? "critical" : alert.severity === "warning" ? "warning" : "info",
    scope: "COMPANY" as AlertScope,
    companyId: user.companyId,
    companyName: user.companyName,
    navigateTo: alert.navigateTo,
    createdAt: alert.createdAt,
    type: "smart" as const,
    dismissible: alert.autoResolves,
  }));
}

/**
 * Admin/Gerente: sees strategic notifications filtered by role
 */
function getAdminAlerts(user: User, adminRole: string): UnifiedAlert[] {
  const notifications = generateAdminNotifications(user.email, adminRole);

  return notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    severity: n.priority === "insight" ? "info" : n.priority,
    scope: n.companyId ? "COMPANY" as AlertScope : "GLOBAL" as AlertScope,
    companyId: n.companyId,
    companyName: n.companyName,
    navigateTo: n.navigateTo,
    createdAt: n.time,
    type: "strategic" as const,
    dismissible: true,
  }));
}

/**
 * Checks if an operational event should be visible to a given user
 */
export function isEventVisibleToUser(
  event: OperationalEvent,
  user: User
): boolean {
  const isClient = user.role === "admin_empresa";

  if (isClient && ADMIN_ONLY_EVENT_TYPES.includes(event.type)) {
    return false;
  }

  if (isClient) {
    return event.companyId === user.companyId;
  }

  // Admin master sees everything
  return true;
}
