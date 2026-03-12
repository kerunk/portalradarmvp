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
import { Plus, Pencil, Search, ShieldCheck, Eye, Crown, Briefcase, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getCompanies } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getCompanyCountForManager } from "@/lib/portfolioUtils";
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
}

const USERS_MGMT_KEY = "mvp_managed_users_v2";

const adminRoleIcons: Record<AdminRole, React.ElementType> = {
  admin_master: Crown,
  admin_mvp: ShieldCheck,
  gerente_conta: Briefcase,
  visualizador: Eye,
};

function loadUsers(): ManagedUser[] {
  try {
    const stored = localStorage.getItem(USERS_MGMT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}

  const defaults: ManagedUser[] = [
    {
      id: "admin-1",
      name: "Administrador MVP",
      email: "admin@mvp.com",
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

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(loadUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const { user: currentUser } = useAuth();

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
          ? {
              ...u,
              name: formName,
              email: formEmail,
              adminRole: formAdminRole,
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
        adminRole: formAdminRole,
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

  const adminRoleCounts = useMemo(() => {
    const counts: Record<AdminRole, number> = {
      admin_master: 0,
      admin_mvp: 0,
      gerente_conta: 0,
      visualizador: 0,
    };
    users.forEach(u => {
      if (u.active) counts[u.adminRole]++;
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
                        {(Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(role => (
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
                  <Button onClick={handleSave} className="w-full">
                    {editingUser ? "Salvar Alterações" : "Criar Administrador"}
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
                      {u.adminRole === "gerente_conta" && u.assignedCompanyIds?.length ? (
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
                      ) : u.adminRole === "admin_master" || u.adminRole === "admin_mvp" ? (
                        <span className="text-xs text-muted-foreground">Toda a carteira</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
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
      </div>
    </AppLayout>
  );
}
