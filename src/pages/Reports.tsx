import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Users,
  Target,
  Shield,
  GraduationCap,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateExecutiveReport,
  generateTurmaReport,
  generateNucleoReport,
  generateCoverageReport,
  generateCycleReport,
  getAvailableFilters,
  type ExecutiveReportData,
} from "@/lib/reportData";
import {
  exportExecutivePDF,
  exportTurmaPDF,
  exportCoveragePDF,
  exportNucleoPDF,
  exportCyclePDF,
  exportExecutiveExcel,
  exportTurmaExcel,
  exportCoverageExcel,
  exportNucleoExcel,
  exportCycleExcel,
} from "@/lib/reportExport";
import { toast } from "@/hooks/use-toast";

type ReportType = "executive" | "turmas" | "nucleo" | "coverage" | "cycle";

const REPORT_TYPES: { id: ReportType; label: string; icon: typeof FileText; description: string }[] = [
  { id: "executive", label: "Executivo Geral", icon: BarChart3, description: "Visão completa da implementação" },
  { id: "turmas", label: "Turmas", icon: GraduationCap, description: "Treinamentos e presenças" },
  { id: "nucleo", label: "Núcleo", icon: Shield, description: "Integrantes e ações atribuídas" },
  { id: "coverage", label: "Cobertura", icon: Users, description: "Colaboradores treinados vs base" },
  { id: "cycle", label: "Por Ciclo", icon: Target, description: "Detalhamento por ciclo MVP" },
];

