import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Target, CheckCircle2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionStatus = "planned" | "in_progress" | "completed";

export interface ActiveAction {
  id: string;
  factorName: string;
  title: string;
  status: ActionStatus;
  observation: string;
}

interface ActiveActionsProps {
  actions: ActiveAction[];
  onStatusChange: (actionId: string, status: ActionStatus) => void;
  onObservationChange: (actionId: string, observation: string) => void;
}

const statusConfig = {
  planned: {
    label: "Planejado",
    color: "bg-muted text-muted-foreground border-muted",
    icon: Clock,
    value: 0,
  },
  in_progress: {
    label: "Em andamento",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: Target,
    value: 50,
  },
  completed: {
    label: "Concluído",
    color: "bg-success/10 text-success border-success/30",
    icon: CheckCircle2,
    value: 100,
  },
};

export function ActiveActions({
  actions,
  onStatusChange,
  onObservationChange,
}: ActiveActionsProps) {
  if (actions.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <ListChecks size={20} className="text-primary" />
          Ações do Ciclo
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <ListChecks size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma ação ativa neste ciclo.</p>
          <p className="text-sm">
            Ative ações nos Fatores de Sucesso acima para começar.
          </p>
        </div>
      </Card>
    );
  }

  const completedCount = actions.filter((a) => a.status === "completed").length;
  const overallProgress = Math.round((completedCount / actions.length) * 100);

  // Group actions by factor
  const groupedActions = actions.reduce((acc, action) => {
    if (!acc[action.factorName]) {
      acc[action.factorName] = [];
    }
    acc[action.factorName].push(action);
    return acc;
  }, {} as Record<string, ActiveAction[]>);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <ListChecks size={20} className="text-primary" />
          Ações do Ciclo ({actions.length})
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {completedCount}/{actions.length} concluídas
          </span>
          <div className="flex items-center gap-2">
            <Progress value={overallProgress} className="w-24 h-2" />
            <span className="text-sm font-semibold text-primary">
              {overallProgress}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedActions).map(([factorName, factorActions]) => (
          <div key={factorName}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              {factorName}
            </h4>
            <div className="space-y-3">
              {factorActions.map((action) => {
                const status = statusConfig[action.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={action.id}
                    className={cn(
                      "p-4 rounded-lg border-l-4 bg-card border transition-all",
                      action.status === "completed" && "border-l-success",
                      action.status === "in_progress" && "border-l-warning",
                      action.status === "planned" && "border-l-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <span className="font-medium text-foreground flex-1">
                        {action.title}
                      </span>
                      <Select
                        value={action.status}
                        onValueChange={(value: ActionStatus) =>
                          onStatusChange(action.id, value)
                        }
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

                    <Progress value={status.value} className="h-1.5 mb-3" />

                    <Textarea
                      placeholder="Observações sobre esta ação..."
                      value={action.observation}
                      onChange={(e) =>
                        onObservationChange(action.id, e.target.value)
                      }
                      className="min-h-[50px] text-sm resize-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
