import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Target, Clock, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionStatus = "planned" | "in_progress" | "completed";

interface Action {
  id: number;
  title: string;
  status: ActionStatus;
  observation: string;
}

interface MonthData {
  id: string;
  label: string;
  focus: string;
  actions: Action[];
}

// Mock data - em produção virá do banco
const initialMonths: MonthData[] = Array.from({ length: 12 }, (_, i) => ({
  id: `M${i + 1}`,
  label: `M${i + 1}`,
  focus: getFocusForMonth(i + 1),
  actions: getActionsForMonth(i + 1),
}));

function getFocusForMonth(month: number): string {
  const focuses: Record<number, string> = {
    1: "Estruturação inicial do programa e alinhamento da liderança",
    2: "Comunicação interna e engajamento das equipes",
    3: "Primeiros treinamentos e formação do núcleo",
    4: "Consolidação dos processos e primeiros indicadores",
    5: "Avaliação intermediária e ajustes de rota",
    6: "Fortalecimento da cultura e práticas diárias",
    7: "Expansão do programa para outras áreas",
    8: "Medição de resultados e evidências",
    9: "Reconhecimento e celebração de conquistas",
    10: "Preparação para sustentabilidade do programa",
    11: "Avaliação final e documentação",
    12: "Fechamento do ciclo e planejamento do próximo ano",
  };
  return focuses[month] || `Foco do mês ${month}`;
}

function getActionsForMonth(month: number): Action[] {
  const baseActions = [
    "Reunião de alinhamento com liderança",
    "Comunicação interna sobre o programa",
    "Treinamento da equipe operacional",
    "Registro de indicadores do período",
    "Acompanhamento das metas estabelecidas",
  ];
  
  return baseActions.map((title, idx) => ({
    id: idx + 1,
    title,
    status: idx === 0 ? "completed" : idx === 1 ? "in_progress" : "planned" as ActionStatus,
    observation: "",
  }));
}

const statusConfig = {
  planned: { 
    label: "Planejado", 
    color: "bg-muted text-muted-foreground border-muted", 
    icon: Clock,
    value: 0 
  },
  in_progress: { 
    label: "Em andamento", 
    color: "bg-warning/10 text-warning border-warning/30", 
    icon: Target,
    value: 50 
  },
  completed: { 
    label: "Concluído", 
    color: "bg-success/10 text-success border-success/30", 
    icon: CheckCircle2,
    value: 100 
  },
};

export default function Months() {
  const [selectedMonth, setSelectedMonth] = useState("M1");
  const [monthsData, setMonthsData] = useState<MonthData[]>(initialMonths);
  
  const currentMonthIndex = parseInt(selectedMonth.replace("M", "")) - 1;
  const currentMonth = monthsData[currentMonthIndex];
  const previousMonth = currentMonthIndex > 0 ? monthsData[currentMonthIndex - 1] : null;
  
  // Calcular ações pendentes do mês anterior
  const previousPendingActions = previousMonth 
    ? previousMonth.actions.filter(a => a.status !== "completed").length 
    : 0;

  // Calcular progresso do mês atual
  const completedActions = currentMonth.actions.filter(a => a.status === "completed").length;
  const totalActions = currentMonth.actions.length;
  const monthProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const handleStatusChange = (actionId: number, newStatus: ActionStatus) => {
    setMonthsData(prev => prev.map((month, idx) => {
      if (idx === currentMonthIndex) {
        return {
          ...month,
          actions: month.actions.map(action => 
            action.id === actionId ? { ...action, status: newStatus } : action
          )
        };
      }
      return month;
    }));
  };

  const handleObservationChange = (actionId: number, observation: string) => {
    setMonthsData(prev => prev.map((month, idx) => {
      if (idx === currentMonthIndex) {
        return {
          ...month,
          actions: month.actions.map(action => 
            action.id === actionId ? { ...action, observation } : action
          )
        };
      }
      return month;
    }));
  };

  return (
    <AppLayout
      title="Meses (M1–M12)"
      subtitle="Acompanhamento mensal do programa. Atualize o status e observações de cada ação."
    >
      <div className="space-y-6 animate-fade-in">
        {/* Month Navigation - Horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {monthsData.map((month, idx) => {
            const monthCompleted = month.actions.filter(a => a.status === "completed").length;
            const monthTotal = month.actions.length;
            const isComplete = monthCompleted === monthTotal;
            const hasPending = month.actions.some(a => a.status !== "completed");
            
            return (
              <button
                key={month.id}
                onClick={() => setSelectedMonth(month.id)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all text-sm",
                  "border-2 min-w-[60px]",
                  selectedMonth === month.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : isComplete
                    ? "bg-success/10 text-success border-success/30 hover:bg-success/20"
                    : hasPending && idx < currentMonthIndex
                    ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                )}
              >
                {month.label}
              </button>
            );
          })}
        </div>

        {/* Previous Month Warning */}
        {previousPendingActions > 0 && (
          <Alert className="border-warning/50 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              <span className="font-medium">{previousPendingActions} ação(ões)</span> do mês anterior ({previousMonth?.id}) ainda não foram concluídas.
            </AlertDescription>
          </Alert>
        )}

        {/* Month Header Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">
                  {currentMonth.id} - Mês {currentMonthIndex + 1}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {completedActions} de {totalActions} ações concluídas
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{monthProgress}%</span>
              <Progress value={monthProgress} className="w-24 h-2 mt-1" />
            </div>
          </div>

          {/* Focus Section */}
          <div className="bg-secondary/30 p-4 rounded-lg border border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
              Foco do Mês
            </h3>
            <p className="text-foreground font-medium">
              {currentMonth.focus}
            </p>
          </div>
        </Card>

        {/* Actions List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <ChevronRight size={16} className="text-primary" />
            Ações do Mês ({currentMonth.actions.length})
          </h3>
          
          {currentMonth.actions.map((action) => {
            const status = statusConfig[action.status];
            const StatusIcon = status.icon;
            
            return (
              <Card
                key={action.id}
                className={cn(
                  "p-4 transition-all border-l-4",
                  action.status === "completed" && "border-l-success",
                  action.status === "in_progress" && "border-l-warning",
                  action.status === "planned" && "border-l-muted"
                )}
              >
                <div className="space-y-3">
                  {/* Action Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                        {action.id}
                      </div>
                      <span className="text-foreground font-medium">{action.title}</span>
                    </div>
                    
                    {/* Status Selector */}
                    <Select
                      value={action.status}
                      onValueChange={(value: ActionStatus) => handleStatusChange(action.id, value)}
                    >
                      <SelectTrigger className={cn("w-[160px] h-9", status.color)}>
                        <div className="flex items-center gap-2">
                          <StatusIcon size={14} />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            Planejado
                          </div>
                        </SelectItem>
                        <SelectItem value="in_progress">
                          <div className="flex items-center gap-2">
                            <Target size={14} />
                            Em andamento
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} />
                            Concluído
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Progress Indicator */}
                  <Progress value={status.value} className="h-1.5" />

                  {/* Observation Field */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Observações (opcional)
                    </label>
                    <Textarea
                      placeholder="Adicione observações, anotações ou referências externas..."
                      value={action.observation}
                      onChange={(e) => handleObservationChange(action.id, e.target.value)}
                      className="min-h-[60px] text-sm resize-none"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center py-4">
          As alterações são salvas automaticamente. Navegue livremente entre os meses.
        </p>
      </div>
    </AppLayout>
  );
}