export default function Reports() {
  const { user } = useAuth();
  const companyId = user?.companyId || "company-1";
  const companyName = user?.companyName || "Empresa";

  const [activeReport, setActiveReport] = useState<ReportType>("executive");
  const [filterCycle, setFilterCycle] = useState<string>("all");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterFacilitator, setFilterFacilitator] = useState<string>("all");

  const filters = useMemo(() => getAvailableFilters(companyId), [companyId]);
  const executiveData = useMemo(() => generateExecutiveReport(companyId, companyName), [companyId, companyName]);

  const handleExportPDF = () => {
    try {
      const reportFilters = {
        cycleId: filterCycle !== "all" ? filterCycle : undefined,
        sector: filterSector !== "all" ? filterSector : undefined,
        facilitator: filterFacilitator !== "all" ? filterFacilitator : undefined,
      };

      switch (activeReport) {
        case "executive":
          exportExecutivePDF(executiveData);
          break;
        case "turmas":
          exportTurmaPDF(generateTurmaReport(companyId, reportFilters), companyName);
          break;
        case "nucleo":
          exportNucleoPDF(generateNucleoReport(companyId), companyName);
          break;
        case "coverage":
          exportCoveragePDF(generateCoverageReport(companyId), companyName);
          break;
        case "cycle":
          if (filterCycle !== "all") {
            exportCyclePDF(generateCycleReport(filterCycle), companyName);
          } else {
            exportExecutivePDF(executiveData);
          }
          break;
      }
      toast({ title: "PDF exportado com sucesso!" });
    } catch (e) {
      toast({ title: "Erro ao exportar PDF", variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    try {
      const reportFilters = {
        cycleId: filterCycle !== "all" ? filterCycle : undefined,
        sector: filterSector !== "all" ? filterSector : undefined,
        facilitator: filterFacilitator !== "all" ? filterFacilitator : undefined,
      };

      switch (activeReport) {
        case "executive":
          exportExecutiveExcel(executiveData);
          break;
        case "turmas":
          exportTurmaExcel(generateTurmaReport(companyId, reportFilters), companyName);
          break;
        case "nucleo":
          exportNucleoExcel(generateNucleoReport(companyId), companyName);
          break;
        case "coverage":
          exportCoverageExcel(generateCoverageReport(companyId), companyName);
          break;
        case "cycle":
          if (filterCycle !== "all") {
            exportCycleExcel(generateCycleReport(filterCycle), companyName);
          } else {
            exportExecutiveExcel(executiveData);
          }
          break;
      }
      toast({ title: "Excel exportado com sucesso!" });
    } catch (e) {
      toast({ title: "Erro ao exportar Excel", variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Relatórios" subtitle="Relatórios executivos e acompanhamento">
      <div className="space-y-6 animate-fade-in">
        {/* Report type selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {REPORT_TYPES.map((rt) => {
            const Icon = rt.icon;
            const isActive = activeReport === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => setActiveReport(rt.id)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <Icon size={20} className={cn("mb-2", isActive ? "text-primary-foreground" : "text-primary")} />
                <p className={cn("text-sm font-semibold", isActive ? "text-primary-foreground" : "text-foreground")}>{rt.label}</p>
                <p className={cn("text-xs mt-0.5", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>{rt.description}</p>
              </button>
            );
          })}
        </div>

        {/* Filters and actions bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(activeReport === "turmas" || activeReport === "cycle" || activeReport === "executive") && (
                <Select value={filterCycle} onValueChange={setFilterCycle}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os ciclos</SelectItem>
                    {filters.cycles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(activeReport === "turmas" || activeReport === "coverage") && filters.sectors.length > 0 && (
                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os setores</SelectItem>
                    {filters.sectors.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {activeReport === "turmas" && filters.facilitators.length > 0 && (
                <Select value={filterFacilitator} onValueChange={setFilterFacilitator}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Facilitador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os facilitadores</SelectItem>
                    {filters.facilitators.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportPDF} className="btn-primary-gradient">
                <Download size={16} className="mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={handleExportExcel} variant="outline">
                <FileSpreadsheet size={16} className="mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Report content */}
        {activeReport === "executive" && <ExecutivePreview data={executiveData} />}
        {activeReport === "turmas" && <TurmasPreview companyId={companyId} filterCycle={filterCycle} filterFacilitator={filterFacilitator} />}
        {activeReport === "nucleo" && <NucleoPreview companyId={companyId} />}
        {activeReport === "coverage" && <CoveragePreview companyId={companyId} />}
        {activeReport === "cycle" && <CyclePreview filterCycle={filterCycle} />}
      </div>
    </AppLayout>
  );
}

// ============ EXECUTIVE PREVIEW ============
function ExecutivePreview({ data }: { data: ExecutiveReportData }) {
  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-foreground">Resumo Executivo — {data.companyName}</h2>
            <p className="text-sm text-muted-foreground">{data.period} · Fase atual: {data.currentPhase}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <MetricMini label="Colaboradores" value={data.activePop} />
          <MetricMini label="Núcleo" value={data.nucleoCount} />
          <MetricMini label="Facilitadores" value={data.facilitators} />
          <MetricMini label="Cobertura" value={`${data.coveragePercent}%`} color={data.coveragePercent >= 60 ? "success" : "warning"} />
          <MetricMini label="Ações" value={`${data.completedActions}/${data.totalActions}`} />
          <MetricMini label="Atrasadas" value={data.delayedActions} color={data.delayedActions > 0 ? "destructive" : "success"} />
          <MetricMini label="Ciclos" value={`${data.closedCycles}/${data.totalCycles}`} />
          <MetricMini label="Maturidade" value={data.maturityScore} subtitle={data.maturityLevel} />
        </div>
      </Card>

      {/* Training and execution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" /> Treinamento
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <MetricMini label="Turmas realizadas" value={`${data.turmasRealizadas}/${data.turmasTotal}`} />
            <MetricMini label="Pessoas treinadas" value={data.pessoasTreinadas} />
            <MetricMini label="Presenças" value={data.totalPresences} />
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target size={18} className="text-primary" /> Execução
          </h3>
          <div className="space-y-2">
            <ProgressRow label="Concluídas" value={data.completedActions} total={data.totalActions} color="bg-success" />
            <ProgressRow label="Em andamento" value={data.inProgressActions} total={data.totalActions} color="bg-primary" />
            <ProgressRow label="Atrasadas" value={data.delayedActions} total={data.totalActions} color="bg-destructive" />
            <ProgressRow label="Pendentes" value={data.pendingActions} total={data.totalActions} color="bg-warning" />
          </div>
        </Card>
      </div>

      {/* Sector distribution */}
      {data.populationBySector.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" /> Distribuição por Setor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.populationBySector.map((s) => {
              const pct = s.count > 0 ? Math.round((s.trained / s.count) * 100) : 0;
              return (
                <div key={s.sector} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground w-32 truncate">{s.sector}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", pct >= 60 ? "bg-success" : pct >= 30 ? "bg-warning" : "bg-primary")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-24 text-right">{s.trained}/{s.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Cycle details */}
      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target size={18} className="text-primary" /> Ciclos MVP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.cycleDetails.map((c) => {
            const statusColors: Record<string, string> = {
              closed: "border-success/40 bg-success/5",
              ready_to_close: "border-primary/40 bg-primary/5",
              in_progress: "border-warning/40 bg-warning/5",
              pending: "border-border bg-muted/30",
            };
            const statusLabels: Record<string, string> = {
              closed: "Encerrado",
              ready_to_close: "Pronto",
              in_progress: "Em andamento",
              pending: "Pendente",
            };
            return (
              <div key={c.cycleId} className={cn("p-3 rounded-lg border", statusColors[c.status] || "border-border")}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-foreground">{c.cycleId} — {c.phaseName}</span>
                  <Badge variant="outline" className="text-xs">{statusLabels[c.status] || c.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.completionPercent}% · {c.completedActions}/{c.totalActions} ações · {c.turmasCompleted}/{c.turmasTotal} turmas</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-warning" /> Insights Inteligentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.insights.map((insight, i) => {
              const config = {
                positive: { icon: CheckCircle2, bg: "bg-success/10 border-success/20", iconColor: "text-success" },
                warning: { icon: AlertTriangle, bg: "bg-warning/10 border-warning/20", iconColor: "text-warning" },
                reinforcement: { icon: Lightbulb, bg: "bg-primary/10 border-primary/20", iconColor: "text-primary" },
              }[insight.type];
              const Icon = config.icon;
              return (
                <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", config.bg)}>
                  <Icon size={18} className={cn("flex-shrink-0 mt-0.5", config.iconColor)} />
                  <p className="text-sm text-foreground">{insight.message}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ TURMAS PREVIEW ============
function TurmasPreview({ companyId, filterCycle, filterFacilitator }: { companyId: string; filterCycle: string; filterFacilitator: string }) {
  const data = useMemo(() => generateTurmaReport(companyId, {
    cycleId: filterCycle !== "all" ? filterCycle : undefined,
    facilitator: filterFacilitator !== "all" ? filterFacilitator : undefined,
  }), [companyId, filterCycle, filterFacilitator]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total de turmas" value={data.turmas.length} icon={GraduationCap} />
        <MetricCard label="Participantes" value={data.totalParticipants} icon={Users} />
        <MetricCard label="Presenças" value={data.totalPresences} icon={CheckCircle2} color="success" />
        <MetricCard label="Faltas" value={data.totalAbsences} icon={AlertTriangle} color="destructive" />
      </div>
      {data.turmas.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma turma encontrada com os filtros selecionados.</Card>
      ) : (
        data.turmas.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-foreground">{t.name}</h4>
                <p className="text-xs text-muted-foreground">Ciclo {t.cycleId} · Facilitador: {t.facilitator} · {t.trainingDate ? new Date(t.trainingDate).toLocaleDateString('pt-BR') : 'Sem data'}</p>
              </div>
              <Badge variant="outline">{t.presentCount}/{t.participantCount} presentes</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
              {t.participants.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm px-2 py-1 rounded bg-muted/50">
                  <span className="text-foreground truncate">{p.name} <span className="text-muted-foreground">({p.sector})</span></span>
                  <span className={cn(
                    "text-xs font-medium",
                    p.attendance === "Presente" ? "text-success" : p.attendance === "Faltou" ? "text-destructive" : "text-warning"
                  )}>{p.attendance}</span>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ============ NUCLEO PREVIEW ============
function NucleoPreview({ companyId }: { companyId: string }) {
  const data = useMemo(() => generateNucleoReport(companyId), [companyId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Integrantes" value={data.totalMembers} icon={Shield} />
        <MetricCard label="Com ações" value={data.membersWithActions} icon={Target} />
        <MetricCard label="Ações atribuídas" value={data.totalActionsAssigned} icon={FileText} />
        <MetricCard label="Concluídas" value={data.completedActions} icon={CheckCircle2} color="success" />
      </div>
      {data.members.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum integrante do núcleo cadastrado.</Card>
      ) : (
        <Card className="p-4">
          <div className="space-y-2">
            {data.members.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.sector} · {m.role}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-foreground">{m.actionsCompleted}/{m.actionsAssigned} ações</span>
                  {m.actionsDelayed > 0 && (
                    <Badge variant="destructive" className="text-xs">{m.actionsDelayed} atrasada(s)</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ COVERAGE PREVIEW ============
function CoveragePreview({ companyId }: { companyId: string }) {
  const data = useMemo(() => generateCoverageReport(companyId), [companyId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Base ativa" value={data.totalPopulation} icon={Users} />
        <MetricCard label="Treinados" value={data.trainedCount} icon={CheckCircle2} color="success" />
        <MetricCard label="Não treinados" value={data.notTrainedCount} icon={AlertTriangle} color="destructive" />
        <MetricCard label="Cobertura" value={`${data.coveragePercent}%`} icon={TrendingUp} color={data.coveragePercent >= 60 ? "success" : "warning"} />
      </div>

      {data.bySector.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-3">Cobertura por Setor</h3>
          <div className="space-y-2">
            {data.bySector.map((s) => (
              <div key={s.sector} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-28 truncate">{s.sector}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", s.percent >= 60 ? "bg-success" : s.percent >= 30 ? "bg-warning" : "bg-primary")} style={{ width: `${s.percent}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right">{s.trained}/{s.total} ({s.percent}%)</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.byCycle.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-foreground mb-3">Cobertura por Ciclo</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {data.byCycle.map((c) => (
              <div key={c.cycleId} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{c.trained}</p>
                <p className="text-xs text-muted-foreground">{c.cycleId} ({c.percent}%)</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ CYCLE PREVIEW ============
function CyclePreview({ filterCycle }: { filterCycle: string }) {
  const cycleId = filterCycle !== "all" ? filterCycle : "M1";
  const data = useMemo(() => generateCycleReport(cycleId), [cycleId]);

  const statusLabels: Record<string, string> = { pending: "Pendente", in_progress: "Em andamento", completed: "Concluído", delayed: "Atrasado", ready_to_close: "Pronto", closed: "Encerrado" };
  const statusColors: Record<string, string> = { completed: "text-success", delayed: "text-destructive", in_progress: "text-warning", pending: "text-muted-foreground" };

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg text-foreground">Ciclo {data.cycleId} — {data.phaseName}</h3>
            <p className="text-sm text-muted-foreground">{data.title}</p>
          </div>
          <Badge variant="outline">{statusLabels[data.status] || data.status}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricMini label="Conclusão" value={`${data.completionPercent}%`} color={data.completionPercent >= 80 ? "success" : "warning"} />
          <MetricMini label="Ações" value={`${data.completedActions}/${data.totalActions}`} />
          <MetricMini label="Atrasadas" value={data.delayedActions} color={data.delayedActions > 0 ? "destructive" : "success"} />
          <MetricMini label="Turmas" value={`${data.turmasCompleted}/${data.turmasTotal}`} />
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold text-foreground mb-3">Ações do Ciclo</h4>
        {data.actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma ação habilitada neste ciclo.</p>
        ) : (
          <div className="space-y-2">
            {data.actions.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.factorName} · {a.responsible}</p>
                </div>
                <span className={cn("text-xs font-medium", statusColors[a.status] || "text-muted-foreground")}>
                  {statusLabels[a.status] || a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {data.decisions.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-foreground mb-3">Decisões Registradas</h4>
          <div className="space-y-2">
            {data.decisions.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                <span className="text-foreground">{d.title}</span>
                <span className="text-muted-foreground">{new Date(d.date).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ SHARED COMPONENTS ============
function MetricMini({ label, value, subtitle, color }: { label: string; value: string | number; subtitle?: string; color?: string }) {
  const colorClass = color === "success" ? "text-success" : color === "destructive" ? "text-destructive" : color === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="text-center p-2">
      <p className={cn("text-xl font-bold", colorClass)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof FileText; color?: string }) {
  const colorMap: Record<string, string> = {
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
  };
  const iconColor = color ? colorMap[color] || "bg-primary/10 text-primary" : "bg-primary/10 text-primary";

  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconColor)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground w-12 text-right">{value}</span>
    </div>
  );
}
