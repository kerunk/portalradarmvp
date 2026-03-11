import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "./MetricCard";
import { SmartAlerts } from "./SmartAlerts";
import { MaturityGaugePremium } from "./MaturityGaugePremium";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, Target, TrendingUp, CheckCircle, AlertTriangle,
  BarChart3, Rocket, GraduationCap, Zap, ShieldAlert, ShieldCheck,
  AlertCircle, ArrowRight,
} from "lucide-react";
import { getCompanies, setActiveCompany, getState } from "@/lib/storage";
import { obterIndicadoresGlobais } from "@/lib/governance";
import { getCompanyRiskData, type CompanyRiskData } from "@/lib/adminNotifications";
import type { CompanyState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { CYCLE_IDS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
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
    healthy: { label: "Saudável", color: "bg-emerald-500/15 text-emerald-500", icon: ShieldCheck },
    warning: { label: "Atenção", color: "bg-amber-500/15 text-amber-500", icon: AlertTriangle },
    risk: { label: "Risco", color: "bg-destructive/15 text-destructive", icon: ShieldAlert },
  };
  return map[s];
}

function getMainAlert(data: CompanyRiskData): string {
  const coverage = data.totalEmployees > 0
    ? Math.round((data.trainedCount / data.totalEmployees) * 100) : 0;
  if (data.delayedActions >= 3) return `${data.delayedActions} ações atrasadas`;
  if (coverage < 5 && data.totalEmployees > 0) return `Cobertura ${coverage}%`;
  if (data.delayedActions >= 1) return `${data.delayedActions} ação atrasada`;
  if (coverage < 15 && data.totalEmployees > 0) return `Cobertura baixa (${coverage}%)`;
  if (data.maturityScore < 20) return `Maturidade baixa (${data.maturityScore}%)`;
  if (data.cyclesInProgress > 0) return "Ciclo avançando";
  return "Sem pendências";
}

