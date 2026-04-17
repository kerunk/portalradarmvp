import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, ArrowRight, CheckCircle2, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RECORD_TYPES } from "@/lib/constants";
import {
  CreateActionFromTemplateDialog,
  type NewActionData,
} from "./CreateActionFromTemplateDialog";
import { fetchRecords, type DBRecord } from "@/lib/db";

interface PendingDecisionsProps {
  cycleId: string;
  onCreateAction: (action: NewActionData, decisionId: string) => void;
}

export function PendingDecisions({ cycleId, onCreateAction }: PendingDecisionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const [allRecords, setAllRecords] = useState<DBRecord[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<DBRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchRecords(companyId).then(setAllRecords);
  }, [companyId, cycleId]);

  const decisions = useMemo(() =>
    allRecords.filter(r =>
      r.type === "decision" &&
      r.status !== "closed" &&
      (r.cycleId === cycleId || !r.cycleId)
    ),
    [allRecords, cycleId]
  );

  const handleConfirmAction = (actionData: NewActionData) => {
    if (selectedDecision) {
      onCreateAction(actionData, selectedDecision.id);
    }
    setSelectedDecision(null);
    setIsDialogOpen(false);
  };

  if (decisions.length === 0) return null;

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
        <Button variant="ghost" size="sm" onClick={() => navigate("/registros?type=decision")} className="gap-1">
          Ver todas <ArrowRight size={14} />
        </Button>
      </div>

      <div className="space-y-3">
        {decisions.slice(0, 5).map(decision => (
          <div
            key={decision.id}
            className="flex items-start gap-4 p-4 rounded-lg bg-card border hover:border-primary/30 transition-colors"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", RECORD_TYPES.decision.color)}>
              <CheckCircle2 size={16} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-foreground line-clamp-1">{decision.title}</h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {decision.cycleId && <Badge variant="outline" className="text-xs">{decision.cycleId}</Badge>}
                  {decision.linkedActionIds?.length > 0 ? (
                    <Badge className="bg-success/10 text-success text-xs gap-1">
                      <CheckCircle2 size={10} />
                      {decision.linkedActionIds.length} ação(ões)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning/30 text-xs">Sem ação</Badge>
                  )}
                </div>
              </div>
              {decision.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{decision.description}</p>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-7"
                onClick={() => { setSelectedDecision(decision); setIsDialogOpen(true); }}
              >
                <Zap size={12} />
                Criar Ação
              </Button>
            </div>
          </div>
        ))}
      </div>

      {selectedDecision && (
        <CreateActionFromTemplateDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setSelectedDecision(null); }}
          onConfirm={handleConfirmAction}
          sourceDecisionId={selectedDecision.id}
          defaultCycleId={cycleId}
          dialogTitle={`Criar ação a partir de: "${selectedDecision.title}"`}
        />
      )}
    </Card>
  );
}
