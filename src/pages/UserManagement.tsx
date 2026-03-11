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
import { UserCog, Plus, Pencil, Search, ShieldCheck, Building2, Eye, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { getCompanies } from "@/lib/storage";

// User profile types
type UserProfile = "admin_mvp" | "admin_cliente" | "facilitador" | "visualizador";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  profile: UserProfile;
  companyId?: string;
  companyName?: string;
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

  // Seed with default users
  const companies = getCompanies();
  const defaults: ManagedUser[] = [
    {
      id: "admin-1",
      name: "Administrador MVP",
      email: "admin@mvp.com",
      profile: "admin_mvp",
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

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(loadUsers);
  const [search, setSearch] = useState("");
  const [filterProfile, setFilterProfile] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProfile, setFormProfile] = useState<UserProfile>("facilitador");
  const [formCompanyId, setFormCompanyId] = useState<string>("");

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
    setFormCompanyId("");
    setDialogOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormProfile(user.profile);
    setFormCompanyId(user.companyId || "");
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
          ? { ...u, name: formName, email: formEmail, profile: formProfile, companyId: formCompanyId || undefined, companyName: companyName || undefined }
          : u
      );
      setUsers(updated);
      saveUsers(updated);
      toast({ title: "Usuário atualizado com sucesso" });
    } else {
      const newUser: ManagedUser = {
        id: `user-${Date.now()}`,
        name: formName,
        email: formEmail,
        profile: formProfile,
        companyId: formCompanyId || undefined,
        companyName: companyName || undefined,
        active: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...users, newUser];
      setUsers(updated);
      saveUsers(updated);
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
                <SelectItem value="admin_mvp">Administrador MVP</SelectItem>
                <SelectItem value="admin_cliente">Admin Cliente</SelectItem>
                <SelectItem value="facilitador">Facilitador</SelectItem>
                <SelectItem value="visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus size={16} className="mr-2" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  <Label>Perfil de acesso</Label>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["admin_mvp", "admin_cliente", "facilitador", "visualizador"] as UserProfile[]).map((p) => {
            const Icon = profileIcons[p];
            const count = users.filter((u) => u.profile === p && u.active).length;
            return (
              <Card key={p} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{profileLabels[p]}</p>
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
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
                    <span className="text-sm text-muted-foreground">{u.companyName || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={u.active} onCheckedChange={() => toggleActive(u.id)} />
                      <span className={cn("text-xs", u.active ? "text-emerald-400" : "text-muted-foreground")}>
                        {u.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
