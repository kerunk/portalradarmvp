import { useMemo, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "./MetricCard";
import { MaturityGaugePremium } from "./MaturityGaugePremium";
import { ImplementationPipeline } from "./ImplementationPipeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, TrendingUp, CheckCircle,
  AlertTriangle, BarChart3, Rocket, GraduationCap,
  ShieldAlert, ShieldCheck, AlertCircle, ArrowRight,
  Layers, Clock, PowerOff,
} from "lucide-react";
import type { CompanyState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRoleForUser } from "@/lib/permissions";
import { CYCLE_IDS } from "@/lib/constants";
import { fetchCompanies } from "@/lib/companyService";
import { fetchCompanyOperationalData } from "@/lib/supabaseDataService";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip as ReTooltip,
} from "recharts";

interface AdminDashboardProps {
  refreshKey: number;
  onAlertDismissed: () => void;
}

type HealthStatus = "healthy" | "warning" | "risk";

interface CompanyMetrics {
  company: CompanyState;
  totalEmployees: number;
  trainedCount: number;
  totalTurmas: number;
  completedActions: number;
  delayedActions: number;
  totalActions: number;
  closedCycles: number;
  cyclesInProgress: number;
  maturityScore: number;
  coveragePercent: number;
  currentCycle: string;
}

