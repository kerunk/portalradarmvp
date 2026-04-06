// ============================================================
// Simplified RBAC — Only admin_master (admin_mvp) supported
// ============================================================

export type AdminRole = "admin_master";

export interface AdminPermissions {
  viewAllCompanies: boolean;
  createCompanies: boolean;
  editCompanies: boolean;
  deleteCompanies: boolean;
  accessCompanyMirror: boolean;
  manageAdminUsers: boolean;
  editGlobalShelf: boolean;
  editGlobalManual: boolean;
  editIndicatorSettings: boolean;
  editPlatformSettings: boolean;
  editAdminHelp: boolean;
  viewIndicators: boolean;
  viewReports: boolean;
  viewDashboard: boolean;
  viewAlerts: boolean;
}

const MASTER_PERMISSIONS: AdminPermissions = {
  viewAllCompanies: true,
  createCompanies: true,
  editCompanies: true,
  deleteCompanies: true,
  accessCompanyMirror: true,
  manageAdminUsers: false,
  editGlobalShelf: true,
  editGlobalManual: true,
  editIndicatorSettings: true,
  editPlatformSettings: true,
  editAdminHelp: true,
  viewIndicators: true,
  viewReports: true,
  viewDashboard: true,
  viewAlerts: true,
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin_master: "Administrador Master",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  admin_master: "Controle total da plataforma",
};

export const ADMIN_ROLE_COLORS: Record<AdminRole, string> = {
  admin_master: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export function getPermissions(_role: AdminRole): AdminPermissions {
  return MASTER_PERMISSIONS;
}

export function hasPermission(_role: AdminRole, permission: keyof AdminPermissions): boolean {
  return MASTER_PERMISSIONS[permission];
}

export function getAdminRoleForUser(_email: string): AdminRole {
  return "admin_master";
}

export function getAdminRoleAssignments(): { userId: string; email: string; adminRole: AdminRole }[] {
  return [];
}

export function saveAdminRoleAssignments(_assignments: any[]): void {
  // no-op
}

export function getAssignedCompanies(_email: string): string[] | undefined {
  return undefined;
}

export function addCompanyToManager(_managerEmail: string, _companyId: string): void {
  // no-op
}

export type AdminRoleAssignment = {
  userId: string;
  email: string;
  adminRole: AdminRole;
  assignedCompanyIds?: string[];
};
