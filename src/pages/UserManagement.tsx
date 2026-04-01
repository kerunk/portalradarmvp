import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Search, ShieldCheck, Crown, Briefcase, ChevronRight, Download, CheckCircle2, Copy, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getCompanies, setCompanies } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getCompanyCountForManager, getCompaniesForManager } from "@/lib/portfolioUtils";
import { addOperationalEvent } from "@/lib/operationalEvents";
import { auditUserAction } from "@/lib/auditLog";
import jsPDF from "jspdf";
import {
  type AdminRole,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_COLORS,
  ADMIN_ROLE_DESCRIPTIONS,
  getAdminRoleAssignments,
  saveAdminRoleAssignments,
  getPermissions,
  type AdminRoleAssignment,
} from "@/lib/permissions";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole;
  assignedCompanyIds?: string[];
  active: boolean;
  createdAt: string;
  mustChangePassword?: boolean;
}

const USERS_MGMT_KEY = "mvp_managed_users_v2";
const CREDENTIALS_KEY = "mvp_credentials";

const adminRoleIcons: Record<AdminRole, React.ElementType> = {
  admin_master: Crown,
  admin_mvp: ShieldCheck,
  gerente_conta: Briefcase,
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

function loadUsers(): ManagedUser[] {
  try {
    const stored = localStorage.getItem(USERS_MGMT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}

  const defaults: ManagedUser[] = [
    {
      id: "admin-1",
      name: "Administrador MVP Master",
      email: "admin@radarmvp.com",
      adminRole: "admin_master",
      active: true,
      createdAt: "2024-01-01",
    },
  ];
  localStorage.setItem(USERS_MGMT_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveUsers(users: ManagedUser[]) {
  localStorage.setItem(USERS_MGMT_KEY, JSON.stringify(users));
}

function syncAdminRoles(users: ManagedUser[]) {
  const assignments: AdminRoleAssignment[] = users.map(u => ({
    userId: u.id,
    email: u.email,
    adminRole: u.adminRole,
    assignedCompanyIds: u.assignedCompanyIds,
  }));
  saveAdminRoleAssignments(assignments);
}

function registerUserForLogin(user: ManagedUser, password: string) {
  try {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    const creds = stored ? JSON.parse(stored) : {};
    creds[user.email.toLowerCase()] = {
      password: password,
      mustChangePassword: true,
    };
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (e) {
    console.error("Error registering user for login:", e);
  }
}

function generateCredentialsPDF(name: string, email: string, password: string, role: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(234, 88, 12); // orange
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Radar MVP", pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma de Gestão da Metodologia MVP", pageWidth / 2, 28, { align: "center" });

  // Green accent line
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 40, pageWidth, 3, "F");

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Credenciais de Acesso", pageWidth / 2, 62, { align: "center" });

  // Info box
  const boxY = 75;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(25, boxY, pageWidth - 50, 80, 4, 4, "FD");

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");

  const leftCol = 35;
  const rightCol = 75;
  let y = boxY + 16;

  doc.text("Nome:", leftCol, y);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(name, rightCol, y);

  y += 14;
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Perfil:", leftCol, y);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(role, rightCol, y);

  y += 14;
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Email:", leftCol, y);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(email, rightCol, y);

  y += 14;
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Senha:", leftCol, y);
  doc.setTextColor(234, 88, 12);
  doc.setFont("helvetica", "bold");
  doc.text(password, rightCol, y);

  // Portal URL
  y += 14;
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Portal:", leftCol, y);
  doc.setTextColor(34, 139, 34);
  doc.setFont("helvetica", "bold");
  doc.text(window.location.origin, rightCol, y);

  // Instructions
  const instructY = boxY + 95;
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(25, instructY, pageWidth - 50, 35, 4, 4, "FD");

  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.setFont("helvetica", "bold");
  doc.text("Importante:", 35, instructY + 12);
  doc.setFont("helvetica", "normal");
  doc.text("No primeiro acesso, você será solicitado a alterar sua senha.", 35, instructY + 22);
  doc.text("Escolha uma senha segura com pelo menos 8 caracteres.", 35, instructY + 30);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} — Radar MVP © ${new Date().getFullYear()}`,
    pageWidth / 2,
    280,
    { align: "center" }
  );

  doc.save(`credenciais-${email.split("@")[0]}.pdf`);
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(loadUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [transferManagerEmail, setTransferManagerEmail] = useState("");
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Credential confirmation state
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);

  const currentAdminRole = useMemo(() => {
    const assignments = getAdminRoleAssignments();
    const found = assignments.find(a => a.email.toLowerCase() === currentUser?.email?.toLowerCase());
    return found?.adminRole || "admin_master";
  }, [currentUser]);
  const canManageUsers = getPermissions(currentAdminRole).manageAdminUsers;

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAdminRole, setFormAdminRole] = useState<AdminRole>("admin_mvp");

  const companies = useMemo(() => getCompanies(), []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "all" || u.adminRole === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const openCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormAdminRole("admin_mvp");
    setDialogOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormAdminRole(user.adminRole);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: "Preencha nome e email", variant: "destructive" });
      return;
    }

    if (editingUser) {
      const updated = users.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: formName, email: formEmail, adminRole: formAdminRole }
          : u
      );
      setUsers(updated);
      saveUsers(updated);
      syncAdminRoles(updated);
      toast({ title: "Usuário atualizado com sucesso" });
      setDialogOpen(false);
    } else {
      // Check duplicate email
      if (users.some(u => u.email.toLowerCase() === formEmail.toLowerCase())) {
        toast({ title: "Email já cadastrado", variant: "destructive" });
        return;
      }

      const tempPassword = generateTempPassword();
      const newUser: ManagedUser = {
        id: `user-${Date.now()}`,
        name: formName,
        email: formEmail,
        adminRole: formAdminRole,
        active: true,
        createdAt: new Date().toISOString().split("T")[0],
        mustChangePassword: true,
      };
      const updated = [...users, newUser];
      setUsers(updated);
      saveUsers(updated);
      syncAdminRoles(updated);

      // Register user for login with temp password
      registerUserForLogin(newUser, tempPassword);

      // Show credentials confirmation
      setCreatedCredentials({
        name: formName,
        email: formEmail,
        password: tempPassword,
        role: ADMIN_ROLE_LABELS[formAdminRole],
      });
      setDialogOpen(false);
      setShowCredentials(true);
    }
  };

  const handleDownloadPDF = () => {
    if (!createdCredentials) return;
    generateCredentialsPDF(
      createdCredentials.name,
      createdCredentials.email,
      createdCredentials.password,
      createdCredentials.role
    );
    toast({ title: "PDF de credenciais gerado com sucesso" });
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Login: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Credenciais copiadas" });
  };

  const toggleActive = (userId: string) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, active: !u.active } : u
    );
    setUsers(updated);
    saveUsers(updated);
  };

  // ── Delete user logic ──
  const canDeleteUser = (u: ManagedUser): { allowed: boolean; reason?: string } => {
    // Only admin_master can delete
    if (currentAdminRole !== "admin_master") return { allowed: false, reason: "Apenas o Admin Master pode excluir usuários." };
    // Never delete yourself
    if (u.email.toLowerCase() === currentUser?.email?.toLowerCase()) return { allowed: false, reason: "Não é possível excluir seu próprio usuário." };
    // Never delete the primary admin_master (admin@radarmvp.com)
    if (u.email.toLowerCase() === "admin@radarmvp.com") return { allowed: false, reason: "O Administrador MVP Master principal não pode ser excluído." };
    // Don't delete last admin_master
    if (u.adminRole === "admin_master") {
      const masterCount = users.filter(x => x.adminRole === "admin_master" && x.active).length;
      if (masterCount <= 1) return { allowed: false, reason: "Não é possível excluir o último Admin Master ativo." };
    }
    return { allowed: true };
  };

  const handleInitiateDelete = (u: ManagedUser) => {
    const check = canDeleteUser(u);
    if (!check.allowed) {
      toast({ title: check.reason || "Ação não permitida", variant: "destructive" });
      return;
    }
    setDeleteTarget(u);
    setTransferManagerEmail("");
  };

  const managerCompanyCount = useMemo(() => {
    if (!deleteTarget || deleteTarget.adminRole !== "gerente_conta") return 0;
    return getCompanyCountForManager(deleteTarget.email);
  }, [deleteTarget]);

  const availableTransferManagers = useMemo(() => {
    if (!deleteTarget) return [];
    return users.filter(u =>
      u.id !== deleteTarget.id &&
      u.active &&
      (u.adminRole === "gerente_conta" || u.adminRole === "admin_mvp" || u.adminRole === "admin_master")
    );
  }, [deleteTarget, users]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    // If gerente with companies, require transfer
    if (deleteTarget.adminRole === "gerente_conta" && managerCompanyCount > 0) {
      if (!transferManagerEmail) {
        toast({ title: "Selecione um gerente para transferir a carteira", variant: "destructive" });
        return;
      }
      // Transfer companies
      const targetManager = users.find(u => u.email === transferManagerEmail);
      const allCompanies = getCompanies();
      const updated = allCompanies.map(c =>
        c.ownerEmail?.toLowerCase() === deleteTarget.email.toLowerCase()
          ? { ...c, ownerEmail: transferManagerEmail, ownerName: targetManager?.name || transferManagerEmail }
          : c
      );
      setCompanies(updated);

      addOperationalEvent({
        type: "company_manager_changed",
        title: "Carteira transferida por exclusão de usuário",
        message: `${managerCompanyCount} empresa(s) de ${deleteTarget.name} foram transferidas para ${targetManager?.name || transferManagerEmail}.`,
        managerName: targetManager?.name,
        managerEmail: transferManagerEmail,
      });
    }

    // Remove user
    const updatedUsers = users.filter(u => u.id !== deleteTarget.id);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    syncAdminRoles(updatedUsers);

    // Remove credentials
    try {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        const creds = JSON.parse(stored);
        delete creds[deleteTarget.email.toLowerCase()];
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
      }
    } catch {}

    // Audit event
    addOperationalEvent({
      type: "company_created", // reusing type for audit
      title: "Usuário excluído",
      message: `${deleteTarget.name} (${deleteTarget.email}) foi excluído por ${currentUser?.name || "Admin Master"}.${managerCompanyCount > 0 ? ` Carteira transferida para ${transferManagerEmail}.` : ""}`,
    });

    toast({ title: `${deleteTarget.name} foi excluído com sucesso.` });
    setDeleteTarget(null);
  };

  const adminRoleCounts = useMemo(() => {
    const counts: Record<AdminRole, number> = {
      admin_master: 0,
      admin_mvp: 0,
      gerente_conta: 0,
    };
    users.forEach(u => {
      if (u.active && counts[u.adminRole] !== undefined) counts[u.adminRole]++;
    });
    return counts;
  }, [users]);

  return (
    <AppLayout title="Gestão de Usuários" subtitle="Controle de acesso e perfis administrativos">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(role => (
                  <SelectItem key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canManageUsers && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus size={16} className="mr-2" /> Novo Administrador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Administrador" : "Novo Administrador"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Nome completo</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do administrador" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@empresa.com" type="email" />
                  </div>
                  <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                    <Label className="text-sm font-semibold">Função administrativa</Label>
                    <Select value={formAdminRole} onValueChange={(v) => setFormAdminRole(v as AdminRole)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["admin_mvp", "gerente_conta"] as AdminRole[]).map(role => (
                          <SelectItem key={role} value={role}>
                            {ADMIN_ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {ADMIN_ROLE_DESCRIPTIONS[formAdminRole]}
                    </p>
                    {formAdminRole === "gerente_conta" && (
                      <p className="text-xs text-amber-400">
                        As empresas serão atribuídas automaticamente quando este gerente criar uma nova empresa.
                      </p>
                    )}
                  </div>

                  {!editingUser && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        Uma <strong>senha provisória</strong> será gerada automaticamente. O usuário deverá alterá-la no primeiro acesso.
                      </p>
                    </div>
                  )}

                  <Button onClick={handleSave} className="w-full">
                    {editingUser ? "Salvar Alterações" : "Criar Administrador"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Credentials Confirmation Dialog */}
        <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                Usuário criado com sucesso
              </DialogTitle>
            </DialogHeader>
            {createdCredentials && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nome</span>
                    <span className="text-sm font-medium text-foreground">{createdCredentials.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Perfil</span>
                    <span className="text-sm font-medium text-foreground">{createdCredentials.role}</span>
                  </div>
                  <div className="border-t border-border my-2" />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Login</span>
                    <span className="text-sm font-mono font-medium text-foreground">{createdCredentials.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Senha provisória</span>
                    <span className="text-sm font-mono font-bold text-primary">{createdCredentials.password}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠ O usuário deverá alterar a senha no primeiro acesso. Guarde ou baixe as credenciais antes de fechar.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCopyCredentials} variant="outline" className="flex-1">
                    <Copy size={14} className="mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={handleDownloadPDF} className="flex-1">
                    <Download size={14} className="mr-2" />
                    Baixar credenciais de acesso
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Admin Role Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((role) => {
            const Icon = adminRoleIcons[role];
            return (
              <Card key={role} className="p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", ADMIN_ROLE_COLORS[role].split(" ")[0])}>
                  <Icon size={18} className={ADMIN_ROLE_COLORS[role].split(" ")[1]} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{adminRoleCounts[role]}</p>
                  <p className="text-xs text-muted-foreground">{ADMIN_ROLE_LABELS[role]}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Status</TableHead>
                {canManageUsers && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const Icon = adminRoleIcons[u.adminRole];
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", ADMIN_ROLE_COLORS[u.adminRole])}>
                        <Icon size={12} className="mr-1" />
                        {ADMIN_ROLE_LABELS[u.adminRole]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(u.adminRole === "admin_master" || u.adminRole === "admin_mvp") ? (
                        <span className="text-xs text-muted-foreground">Toda a carteira</span>
                      ) : u.adminRole === "gerente_conta" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/carteira/${u.id}`); }}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {getCompanyCountForManager(u.email)} empresa{getCompanyCountForManager(u.email) !== 1 ? "s" : ""}
                          <ChevronRight size={12} />
                        </button>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.active}
                          onCheckedChange={() => toggleActive(u.id)}
                          disabled={!canManageUsers}
                        />
                        <span className={cn("text-xs", u.active ? "text-emerald-400" : "text-muted-foreground")}>
                          {u.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </TableCell>
                    {canManageUsers && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                            <Pencil size={14} />
                          </Button>
                          {currentAdminRole === "admin_master" && u.email.toLowerCase() !== "admin@radarmvp.com" && u.email.toLowerCase() !== currentUser?.email?.toLowerCase() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleInitiateDelete(u)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManageUsers ? 5 : 4} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle size={20} />
                Excluir Usuário
              </DialogTitle>
            </DialogHeader>
            {deleteTarget && (
              <div className="space-y-4 pt-2">
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm font-medium text-foreground">{deleteTarget.name}</p>
                  <p className="text-xs text-muted-foreground">{deleteTarget.email} · {ADMIN_ROLE_LABELS[deleteTarget.adminRole]}</p>
                </div>

                {deleteTarget.adminRole === "gerente_conta" && managerCompanyCount > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        ⚠ Este gerente possui {managerCompanyCount} empresa{managerCompanyCount > 1 ? "s" : ""} vinculada{managerCompanyCount > 1 ? "s" : ""}.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Antes de excluir, transfira a carteira para outro gerente.
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm">Transferir carteira para:</Label>
                      <Select value={transferManagerEmail} onValueChange={setTransferManagerEmail}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione o novo gerente..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTransferManagers.map(m => (
                            <SelectItem key={m.email} value={m.email}>
                              {m.name} ({ADMIN_ROLE_LABELS[m.adminRole]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                    disabled={deleteTarget.adminRole === "gerente_conta" && managerCompanyCount > 0 && !transferManagerEmail}
                  >
                    {managerCompanyCount > 0 ? "Transferir e Excluir" : "Excluir Usuário"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