function getCurrentCycle(data: CompanyRiskData): string {
  // Find the most advanced cycle with activity
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

export function AdminDashboard({ refreshKey, onAlertDismissed }: AdminDashboardProps) {
  const navigate = useNavigate();
  const companies = useMemo(() => getCompanies(), [refreshKey]);
  const globalIndicators = useMemo(() => obterIndicadoresGlobais(), [refreshKey]);

  const companiesCompleted = companies.filter(c => c.onboardingStatus === "completed").length;
  const companiesPending = companies.filter(c => c.onboardingStatus !== "completed").length;

  const companyData = useMemo(() => {
    return companies.map(c => {
      const data = getCompanyRiskData(c);
      return {
        company: c,
        data,
        health: classifyHealth(data),
        mainAlert: getMainAlert(data),
        currentCycle: getCurrentCycle(data),
      };
    });
  }, [companies, refreshKey]);

  // Aggregated totals
  const totalEmployeesAll = companyData.reduce((s, c) => s + c.data.totalEmployees, 0);
  const totalTurmasAll = companyData.reduce((s, c) => s + c.data.totalTurmas, 0);
  const activeTurmasAll = companyData.reduce((s, c) => s + c.data.activeTurmas, 0);
  const totalActionsAll = companyData.reduce((s, c) => s + c.data.totalActions, 0);
  const completedActionsAll = companyData.reduce((s, c) => s + c.data.completedActions, 0);
  const avgMaturity = companyData.length > 0
    ? Math.round(companyData.reduce((s, c) => s + c.data.maturityScore, 0) / companyData.length)
    : 0;

  // Health counts
  const healthCounts = { healthy: 0, warning: 0, risk: 0 };
  companyData.forEach(c => healthCounts[c.health]++);

  // Cycle distribution chart
  const cycleDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    CYCLE_IDS.forEach(c => { dist[c] = 0; });
    companyData.forEach(cd => {
      if (cd.currentCycle !== "—") dist[cd.currentCycle] = (dist[cd.currentCycle] || 0) + 1;
    });
    return CYCLE_IDS.map(c => ({ cycle: c, count: dist[c] || 0 }));
  }, [companyData]);

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

  // Critical actions (companies sorted by delayed actions)
  const criticalCompanies = useMemo(() => {
    return [...companyData]
      .filter(c => c.data.delayedActions > 0)
      .sort((a, b) => b.data.delayedActions - a.data.delayedActions)
      .slice(0, 5);
  }, [companyData]);

  const maturityLevels: Record<string, { label: string; color: string }> = {
    "0": { label: "Inicial", color: "bg-muted text-muted-foreground" },
    "1": { label: "Estruturando", color: "bg-amber-500/15 text-amber-400" },
    "2": { label: "Evoluindo", color: "bg-primary/15 text-primary" },
    "3": { label: "Consolidando", color: "bg-emerald-500/15 text-emerald-400" },
  };

  function getMaturityLevel(score: number) {
    if (score >= 76) return maturityLevels["3"];
    if (score >= 51) return maturityLevels["2"];
    if (score >= 26) return maturityLevels["1"];
    return maturityLevels["0"];
  }

  const cycleBarColor = (cycle: string) => {
    if (cycle.startsWith("M")) return "hsl(217, 91%, 60%)";
    if (cycle.startsWith("V")) return "hsl(38, 92%, 50%)";
    return "hsl(142, 71%, 45%)";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin summary banner */}
      <div className="relative rounded-xl border border-primary/15 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-5 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
              Painel Administrativo MVP
            </p>
            <p className="text-sm font-medium text-foreground">
              {companies.length} empresas na carteira — {companiesCompleted} ativas, {companiesPending} com onboarding pendente.
            </p>
          </div>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Empresas Ativas" value={companiesCompleted} icon={Building2} subtitle={`${companiesPending} pendentes`} variant="default" />
        <MetricCard title="Colaboradores" value={totalEmployeesAll} icon={Users} subtitle="cadastrados no total" variant="default" />
        <MetricCard title="Ciclos MVP" value={`${globalIndicators.closedCycles}/${globalIndicators.totalCycles}`} icon={Rocket} subtitle={`${globalIndicators.cyclesInProgress} em andamento`} variant={globalIndicators.closedCycles > 0 ? "success" : "default"} />
        <MetricCard title="Turmas" value={totalTurmasAll} icon={GraduationCap} subtitle={`${activeTurmasAll} em execução`} variant="default" />
        <MetricCard title="Ações Globais" value={`${completedActionsAll}/${totalActionsAll}`} icon={CheckCircle} subtitle={`${totalActionsAll > 0 ? Math.round((completedActionsAll / totalActionsAll) * 100) : 0}% concluído`} variant="success" />
        <MetricCard title="Taxa Decisão→Ação" value={`${globalIndicators.decisionConversionRate}%`} icon={Zap} subtitle={`${globalIndicators.decisionsWithActions} convertidas`} variant={globalIndicators.decisionConversionRate >= 50 ? "success" : "warning"} />
      </div>

      {/* Health panel */}
      <Card className="p-5">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          Saúde da Implementação
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cycle distribution */}
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4">Distribuição por Ciclo</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleDistribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="cycle" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <ReTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`${value} empresa(s)`, "Qtd"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {cycleDistribution.map((entry) => (
                    <Cell key={entry.cycle} fill={cycleBarColor(entry.cycle)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Maturity distribution */}
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4">Distribuição de Maturidade</h3>
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
      </div>

      {/* Coverage + Critical actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage */}
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4">Cobertura de Treinamento</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
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
              <p className="text-sm text-muted-foreground">Média de cobertura da carteira</p>
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

        {/* Critical actions */}
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-destructive" />
            Ações Críticas da Carteira
          </h3>
          {criticalCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma ação atrasada na carteira</p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticalCompanies.map(c => (
                <div key={c.company.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} className="text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.company.name}</p>
                    <p className="text-xs text-muted-foreground">Ciclo {c.currentCycle}</p>
                  </div>
                  <Badge className="bg-destructive/15 text-destructive text-xs">
                    {c.data.delayedActions} atrasada{c.data.delayedActions > 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Company table + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Empresas na Carteira</h3>
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
                <div className="col-span-4">Alerta</div>
              </div>
              {companyData.map(({ company, data, health, mainAlert, currentCycle }) => {
                const healthInfo = getHealthLabel(health);
                const HealthIcon = healthInfo.icon;
                const matLevel = getMaturityLevel(data.maturityScore);
                return (
                  <div key={company.id} className="grid grid-cols-12 gap-2 items-center px-3 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
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
                        {health === "risk" ? "🔴" : health === "warning" ? "🟡" : "🟢"} {mainAlert}
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

        <div className="space-y-6">
          <SmartAlerts onAlertDismissed={onAlertDismissed} maxAlerts={4} refreshTrigger={refreshKey} />
          <MaturityGaugePremium score={avgMaturity} />
        </div>
      </div>
    </div>
  );
}
