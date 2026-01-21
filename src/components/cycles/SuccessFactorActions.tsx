import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuggestedAction {
  id: string;
  title: string;
  bestPractice: string;
  enabled: boolean;
  disabledReason?: string;
}

export interface SuccessFactor {
  id: string;
  name: string;
  icon: string;
  color: string;
  actions: SuggestedAction[];
}

interface SuccessFactorActionsProps {
  factors: SuccessFactor[];
  onToggleAction: (factorId: string, actionId: string, enabled: boolean) => void;
  onUpdateReason: (factorId: string, actionId: string, reason: string) => void;
}

const iconColors: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  amber: "bg-amber-500/10 text-amber-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  purple: "bg-purple-500/10 text-purple-600",
  rose: "bg-rose-500/10 text-rose-600",
};

export function SuccessFactorActions({
  factors,
  onToggleAction,
  onUpdateReason,
}: SuccessFactorActionsProps) {
  const [openFactors, setOpenFactors] = useState<string[]>([]);

  const toggleFactor = (factorId: string) => {
    setOpenFactors((prev) =>
      prev.includes(factorId)
        ? prev.filter((id) => id !== factorId)
        : [...prev, factorId]
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-display font-semibold text-foreground mb-4">
        Fatores de Sucesso do Ciclo
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Clique em cada fator para ver e configurar as ações sugeridas. Ative as ações que serão executadas neste ciclo.
      </p>

      <div className="space-y-3">
        {factors.map((factor) => {
          const isOpen = openFactors.includes(factor.id);
          const activeCount = factor.actions.filter((a) => a.enabled).length;
          const totalCount = factor.actions.length;

          return (
            <Collapsible
              key={factor.id}
              open={isOpen}
              onOpenChange={() => toggleFactor(factor.id)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-lg border transition-all",
                    "hover:bg-secondary/50",
                    isOpen && "bg-secondary/30 border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                        iconColors[factor.color] || iconColors.blue
                      )}
                    >
                      {factor.icon}
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-foreground">
                        {factor.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={activeCount === totalCount ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {activeCount}/{totalCount} ações ativas
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={20} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={20} className="text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="mt-2 ml-4 space-y-3 border-l-2 border-border pl-4">
                  {factor.actions.map((action) => (
                    <div
                      key={action.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        action.enabled
                          ? "bg-success/5 border-success/20"
                          : "bg-muted/30 border-muted"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Switch
                              checked={action.enabled}
                              onCheckedChange={(checked) =>
                                onToggleAction(factor.id, action.id, checked)
                              }
                            />
                            <span
                              className={cn(
                                "font-medium",
                                action.enabled
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {action.title}
                            </span>
                          </div>

                          {/* Best practice tip */}
                          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/30 p-2 rounded mt-2">
                            <Lightbulb size={14} className="text-warning mt-0.5 flex-shrink-0" />
                            <span>{action.bestPractice}</span>
                          </div>

                          {/* Reason field when disabled */}
                          {!action.enabled && (
                            <div className="mt-3">
                              <div className="flex items-center gap-1 text-xs text-warning mb-1">
                                <AlertCircle size={12} />
                                <span>Motivo para não executar (obrigatório)</span>
                              </div>
                              <Textarea
                                placeholder="Explique por que esta ação não será executada neste ciclo..."
                                value={action.disabledReason || ""}
                                onChange={(e) =>
                                  onUpdateReason(factor.id, action.id, e.target.value)
                                }
                                className="min-h-[60px] text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </Card>
  );
}
