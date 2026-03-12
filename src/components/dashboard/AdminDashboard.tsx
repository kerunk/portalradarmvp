import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "./MetricCard";
import { MaturityGaugePremium } from "./MaturityGaugePremium";
import { ImplementationPipeline } from "./ImplementationPipeline";
import { EvolutionRanking } from "./EvolutionRanking";
import { ManagerRanking } from "./ManagerRanking";
import { LoadDistribution } from "./LoadDistribution";
import { StalledCompanies } from "./StalledCompanies";
import { StrategicOverview } from "./StrategicOverview";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, TrendingUp, CheckCircle,
  AlertTriangle, BarChart3, Rocket, GraduationCap,
  ShieldAlert, ShieldCheck, AlertCircle, ArrowRight,
  Layers, Clock,
} from "lucide-react";
import { getCompanies, setActiveCompany, getState } from "@/lib/storage";
import { getCompanyRiskData, type CompanyRiskData } from "@/lib/adminNotifications";
import type { CompanyState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CYCLE_IDS } from "@/lib/constants";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip as ReTooltip,
} from "recharts";

interface AdminDashboardProps {
  refreshKey: number;
  onAlertDismissed: () => void;
}

type HealthStatus = "healthy" | "warning" | "risk";

function classifyHealth(data: CompanyRiskData): HealthStatus {
  const coverage = data.totalEmployees > 0
    ? (data.trainedCount / data.totalEmployees) * 100 : 0;
  if (data.delayedActions >= 3 || coverage < 5) return "risk";
  if (data.delayedActions >= 1 || coverage < 15 || data.maturityScore < 20) return "warning";
  return "healthy";
}

function getHealthLabel(s: HealthStatus) {
  const map = {
    healthy: { label: "Saudável", color: "bg-emerald-500/15 text-emerald-500", icon: ShieldCheck, emoji: "🟢" },
    warning: { label: "Atenção", color: "bg-amber-500/15 text-amber-500", icon: AlertTriangle, emoji: "🟡" },
    risk: { label: "Risco", color: "bg-destructive/15 text-destructive", icon: ShieldAlert, emoji: "🔴" },
  };
  return map[s];
}

type AlertType = "delayed" | "low-coverage" | "low-maturity" | "stalled-cycle";

interface CompanyAlert {
  company: CompanyState;
  health: HealthStatus;
  alertType: AlertType;
  message: string;
  navigateTo: string;
}

function getCompanyAlerts(data: CompanyRiskData, health: HealthStatus): CompanyAlert[] {
  const alerts: CompanyAlert[] = [];
  const company = data.company;
  const coverage = data.totalEmployees > 0
    ? Math.round((data.trainedCount / data.totalEmployees) * 100) : 0;

  if (data.delayedActions > 0) {
    alerts.push({
      company,
      health,
      alertType: "delayed",
      message: `${data.delayedActions} ${data.delayedActions === 1 ? "ação atrasada" : "ações atrasadas"}`,
      navigateTo: `/empresas/${company.id}?tab=registros`,
    });
  }
  if (coverage < 15 && data.totalEmployees > 0) {
    alerts.push({
      company,
      health,
      alertType: "low-coverage",
      message: `Cobertura de treinamento em ${coverage}%`,
      navigateTo: `/empresas/${company.id}?tab=turmas`,
    });
  }
  if (data.maturityScore < 20 && data.company.onboardingStatus === "completed") {
    alerts.push({
      company,
      health,
      alertType: "low-maturity",
      message: `Maturidade em ${data.maturityScore}%`,
      navigateTo: `/empresas/${company.id}?tab=indicadores`,
    });
  }
  if (data.cyclesInProgress === 0 && data.closedCycles === 0 && data.company.onboardingStatus === "completed") {
    alerts.push({
      company,
      health,
      alertType: "stalled-cycle",
      message: "Nenhum ciclo iniciado",
      navigateTo: `/empresas/${company.id}?tab=ciclos`,
    });
  }
  return alerts;
}

function getCurrentCycle(data: CompanyRiskData): string {
  const company = data.company;
  setActiveCompany(company.id);
  const state = getState();
  let currentCycle = "—";
  for (let i = CYCLE_IDS.length - 1; i >= 0; i--) {
    const cid = CYCLE_IDS[i];
    const cs = state.cycles[cid];
    if (cs && (cs.closureStatus === "closed" || cs.factors.some(f => f.actions.some(a => a.enabled)))) {
      currentCycle = cid;
      break;
    }
  }
  setActiveCompany(null);
  return currentCycle;
}

