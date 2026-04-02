import { useState, useMemo, useEffect } from "react";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Eye,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Target,
  User,
  Lock,
  Unlock,
  TrendingUp,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  obterIndicadoresGlobais, 
  obterIndicadoresTodosCiclos,
  obterIndicadoresPorCiclo,
  type GlobalIndicators,
  type CycleIndicators,
} from "@/lib/governance";
import { getAllCycleActions, recalculateActionStatuses } from "@/lib/storage";
import { mvpCycles } from "@/data/mvpCycles";
import { CYCLE_IDS, PHASE_COLORS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useReadOnly } from "@/contexts/ReadOnlyContext";

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
  const { isAdminMVP } = useAuth();
  const { isReadOnly } = useReadOnly();
  
  // Admin context: not in mirror/read-only mode
  const isAdminContext = isAdminMVP && !isReadOnly;

  // Recalculate on mount
  useEffect(() => {
    recalculateActionStatuses();
  }, []);

  // Get real indicators from governance layer
  const { globalIndicators, cycleIndicators, allActions, responsibleStats, chartData } = useMemo(() => {
    const global = obterIndicadoresGlobais();
    const cycles = obterIndicadoresTodosCiclos();
    const actions = getAllCycleActions();
    
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

    // Responsible stats
    const responsibleMap = new Map<string, { total: number; delayed: number; completed: number }>();
    allActions.forEach(a => {
      const current = responsibleMap.get(a.responsible) || { total: 0, delayed: 0, completed: 0 };
      responsibleMap.set(a.responsible, {
        total: current.total + 1,
        delayed: current.delayed + (a.isDelayed ? 1 : 0),
        completed: current.completed + (a.status === 'completed' ? 1 : 0),
      });
    });
    const responsibleStats = Array.from(responsibleMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);

    // Chart data
    const chartData = [
      { name: "Concluídas", value: global.completedActions, color: "hsl(158, 64%, 40%)" },
      { name: "Em andamento", value: global.inProgressActions, color: "hsl(192, 70%, 35%)" },
      { name: "Atrasadas", value: global.delayedActions, color: "hsl(0, 72%, 51%)" },
      { name: "Pendentes", value: global.pendingActions, color: "hsl(38, 92%, 50%)" },
    ].filter(d => d.value > 0);

    return { globalIndicators: global, cycleIndicators: cycles, allActions, responsibleStats, chartData };
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

  // Cycle progress chart data
  const cycleProgressData = cycleIndicators.map(c => ({
    name: c.cycleId,
    completed: c.completionPercent,
    turmas: c.turmasCompleted,
  }));

  return (
    <AppLayout
      title="Indicadores"
      subtitle="Métricas consolidadas do programa baseadas em dados reais de governança"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(isAdminContext ? "/ciclos-ativos" : "/ciclos")}>
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

              <Card className="p-5 cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => { setActiveTab("deadlines"); setDeadlineFilter("overdue"); }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Atrasadas</p>
                    <p className="text-3xl font-bold text-destructive">{globalIndicators.delayedActions}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requerem atenção</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
                </div>
              </Card>

              <Card className="p-5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/turmas")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Turmas</p>
                    <p className="text-3xl font-bold text-primary">{globalIndicators.completedTurmas}/{globalIndicators.totalTurmas}</p>
                    <p className="text-xs text-muted-foreground mt-1">{globalIndicators.totalParticipants} participantes</p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-50" />
                </div>
              </Card>

              <Card className="p-5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/registros?type=decision")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Decisão→Ação</p>
                    <p className="text-3xl font-bold text-foreground">{globalIndicators.decisionConversionRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{globalIndicators.decisionsWithActions} decisões convertidas</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary opacity-50" />
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
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Nenhuma ação registrada
                    </div>
                  )}
                </div>
              </Card>

              {/* Progress by Cycle */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Progresso por Ciclo</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cycleProgressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="completed" name="% Concluído" fill="hsl(158, 64%, 40%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Ciclos Encerrados</h4>
                </div>
                <p className="text-3xl font-bold">{globalIndicators.closedCycles}/{globalIndicators.totalCycles}</p>
                <Progress value={(globalIndicators.closedCycles / globalIndicators.totalCycles) * 100} className="mt-3 h-2" />
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-warning" />
                  <h4 className="font-medium">Tempo Médio por Ciclo</h4>
                </div>
                <p className="text-3xl font-bold">
                  {globalIndicators.averageCycleDurationDays || '—'} 
                  <span className="text-lg font-normal text-muted-foreground"> dias</span>
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Backlog de Ações</h4>
                </div>
                <p className="text-3xl font-bold">{globalIndicators.actionBacklog}</p>
                <p className="text-sm text-muted-foreground mt-1">ações pendentes ou em andamento</p>
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
                        <Badge className={PHASE_COLORS[stat.phaseName.charAt(0) as 'M' | 'V' | 'P']?.badge || ''}>
                          {stat.phaseName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          stat.status === 'closed' && "bg-success/10 text-success",
                          stat.status === 'ready_to_close' && "bg-primary/10 text-primary",
                          stat.status === 'in_progress' && "bg-warning/10 text-warning",
                          stat.status === 'pending' && "bg-muted text-muted-foreground",
                        )}>
                          {stat.status === 'closed' ? 'Encerrado' : 
                           stat.status === 'ready_to_close' ? 'Pronto' : 
                           stat.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-success">{stat.completedActions}</span>
                        <span className="text-muted-foreground">/{stat.totalActions}</span>
                        {stat.delayedActions > 0 && (
                          <Badge variant="destructive" className="ml-2 text-xs">{stat.delayedActions} atrasadas</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.turmasCompleted}/{stat.turmasTotal}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={stat.completionPercent} className="w-16 h-2" />
                          <span className="text-xs">{stat.completionPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {stat.daysActive || '—'}
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
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User size={14} className="text-primary" />
                            </div>
                            <span className="font-medium">{stat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{stat.total}</TableCell>
                        <TableCell className="text-center text-success">{stat.completed}</TableCell>
                        <TableCell className="text-center">
                          {stat.delayed > 0 ? (
                            <Badge variant="destructive">{stat.delayed}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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

          {/* Deadlines Tab */}
          <TabsContent value="deadlines" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Ações por Prazo</h3>
                <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
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
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredByDeadline.map(action => (
                      <TableRow key={`${action.cycleId}-${action.actionId}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{action.title}</p>
                            <p className="text-xs text-muted-foreground">{action.factorName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{action.cycleId}</Badge>
                        </TableCell>
                        <TableCell>{action.responsible}</TableCell>
                        <TableCell>
                          {action.dueDate ? (
                            <span className={cn(action.isDelayed && "text-destructive font-medium")}>
                              {format(new Date(action.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            action.status === 'completed' && "bg-success/10 text-success",
                            action.status === 'delayed' && "bg-destructive/10 text-destructive",
                            action.status === 'in_progress' && "bg-warning/10 text-warning",
                            action.status === 'pending' && "bg-muted text-muted-foreground",
                          )}>
                            {action.status === 'completed' ? 'Concluída' :
                             action.status === 'delayed' ? 'Atrasada' :
                             action.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/ciclos?cycle=${action.cycleId}`)}
                          >
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