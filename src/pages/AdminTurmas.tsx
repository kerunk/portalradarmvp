import { useState, useEffect, useMemo } from "react";
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
  GraduationCap, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompanies } from "@/lib/companyService";
import { useAuth } from "@/contexts/AuthContext";
import { CYCLE_IDS } from "@/lib/constants";
import type { Turma } from "@/lib/db";

const sb = supabase as any;

interface CompanyTurmaRow {
  companyId: string;
  companyName: string;
  turma: Turma;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  planned:     { label: "Planejada",    icon: Clock,        color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em andamento", icon: Target,       color: "bg-amber-500/10 text-amber-600" },
  completed:   { label: "Concluída",    icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600" },
  delayed:     { label: "Atrasada",     icon: AlertCircle,  color: "bg-destructive/10 text-destructive" },
};

export default function AdminTurmas() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CompanyTurmaRow[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const [filterCompany, setFilterCompany] = useState("all");
  const [filterCycle, setFilterCycle]     = useState("all");
  const [filterStatus, setFilterStatus]   = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [comps, { data: turmasRaw }] = await Promise.all([
        fetchCompanies(),
        sb.from("turmas").select("*").order("created_at"),
      ]);

      const activeComps = (comps || []).filter((c: any) => c.active !== false && !c.deleted);
      setCompanies(activeComps.map((c: any) => ({ id: c.id, name: c.name })));

      const compMap = Object.fromEntries(activeComps.map((c: any) => [c.id, c.name]));

      const result: CompanyTurmaRow[] = (turmasRaw || []).map((t: any) => {
        let participants: any[] = [];
        let attendance: Record<string, "present" | "absent"> | undefined;
        try { participants = JSON.parse(t.participants_json ?? "[]"); } catch {}
        try { attendance = JSON.parse(t.attendance_json ?? "null") ?? undefined; } catch {}
        return {
          companyId: t.company_id,
          companyName: compMap[t.company_id] || "Empresa",
          turma: {
            id: t.id,
            companyId: t.company_id,
            name: t.name,
            cycleId: t.cycle_id,
            facilitator: t.facilitator ?? "",
            startDate: t.start_date ?? null,
            endDate: t.end_date ?? null,
            trainingDate: t.training_date ?? null,
            status: t.status ?? "planned",
            notes: t.notes ?? "",
            participants,
            attendance,
          } as Turma,
        };
      });

      setRows(result);
      setLoading(false);
    })();
  }, []);

  const filteredRows = useMemo(() => rows.filter(r => {
    if (filterCompany !== "all" && r.companyId !== filterCompany) return false;
    if (filterCycle   !== "all" && r.turma.cycleId !== filterCycle) return false;
    if (filterStatus  !== "all" && r.turma.status  !== filterStatus) return false;
    return true;
  }), [rows, filterCompany, filterCycle, filterStatus]);

  const totals = useMemo(() => ({
    total:            filteredRows.length,
    planned:          filteredRows.filter(r => r.turma.status === "planned").length,
    inProgress:       filteredRows.filter(r => r.turma.status === "in_progress").length,
    completed:        filteredRows.filter(r => r.turma.status === "completed").length,
    totalParticipants: filteredRows.reduce((s, r) => s + (r.turma.participants?.length || 0), 0),
    totalPresent:     filteredRows.reduce((s, r) => s + (r.turma.attendance
      ? Object.values(r.turma.attendance).filter(v => v === "present").length : 0), 0),
  }), [filteredRows]);

  if (loading) {
    return (
      <AppLayout title="Turmas — Visão Administrativa" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Turmas — Visão Administrativa" subtitle="Visão consolidada de todas as turmas da carteira">
      <div className="space-y-6 animate-fade-in">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: GraduationCap, label: "Total Turmas",     value: totals.total },
            { icon: Clock,         label: "Planejadas",        value: totals.planned },
            { icon: Target,        label: "Em andamento",      value: totals.inProgress },
            { icon: CheckCircle2,  label: "Concluídas",        value: totals.completed },
            { icon: Users,         label: "Participantes",     value: totals.totalParticipants },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Empresa:</span>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ciclo:</span>
              <Select value={filterCycle} onValueChange={setFilterCycle}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {CYCLE_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Tabela */}
        <Card>
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
              ) : filteredRows.map(row => {
                const sc = statusConfig[row.turma.status] ?? statusConfig.planned;
                const StatusIcon = sc.icon;
                const presences = row.turma.attendance
                  ? Object.values(row.turma.attendance).filter(v => v === "present").length
                  : 0;
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
                      {presences > 0
                        ? <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">{presences}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs gap-1", sc.color)}>
                        <StatusIcon size={10} />{sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm"
                        onClick={() => navigate(`/empresas/${row.companyId}?tab=turmas`)}>
                        <Eye size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