const alertTypeConfig: Record<AlertType, { label: string; icon: typeof AlertTriangle; color: string }> = {
  delayed: { label: "Ações Atrasadas", icon: Clock, color: "text-destructive" },
  "low-coverage": { label: "Cobertura de Treinamento Baixa", icon: GraduationCap, color: "text-amber-500" },
  "low-maturity": { label: "Maturidade Baixa", icon: TrendingUp, color: "text-amber-500" },
  "stalled-cycle": { label: "Ciclos Parados", icon: Rocket, color: "text-muted-foreground" },
};

export function AdminDashboard({ refreshKey, onAlertDismissed }: AdminDashboardProps) {
  const navigate = useNavigate();
  const companies = useMemo(() => getCompanies(), [refreshKey]);

  const companiesCompleted = companies.filter(c => c.onboardingStatus === "completed").length;
  const companiesPending = companies.filter(c => c.onboardingStatus !== "completed").length;

  const companyData = useMemo(() => {
    return companies.map(c => {
      const data = getCompanyRiskData(c);
      return {
        company: c,
        data,
        health: classifyHealth(data),
        currentCycle: getCurrentCycle(data),
      };
    });
  }, [companies, refreshKey]);

  // Aggregated totals
  const totalEmployeesAll = companyData.reduce((s, c) => s + c.data.totalEmployees, 0);
  const totalTrained = companyData.reduce((s, c) => s + c.data.trainedCount, 0);
  const totalTurmasAll = companyData.reduce((s, c) => s + c.data.totalTurmas, 0);
  const totalActionsCompleted = companyData.reduce((s, c) => s + c.data.completedActions, 0);
  const totalActionsDelayed = companyData.reduce((s, c) => s + c.data.delayedActions, 0);
  const avgMaturity = companyData.length > 0
    ? Math.round(companyData.reduce((s, c) => s + c.data.maturityScore, 0) / companyData.length)
    : 0;

  // Health counts
  const healthCounts = { healthy: 0, warning: 0, risk: 0 };
  companyData.forEach(c => healthCounts[c.health]++);

  // Coverage data
  const avgCoverage = useMemo(() => {
    const withEmployees = companyData.filter(c => c.data.totalEmployees > 0);
    if (withEmployees.length === 0) return 0;
    return Math.round(withEmployees.reduce((s, c) =>
      s + (c.data.trainedCount / c.data.totalEmployees) * 100, 0) / withEmployees.length);
  }, [companyData]);

  // Maturity distribution
  const maturityDistribution = useMemo(() => {
    const levels = [
      { name: "Inicial", min: 0, max: 25, count: 0, fill: "hsl(var(--muted-foreground))" },
      { name: "Estruturando", min: 26, max: 50, count: 0, fill: "hsl(38, 92%, 50%)" },
      { name: "Evoluindo", min: 51, max: 75, count: 0, fill: "hsl(var(--primary))" },
      { name: "Consolidando", min: 76, max: 100, count: 0, fill: "hsl(142, 71%, 45%)" },
    ];
    companyData.forEach(c => {
      const s = c.data.maturityScore;
      const l = levels.find(l => s >= l.min && s <= l.max);
      if (l) l.count++;
    });
    return levels;
  }, [companyData]);

  // Strategic alerts grouped by type
  const groupedAlerts = useMemo(() => {
    const allAlerts: CompanyAlert[] = [];
    companyData.forEach(cd => {
      allAlerts.push(...getCompanyAlerts(cd.data, cd.health));
    });

    const groups = new Map<AlertType, CompanyAlert[]>();
    allAlerts.forEach(a => {
      if (!groups.has(a.alertType)) groups.set(a.alertType, []);
      groups.get(a.alertType)!.push(a);
    });

    // Sort groups: delayed first, then coverage, maturity, stalled
    const order: AlertType[] = ["delayed", "low-coverage", "low-maturity", "stalled-cycle"];
    return order
      .filter(t => groups.has(t))
      .map(t => ({ type: t, alerts: groups.get(t)! }));
  }, [companyData]);

  const totalAlerts = groupedAlerts.reduce((s, g) => s + g.alerts.length, 0);

  // Companies with most delayed actions
  const criticalCompanies = useMemo(() => {
    return [...companyData]
      .filter(c => c.data.delayedActions > 0)
      .sort((a, b) => b.data.delayedActions - a.data.delayedActions)
      .slice(0, 5);
  }, [companyData]);

  // Drill-down: set company context then navigate
  const drillDown = useCallback((companyId: string, path: string) => {
    navigate(path);
  }, [navigate]);

  function getMaturityLevel(score: number) {
    if (score >= 76) return { label: "Consolidando", color: "bg-emerald-500/15 text-emerald-400" };
    if (score >= 51) return { label: "Evoluindo", color: "bg-primary/15 text-primary" };
    if (score >= 26) return { label: "Estruturando", color: "bg-amber-500/15 text-amber-400" };
    return { label: "Inicial", color: "bg-muted text-muted-foreground" };
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="relative rounded-xl border border-primary/15 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-5 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              Painel Estratégico da Carteira MVP
            </p>
            <p className="text-sm font-medium text-foreground">
              {companies.length} empresas na carteira — {companiesCompleted} ativas, {companiesPending} em onboarding
            </p>
          </div>
        </div>
      </div>

      {/* BLOCO 1 — KPIs da Carteira */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Empresas Ativas"
          value={companiesCompleted}
          icon={Building2}
          subtitle={`${companiesPending} em onboarding`}
          tooltip="Empresas com onboarding concluído"
          variant="default"
        />
        <MetricCard
          title="Colaboradores"
          value={totalEmployeesAll}
          icon={Users}
          subtitle={`${totalTrained} treinados`}
          tooltip="Total de colaboradores cadastrados e treinados na carteira"
          variant="default"
        />
        <MetricCard
          title="Maturidade Média"
          value={`${avgMaturity}%`}
          icon={TrendingUp}
          subtitle={getMaturityLevel(avgMaturity).label}
          tooltip="Índice médio de maturidade de todas as empresas"
          variant={avgMaturity >= 50 ? "success" : avgMaturity >= 25 ? "warning" : "default"}
        />
        <MetricCard
          title="Cobertura Média"
          value={`${avgCoverage}%`}
          icon={GraduationCap}
          subtitle="treinamento da carteira"
          tooltip="Média de cobertura de treinamento das empresas"
          variant={avgCoverage >= 50 ? "success" : avgCoverage >= 20 ? "warning" : "danger"}
        />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Turmas Realizadas"
          value={totalTurmasAll}
          icon={Layers}
          subtitle="na carteira"
          tooltip="Total de turmas em todas as empresas"
          variant="default"
        />
        <MetricCard
          title="Ações Concluídas"
          value={totalActionsCompleted}
          icon={CheckCircle}
          subtitle="na carteira"
          tooltip="Total de ações concluídas em todas as empresas"
          variant="success"
        />
        <MetricCard
          title="Ações Atrasadas"
          value={totalActionsDelayed}
          icon={AlertTriangle}
          subtitle="na carteira"
          tooltip="Total de ações atrasadas em todas as empresas"
          variant={totalActionsDelayed > 0 ? "danger" : "default"}
        />
        <MetricCard
          title="Ciclos em Andamento"
          value={companyData.reduce((s, c) => s + c.data.cyclesInProgress, 0)}
          icon={Rocket}
          subtitle="na carteira"
          tooltip="Total de ciclos em progresso"
          variant="default"
        />
      </div>

      {/* Pipeline de Implementação */}
      <ImplementationPipeline refreshKey={refreshKey} />

      {/* BLOCO 2 — Saúde da Carteira de Implementação */}
      <Card className="p-5">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          Saúde da Carteira de Implementação
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {(["healthy", "warning", "risk"] as HealthStatus[]).map(status => {
            const info = getHealthLabel(status);
            const Icon = info.icon;
            return (
              <div key={status} className={cn("rounded-xl border p-4 flex items-center gap-4", info.color.replace("text-", "border-").replace("/15", "/20").split(" ")[0])}>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", info.color)}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{healthCounts[status]}</p>
                  <p className="text-sm text-muted-foreground">{info.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* BLOCO 3 — Empresas que Precisam de Atenção + Alertas Estratégicos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Empresas que Precisam de Atenção</h3>
              <button onClick={() => navigate("/empresas")} className="text-xs text-primary hover:text-primary/80 font-medium">
                Ver todas →
              </button>
            </div>
            <div className="space-y-0">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
                <div className="col-span-3">Empresa</div>
                <div className="col-span-1 text-center">Ciclo</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-center">Maturidade</div>
                <div className="col-span-4">Alerta Principal</div>
              </div>
              {companyData.map(({ company, data, health, currentCycle }) => {
                const healthInfo = getHealthLabel(health);
                const HealthIcon = healthInfo.icon;
                const alerts = getCompanyAlerts(data, health);
                const mainAlert = alerts.length > 0 ? alerts[0] : null;
                const mainAlertMsg = mainAlert ? mainAlert.message : "Sem pendências";
                return (
                  <div
                    key={company.id}
                    className="grid grid-cols-12 gap-2 items-center px-3 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => mainAlert ? drillDown(company.id, mainAlert.navigateTo) : navigate(`/empresas/${company.id}`)}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                    </div>
                    <div className="col-span-1 text-center">
                      <Badge variant="outline" className="text-xs">{currentCycle}</Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <Badge className={cn("text-xs gap-1", healthInfo.color)}>
                        <HealthIcon size={10} />
                        {healthInfo.label}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <div className="flex-1 max-w-[60px] h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${data.maturityScore}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground">{data.maturityScore}%</span>
                    </div>
                    <div className="col-span-4">
                      <p className={cn("text-xs", health === "risk" ? "text-destructive font-medium" : health === "warning" ? "text-amber-500" : "text-muted-foreground")}>
                        {healthInfo.emoji} {mainAlertMsg}
                      </p>
                    </div>
                  </div>
                );
              })}
              {companies.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma empresa cadastrada</p>
              )}
            </div>
          </Card>
        </div>

        {/* Alertas Estratégicos agrupados por tipo */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <AlertCircle size={16} className="text-destructive" />
              Alertas Estratégicos
            </h3>
            {totalAlerts > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalAlerts}
              </Badge>
            )}
          </div>
          {groupedAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma empresa em risco</p>
              <p className="text-xs mt-1">Carteira saudável</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedAlerts.map(({ type, alerts }) => {
                const config = alertTypeConfig[type];
                const TypeIcon = config.icon;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <TypeIcon size={14} className={config.color} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {config.label}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4">{alerts.length}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {alerts.map((alert, idx) => {
                        const info = getHealthLabel(alert.health);
                        return (
                          <button
                            key={`${alert.company.id}-${idx}`}
                            onClick={() => drillDown(alert.company.id, alert.navigateTo)}
                            className={cn(
                              "w-full p-2.5 rounded-lg border text-left transition-all hover:opacity-90 hover:shadow-sm",
                              alert.health === "risk"
                                ? "bg-destructive/5 border-destructive/15"
                                : "bg-amber-500/5 border-amber-500/15"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 size={12} className="text-muted-foreground shrink-0" />
                              <span className="text-sm font-medium text-foreground flex-1 truncate">{alert.company.name}</span>
                              <ArrowRight size={12} className="text-muted-foreground shrink-0" />
                            </div>
                            <p className={cn("text-xs mt-0.5 ml-5", alert.health === "risk" ? "text-destructive" : "text-amber-500")}>
                              {info.emoji} {alert.message}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* BLOCO 4 — Maturidade + Cobertura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Maturidade da Carteira */}
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4">Distribuição de Maturidade da Carteira</h3>
          <div className="h-56 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maturityDistribution.filter(d => d.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {maturityDistribution.filter(d => d.count > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {maturityDistribution.map(level => (
                <div key={level.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: level.fill }} />
                  <span className="text-sm text-muted-foreground flex-1">{level.name}</span>
                  <span className="text-sm font-semibold text-foreground">{level.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Cobertura Média de Treinamento da Carteira */}
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4">Cobertura Média de Treinamento da Carteira</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
                  strokeDasharray={`${avgCoverage * 2.64} ${264 - avgCoverage * 2.64}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{avgCoverage}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">Cobertura por empresa</p>
              {companyData.filter(c => c.data.totalEmployees > 0).slice(0, 4).map(c => {
                const cov = Math.round((c.data.trainedCount / c.data.totalEmployees) * 100);
                return (
                  <div key={c.company.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 truncate">{c.company.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${cov}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-10 text-right">{cov}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* BLOCO 5 — Ações Críticas + Maturidade Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-destructive" />
            Empresas com Mais Ações Atrasadas
          </h3>
          {criticalCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma empresa com ações atrasadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticalCompanies.map(c => (
                <div
                  key={c.company.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/8 transition-colors"
                  onClick={() => drillDown(c.company.id, `/empresas/${c.company.id}?tab=registros`)}
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} className="text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.company.name}</p>
                  </div>
                  <Badge className="bg-destructive/15 text-destructive text-xs">
                    {c.data.delayedActions} atrasada{c.data.delayedActions > 1 ? "s" : ""}
                  </Badge>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Índice Médio de Maturidade da Carteira MVP
          </h3>
          <div className="flex justify-center">
            <div className="max-w-md w-full">
              <MaturityGaugePremium score={avgMaturity} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
