// ============================================================
// Admin Role-Based Access Control (RBAC) System
// ============================================================

export type AdminRole = "admin_master" | "admin_mvp" | "gerente_conta";

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
  admin_mvp: {
    viewAllCompanies: true,
    viewAssignedCompanies: true,
    createCompanies: true,
    editCompanies: false,
    deleteCompanies: true,
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
    createCompanies: true,
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
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin_master: "Administrador MVP Master",
  admin_mvp: "Administrador MVP",
  gerente_conta: "Gerente de Conta",
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  admin_master: "Controle total da plataforma, incluindo gestão de administradores",
  admin_mvp: "Equipe interna MVP — cria empresas e acompanha a carteira",
  gerente_conta: "Responsável por empresas que criou",
};

export const ADMIN_ROLE_COLORS: Record<AdminRole, string> = {
  admin_master: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  admin_mvp: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  gerente_conta: "bg-amber-500/15 text-amber-400 border-amber-500/30",
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
  assignedCompanyIds?: string[]; // Auto-populated when gerente_conta creates companies
}

export function getAdminRoleAssignments(): AdminRoleAssignment[] {
  try {
    const stored = localStorage.getItem(ADMIN_ROLES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  
  // Default: admin@mvp.com is admin_master
  const defaults: AdminRoleAssignment[] = [
    { userId: "admin-1", email: "admin@radarmvp.com", adminRole: "admin_master" },
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

// Add a company to a gerente_conta's assigned companies
export function addCompanyToManager(managerEmail: string, companyId: string): void {
  const assignments = getAdminRoleAssignments();
  const idx = assignments.findIndex(a => a.email.toLowerCase() === managerEmail.toLowerCase());
  if (idx >= 0 && assignments[idx].adminRole === "gerente_conta") {
    const current = assignments[idx].assignedCompanyIds || [];
    if (!current.includes(companyId)) {
      assignments[idx].assignedCompanyIds = [...current, companyId];
      saveAdminRoleAssignments(assignments);
    }
  }
}
