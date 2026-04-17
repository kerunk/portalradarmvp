import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Eye, Calendar, Clock, AlertTriangle, CheckCircle2, Target,
  User, Lock, Unlock, TrendingUp, FileText, Users, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASE_COLORS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useReadOnly } from "@/contexts/ReadOnlyContext";

// ── Hook Supabase ──────────────────────────────────────────────────────────────
import { useIndicators } from "@/hooks/useIndicators";

export default function Indicators() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const { isAdminMVP } = useAuth();
  const { isReadOnly } = useReadOnly();
  const isAdminContext = isAdminMVP && !isReadOnly;

  const { loading, globalIndicators, cycleIndicators, allActions } = useIndicators();

  // ── Dados derivados ──────────────────────────────────────────────────────────
  const responsibleStats = useMemo(() => {
    const map = new Map<string, { total: number; delayed: number; completed: number }>();
    allActions.forEach(a => {
      const curr = map.get(a.responsible) || { total: 0, delayed: 0, completed: 0 };
      map.set(a.responsible, {
        total: curr.total + 1,
        delayed: curr.delayed + (a.isDelayed ? 1 : 0),
        completed: curr.completed + (a.status === "completed" ? 1 : 0),
      });
    });
    return Array.from(map.entries()).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total);
  }, [allActions]);

  const chartData = useMemo(() => {
    if (!globalIndicators) return [];
    return [
      { name: "Concluídas",    value: globalIndicators.completedActions,  color: "hsl(158, 64%, 40%)" },
      { name: "Em andamento",  value: globalIndicators.inProgressActions, color: "hsl(192, 70%, 35%)" },
      { name: "Atrasadas",     value: globalIndicators.delayedActions,    color: "hsl(0, 72%, 51%)" },
      { name: "Pendentes",     value: globalIndicators.pendingActions,    color: "hsl(38, 92%, 50%)" },
    ].filter(d => d.value > 0);
  }, [globalIndicators]);

  const cycleProgressData = cycleIndicators.map(c => ({ name: c.cycleId, completed: c.completionPercent, turmas: c.turmasCompleted }));

  const filteredByDeadline = useMemo(() => {
    if (deadlineFilter === "all") return allActions;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return allActions.filter(a => {
      if (!a.dueDate) return false;
      const due = new Date(a.dueDate); due.setHours(0, 0, 0, 0);
      const diff = differenceInDays(due, today);
      switch (deadlineFilter) {
        case "overdue": return diff < 0 && a.status !== "completed";
        case "7days":   return diff >= 0 && diff <= 7 && a.status !== "completed";
        case "30days":  return diff >= 0 && diff <= 30 && a.status !== "completed";
        default: return true;
      }
    });
  }, [allActions, deadlineFilter]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading || !globalIndicators) {
    return (
      <AppLayout title="Indicadores" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AppLayout
      title={isAdminContext ? "Indicadores — Visão Administrativa" : "Indicadores"}
      subtitle={isAdminContext ? "Métricas consolidadas da carteira de implementação" : "Métricas consolidadas do programa baseadas em dados reais"}
    >
      <div className="space-y-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="cycles">Por Ciclo</TabsTrigger>
            <TabsTrigger value="responsible">Por Responsável</TabsTrigger>
            <TabsTrigger value="deadlines">Prazos</TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-5 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(isAdminContext ? "/ciclos-ativos" : "/ciclos")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Ações</p>
                    <p className="text-3xl font-bold text-foreground">{globalIndicators.totalActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ações ativas nos ciclos</p>
                  </div>
                  <Target className="h-8 w-8 text-primary opacity-50" />
                </div>
              </Card>

              <Card className="p-5 cursor-pointer hover:border-success/50 transition-colors" onClick={() => navigate("/registros")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                    <p className="text-3xl font-bold text-success">{globalIndicators.completedActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">{globalIndicators.overallCompletionPercent}% do total</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
                </div>
              </Card>

              <Card className="p-5 cursor-pointer hover:border-destructive/50 transition-colors"
                onClick={() => { setActiveTab("deadlines"); setDeadlineFilter("overdue"); }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Atrasadas</p>
                    <p className="text-3xl font-bold text-destructive">{globalIndicators.delayedActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requerem atenção</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
                </div>
              </Card>

              <Card className="p-5 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(isAdminContext ? "/ciclos-ativos" : "/ciclos")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ciclos Encerrados</p>
                    <p className="text-3xl font-bold text-foreground">{globalIndicators.closedCycles}</p>
                    <p className="text-xs text-muted-foreground mt-1">de {globalIndicators.totalCycles} ciclos</p>
                  </div>
                  <Lock className="h-8 w-8 text-primary opacity-50" />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Turmas Realizadas</p>
                    <p className="text-3xl font-bold text-foreground">{globalIndicators.completedTurmas}</p>
                    <p className="text-xs text-muted-foreground mt-1">de {globalIndicators.totalTurmas} turmas</p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-50" />
                </div>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Distribuição de Ações</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Nenhuma ação registrada ainda.</div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Progresso por Ciclo</h3>
                {cycleProgressData.some(d => d.completed > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={cycleProgressData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Progresso"]} />
                      <Bar dataKey="completed" fill="hsl(192, 70%, 35%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Nenhum progresso registrado ainda.</div>
                )}
              </Card>
            </div>

            {/* Métricas secundárias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3"><TrendingUp className="h-5 w-5 text-primary" /><h4 className="font-medium">Taxa de Conversão de Decisões</h4></div>
                <p className="text-3xl font-bold">{globalIndicators.decisionConversionRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">das decisões geraram ações</p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3"><Clock className="h-5 w-5 text-primary" /><h4 className="font-medium">Duração Média por Ciclo</h4></div>
                <p className="text-3xl font-bold">
                  {globalIndicators.averageCycleDurationDays || "—"}
                  <span className="text-lg font-normal text-muted-foreground"> dias</span>
                </p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3"><FileText className="h-5 w-5 text-primary" /><h4 className="font-medium">Backlog de Ações</h4></div>
                <p className="text-3xl font-bold">{globalIndicators.actionBacklog}</p>
                <p className="text-sm text-muted-foreground mt-1">ações pendentes ou em andamento</p>
              </Card>
            </div>
          </TabsContent>

          {/* ── CYCLES ── */}
          <TabsContent value="cycles" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Status por Ciclo</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                    <TableHead className="text-center">Turmas</TableHead>
                    <TableHead className="text-center">Progresso</TableHead>
                    <TableHead className="text-center">Dias</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycleIndicators.map(stat => (
                    <TableRow key={stat.cycleId} className={stat.isLocked ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {stat.isLocked && <Lock size={14} className="text-muted-foreground" />}
                          {stat.cycleId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={PHASE_COLORS?.[stat.phaseName.charAt(0) as "M" | "V" | "P"]?.badge || ""}>
                          {stat.phaseName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          stat.status === "closed"          && "bg-success/10 text-success",
                          stat.status === "ready_to_close"  && "bg-primary/10 text-primary",
                          stat.status === "in_progress"     && "bg-warning/10 text-warning",
                          stat.status === "not_started"     && "bg-muted text-muted-foreground",
                        )}>
                          {stat.status === "closed"         ? "Encerrado"
                          : stat.status === "ready_to_close" ? "Pronto p/ Encerrar"
                          : stat.status === "in_progress"    ? "Em Execução"
                          : "Não Iniciado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {stat.completedActions}/{stat.totalActions}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {stat.turmasCompleted}/{stat.turmasTotal}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={stat.completionPercent} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground">{stat.completionPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {stat.daysActive ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"
                          onClick={() => navigate(`/ciclos?cycle=${stat.cycleId}`)}>
                          <Eye size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ── RESPONSIBLE ── */}
          <TabsContent value="responsible" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Desempenho por Responsável</h3>
              {responsibleStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Concluídas</TableHead>
                      <TableHead className="text-center">Atrasadas</TableHead>
                      <TableHead className="text-center">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responsibleStats.map(stat => (
                      <TableRow key={stat.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-muted-foreground" />
                            <span className="font-medium text-sm">{stat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{stat.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-success/10 text-success">{stat.completed}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.delayed > 0
                            ? <Badge variant="destructive">{stat.delayed}</Badge>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            (stat.completed / stat.total) >= 0.8 && "bg-success/10 text-success",
                            (stat.completed / stat.total) >= 0.5 && (stat.completed / stat.total) < 0.8 && "bg-warning/10 text-warning",
                            (stat.completed / stat.total) < 0.5 && "bg-destructive/10 text-destructive",
                          )}>
                            {Math.round((stat.completed / stat.total) * 100)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <User size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhum responsável atribuído</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ── DEADLINES ── */}
          <TabsContent value="deadlines" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Ações por Prazo</h3>
                <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="overdue">Vencidas</SelectItem>
                    <SelectItem value="7days">Próx. 7 dias</SelectItem>
                    <SelectItem value="30days">Próx. 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredByDeadline.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Fator</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredByDeadline.map((action, i) => (
                      <TableRow key={i} className={action.isDelayed ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">{action.title}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{action.cycleId}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{action.factorName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <User size={12} className="text-muted-foreground" />
                            {action.responsible}
                          </div>
                        </TableCell>
                        <TableCell>
                          {action.dueDate ? (
                            <div className={cn("flex items-center gap-1 text-sm", action.isDelayed && "text-destructive font-medium")}>
                              <Calendar size={12} />
                              {format(new Date(action.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                              {action.isDelayed && (
                                <span className="text-xs">
                                  ({Math.abs(differenceInDays(new Date(action.dueDate), new Date()))}d atraso)
                                </span>
                              )}
                            </div>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            action.status === "completed"   && "bg-success/10 text-success",
                            action.status === "delayed"     && "bg-destructive/10 text-destructive",
                            action.status === "in_progress" && "bg-warning/10 text-warning",
                            action.status === "pending"     && "bg-muted text-muted-foreground",
                          )}>
                            {action.status === "completed"   ? "Concluída"
                            : action.status === "delayed"    ? "Atrasada"
                            : action.status === "in_progress"? "Em andamento"
                            : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm"
                            onClick={() => navigate(`/ciclos?cycle=${action.cycleId}`)}>
                            <Eye size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhuma ação encontrada com este filtro</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
