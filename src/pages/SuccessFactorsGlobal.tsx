import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Trash2,
  Info,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mvpCycles, SUCCESS_FACTOR_DESCRIPTIONS } from "@/data/mvpCycles";
import {
  getEffectiveSuccessFactors,
  saveGlobalAction,
  deleteGlobalAction,
  replicateToCompanies,
} from "@/lib/globalSuccessFactors";
import { useToast } from "@/hooks/use-toast";

const cycleOptions = ["M1", "M2", "M3", "V1", "V2", "V3", "P1", "P2", "P3"];

const phaseColors: Record<string, string> = {
  M: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  V: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  P: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

const factorIconColors: Record<string, string> = {
  amber: "bg-amber-500/10 text-amber-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  blue: "bg-blue-500/10 text-blue-600",
  purple: "bg-purple-500/10 text-purple-600",
  rose: "bg-rose-500/10 text-rose-600",
};

export default function SuccessFactorsGlobal() {
  const { toast } = useToast();
  const [selectedCycleId, setSelectedCycleId] = useState("M1");
  const [openFactors, setOpenFactors] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingAction, setEditingAction] = useState<{
    factorId: string;
    actionId: string | null;
    title: string;
    description: string;
    bestPractice: string;
  } | null>(null);

  // Read effective factors (defaults merged with overrides) — re-reads on refreshKey change
  const factors = useMemo(
    () => getEffectiveSuccessFactors(selectedCycleId),
    [selectedCycleId, refreshKey]
  );

  const totalActions = useMemo(
    () => factors.reduce((sum, f) => sum + f.actions.length, 0),
    [factors]
  );

  const toggleFactor = (factorId: string) => {
    setOpenFactors(prev =>
      prev.includes(factorId)
        ? prev.filter(id => id !== factorId)
        : [...prev, factorId]
    );
  };

  const handleSaveAction = useCallback(() => {
    if (!editingAction) return;

    // 1. Persist to global storage
    const result = saveGlobalAction(
      selectedCycleId,
      editingAction.factorId,
      editingAction.actionId,
      { title: editingAction.title, description: editingAction.description, bestPractice: editingAction.bestPractice }
    );

    if (!result.success) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível persistir a alteração. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    // 2. Cascade to companies
    const replication = replicateToCompanies(selectedCycleId);

    // 3. Refresh UI
    setRefreshKey(k => k + 1);
    setEditingAction(null);

    // 4. Conditional success message
    const action = editingAction.actionId ? "atualizada" : "criada";
    if (replication.failed > 0) {
      toast({
        title: `Ação ${action} com alertas`,
        description: `Salva com sucesso. ${replication.updated} empresa(s) atualizada(s), ${replication.failed} com erro.`,
      });
    } else {
      toast({
        title: `Ação ${action}`,
        description: replication.updated > 0
          ? `"${editingAction.title}" salva. ${replication.updated} empresa(s) receberão a atualização.`
          : `"${editingAction.title}" salva com sucesso.`,
      });
    }
  }, [editingAction, selectedCycleId, toast]);

  const handleDeleteAction = useCallback((factorId: string, actionId: string) => {
    if (!confirm("Deseja remover esta ação padrão? Empresas que já a utilizam manterão seus dados.")) {
      return;
    }

    const success = deleteGlobalAction(selectedCycleId, factorId, actionId);

    if (!success) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a ação. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setRefreshKey(k => k + 1);
    toast({
      title: "Ação removida",
      description: "A ação padrão foi removida da estrutura global.",
      variant: "destructive",
    });
  }, [selectedCycleId, toast]);

  const currentCycle = mvpCycles.find(c => c.id === selectedCycleId);
  if (!currentCycle) return null;

  return (
    <AppLayout
      title="Estrutura Global de Fatores de Sucesso"
      subtitle="Configure a estrutura base dos Fatores de Sucesso por ciclo. Alterações se refletem em todas as empresas."
    >
      <div className="space-y-6 animate-fade-in">
        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Como funciona a cascata</p>
            <p>
              As alterações feitas aqui definem a estrutura padrão dos ciclos.
              Empresas que já possuem o ciclo em andamento receberão novas ações e atualizações de título,
              sem perder dados operacionais já preenchidos (responsável, prazo, status).
            </p>
          </div>
        </div>

        {/* Cycle selector */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Selecione o ciclo para configurar</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {cycleOptions.map(id => {
              const phase = id.charAt(0) as "M" | "V" | "P";
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCycleId(id)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold text-sm border-2 transition-all",
                    selectedCycleId === id
                      ? `${phaseColors[phase]} border-current font-bold`
                      : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                  )}
                >
                  {id}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Cycle overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">
                {currentCycle.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Fase {currentCycle.phaseName} • {currentCycle.estimatedDuration}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {factors.length} fatores • {totalActions} ações
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {currentCycle.context}
          </p>
        </Card>

        {/* Success Factors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Layers size={20} className="text-primary" />
              Fatores de Sucesso — {selectedCycleId}
            </h3>
          </div>

          {factors.map(factor => {
            const isOpen = openFactors.includes(factor.id);
            const description = SUCCESS_FACTOR_DESCRIPTIONS[factor.id] || "";

            return (
              <Collapsible
                key={factor.id}
                open={isOpen}
                onOpenChange={() => toggleFactor(factor.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center justify-between p-4 transition-all hover:bg-secondary/50",
                        isOpen && "bg-secondary/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                            factorIconColors[factor.color] || factorIconColors.blue
                          )}
                        >
                          {factor.icon}
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-foreground">{factor.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {factor.actions.length} ações
                        </Badge>
                        {isOpen ? (
                          <ChevronDown size={20} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={20} className="text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <Separator />
                    <div className="p-4 space-y-3">
                      {factor.actions.map(action => (
                        <div
                          key={action.id}
                          className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-secondary/20 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                             <p className="font-medium text-foreground text-sm">
                               {action.title}
                             </p>
                             {action.description && (
                               <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                 {action.description}
                               </p>
                             )}
                             <p className="text-xs text-muted-foreground mt-1">
                               💡 {action.bestPractice}
                             </p>
                          </div>
                          <div className="flex items-center gap-1 ml-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                             onClick={() =>
                                 setEditingAction({
                                   factorId: factor.id,
                                   actionId: action.id,
                                   title: action.title,
                                   description: action.description || "",
                                   bestPractice: action.bestPractice,
                                 })
                               }
                              }
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteAction(factor.id, action.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full"
                       onClick={() =>
                           setEditingAction({
                             factorId: factor.id,
                             actionId: null,
                             title: "",
                             description: "",
                             bestPractice: "",
                           })
                         }
                        }
                      >
                        <Plus size={14} />
                        Adicionar ação a "{factor.name}"
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {/* Legend */}
        <p className="text-xs text-muted-foreground text-center">
          Os 5 Fatores de Sucesso são padrão do programa MVP. As ações dentro de cada fator podem ser personalizadas por ciclo.
        </p>
      </div>

      {/* Edit/Create Action Dialog */}
      <Dialog
        open={!!editingAction}
        onOpenChange={() => setEditingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAction?.actionId ? "Editar Ação" : "Nova Ação"}
            </DialogTitle>
            <DialogDescription>
              {editingAction?.actionId
                ? "Atualize o título e a dica de boa prática."
                : "Adicione uma nova ação padrão ao fator de sucesso."}
            </DialogDescription>
          </DialogHeader>

          {editingAction && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Título da Ação
                </label>
                <Input
                  value={editingAction.title}
                  onChange={e =>
                    setEditingAction({ ...editingAction, title: e.target.value })
                  }
                  placeholder="Ex: Reunião semanal do núcleo"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Dica de Boa Prática
                </label>
                <Textarea
                  value={editingAction.bestPractice}
                  onChange={e =>
                    setEditingAction({
                      ...editingAction,
                      bestPractice: e.target.value,
                    })
                  }
                  placeholder="Ex: Máximo 30 min, pauta fixa"
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAction(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAction} disabled={!editingAction?.title?.trim()}>
              {editingAction?.actionId ? "Salvar Alterações" : "Criar Ação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
