import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search, Building2, TrendingUp, AlertTriangle,
  ChevronRight, Plus, ShieldCheck, ShieldAlert,
  ArrowUpDown, UserCog, Trash2, PowerOff, Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCompanyDialog } from "@/components/companies/CreateCompanyDialog";
import { getCompanies, setCompanies, type CompanyState } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import {
  getEnrichedCompanies,
  RISK_LABELS, RISK_COLORS,
  STAGE_LABELS, STAGE_COLORS,
  getLastActivityLabel,
  type EnrichedCompany, type RiskLevel, type ImplementationStage,
} from "@/lib/portfolioUtils";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRoleForUser, getAdminRoleAssignments, hasPermission } from "@/lib/permissions";
import { emitManagerChanged, addOperationalEvent } from "@/lib/operationalEvents";
import { useToast } from "@/hooks/use-toast";

const riskIcons = { healthy: ShieldCheck, warning: AlertTriangle, risk: ShieldAlert };

type SortKey = "name" | "maturity" | "risk" | "lastActivity";

export default function Companies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reassignCompany, setReassignCompany] = useState<CompanyState | null>(null);
  const [selectedManager, setSelectedManager] = useState("");
  const [deleteCompany, setDeleteCompany] = useState<CompanyState | null>(null);
  const [deactivateCompany, setDeactivateCompany] = useState<CompanyState | null>(null);

  const adminRole = useMemo(() => getAdminRoleForUser(user?.email || ""), [user?.email]);
  const canReassign = adminRole === "admin_master" || adminRole === "admin_mvp";
  const canDelete = hasPermission(adminRole, "deleteCompanies");

  useEffect(() => {
    if (!createDialogOpen) setRefreshKey(k => k + 1);
  }, [createDialogOpen]);

  const enriched = useMemo(() => getEnrichedCompanies(user?.email, adminRole), [refreshKey, user?.email, adminRole]);

  // Available managers for reassignment
  const availableManagers = useMemo(() => {
    const assignments = getAdminRoleAssignments();
    return assignments.filter(a => a.adminRole === "gerente_conta" || a.adminRole === "admin_mvp" || a.adminRole === "admin_master");
  }, [refreshKey]);

  // Unique owners
  const owners = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach(ec => {
      if (ec.company.ownerName) set.add(ec.company.ownerName);
    });
    return Array.from(set).sort();
  }, [enriched]);

  // Handle manager reassignment
  const handleReassignManager = () => {
    if (!reassignCompany || !selectedManager) return;
    const manager = availableManagers.find(m => m.email === selectedManager);
    if (!manager) return;

    const allCompanies = getCompanies();
    const updated = allCompanies.map(c =>
      c.id === reassignCompany.id
        ? { ...c, ownerEmail: manager.email, ownerName: manager.email === "admin@radarmvp.com" ? "Admin Master" : (availableManagers.find(m => m.email === manager.email)?.email || manager.email) }
        : c
    );
    // Resolve name from managed users
    let managerName = manager.email;
    try {
      const storedUsers = localStorage.getItem("mvp_managed_users_v2");
      if (storedUsers) {
        const managed = JSON.parse(storedUsers) as Array<{ name: string; email: string }>;
        const found = managed.find(u => u.email.toLowerCase() === manager.email.toLowerCase());
        if (found) managerName = found.name;
      }
    } catch {}
    if (manager.email === "admin@radarmvp.com") managerName = "Admin Master";

    const finalCompanies = updated.map(c =>
      c.id === reassignCompany.id ? { ...c, ownerName: managerName } : c
    );
    setCompanies(finalCompanies);

    emitManagerChanged(reassignCompany.name, reassignCompany.id, managerName, manager.email);

    toast({
      title: "Gerente alterado",
      description: `${reassignCompany.name} agora é responsabilidade de ${managerName}.`,
    });
    setReassignCompany(null);
    setSelectedManager("");
    setRefreshKey(k => k + 1);
  };

  // Check if company has data
  const companyHasData = (company: CompanyState): boolean => {
    try {
      const key = `mvp_portal_company_${company.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        const hasCycles = data.cycles && Object.keys(data.cycles).length > 0;
        const hasTurmas = data.turmas && data.turmas.length > 0;
        const hasRecords = data.records && data.records.length > 0;
        const hasEmployees = data.employees && data.employees.length > 0;
        return hasCycles || hasTurmas || hasRecords || hasEmployees;
      }
    } catch {}
    return false;
  };

  // Handle company deletion
  const handleDeleteCompany = () => {
    if (!deleteCompany) return;
    const allCompanies = getCompanies();
    const updated = allCompanies.filter(c => c.id !== deleteCompany.id);
    setCompanies(updated);
    try { localStorage.removeItem(`mvp_portal_company_${deleteCompany.id}`); } catch {}
    addOperationalEvent({
      type: "company_deleted",
      title: "Empresa excluída",
      message: `A empresa ${deleteCompany.name} foi excluída por ${user?.name || user?.email}.`,
      companyId: deleteCompany.id,
      companyName: deleteCompany.name,
    });
    toast({ title: "Empresa excluída", description: `${deleteCompany.name} foi removida da plataforma.` });
    setDeleteCompany(null);
    setRefreshKey(k => k + 1);
  };

  // Handle company deactivation/reactivation
  const handleToggleActive = (company: CompanyState) => {
    const isCurrentlyActive = company.active !== false;
    const allCompanies = getCompanies();
    const updated = allCompanies.map(c =>
      c.id === company.id ? { ...c, active: !isCurrentlyActive } : c
    );
    setCompanies(updated);
    addOperationalEvent({
      type: isCurrentlyActive ? "company_deactivated" : "company_reactivated",
      title: isCurrentlyActive ? "Empresa inativada" : "Empresa reativada",
      message: `A empresa ${company.name} foi ${isCurrentlyActive ? "inativada" : "reativada"} por ${user?.name || user?.email}.`,
      companyId: company.id,
      companyName: company.name,
    });
    toast({
      title: isCurrentlyActive ? "Empresa inativada" : "Empresa reativada",
      description: isCurrentlyActive
        ? `${company.name} foi inativada. O acesso ao portal está bloqueado.`
        : `${company.name} foi reativada e pode acessar o portal novamente.`,
    });
    setDeactivateCompany(null);
    setRefreshKey(k => k + 1);
  };

  // Filter
  const filtered = useMemo(() => {
    return enriched.filter(ec => {
      const matchSearch = ec.company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRisk = filterRisk === "all" || ec.riskLevel === filterRisk;
      const matchStage = filterStage === "all" || ec.stage === filterStage;
      const matchOwner = filterOwner === "all" || (ec.company.ownerName || "Admin Master") === filterOwner;
      return matchSearch && matchRisk && matchStage && matchOwner;
    });
  }, [enriched, searchTerm, filterRisk, filterStage, filterOwner]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name": cmp = a.company.name.localeCompare(b.company.name); break;
        case "maturity": cmp = a.riskData.maturityScore - b.riskData.maturityScore; break;
        case "risk": {
          const order: Record<RiskLevel, number> = { risk: 0, warning: 1, healthy: 2 };
          cmp = order[a.riskLevel] - order[b.riskLevel];
          break;
        }
        case "lastActivity": cmp = (a.lastActivityDays ?? 999) - (b.lastActivityDays ?? 999); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(true); }
  };

  // Stats
  const totalCompanies = enriched.length;
  const riskCt = enriched.filter(e => e.riskLevel === "risk").length;
  const healthyCt = enriched.filter(e => e.riskLevel === "healthy").length;
  const avgMat = enriched.length > 0
    ? Math.round(enriched.reduce((s, e) => s + e.riskData.maturityScore, 0) / enriched.length) : 0;

  return (
    <AppLayout title="Visão MVP" subtitle="Acompanhamento de todas as empresas">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCompanies}</p>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{healthyCt}</p>
                <p className="text-sm text-muted-foreground">Saudáveis</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ShieldAlert size={20} className="text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{riskCt}</p>
                <p className="text-sm text-muted-foreground">Em Risco</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgMat}%</p>
                <p className="text-sm text-muted-foreground">Maturidade Média</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="healthy">Saudável</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="risk">Risco</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estágio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos estágios</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="implementacao">Implementação</SelectItem>
                <SelectItem value="consolidacao">Consolidação</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            {owners.length > 0 && (
              <Select value={filterOwner} onValueChange={setFilterOwner}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus size={16} /> Nova Empresa
          </Button>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Empresa <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("risk")}>
                    Status <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("maturity")}>
                    Maturidade <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>Ciclo Atual</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("lastActivity")}>
                    Última Atividade <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((ec) => {
                const RiskIcon = riskIcons[ec.riskLevel];
                return (
                  <TableRow key={ec.company.id} className="cursor-pointer" onClick={() => navigate(`/empresas/${ec.company.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{ec.company.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{ec.company.name}</p>
                          <p className="text-xs text-muted-foreground">{ec.company.sector} · {ec.company.employees} colab.</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{ec.company.ownerName || "Admin Master"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", STAGE_COLORS[ec.stage])}>
                        {STAGE_LABELS[ec.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs gap-1", RISK_COLORS[ec.riskLevel])}>
                        <RiskIcon size={10} />
                        {RISK_LABELS[ec.riskLevel]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[60px] h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${ec.riskData.maturityScore}%` }} />
                        </div>
                        <span className="text-xs font-medium">{ec.riskData.maturityScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{ec.currentCycle}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs",
                        ec.lastActivityDays !== null && ec.lastActivityDays > 7 ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {getLastActivityLabel(ec.lastActivityDays)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canDelete && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={ec.company.active !== false ? "Inativar empresa" : "Reativar empresa"}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (ec.company.active === false) {
                                  handleToggleActive(ec.company);
                                } else {
                                  setDeactivateCompany(ec.company);
                                }
                              }}
                            >
                              {ec.company.active !== false
                                ? <PowerOff size={14} className="text-muted-foreground" />
                                : <Power size={14} className="text-emerald-500" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Excluir empresa"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteCompany(ec.company);
                              }}
                            >
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          </>
                        )}
                        {canReassign && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Alterar gerente responsável"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReassignCompany(ec.company);
                              setSelectedManager(ec.company.ownerEmail || "");
                            }}
                          >
                            <UserCog size={14} className="text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/empresas/${ec.company.id}`); }}
                        >
                          Ver portal <ChevronRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <CreateCompanyDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {/* Manager Reassignment Dialog */}
        <Dialog open={!!reassignCompany} onOpenChange={(open) => { if (!open) { setReassignCompany(null); setSelectedManager(""); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Alterar Gerente Responsável
              </DialogTitle>
              <DialogDescription>
                {reassignCompany && `Selecione o novo gerente responsável por ${reassignCompany.name}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Gerente Responsável Atual</Label>
                <p className="text-sm font-medium text-foreground">{reassignCompany?.ownerName || "Não atribuído"}</p>
              </div>
              <div className="space-y-2">
                <Label>Novo Gerente Responsável</Label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {availableManagers.map(m => (
                      <SelectItem key={m.email} value={m.email}>
                        {m.email === "admin@radarmvp.com" ? "Admin Master" : m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setReassignCompany(null); setSelectedManager(""); }}>
                  Cancelar
                </Button>
                <Button onClick={handleReassignManager} disabled={!selectedManager}>
                  Confirmar Alteração
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
