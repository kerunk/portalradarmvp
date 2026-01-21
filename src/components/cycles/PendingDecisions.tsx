import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  Zap,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecords, type RecordState } from "@/lib/storage";
import { RECORD_TYPES } from "@/lib/constants";
import { 
  CreateActionFromTemplateDialog,
  type NewActionData,
} from "./CreateActionFromTemplateDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingDecisionsProps {
  cycleId: string;
  onCreateAction: (action: NewActionData, decisionId: string) => void;
}

export function PendingDecisions({ cycleId, onCreateAction }: PendingDecisionsProps) {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<RecordState[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<RecordState | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const allRecords = getRecords();
    const pendingDecisions = allRecords.filter(r => 
      r.type === "decision" && 
      r.status !== "closed" &&
      (r.cycleId === cycleId || !r.cycleId)
    );
    setDecisions(pendingDecisions);
  }, [cycleId]);

  const handleCreateAction = (decision: RecordState) => {
    setSelectedDecision(decision);
    setIsDialogOpen(true);
  };

  const handleConfirmAction = (actionData: NewActionData) => {
    if (selectedDecision) {
      onCreateAction(actionData, selectedDecision.id);
    }
    setSelectedDecision(null);
  };

  if (decisions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-warning/30 bg-warning/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              Decisões Pendentes
            </h3>
            <p className="text-sm text-muted-foreground">
              Decisões do comitê aguardando ações. Transforme em ações executáveis.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/registros?type=decision")}
          className="gap-1"
        >
          Ver todas
          <ArrowRight size={14} />
        </Button>
      </div>

      <div className="space-y-3">
        {decisions.slice(0, 5).map(decision => (
          <div 
            key={decision.id}
            className="flex items-start gap-4 p-4 rounded-lg bg-card border hover:border-primary/30 transition-colors"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              RECORD_TYPES.decision.color
            )}>
              <CheckCircle2 size={16} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-foreground line-clamp-1">
                  {decision.title}
                </h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {decision.cycleId && (
                    <Badge variant="outline" className="text-xs">
                      {decision.cycleId}
                    </Badge>
                  )}
                  {decision.linkedActionIds && decision.linkedActionIds.length > 0 ? (
                    <Badge className="bg-success/10 text-success text-xs">
                      {decision.linkedActionIds.length} ação(ões)
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Sem ações
                    </Badge>
                  )}
                </div>
              </div>

              {decision.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {decision.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(decision.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                  {decision.owner && ` • ${decision.owner}`}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7"
                  onClick={() => handleCreateAction(decision)}
                >
                  <Zap size={12} />
                  Criar Ação
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {decisions.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/registros?type=decision")}
          >
            Ver mais {decisions.length - 5} decisões
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      )}

      {/* Dialog for creating action */}
      <CreateActionFromTemplateDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedDecision(null);
        }}
        onConfirm={handleConfirmAction}
        defaultTitle={selectedDecision?.title || ""}
        defaultDescription={selectedDecision?.description || ""}
        defaultCycleId={selectedDecision?.cycleId || cycleId}
        sourceDecisionId={selectedDecision?.id}
        dialogTitle="Criar Ação a partir da Decisão"
        dialogDescription={`Transforme a decisão "${selectedDecision?.title || ""}" em ação executável`}
      />
    </Card>
  );
}
