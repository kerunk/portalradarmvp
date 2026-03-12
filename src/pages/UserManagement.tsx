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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Search, ShieldCheck, Building2, Eye, Users, Crown, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getCompanies } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
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

// User profile types (kept for backward compat + client roles)
type UserProfile = "admin_mvp" | "admin_cliente" | "facilitador" | "visualizador";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
  adminRole?: AdminRole; // New: specific admin sub-role
  companyId?: string;
  companyName?: string;
  assignedCompanyIds?: string[]; // For gerente_conta
  active: boolean;
  createdAt: string;
}

const USERS_MGMT_KEY = "mvp_managed_users";

const profileLabels: Record<UserProfile, string> = {
  admin_mvp: "Administrador MVP",
  admin_cliente: "Administrador Cliente",
  facilitador: "Facilitador",
  visualizador: "Visualizador",
};

const profileColors: Record<UserProfile, string> = {
  admin_mvp: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  admin_cliente: "bg-primary/15 text-primary border-primary/30",
  facilitador: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  visualizador: "bg-muted text-muted-foreground border-border",
};

const adminRoleIcons: Record<AdminRole, React.ElementType> = {
  admin_master: Crown,
  admin_operacional: ShieldCheck,
  gerente_conta: Briefcase,
  observador: Eye,
};

const profileIcons: Record<UserProfile, React.ElementType> = {
  admin_mvp: ShieldCheck,
  admin_cliente: Building2,
  facilitador: Users,
  visualizador: Eye,
};

