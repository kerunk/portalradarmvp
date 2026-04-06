import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Building2, CheckCircle2, Clock, Target, Eye,
  GraduationCap, AlertCircle, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCompanies, setActiveCompany, getState, type TurmaState } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRoleForUser } from "@/lib/permissions";
import { CYCLE_IDS, TURMA_STATUS } from "@/lib/constants";

interface CompanyTurmaRow {
  companyId: string;
  companyName: string;
  turma: TurmaState;
}

export default function AdminTurmas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const adminRole = useMemo(() => getAdminRoleForUser(user?.email || ""), [user?.email]);

  const [filterCompany, setFilterCompany] = useState("all");
  const [filterCycle, setFilterCycle] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { rows, companies, totals } = useMemo(() => {
    const allCompanies = getCompanies().filter(c => c.active !== false && !c.deleted);
    const filtered = allCompanies;

    const rows: CompanyTurmaRow[] = [];
    filtered.forEach(company => {
      setActiveCompany(company.id);
      const state = getState();
      const turmas = state.turmas || [];
      turmas.forEach(t => {
        rows.push({ companyId: company.id, companyName: company.name, turma: t });
      });
    });
    setActiveCompany(null);

    const totals = {
      total: rows.length,
      planned: rows.filter(r => r.turma.status === "planned").length,
      inProgress: rows.filter(r => r.turma.status === "in_progress").length,
      completed: rows.filter(r => r.turma.status === "completed").length,
      totalParticipants: rows.reduce((s, r) => s + (r.turma.participants?.length || 0), 0),
      totalPresent: rows.reduce((s, r) => s + (r.turma.attendance ? Object.values(r.turma.attendance).filter(v => v === "present").length : 0), 0),
    };

    return { rows, companies: filtered, totals };
  }, [adminRole, user?.email]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (filterCompany !== "all" && r.companyId !== filterCompany) return false;
      if (filterCycle !== "all" && r.turma.cycleId !== filterCycle) return false;
      if (filterStatus !== "all" && r.turma.status !== filterStatus) return false;
      return true;
    });
  }, [rows, filterCompany, filterCycle, filterStatus]);

  const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    planned: { label: "Planejada", icon: Clock, color: "bg-muted text-muted-foreground" },
    in_progress: { label: "Em andamento", icon: Target, color: "bg-amber-500/10 text-amber-600" },
    completed: { label: "Concluída", icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600" },
    delayed: { label: "Atrasada", icon: AlertCircle, color: "bg-destructive/10 text-destructive" },
  };

  return (
    <AppLayout title="Turmas — Visão Administrativa" subtitle="Visão consolidada de todas as turmas da carteira">
      <div className="space-y-6 animate-fade-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totals.total}</p>
                <p className="text-xs text-muted-foreground">Total de Turmas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totals.planned}</p>
                <p className="text-xs text-muted-foreground">Planejadas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totals.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totals.completed}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totals.totalParticipants}</p>
                <p className="text-xs text-muted-foreground">Participantes</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Empresa:</span>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ciclo:</span>
              <Select value={filterCycle} onValueChange={setFilterCycle}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {CYCLE_IDS.map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="planned">Planejada</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Facilitador</TableHead>
                <TableHead className="text-center">Participantes</TableHead>
                <TableHead className="text-center">Presenças</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <GraduationCap size={40} className="mx-auto mb-2 opacity-30" />
                    <p>Nenhuma turma encontrada</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map(row => {
                  const sc = statusConfig[row.turma.status] || statusConfig.planned;
                  const StatusIcon = sc.icon;
                  const presences = row.turma.attendance ? Object.values(row.turma.attendance).filter(v => v === "present").length : 0;
                  return (
                    <TableRow key={`${row.companyId}-${row.turma.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-muted-foreground" />
                          <span className="font-medium text-sm">{row.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{row.turma.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{row.turma.cycleId}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.turma.facilitator || "—"}
                      </TableCell>
                      <TableCell className="text-center">{row.turma.participants?.length || 0}</TableCell>
                      <TableCell className="text-center">
                        {presences > 0 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">{presences}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs gap-1", sc.color)}>
                          <StatusIcon size={10} />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/empresas/${row.companyId}?tab=turmas`)}
                          title="Ver no portal da empresa"
                        >
                          <Eye size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
