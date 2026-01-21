import { useState } from "react";
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
import { CheckCircle2, AlertTriangle, FileDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NEXT_CYCLE, type CycleId } from "@/lib/constants";

interface CycleClosureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string;
  cycleTitle: string;
  completionPercent: number;
  completedTurmas: number;
  totalTurmas: number;
  delayedActions: number;
  canClose: boolean;
  onConfirmClose: (notes: string) => void;
  onExportPDF: () => void;
}

export function CycleClosureDialog({
  isOpen,
  onClose,
  cycleId,
  cycleTitle,
  completionPercent,
  completedTurmas,
  totalTurmas,
  delayedActions,
  canClose,
  onConfirmClose,
  onExportPDF,
}: CycleClosureDialogProps) {
  const [notes, setNotes] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const nextCycle = NEXT_CYCLE[cycleId as CycleId];

  const handleConfirm = () => {
    setIsConfirming(true);
    onConfirmClose(notes);
    setTimeout(() => {
      setIsConfirming(false);
      onClose();
    }, 500);
  };

  const criteriaItems = [
    {
      label: "Ações concluídas (mín. 80%)",
      value: completionPercent,
      met: completionPercent >= 80,
    },
    {
      label: "Turmas concluídas (mín. 1)",
      value: completedTurmas,
      met: completedTurmas >= 1,
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
            <h4 className="text-sm font-medium">Critérios de Encerramento</h4>
            
            {criteriaItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2">
                  {item.met ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-sm">{item.label}</span>
                </div>
                <Badge className={cn(
                  item.met ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                )}>
                  {typeof item.value === 'number' && item.label.includes('%') 
                    ? `${item.value}%` 
                    : item.value}
                </Badge>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso geral</span>
              <span className="font-semibold">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </div>

          {/* Delayed actions warning */}
          {delayedActions > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Existem {delayedActions} ação(ões) atrasada(s). Elas serão marcadas como não concluídas.
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
              placeholder="Registre observações sobre o ciclo, lições aprendidas, pontos de atenção para o próximo ciclo..."
              rows={4}
            />
          </div>

          {/* Next cycle info */}
          {nextCycle && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                <strong>Próximo:</strong> Ao encerrar, o ciclo <strong>{nextCycle}</strong> será liberado para execução.
              </p>
            </div>
          )}

          {!canClose && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Os critérios mínimos ainda não foram atingidos. Complete mais ações ou turmas antes de encerrar.
              </AlertDescription>
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
            disabled={!canClose || isConfirming}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isConfirming ? "Encerrando..." : "Confirmar Encerramento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}