function classifyHealth(m: CompanyMetrics): HealthStatus {
  if (m.delayedActions >= 3 || m.coveragePercent < 5) return "risk";
  if (m.delayedActions >= 1 || m.coveragePercent < 15 || m.maturityScore < 20) return "warning";
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

function getCompanyAlerts(m: CompanyMetrics, health: HealthStatus): CompanyAlert[] {
  const alerts: CompanyAlert[] = [];
  const company = m.company;

  if (m.delayedActions > 0) {
    alerts.push({ company, health, alertType: "delayed", message: `${m.delayedActions} ${m.delayedActions === 1 ? "ação atrasada" : "ações atrasadas"}`, navigateTo: `/empresas/${company.id}?tab=registros` });
  }
  if (m.coveragePercent < 15 && m.totalEmployees > 0) {
    alerts.push({ company, health, alertType: "low-coverage", message: `Cobertura de treinamento em ${m.coveragePercent}%`, navigateTo: `/empresas/${company.id}?tab=turmas` });
  }
  if (m.maturityScore < 20) {
    alerts.push({ company, health, alertType: "low-maturity", message: `Maturidade em ${m.maturityScore}%`, navigateTo: `/empresas/${company.id}?tab=indicadores` });
  }
  if (m.cyclesInProgress === 0 && m.closedCycles === 0) {
    alerts.push({ company, health, alertType: "stalled-cycle", message: "Nenhum ciclo iniciado", navigateTo: `/empresas/${company.id}?tab=ciclos` });
  }
  return alerts;
}

export function AdminDashboard({ refreshKey, onAlertDismissed }: AdminDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const adminRole = useMemo(() => getAdminRoleForUser(user?.email || ""), [user?.email]);

  const [supabaseCompanies, setSupabaseCompanies] = useState<CompanyState[]>([]);
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    fetchCompanies().then(async (companies) => {
      if (cancelled) return;
      console.log("[AdminDashboard] empresas carregadas do Supabase:", companies.length);
      setSupabaseCompanies(companies);

      const activeCompanies = companies.filter(c => c.active !== false && !c.deleted);
      
      // Fetch operational data for each company from Supabase
      const metrics: CompanyMetrics[] = [];
      for (const company of activeCompanies) {
        try {
          const opData = await fetchCompanyOperationalData(company.id);
          
          // Determine current cycle
          let currentCycle = "—";
          for (let i = CYCLE_IDS.length - 1; i >= 0; i--) {
            const cid = CYCLE_IDS[i];
            const cs = opData.cycleStates.find(s => s.cycle_id === cid);
            if (cs && (cs.closure_status === "closed" || cs.closure_status !== "not_started")) {
              currentCycle = cid;
              break;
            }
            // Check if there are actions for this cycle
            const hasActions = opData.cycleActions.some(a => a.cycle_id === cid && a.enabled);
            if (hasActions) {
              currentCycle = cid;
              break;
            }
          }

          metrics.push({
            company,
            totalEmployees: opData.populationTotal,
            trainedCount: opData.pessoasTreinadas,
            totalTurmas: opData.turmasTotal,
            completedActions: opData.completedActions,
            delayedActions: opData.delayedActions,
            totalActions: opData.enabledActions,
            closedCycles: opData.closedCycles,
            cyclesInProgress: opData.cyclesInProgress,
            maturityScore: opData.maturityScore,
            coveragePercent: opData.coveragePercent,
            currentCycle,
          });
        } catch (err) {
          console.error(`Error fetching data for company ${company.id}:`, err);
          metrics.push({
            company,
            totalEmployees: 0, trainedCount: 0, totalTurmas: 0,
            completedActions: 0, delayedActions: 0, totalActions: 0,
            closedCycles: 0, cyclesInProgress: 0,
            maturityScore: 0, coveragePercent: 0, currentCycle: "—",
          });
        }
      }

      if (!cancelled) {
        setCompanyMetrics(metrics);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [refreshKey]);

  const companies = useMemo(() => {
    return supabaseCompanies.filter(c => c.active !== false && !c.deleted);
  }, [supabaseCompanies]);

  const inactiveCompaniesCount = useMemo(() => {
    return supabaseCompanies.filter(c => c.active === false && !c.deleted).length;
  }, [supabaseCompanies]);

  const companiesTotal = companies.length;

  const companyData = useMemo(() => {
    return companyMetrics.map(m => ({
      company: m.company,
      metrics: m,
      health: classifyHealth(m),
      currentCycle: m.currentCycle,
    }));
  }, [companyMetrics]);

  // Aggregated totals
  const totalEmployeesAll = companyMetrics.reduce((s, m) => s + m.totalEmployees, 0);
  const totalTrained = companyMetrics.reduce((s, m) => s + m.trainedCount, 0);
  const totalTurmasAll = companyMetrics.reduce((s, m) => s + m.totalTurmas, 0);
  const totalActionsCompleted = companyMetrics.reduce((s, m) => s + m.completedActions, 0);
  const totalActionsDelayed = companyMetrics.reduce((s, m) => s + m.delayedActions, 0);
  const avgMaturity = companyMetrics.length > 0
    ? Math.round(companyMetrics.reduce((s, m) => s + m.maturityScore, 0) / companyMetrics.length)
    : 0;

  // Health counts
  const healthCounts = { healthy: 0, warning: 0, risk: 0 };
  companyData.forEach(c => healthCounts[c.health]++);

  // Coverage
  const avgCoverage = useMemo(() => {
    const withEmployees = companyMetrics.filter(m => m.totalEmployees > 0);
    if (withEmployees.length === 0) return 0;
    return Math.round(withEmployees.reduce((s, m) => s + m.coveragePercent, 0) / withEmployees.length);
  }, [companyMetrics]);

  // Maturity distribution
  const maturityDistribution = useMemo(() => {
    const levels = [
      { name: "Inicial", min: 0, max: 25, count: 0, fill: "hsl(var(--muted-foreground))" },
      { name: "Estruturando", min: 26, max: 50, count: 0, fill: "hsl(38, 92%, 50%)" },
      { name: "Evoluindo", min: 51, max: 75, count: 0, fill: "hsl(var(--primary))" },
      { name: "Consolidando", min: 76, max: 100, count: 0, fill: "hsl(142, 71%, 45%)" },
    ];
    companyMetrics.forEach(m => {
      const s = m.maturityScore;
      const l = levels.find(l => s >= l.min && s <= l.max);
      if (l) l.count++;
    });
    return levels;
  }, [companyMetrics]);

  // Grouped alerts
  const groupedAlerts = useMemo(() => {
    const allAlerts: CompanyAlert[] = [];
    companyData.forEach(cd => {
      allAlerts.push(...getCompanyAlerts(cd.metrics, cd.health));
    });

    const groups = new Map<AlertType, CompanyAlert[]>();
    allAlerts.forEach(a => {
      if (!groups.has(a.alertType)) groups.set(a.alertType, []);
      groups.get(a.alertType)!.push(a);
    });

    const order: AlertType[] = ["delayed", "low-coverage", "low-maturity", "stalled-cycle"];
    return order
      .filter(t => groups.has(t))
      .map(t => ({ type: t, alerts: groups.get(t)! }));
  }, [companyData]);

  const totalAlerts = groupedAlerts.reduce((s, g) => s + g.alerts.length, 0);

  const criticalCompanies = useMemo(() => {
    return [...companyData]
      .filter(c => c.metrics.delayedActions > 0)
      .sort((a, b) => b.metrics.delayedActions - a.metrics.delayedActions)
      .slice(0, 5);
  }, [companyData]);

  const drillDown = useCallback((companyId: string, path: string) => {
    navigate(path);
  }, [navigate]);

  function getMaturityLevel(score: number) {
    if (score >= 76) return { label: "Consolidando", color: "bg-emerald-500/15 text-emerald-400" };
    if (score >= 51) return { label: "Evoluindo", color: "bg-primary/15 text-primary" };
    if (score >= 26) return { label: "Estruturando", color: "bg-amber-500/15 text-amber-400" };
    return { label: "Inicial", color: "bg-muted text-muted-foreground" };
  }

  const alertTypeConfig: Record<AlertType, { label: string; icon: typeof AlertTriangle; color: string }> = {
    delayed: { label: "Ações Atrasadas", icon: Clock, color: "text-destructive" },
    "low-coverage": { label: "Cobertura Baixa", icon: GraduationCap, color: "text-amber-500" },
    "low-maturity": { label: "Maturidade Baixa", icon: TrendingUp, color: "text-amber-500" },
    "stalled-cycle": { label: "Ciclos Parados", icon: Rocket, color: "text-muted-foreground" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
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
              {companies.length} empresas na carteira
            </p>
          </div>
        </div>
      </div>

      {/* BLOCO 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard title="Empresas" value={companiesTotal} icon={Building2} subtitle="na carteira" tooltip="Total de empresas cadastradas" variant="default" onClick={() => navigate("/empresas")} />
        <MetricCard title="Empresas Inativas" value={inactiveCompaniesCount} icon={PowerOff} subtitle="acesso bloqueado" tooltip="Empresas inativadas" variant={inactiveCompaniesCount > 0 ? "warning" : "default"} onClick={() => navigate("/empresas")} />
        <MetricCard title="Colaboradores" value={totalEmployeesAll} icon={Users} subtitle={`${totalTrained} treinados`} tooltip="Total de colaboradores cadastrados e treinados" variant="default" />
        <MetricCard title="Maturidade Média" value={`${avgMaturity}%`} icon={TrendingUp} subtitle={getMaturityLevel(avgMaturity).label} tooltip="Índice médio de maturidade" variant={avgMaturity >= 50 ? "success" : avgMaturity >= 25 ? "warning" : "default"} />
        <MetricCard title="Cobertura Média" value={`${avgCoverage}%`} icon={GraduationCap} subtitle="treinamento da carteira" tooltip="Média de cobertura de treinamento" variant={avgCoverage >= 50 ? "success" : avgCoverage >= 20 ? "warning" : "danger"} />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Turmas Realizadas" value={totalTurmasAll} icon={Layers} subtitle="na carteira" tooltip="Total de turmas" variant="default" />
        <MetricCard title="Ações Concluídas" value={totalActionsCompleted} icon={CheckCircle} subtitle="na carteira" tooltip="Total de ações concluídas" variant="success" />
        <MetricCard title="Ações Atrasadas" value={totalActionsDelayed} icon={AlertTriangle} subtitle="na carteira" tooltip="Total de ações atrasadas" variant={totalActionsDelayed > 0 ? "danger" : "default"} onClick={totalActionsDelayed > 0 ? () => navigate("/acoes-atrasadas") : undefined} />
        <MetricCard title="Ciclos em Andamento" value={companyMetrics.reduce((s, m) => s + m.cyclesInProgress, 0)} icon={Rocket} subtitle="na carteira" tooltip="Total de ciclos em progresso" variant="default" onClick={() => navigate("/ciclos-ativos")} />
      </div>

      {/* Pipeline */}
      <ImplementationPipeline refreshKey={refreshKey} companies={supabaseCompanies} />

      {/* Saúde da Carteira */}
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

      {/* Empresas que precisam de atenção */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Empresas que Precisam de Atenção</h3>
              <button onClick={() => navigate("/empresas")} className="text-xs text-primary hover:text-primary/80 font-medium">Ver todas →</button>
            </div>
            <div className="space-y-0">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
                <div className="col-span-3">Empresa</div>
                <div className="col-span-1 text-center">Ciclo</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-center">Maturidade</div>
                <div className="col-span-4">Alerta Principal</div>
              </div>
              {companyData.map(({ company, metrics, health, currentCycle }) => {
                const healthInfo = getHealthLabel(health);
                const HealthIcon = healthInfo.icon;
                const alerts = getCompanyAlerts(metrics, health);
                const mainAlert = alerts.length > 0 ? alerts[0] : null;
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
                      <Badge className={cn("text-xs", healthInfo.color)}>
                        <HealthIcon size={12} className="mr-1" />
                        {healthInfo.label}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-medium">{metrics.maturityScore}%</span>
                    </div>
                    <div className="col-span-4">
                      <p className="text-xs text-muted-foreground truncate">{mainAlert?.message || "Sem pendências"}</p>
                    </div>
                  </div>
                );
              })}
              {companyData.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Nenhuma empresa cadastrada.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Alertas Estratégicos */}
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" />
            Alertas Estratégicos
            {totalAlerts > 0 && <Badge variant="destructive" className="text-xs ml-auto">{totalAlerts}</Badge>}
          </h3>
          <div className="space-y-3">
            {groupedAlerts.map(group => {
              const config = alertTypeConfig[group.type];
              const GroupIcon = config.icon;
              return (
                <div key={group.type} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <GroupIcon size={14} className={config.color} />
                    <span className="text-xs font-medium text-foreground">{config.label}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{group.alerts.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {group.alerts.slice(0, 3).map((alert, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => navigate(alert.navigateTo)}
                      >
                        <span className="truncate">{alert.company.name}</span>
                        <ArrowRight size={12} className="shrink-0 ml-1" />
                      </div>
                    ))}
                    {group.alerts.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{group.alerts.length - 3} mais</p>
                    )}
                  </div>
                </div>
              );
            })}
            {groupedAlerts.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <ShieldCheck size={24} className="mx-auto mb-2 text-success" />
                Nenhum alerta ativo
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Maturity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-medium text-foreground mb-4">Distribuição de Maturidade</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={maturityDistribution.filter(d => d.count > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                  {maturityDistribution.filter(d => d.count > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <ReTooltip formatter={(value: number, name: string) => [`${value} empresas`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {maturityDistribution.map(l => (
              <div key={l.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.fill }} />
                <span className="text-muted-foreground">{l.name}: {l.count}</span>
              </div>
            ))}
          </div>
        </Card>
        <MaturityGaugePremium score={avgMaturity} />
      </div>
    </div>
  );
}
