import { useState, useMemo } from "react";
import { getCompanies } from "@/lib/storage";
import { getCompanyRiskData } from "@/lib/adminNotifications";
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
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileSpreadsheet,
  UserCheck,
  Building2,
  AlertCircle,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateExecutiveReport,
  generateTurmaReport,
  generateNucleoReport,
  generateCoverageReport,
  generateCycleReport,
  generateCollaboratorProgressReport,
  generateSectorMaturityReport,
  generateTrainingDelayAlerts,
  getAvailableFilters,
  type ExecutiveReportData,
} from "@/lib/reportData";
import {
  exportExecutivePDF,
  exportTurmaPDF,
  exportCoveragePDF,
  exportNucleoPDF,
  exportCyclePDF,
  exportCollaboratorProgressPDF,
  exportSectorMaturityPDF,
  exportExecutiveExcel,
  exportTurmaExcel,
  exportCoverageExcel,
  exportNucleoExcel,
  exportCycleExcel,
  exportCollaboratorProgressExcel,
  exportSectorMaturityExcel,
} from "@/lib/reportExport";
import { toast } from "@/hooks/use-toast";
import { CYCLE_IDS } from "@/lib/constants";

type ReportType = "executive" | "turmas" | "nucleo" | "coverage" | "cycle" | "collaborator" | "sector_maturity";

const REPORT_TYPES: { id: ReportType; label: string; icon: typeof FileText; description: string }[] = [
  { id: "executive", label: "Executivo Geral", icon: BarChart3, description: "Visão completa da implementação" },
  { id: "turmas", label: "Turmas", icon: GraduationCap, description: "Treinamentos e presenças" },
  { id: "nucleo", label: "Núcleo", icon: Shield, description: "Integrantes e ações atribuídas" },
  { id: "coverage", label: "Cobertura", icon: Users, description: "Colaboradores treinados vs base" },
  { id: "cycle", label: "Por Ciclo", icon: Target, description: "Detalhamento por ciclo MVP" },
  { id: "collaborator", label: "Progresso por Colaborador", icon: UserCheck, description: "Estágio de cada colaborador" },
  { id: "sector_maturity", label: "Maturidade por Setor", icon: Building2, description: "Cobertura comparativa entre setores" },
];

