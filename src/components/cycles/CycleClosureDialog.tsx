import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, AlertTriangle, FileDown, Lock,
  Calendar, Users, FileText, ArrowRight, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEXT_CYCLE, type CycleId } from "@/lib/constants";
import { upsertCycleState, fetchCycleStates, fetchTurmas, fetchRecords, fetchCycleActions } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import type { CycleEvaluationResult, CycleClosureCriteria } from "@/lib/governance";

interface CycleClosureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string;
  cycleTitle: string;
  onCycleClosed: () => void;
  onExportPDF: () => void;
}

// ── Avalia critérios de encerramento a partir dos dados Supabase ──────────────
async function avaliarCicloSupabase(companyId: string, cycleId: string): Promise<CycleEvaluationResult> {
  const [actions, turmas, records] = await Promise.all([
    fetchCycleActions(companyId, cycleId),
    fetchTurmas(companyId),
    fetchRecords(companyId),
  ]);

  const cycleTurmas   = turmas.filter(t => t.cycleId === cycleId);
  const cycleRecords  = records.filter(r => r.cycleId === cycleId);
  const cycleActions  = actions.filter(a => a.enabled);

  const totalActions     = cycleActions.length;
  const completedActions = cycleActions.filter(a => a.status === "completed").length;
  const delayedActions   = cycleActions.filter(a => a.status === "delayed").length;
  const completedTurmas  = cycleTurmas.filter(t => t.status === "completed").length;
  const hasDecisionOrValidation = cycleRecords.some(r =>
    r.type === "decision" || r.type === "validation" || r.type === "meeting"
  );

  const actionCompletionPercent = totalActions > 0
    ? Math.round((completedActions / totalActions) * 100) : 0;

  const warnings: string[] = [];
  const blockers: string[] = [];

  if (actionCompletionPercent < 80)
    blockers.push(`Apenas ${actionCompletionPercent}% das ações concluídas (mínimo: 80%)`);
  if (completedTurmas < 1)
    blockers.push("Nenhuma turma concluída (mínimo: 1)");
  if (!hasDecisionOrValidation)
    warnings.push("Sem registro de decisão ou validação associado ao ciclo");
  if (delayedActions > 0)
    warnings.push(`${delayedActions} ação(ões) ainda atrasada(s)`);

  const criteria: CycleClosureCriteria = {
    actionCompletionPercent,
    minActionCompletionRequired: 80,
    completedTurmas,
    minTurmasRequired: 1,
    hasDecisionOrValidation,
    requiresDecisionOrValidation: true,
    allCriteriaMet: blockers.length === 0,
  };

  return { cycleId, canClose: blockers.length === 0, criteria, warnings, blockers };
}

export function CycleClosureDialog({
  isOpen, onClose, cycleId, cycleTitle, onCycleClosed, onExportPDF,
}: CycleClosureDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const [notes, setNotes] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<CycleEvaluationResult | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  // Carrega avaliação quando o dialog abre
  const handleOpenChange = async (open: boolean) => {
    if (open && !evaluation) {
      setLoadingEval(true);
      const ev = await avaliarCicloSupabase(companyId, cycleId);
      setEvaluation(ev);
      setLoadingEval(false);
    }
    if (!open) onClose();
  };

  const handleConfirm = async () => {
    if (!evaluation?.canClose) return;
    setIsConfirming(true);
    setError(null);

    // Busca o estado atual do ciclo para preservar startDate
    const states = await fetchCycleStates(companyId);
    const existing = states[cycleId];

    const ok = await upsertCycleState({
      companyId,
      cycleId,
      closureStatus: "closed",
      startDate: existing?.startDate,
      closedAt: new Date().toISOString(),
      closureNotes: notes,
      lockedForEditing: true,
    });

    setIsConfirming(false);
    if (ok) {
      onCycleClosed();
      onClose();
    } else {
      setError("Erro ao encerrar ciclo. Tente novamente.");
    }
  };

  const nextCycle = NEXT_CYCLE[cycleId as CycleId];
  const ev = evaluation;

  const criteriaItems = ev ? [
    {
      label: "Ações concluídas",
      current: ev.criteria.actionCompletionPercent,
      required: ev.criteria.minActionCompletionRequired,
      unit: "%",
      met: ev.criteria.actionCompletionPercent >= 80,
      icon: ListChecks,
      isBlocker: true,
      helpText: "Marque ações como 'Concluído' nos Fatores de Sucesso.",
      navigateTo: `/ciclos?cycle=${cycleId}`,
      navigateLabel: "Ir para Ações",
    },
    {
      label: "Turmas concluídas",
      current: ev.criteria.completedTurmas,
      required: ev.criteria.minTurmasRequired,
      unit: "",
      met: ev.criteria.completedTurmas >= 1,
      icon: Users,
      isBlocker: true,
      helpText: "Finalize pelo menos 1 turma vinculada a este ciclo.",
      navigateTo: `/turmas?cycle=${cycleId}`,
      navigateLabel: "Ir para Turmas",
    },
    {
      label: "Registro de decisão/validação",
      current: ev.criteria.hasDecisionOrValidation ? 1 : 0,
      required: 1,
      unit: "",
      met: ev.criteria.hasDecisionOrValidation,
      icon: FileText,
      isBlocker: false,
      helpText: "Registre uma decisão ou validação associada ao ciclo.",
      navigateTo: `/registros?type=decision`,
      navigateLabel: "Ir para Registros",
    },
  ] : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-primary" />
            Encerrar Ciclo {cycleId}
          </DialogTitle>
          <DialogDescription>
            O encerramento é irreversível. Verifique os critérios antes de prosseguir.
          </DialogDescription>
        </DialogHeader>

        {loadingEval ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Verificando critérios...</div>
        ) : ev ? (
          <div className="space-y-4">
            {/* Critérios */}
            <div className="space-y-3">
              {criteriaItems.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label}
                    className={cn("p-3 rounded-lg border", item.met ? "border-success/30 bg-success/5" : item.isBlocker ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={item.met ? "text-success" : item.isBlocker ? "text-destructive" : "text-warning"} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", item.met ? "text-success border-success/40" : item.isBlocker ? "text-destructive border-destructive/40" : "text-warning border-warning/40")}>
                          {item.current}{item.unit} / {item.required}{item.unit}
                        </Badge>
                        {item.met
                          ? <CheckCircle2 size={16} className="text-success" />
                          : <AlertTriangle size={16} className={item.isBlocker ? "text-destructive" : "text-warning"} />}
                      </div>
                    </div>
                    {!item.met && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">{item.helpText}</p>
                        <Button variant="link" size="sm" className="text-xs h-auto p-0"
                          onClick={() => { onClose(); navigate(item.navigateTo); }}>
                          {item.navigateLabel} <ArrowRight size={10} className="ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {ev.warnings.length > 0 && (
              <Alert className="border-warning/30 bg-warning/5">
                <AlertTriangle size={14} className="text-warning" />
                <AlertDescription className="text-xs">
                  {ev.warnings.map((w, i) => <div key={i}>{w}</div>)}
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {ev.canClose && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas de encerramento (opcional)</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observações sobre o encerramento do ciclo..."
                  rows={3} />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle size={14} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onExportPDF} size="sm">
            <FileDown size={14} className="mr-1" /> Exportar PDF
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={!ev?.canClose || isConfirming}
            className={cn(!ev?.canClose && "opacity-50 cursor-not-allowed")}>
            {isConfirming ? "Encerrando..." : "Confirmar Encerramento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
