import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  Lock,
  Calendar,
  Users,
  FileText,
  ArrowRight,
  ExternalLink,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NEXT_CYCLE, type CycleId } from "@/lib/constants";
import { 
  avaliarEncerramentoDeCiclo, 
  encerrarCiclo,
  type CycleEvaluationResult 
} from "@/lib/governance";

interface CycleClosureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string;
  cycleTitle: string;
  onCycleClosed: () => void;
  onExportPDF: () => void;
}

export function CycleClosureDialog({
  isOpen,
  onClose,
  cycleId,
  cycleTitle,
  onCycleClosed,
  onExportPDF,
}: CycleClosureDialogProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluation: CycleEvaluationResult = avaliarEncerramentoDeCiclo(cycleId);
  const nextCycle = NEXT_CYCLE[cycleId as CycleId];

  const handleConfirm = () => {
    setIsConfirming(true);
    setError(null);
    
    const result = encerrarCiclo(cycleId, notes);
    
    if (result.success) {
      setTimeout(() => {
        setIsConfirming(false);
        onCycleClosed();
        onClose();
      }, 500);
    } else {
      setError(result.error || 'Erro ao encerrar ciclo');
      setIsConfirming(false);
    }
  };

  const handleNavigateTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const criteriaItems = [
    {
      label: "Ações concluídas",
      current: evaluation.criteria.actionCompletionPercent,
      required: evaluation.criteria.minActionCompletionRequired,
      unit: "%",
      met: evaluation.criteria.actionCompletionPercent >= evaluation.criteria.minActionCompletionRequired,
      icon: ListChecks,
      isBlocker: true,
      helpText: "Marque ações como 'Concluído' nos Fatores de Sucesso deste ciclo.",
      navigateTo: `/ciclos?cycle=${cycleId}`,
      navigateLabel: "Ir para Ações",
    },
    {
      label: "Turmas concluídas",
      current: evaluation.criteria.completedTurmas,
      required: evaluation.criteria.minTurmasRequired,
      unit: "",
      met: evaluation.criteria.completedTurmas >= evaluation.criteria.minTurmasRequired,
      icon: Users,
      isBlocker: true,
      helpText: "Finalize pelo menos 1 turma vinculada a este ciclo na tela de Turmas.",
      navigateTo: "/turmas",
      navigateLabel: "Ir para Turmas",
    },
    {
      label: "Decisão/validação registrada",
      current: evaluation.criteria.hasDecisionOrValidation ? "Sim" : "Não",
      required: "Recomendado",
      unit: "",
      met: evaluation.criteria.hasDecisionOrValidation,
      icon: FileText,
      isBlocker: false,
      helpText: "Registre uma decisão ou validação na tela de Registros, vinculando ao ciclo.",
      navigateTo: `/registros?cycleId=${cycleId}`,
      navigateLabel: "Ir para Registros",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Encerrar Ciclo {cycleId}
          </DialogTitle>
          <DialogDescription>
            {cycleTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Criteria Check */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Critérios de Encerramento
            </h4>
            
            {criteriaItems.map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.met ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : item.isBlocker ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    <span className="text-sm">{item.label}</span>
                    {!item.isBlocker && !item.met && (
                      <Badge variant="outline" className="text-xs">Opcional</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      item.met 
                        ? "bg-success/10 text-success" 
                        : item.isBlocker
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/10 text-warning"
                    )}>
                      {item.current}{item.unit}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      / {item.required}{item.unit}
                    </span>
                  </div>
                </div>

                {/* Actionable guidance when criteria not met */}
                {!item.met && (
                  <div className="flex items-center justify-between pl-6">
                    <span className="text-xs text-muted-foreground">{item.helpText}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 text-primary"
                      onClick={() => handleNavigateTo(item.navigateTo)}
                    >
                      {item.navigateLabel}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Progress Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso geral</span>
              <span className="font-semibold">{evaluation.criteria.actionCompletionPercent}%</span>
            </div>
            <Progress value={evaluation.criteria.actionCompletionPercent} className="h-2" />
          </div>

          {/* Warnings */}
          {evaluation.warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="text-sm space-y-1">
                  {evaluation.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Blockers */}
          {evaluation.blockers.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Resolva os itens acima para liberar o encerramento:</p>
                <ul className="text-sm space-y-1">
                  {evaluation.blockers.map((blocker, i) => (
                    <li key={i}>• {blocker}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Closure notes */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Observações de Encerramento
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Registre lições aprendidas, pontos de atenção para o próximo ciclo, decisões tomadas..."
              rows={4}
            />
          </div>

          {/* Next cycle info */}
          {nextCycle && evaluation.canClose && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm text-primary">
                <ArrowRight className="h-4 w-4" />
                <span>
                  Ao encerrar, o ciclo <strong>{nextCycle}</strong> será liberado para execução.
                </span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onExportPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!evaluation.canClose || isConfirming}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            {isConfirming ? "Encerrando..." : "Confirmar Encerramento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
