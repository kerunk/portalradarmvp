import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Eye,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Target,
  User,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllCycleActions, getState } from "@/lib/storage";
import { mvpCycles } from "@/data/mvpCycles";
import { CYCLE_IDS, ACTION_STATUS, PHASE_COLORS } from "@/lib/constants";

interface ActionData {
  cycleId: string;
  factorId: string;
  actionId: string;
  title: string;
  factorName: string;
  responsible: string;
  dueDate: string | null;
  status: string;
  isDelayed: boolean;
}

export default function Indicators() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [deadlineFilter, setDeadlineFilter] = useState("all");

  const { allActions, cycleStats, responsibleStats, chartData } = useMemo(() => {
    const actions = getAllCycleActions();
    const state = getState();
    
    // Build action data with details
    const allActions: ActionData[] = actions.map(a => {
      const cycle = mvpCycles.find(c => c.id === a.cycleId);
      const factor = cycle?.successFactors.find(f => f.id === a.factorId);
      const actionDef = factor?.actions.find(act => act.id === a.action.id);
      
      return {
        cycleId: a.cycleId,
        factorId: a.factorId,
        actionId: a.action.id,
        title: actionDef?.title || a.action.id,
        factorName: factor?.name || a.factorId,
        responsible: a.action.responsible || "Não atribuído",
        dueDate: a.action.dueDate,
        status: a.isDelayed ? "delayed" : a.action.status,
        isDelayed: a.isDelayed,
      };
    });

    // Cycle stats
    const cycleStats = CYCLE_IDS.map(cycleId => {
      const cycleActions = allActions.filter(a => a.cycleId === cycleId);
      const total = cycleActions.length;
      const completed = cycleActions.filter(a => a.status === "completed").length;
      const delayed = cycleActions.filter(a => a.isDelayed).length;
      const nextDeadline = cycleActions
        .filter(a => a.dueDate && a.status !== "completed")
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];

      return {
        cycleId,
        phase: cycleId.charAt(0) as "M" | "V" | "P",
        total,
        completed,
        delayed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        nextDeadline: nextDeadline?.dueDate || null,
      };
    });

    // Responsible stats
    const responsibleMap = new Map<string, { total: number; delayed: number }>();
    allActions.forEach(a => {
      const current = responsibleMap.get(a.responsible) || { total: 0, delayed: 0 };
      responsibleMap.set(a.responsible, {
        total: current.total + 1,
        delayed: current.delayed + (a.isDelayed ? 1 : 0),
      });
    });
    const responsibleStats = Array.from(responsibleMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);

    // Chart data
    const statusCounts = {
      completed: allActions.filter(a => a.status === "completed").length,
      in_progress: allActions.filter(a => a.status === "in_progress").length,
      delayed: allActions.filter(a => a.isDelayed).length,
      pending: allActions.filter(a => a.status === "pending" && !a.isDelayed).length,
    };
    const chartData = [
      { name: "Concluídas", value: statusCounts.completed, color: "hsl(158, 64%, 40%)" },
      { name: "Em andamento", value: statusCounts.in_progress, color: "hsl(192, 70%, 35%)" },
      { name: "Atrasadas", value: statusCounts.delayed, color: "hsl(0, 72%, 51%)" },
      { name: "Pendentes", value: statusCounts.pending, color: "hsl(38, 92%, 50%)" },
    ].filter(d => d.value > 0);

    return { allActions, cycleStats, responsibleStats, chartData };
  }, []);

  const filteredByDeadline = useMemo(() => {
    if (deadlineFilter === "all") return allActions;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allActions.filter(a => {
      if (!a.dueDate) return false;
      const due = new Date(a.dueDate);
      due.setHours(0, 0, 0, 0);
      
      const diff = differenceInDays(due, today);
      
      switch (deadlineFilter) {
        case "overdue":
          return diff < 0 && a.status !== "completed";
        case "7days":
          return diff >= 0 && diff <= 7 && a.status !== "completed";
        case "30days":
          return diff >= 0 && diff <= 30 && a.status !== "completed";
        default:
          return true;
      }
    });
  }, [allActions, deadlineFilter]);

  const totalActions = allActions.length;
  const completedActions = allActions.filter(a => a.status === "completed").length;
  const delayedActions = allActions.filter(a => a.isDelayed).length;
  const inProgressActions = allActions.filter(a => a.status === "in_progress").length;

  return (
    <AppLayout
      title="Indicadores"
      subtitle="Acompanhe as métricas do programa baseadas em dados reais dos ciclos"
    >
      <div className="space-y-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="cycles">Por Ciclo</TabsTrigger>
            <TabsTrigger value="responsible">Por Responsável</TabsTrigger>
            <TabsTrigger value="deadlines">Prazos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="p-5 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate("/ciclos")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Ações</p>
                    <p className="text-3xl font-bold text-foreground">{totalActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ações ativas nos ciclos</p>
                  </div>
                  <Target className="h-8 w-8 text-primary opacity-50" />
                </div>
              </Card>

              <Card 
                className="p-5 cursor-pointer hover:border-success/50 transition-colors"
                onClick={() => navigate("/registros")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídas</p>
                    <p className="text-3xl font-bold text-success">{completedActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0}% do total
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
                </div>
              </Card>

              <Card 
                className="p-5 cursor-pointer hover:border-warning/50 transition-colors"
                onClick={() => setActiveTab("cycles")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                    <p className="text-3xl font-bold text-warning">{inProgressActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ações em execução</p>
                  </div>
                  <Clock className="h-8 w-8 text-warning opacity-50" />
                </div>
              </Card>

              <Card 
                className="p-5 cursor-pointer hover:border-destructive/50 transition-colors"
                onClick={() => { setActiveTab("deadlines"); setDeadlineFilter("overdue"); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Atrasadas</p>
                    <p className="text-3xl font-bold text-destructive">{delayedActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requerem atenção</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Distribuição por Status</h3>
                <div className="h-64">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Nenhuma ação registrada
                    </div>
                  )}
                </div>
              </Card>

              {/* Progress by Phase */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Progresso por Fase</h3>
                <div className="space-y-4">
                  {["M", "V", "P"].map(phase => {
                    const phaseCycles = cycleStats.filter(c => c.phase === phase);
                    const total = phaseCycles.reduce((sum, c) => sum + c.total, 0);
                    const completed = phaseCycles.reduce((sum, c) => sum + c.completed, 0);
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    
                    return (
                      <div key={phase} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={PHASE_COLORS[phase as keyof typeof PHASE_COLORS].badge}>
                              {PHASE_COLORS[phase as keyof typeof PHASE_COLORS].name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {completed}/{total} ações
                            </span>
                          </div>
                          <span className="text-sm font-semibold">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Cycles Tab */}
          <TabsContent value="cycles" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Status por Ciclo</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Concluídas</TableHead>
                    <TableHead className="text-center">Atrasadas</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead>Próximo Prazo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycleStats.map(stat => (
                    <TableRow key={stat.cycleId}>
                      <TableCell className="font-medium">{stat.cycleId}</TableCell>
                      <TableCell>
                        <Badge className={PHASE_COLORS[stat.phase].badge}>
                          {PHASE_COLORS[stat.phase].name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{stat.total}</TableCell>
                      <TableCell className="text-center text-success">{stat.completed}</TableCell>
                      <TableCell className="text-center text-destructive">
                        {stat.delayed > 0 ? stat.delayed : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={stat.percentage} className="w-16 h-2" />
                          <span className="text-xs">{stat.percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {stat.nextDeadline ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(stat.nextDeadline), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/ciclos?cycle=${stat.cycleId}`)}
                        >
                          <Eye size={16} className="mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Responsible Tab */}
          <TabsContent value="responsible" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Ações por Responsável</h3>
              {responsibleStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-center">Total Atribuídas</TableHead>
                      <TableHead className="text-center">Atrasadas</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responsibleStats.map(stat => (
                      <TableRow key={stat.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User size={14} className="text-primary" />
                            </div>
                            <span className="font-medium">{stat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{stat.total}</TableCell>
                        <TableCell className="text-center">
                          {stat.delayed > 0 ? (
                            <Badge variant="destructive">{stat.delayed}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setActiveTab("deadlines"); }}
                          >
                            <ArrowRight size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum responsável atribuído ainda
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Deadlines Tab */}
          <TabsContent value="deadlines" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Ações por Prazo</h3>
                <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="overdue">Vencidas</SelectItem>
                    <SelectItem value="7days">Próximos 7 dias</SelectItem>
                    <SelectItem value="30days">Próximos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {filteredByDeadline.length > 0 ? (
                <div className="space-y-3">
                  {filteredByDeadline
                    .sort((a, b) => {
                      if (!a.dueDate) return 1;
                      if (!b.dueDate) return -1;
                      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    })
                    .map(action => (
                      <div
                        key={`${action.cycleId}-${action.actionId}`}
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer hover:bg-secondary/30 transition-colors",
                          action.isDelayed && "border-destructive/50 bg-destructive/5"
                        )}
                        onClick={() => navigate(`/ciclos?cycle=${action.cycleId}`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{action.cycleId}</Badge>
                              <span className="font-medium">{action.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {action.factorName} • {action.responsible}
                            </p>
                          </div>
                          <div className="text-right">
                            {action.dueDate && (
                              <div className={cn(
                                "flex items-center gap-1 text-sm",
                                action.isDelayed ? "text-destructive font-medium" : "text-muted-foreground"
                              )}>
                                <Calendar size={14} />
                                {format(new Date(action.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            )}
                            <Badge className={ACTION_STATUS[action.status as keyof typeof ACTION_STATUS]?.color || ""}>
                              {ACTION_STATUS[action.status as keyof typeof ACTION_STATUS]?.label || action.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma ação encontrada com o filtro selecionado
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
