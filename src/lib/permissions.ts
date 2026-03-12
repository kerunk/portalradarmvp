// ============================================================
// Admin Role-Based Access Control (RBAC) System
// ============================================================

export type AdminRole = "admin_master" | "admin_operacional" | "gerente_conta" | "observador";

export interface AdminPermissions {
  // Companies
  viewAllCompanies: boolean;
  viewAssignedCompanies: boolean;
  createCompanies: boolean;
  editCompanies: boolean;
  deleteCompanies: boolean;
  accessCompanyMirror: boolean;

  // Users
  manageAdminUsers: boolean;

  // Global config
  editGlobalShelf: boolean;
  editGlobalManual: boolean;
  editIndicatorSettings: boolean;
  editPlatformSettings: boolean;
  editAdminHelp: boolean;

  // Intelligence
  viewIndicators: boolean;
  viewReports: boolean;
  viewDashboard: boolean;
  viewAlerts: boolean;
}

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  admin_master: {
    viewAllCompanies: true,
    viewAssignedCompanies: true,
    createCompanies: true,
    editCompanies: true,
    deleteCompanies: true,
    accessCompanyMirror: true,
    manageAdminUsers: true,
    editGlobalShelf: true,
    editGlobalManual: true,
    editIndicatorSettings: true,
    editPlatformSettings: true,
    editAdminHelp: true,
    viewIndicators: true,
    viewReports: true,
    viewDashboard: true,
    viewAlerts: true,
  },
  admin_operacional: {
    viewAllCompanies: true,
    viewAssignedCompanies: true,
    createCompanies: false,
    editCompanies: false,
    deleteCompanies: false,
    accessCompanyMirror: true,
    manageAdminUsers: false,
    editGlobalShelf: false,
    editGlobalManual: false,
    editIndicatorSettings: false,
    editPlatformSettings: false,
    editAdminHelp: false,
    viewIndicators: true,
    viewReports: true,
    viewDashboard: true,
    viewAlerts: true,
  },
  gerente_conta: {
    viewAllCompanies: false,
    viewAssignedCompanies: true,
    createCompanies: false,
    editCompanies: false,
    deleteCompanies: false,
    accessCompanyMirror: true,
    manageAdminUsers: false,
    editGlobalShelf: false,
    editGlobalManual: false,
    editIndicatorSettings: false,
    editPlatformSettings: false,
    editAdminHelp: false,
    viewIndicators: true,
    viewReports: true,
    viewDashboard: true,
    viewAlerts: true,
  },
  observador: {
    viewAllCompanies: false,
    viewAssignedCompanies: false,
    createCompanies: false,
    editCompanies: false,
    deleteCompanies: false,
    accessCompanyMirror: false,
    manageAdminUsers: false,
    editGlobalShelf: false,
    editGlobalManual: false,
    editIndicatorSettings: false,
    editPlatformSettings: false,
    editAdminHelp: false,
    viewIndicators: true,
    viewReports: true,
    viewDashboard: true,
    viewAlerts: false,
  },
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin_master: "Admin Master",
  admin_operacional: "Admin Operacional",
  gerente_conta: "Gerente de Conta",
  observador: "Observador",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  admin_master: "Controle total da plataforma",
  admin_operacional: "Acompanha a carteira em modo leitura",
  gerente_conta: "Responsável por empresas específicas",
  observador: "Visualização de dashboards e relatórios",
};

export const ADMIN_ROLE_COLORS: Record<AdminRole, string> = {
  admin_master: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  admin_operacional: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  gerente_conta: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  observador: "bg-muted text-muted-foreground border-border",
};

export function getPermissions(role: AdminRole): AdminPermissions {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: AdminRole, permission: keyof AdminPermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Storage key for admin role assignments
const ADMIN_ROLES_KEY = "mvp_admin_roles";

export interface AdminRoleAssignment {
  userId: string;
  email: string;
  adminRole: AdminRole;
  assignedCompanyIds?: string[]; // Only for gerente_conta
}

export function getAdminRoleAssignments(): AdminRoleAssignment[] {
  try {
    const stored = localStorage.getItem(ADMIN_ROLES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  
  // Default: admin@mvp.com is admin_master
  const defaults: AdminRoleAssignment[] = [
    { userId: "admin-1", email: "admin@mvp.com", adminRole: "admin_master" },
  ];
  localStorage.setItem(ADMIN_ROLES_KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveAdminRoleAssignments(assignments: AdminRoleAssignment[]): void {
  localStorage.setItem(ADMIN_ROLES_KEY, JSON.stringify(assignments));
}

export function getAdminRoleForUser(email: string): AdminRole {
  const assignments = getAdminRoleAssignments();
  const found = assignments.find(a => a.email.toLowerCase() === email.toLowerCase());
  return found?.adminRole || "admin_master"; // Default to master for backward compat
}

export function getAssignedCompanies(email: string): string[] | undefined {
  const assignments = getAdminRoleAssignments();
  const found = assignments.find(a => a.email.toLowerCase() === email.toLowerCase());
  return found?.assignedCompanyIds;
}