// Admin sees only aggregated portfolio reports
function AdminReportsView() {
  const companies = getCompanies();
  const companyDataList = companies.map(c => {
    const data = getCompanyRiskData(c);
    return { company: c, data };
  });

  const totalEmployees = companyDataList.reduce((s, c) => s + c.data.totalEmployees, 0);
  const totalTrained = companyDataList.reduce((s, c) => s + c.data.trainedCount, 0);
  const avgCoverage = totalEmployees > 0 ? Math.round((totalTrained / totalEmployees) * 100) : 0;
  const avgMaturity = companyDataList.length > 0
    ? Math.round(companyDataList.reduce((s, c) => s + c.data.maturityScore, 0) / companyDataList.length)
    : 0;
  const totalActions = companyDataList.reduce((s, c) => s + c.data.totalActions, 0);
  const completedActions = companyDataList.reduce((s, c) => s + c.data.completedActions, 0);
  const delayedActions = companyDataList.reduce((s, c) => s + c.data.delayedActions, 0);
  const totalTurmas = companyDataList.reduce((s, c) => s + c.data.totalTurmas, 0);
  const closedCycles = companyDataList.reduce((s, c) => s + c.data.closedCycles, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-foreground">Relatório Consolidado da Carteira</h2>
            <p className="text-sm text-muted-foreground">{companies.length} empresas · Visão agregada</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <MetricMini label="Empresas" value={companies.length} />
          <MetricMini label="Colaboradores" value={totalEmployees} />
          <MetricMini label="Cobertura" value={`${avgCoverage}%`} color={avgCoverage >= 50 ? "success" : "warning"} />
          <MetricMini label="Maturidade" value={`${avgMaturity}%`} />
          <MetricMini label="Ações totais" value={totalActions} />
          <MetricMini label="Concluídas" value={completedActions} color="success" />
          <MetricMini label="Atrasadas" value={delayedActions} color={delayedActions > 0 ? "destructive" : "success"} />
          <MetricMini label="Ciclos encerrados" value={closedCycles} />
        </div>
      </Card>

      {/* Company-by-company summary */}
      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-primary" />
          Resumo por Empresa
        </h3>
        <div className="space-y-0">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
            <div className="col-span-3">Empresa</div>
            <div className="col-span-2 text-center">Colaboradores</div>
            <div className="col-span-2 text-center">Cobertura</div>
            <div className="col-span-2 text-center">Maturidade</div>
            <div className="col-span-1 text-center">Turmas</div>
            <div className="col-span-2 text-center">Ações</div>
          </div>
          {companyDataList.map(({ company, data }) => {
            const cov = data.totalEmployees > 0 ? Math.round((data.trainedCount / data.totalEmployees) * 100) : 0;
            return (
              <div key={company.id} className="grid grid-cols-12 gap-2 items-center px-3 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                <div className="col-span-3">
                  <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                </div>
                <div className="col-span-2 text-center text-sm text-foreground">{data.totalEmployees}</div>
                <div className="col-span-2 text-center">
                  <Badge variant="outline" className={cn("text-xs", cov >= 50 ? "text-emerald-500" : cov >= 20 ? "text-amber-500" : "text-destructive")}>
                    {cov}%
                  </Badge>
                </div>
                <div className="col-span-2 text-center text-sm text-foreground">{data.maturityScore}%</div>
                <div className="col-span-1 text-center text-sm text-foreground">{data.totalTurmas}</div>
                <div className="col-span-2 text-center text-xs text-muted-foreground">
                  {data.completedActions}/{data.totalActions}
                  {data.delayedActions > 0 && (
                    <span className="text-destructive ml-1">({data.delayedActions} atr.)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Relatórios operacionais detalhados estão disponíveis no portal de cada empresa.
        </p>
      </div>
    </div>
  );
}

export default function Reports() {
  const { user, isAdminMVP } = useAuth();
  const companyId = user?.companyId || "company-1";
  const companyName = user?.companyName || "Empresa";

  if (isAdminMVP) {
    return (
      <AppLayout title="Relatórios da Carteira" subtitle="Visão consolidada e agregada de todas as empresas">
        <AdminReportsView />
      </AppLayout>
    );
  }

  return <ClientReportsView companyId={companyId} companyName={companyName} />;
}

function ClientReportsView({ companyId, companyName }: { companyId: string; companyName: string }) {
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
        case "collaborator":
          exportCollaboratorProgressPDF(generateCollaboratorProgressReport(companyId, reportFilters), companyName);
          break;
        case "sector_maturity":
          exportSectorMaturityPDF(generateSectorMaturityReport(companyId), companyName);
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
        case "collaborator":
          exportCollaboratorProgressExcel(generateCollaboratorProgressReport(companyId, reportFilters), companyName);
          break;
        case "sector_maturity":
          exportSectorMaturityExcel(generateSectorMaturityReport(companyId), companyName);
          break;
      }
      toast({ title: "Excel exportado com sucesso!" });
    } catch (e) {
      toast({ title: "Erro ao exportar Excel", variant: "destructive" });
    }
  };

  const showCycleFilter = ["turmas", "cycle", "executive"].includes(activeReport);
  const showSectorFilter = ["turmas", "coverage", "collaborator"].includes(activeReport);
  const showFacilitatorFilter = activeReport === "turmas";

  return (
    <AppLayout title="Relatórios" subtitle="Relatórios executivos e acompanhamento estratégico">
      <div className="space-y-6 animate-fade-in">
        {/* Report type selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {REPORT_TYPES.map((rt) => {
            const Icon = rt.icon;
            const isActive = activeReport === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => setActiveReport(rt.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <Icon size={18} className={cn("mb-1.5", isActive ? "text-primary-foreground" : "text-primary")} />
                <p className={cn("text-xs font-semibold leading-tight", isActive ? "text-primary-foreground" : "text-foreground")}>{rt.label}</p>
                <p className={cn("text-[10px] mt-0.5 leading-tight", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>{rt.description}</p>
              </button>
            );
          })}
        </div>

        {/* Filters and actions bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {showCycleFilter && (
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
              {showSectorFilter && filters.sectors.length > 0 && (
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
              {showFacilitatorFilter && filters.facilitators.length > 0 && (
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
        {activeReport === "executive" && <ExecutivePreview data={executiveData} companyId={companyId} />}
        {activeReport === "turmas" && <TurmasPreview companyId={companyId} filterCycle={filterCycle} filterFacilitator={filterFacilitator} />}
        {activeReport === "nucleo" && <NucleoPreview companyId={companyId} />}
        {activeReport === "coverage" && <CoveragePreview companyId={companyId} />}
        {activeReport === "cycle" && <CyclePreview filterCycle={filterCycle} />}
        {activeReport === "collaborator" && <CollaboratorPreview companyId={companyId} filterSector={filterSector} />}
        {activeReport === "sector_maturity" && <SectorMaturityPreview companyId={companyId} />}
      </div>
    </AppLayout>
  );
}

// ============ EXECUTIVE PREVIEW ============
function ExecutivePreview({ data, companyId }: { data: ExecutiveReportData; companyId: string }) {
  const trainingAlerts = useMemo(() => generateTrainingDelayAlerts(companyId), [companyId]);

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
          <MetricMini label="Núcleo ativo" value={data.nucleoCount} />
          <MetricMini label="Facilitadores" value={data.facilitators} />
          <MetricMini label="Cobertura" value={`${data.coveragePercent}%`} color={data.coveragePercent >= 60 ? "success" : "warning"} />
          <MetricMini label="Ações concluídas" value={`${data.completedActions}/${data.totalActions}`} />
          <MetricMini label="Ações atrasadas" value={data.delayedActions} color={data.delayedActions > 0 ? "destructive" : "success"} />
          <MetricMini label="Ciclos encerrados" value={`${data.closedCycles}/${data.totalCycles}`} />
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
            <MetricMini label="Presenças registradas" value={data.totalPresences} />
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

      {/* Training delay alerts */}
      {trainingAlerts.length > 0 && (
        <Card className="p-5 border-warning/30">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" /> Colaboradores com Treinamentos Pendentes
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {trainingAlerts.length} colaborador(es) ainda não completaram módulos obrigatórios (M1, M2, M3).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {trainingAlerts.slice(0, 20).map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-warning/5 border border-warning/10">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.sector} · {a.role}</p>
                </div>
                <div className="flex gap-1">
                  {a.pendingModules.map(m => (
                    <Badge key={m} variant="outline" className="text-[10px] border-warning/40 text-warning">{m}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {trainingAlerts.length > 20 && (
            <p className="text-xs text-muted-foreground mt-2">...e mais {trainingAlerts.length - 20} colaboradores.</p>
          )}
        </Card>
      )}

      {/* Insights do Programa MVP */}
      {data.insights.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
            <Lightbulb size={20} className="text-warning" /> Insights do Programa MVP
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Análise automática baseada nos dados reais da implementação.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.insights.map((insight, i) => {
              const config = {
                positive: { icon: CheckCircle2, bg: "bg-success/10 border-success/30", iconColor: "text-success", label: "Positivo", labelBg: "bg-success/20 text-success" },
                warning: { icon: AlertTriangle, bg: "bg-warning/10 border-warning/30", iconColor: "text-warning", label: "Atenção", labelBg: "bg-warning/20 text-warning" },
                reinforcement: { icon: Lightbulb, bg: "bg-primary/10 border-primary/30", iconColor: "text-primary", label: "Recomendação", labelBg: "bg-primary/20 text-primary" },
              }[insight.type];
              const Icon = config.icon;
              return (
                <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl border", config.bg)}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.labelBg)}>
                    <Icon size={16} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.iconColor)}>{config.label}</span>
                    <p className="text-sm text-foreground mt-0.5">{insight.message}</p>
                  </div>
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
        <MetricCard label="Presenças registradas" value={data.totalPresences} icon={CheckCircle2} color="success" />
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
              <Badge variant="outline">{t.presentCount}/{t.participantCount} presenças</Badge>
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
        <MetricCard label="Ações concluídas" value={data.completedActions} icon={CheckCircle2} color="success" />
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
          <MetricMini label="Ações concluídas" value={`${data.completedActions}/${data.totalActions}`} />
          <MetricMini label="Ações atrasadas" value={data.delayedActions} color={data.delayedActions > 0 ? "destructive" : "success"} />
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

// ============ COLLABORATOR PROGRESS PREVIEW ============
function CollaboratorPreview({ companyId, filterSector }: { companyId: string; filterSector: string }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in_progress" | "not_started">("all");

  const data = useMemo(() => generateCollaboratorProgressReport(companyId, {
    sector: filterSector !== "all" ? filterSector : undefined,
  }), [companyId, filterSector]);

  const availableRoles = useMemo(() => [...new Set(data.collaborators.map(c => c.role).filter(Boolean))].sort(), [data]);

  const filtered = useMemo(() => {
    let list = data.collaborators;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q));
    }
    if (filterRole !== "all") list = list.filter(c => c.role === filterRole);
    if (filterStatus !== "all") {
      list = list.filter(c => {
        if (filterStatus === "completed") return c.completedModules === c.totalModules;
        if (filterStatus === "not_started") return c.completedModules === 0;
        // in_progress: started but not fully done
        return c.completedModules > 0 && c.completedModules < c.totalModules;
      });
    }
    return list;
  }, [data, search, filterRole, filterStatus]);

  const moduleIds = CYCLE_IDS;
  const statusColor = (s: string) => s === 'completed' ? 'bg-success' : s === 'in_progress' ? 'bg-warning' : 'bg-muted';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Colaboradores" value={data.totalCollaborators} icon={Users} />
        <MetricCard label="Progresso médio" value={`${data.averageProgress}%`} icon={TrendingUp} color={data.averageProgress >= 50 ? "success" : "warning"} />
        <MetricCard label="Programa completo" value={data.fullyTrained} icon={CheckCircle2} color="success" />
        <MetricCard label="Não iniciados" value={data.notStarted} icon={AlertTriangle} color="destructive" />
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador por nome, cargo ou setor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {availableRoles.length > 0 && (
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="not_started">Não iniciado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {search && (
          <p className="text-xs text-muted-foreground mt-2">{filtered.length} resultado(s) para "{search}"</p>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum colaborador encontrado.</Card>
      ) : (
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Colaborador</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Setor</th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Cargo</th>
                {moduleIds.map(m => (
                  <th key={m} className="text-center py-2 px-1 text-muted-foreground font-medium text-xs">{m}</th>
                ))}
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={cn("border-b border-border/50", i % 2 === 0 ? "bg-muted/30" : "")}>
                  <td className="py-2 px-2 font-medium text-foreground">{c.name}</td>
                  <td className="py-2 px-2 text-muted-foreground text-xs">{c.sector}</td>
                  <td className="py-2 px-2 text-muted-foreground text-xs">{c.role}</td>
                  {moduleIds.map(m => (
                    <td key={m} className="py-2 px-1 text-center">
                      <div className={cn("w-4 h-4 rounded-full mx-auto", statusColor(c.modules[m]))} title={c.modules[m] === 'completed' ? 'Concluído' : c.modules[m] === 'in_progress' ? 'Em andamento' : 'Não iniciado'} />
                    </td>
                  ))}
                  <td className="py-2 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", c.progressPercent >= 60 ? "bg-success" : c.progressPercent > 0 ? "bg-warning" : "bg-muted")} style={{ width: `${c.progressPercent}%` }} />
                      </div>
                      <span className="text-xs font-bold text-foreground w-8 text-right">{c.progressPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-success" /> Concluído</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-warning" /> Em andamento</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-muted" /> Não iniciado</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ SECTOR MATURITY PREVIEW ============
function SectorMaturityPreview({ companyId }: { companyId: string }) {
  const data = useMemo(() => generateSectorMaturityReport(companyId), [companyId]);

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-foreground">Maturidade por Setor</h3>
            <p className="text-sm text-muted-foreground">{data.sectors.length} setores analisados</p>
          </div>
          <div className="text-right">
            <p className={cn("text-3xl font-bold", data.overallCoverage >= 60 ? "text-success" : data.overallCoverage >= 30 ? "text-warning" : "text-destructive")}>{data.overallCoverage}%</p>
            <p className="text-xs text-muted-foreground">Cobertura geral</p>
          </div>
        </div>
      </Card>

      {data.sectors.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Nenhum setor com dados disponíveis.</Card>
      ) : (
        <Card className="p-4">
          <div className="space-y-3">
            {data.sectors.map((s) => (
              <div key={s.sector} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{s.sector}</p>
                    <p className="text-xs text-muted-foreground">{s.total} colaboradores · {s.trained} treinados · {s.notTrained} não treinados</p>
                  </div>
                  <span className={cn("text-2xl font-bold", s.coveragePercent >= 60 ? "text-success" : s.coveragePercent >= 30 ? "text-warning" : "text-destructive")}>{s.coveragePercent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", s.coveragePercent >= 60 ? "bg-success" : s.coveragePercent >= 30 ? "bg-warning" : "bg-destructive")} style={{ width: `${s.coveragePercent}%` }} />
                </div>
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