function loadUsers(): ManagedUser[] {
  try {
    const stored = localStorage.getItem(USERS_MGMT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}

  const companies = getCompanies();
  const defaults: ManagedUser[] = [
    {
      id: "admin-1",
      name: "Administrador MVP",
      email: "admin@mvp.com",
      profile: "admin_mvp",
      adminRole: "admin_master",
      active: true,
      createdAt: "2024-01-01",
    },
    ...companies.map((c) => ({
      id: `user-${c.id}`,
      name: c.adminName,
      email: c.adminEmail,
      profile: "admin_cliente" as UserProfile,
      companyId: c.id,
      companyName: c.name,
      active: true,
      createdAt: c.createdAt,
    })),
  ];
  localStorage.setItem(USERS_MGMT_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveUsers(users: ManagedUser[]) {
  localStorage.setItem(USERS_MGMT_KEY, JSON.stringify(users));
}

// Sync admin role assignments from managed users
function syncAdminRoles(users: ManagedUser[]) {
  const assignments: AdminRoleAssignment[] = users
    .filter(u => u.profile === "admin_mvp" && u.adminRole)
    .map(u => ({
      userId: u.id,
      email: u.email,
      adminRole: u.adminRole!,
      assignedCompanyIds: u.assignedCompanyIds,
    }));
  saveAdminRoleAssignments(assignments);
}

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(loadUsers);
  const [search, setSearch] = useState("");
  const [filterProfile, setFilterProfile] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const { user: currentUser } = useAuth();

  // Check if current admin can manage users
  const currentAdminRole = useMemo(() => {
    const assignments = getAdminRoleAssignments();
    const found = assignments.find(a => a.email.toLowerCase() === currentUser?.email?.toLowerCase());
    return found?.adminRole || "admin_master";
  }, [currentUser]);
  const canManageUsers = getPermissions(currentAdminRole).manageAdminUsers;

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProfile, setFormProfile] = useState<UserProfile>("facilitador");
  const [formAdminRole, setFormAdminRole] = useState<AdminRole>("admin_operacional");
  const [formCompanyId, setFormCompanyId] = useState<string>("");
  const [formAssignedCompanyIds, setFormAssignedCompanyIds] = useState<string[]>([]);

  const companies = useMemo(() => getCompanies(), []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchProfile = filterProfile === "all" || u.profile === filterProfile;
      return matchSearch && matchProfile;
    });
  }, [users, search, filterProfile]);

  const openCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormProfile("facilitador");
    setFormAdminRole("admin_operacional");
    setFormCompanyId("");
    setFormAssignedCompanyIds([]);
    setDialogOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormProfile(user.profile);
    setFormAdminRole(user.adminRole || "admin_operacional");
    setFormCompanyId(user.companyId || "");
    setFormAssignedCompanyIds(user.assignedCompanyIds || []);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast({ title: "Preencha nome e email", variant: "destructive" });
      return;
    }

    const companyName = companies.find((c) => c.id === formCompanyId)?.name;

    if (editingUser) {
      const updated = users.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: formName,
              email: formEmail,
              profile: formProfile,
              adminRole: formProfile === "admin_mvp" ? formAdminRole : undefined,
              companyId: formCompanyId || undefined,
              companyName: companyName || undefined,
              assignedCompanyIds: formProfile === "admin_mvp" && formAdminRole === "gerente_conta" ? formAssignedCompanyIds : undefined,
            }
          : u
      );
      setUsers(updated);
      saveUsers(updated);
      syncAdminRoles(updated);
      toast({ title: "Usuário atualizado com sucesso" });
    } else {
      const newUser: ManagedUser = {
        id: `user-${Date.now()}`,
        name: formName,
        email: formEmail,
        profile: formProfile,
        adminRole: formProfile === "admin_mvp" ? formAdminRole : undefined,
        companyId: formCompanyId || undefined,
        companyName: companyName || undefined,
        assignedCompanyIds: formProfile === "admin_mvp" && formAdminRole === "gerente_conta" ? formAssignedCompanyIds : undefined,
        active: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...users, newUser];
      setUsers(updated);
      saveUsers(updated);
      syncAdminRoles(updated);
      toast({ title: "Usuário criado com sucesso" });
    }
    setDialogOpen(false);
  };

  const toggleActive = (userId: string) => {
    const updated = users.map((u) =>
      u.id === userId ? { ...u, active: !u.active } : u
    );
    setUsers(updated);
    saveUsers(updated);
  };

  const toggleCompanyAssignment = (companyId: string) => {
    setFormAssignedCompanyIds(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  // Stats for admin roles
  const adminRoleCounts = useMemo(() => {
    const counts: Record<AdminRole, number> = {
      admin_master: 0,
      admin_operacional: 0,
      gerente_conta: 0,
      observador: 0,
    };
    users.forEach(u => {
      if (u.profile === "admin_mvp" && u.adminRole && u.active) {
        counts[u.adminRole]++;
      }
    });
    return counts;
  }, [users]);

  return (
    <AppLayout title="Gestão de Usuários" subtitle="Controle de acesso e perfis da plataforma">
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
            <Select value={filterProfile} onValueChange={setFilterProfile}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="admin_mvp">Administradores MVP</SelectItem>
                <SelectItem value="admin_cliente">Admin Cliente</SelectItem>
                <SelectItem value="facilitador">Facilitador</SelectItem>
                <SelectItem value="visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canManageUsers && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}>
                  <Plus size={16} className="mr-2" /> Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Nome completo</Label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome do usuário" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@empresa.com" type="email" />
                  </div>
                  <div>
                    <Label>Tipo de perfil</Label>
                    <Select value={formProfile} onValueChange={(v) => setFormProfile(v as UserProfile)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin_mvp">Administrador MVP</SelectItem>
                        <SelectItem value="admin_cliente">Administrador Cliente</SelectItem>
                        <SelectItem value="facilitador">Facilitador</SelectItem>
                        <SelectItem value="visualizador">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Admin role sub-selection */}
                  {formProfile === "admin_mvp" && (
                    <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                      <Label className="text-sm font-semibold">Função administrativa</Label>
                      <Select value={formAdminRole} onValueChange={(v) => setFormAdminRole(v as AdminRole)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(role => (
                            <SelectItem key={role} value={role}>
                              <div className="flex flex-col">
                                <span>{ADMIN_ROLE_LABELS[role]}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {ADMIN_ROLE_DESCRIPTIONS[formAdminRole]}
                      </p>

                      {/* Company assignment for Gerente de Conta */}
                      {formAdminRole === "gerente_conta" && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-sm">Empresas atribuídas</Label>
                          <div className="max-h-40 overflow-y-auto space-y-2 border border-border rounded-md p-2 bg-background">
                            {companies.map((c) => (
                              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                                <Checkbox
                                  checked={formAssignedCompanyIds.includes(c.id)}
                                  onCheckedChange={() => toggleCompanyAssignment(c.id)}
                                />
                                <Building2 size={14} className="text-muted-foreground" />
                                {c.name}
                              </label>
                            ))}
                            {companies.length === 0 && (
                              <p className="text-xs text-muted-foreground p-2">Nenhuma empresa cadastrada</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(formProfile === "admin_cliente" || formProfile === "facilitador" || formProfile === "visualizador") && (
                    <div>
                      <Label>Empresa vinculada</Label>
                      <Select value={formCompanyId} onValueChange={setFormCompanyId}>
                        <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleSave} className="w-full">
                    {editingUser ? "Salvar Alterações" : "Criar Usuário"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

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
                <TableHead>Perfil</TableHead>
                <TableHead>Função Admin</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                {canManageUsers && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", profileColors[u.profile])}>
                      {profileLabels[u.profile]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.profile === "admin_mvp" && u.adminRole ? (
                      <Badge variant="outline" className={cn("text-xs", ADMIN_ROLE_COLORS[u.adminRole])}>
                        {ADMIN_ROLE_LABELS[u.adminRole]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.profile === "admin_mvp" && u.adminRole === "gerente_conta" && u.assignedCompanyIds?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {u.assignedCompanyIds.map(cId => {
                          const comp = companies.find(c => c.id === cId);
                          return comp ? (
                            <Badge key={cId} variant="outline" className="text-[10px] py-0">
                              {comp.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{u.companyName || "—"}</span>
                    )}
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
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                        <Pencil size={14} />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManageUsers ? 6 : 5} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
