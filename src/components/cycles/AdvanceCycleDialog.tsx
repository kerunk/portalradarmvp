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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface AdvanceCycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentCycleId: string;
  nextCycleId: string;
  currentProgress: number;
  onConfirm: (justification: string) => void;
}

export function AdvanceCycleDialog({
  isOpen,
  onClose,
  currentCycleId,
  nextCycleId,
  currentProgress,
  onConfirm,
}: AdvanceCycleDialogProps) {
  const [justification, setJustification] = useState("");

  const handleConfirm = () => {
    onConfirm(justification);
    setJustification("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Iniciar {nextCycleId} antes do recomendado
          </DialogTitle>
          <DialogDescription>
            O ciclo {currentCycleId} ainda está com {currentProgress}% concluído.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription>
              Recomendamos atingir pelo menos <strong>85%</strong> de progresso no ciclo atual
              antes de avançar. Deseja continuar mesmo assim?
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Justificativa <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique o motivo para iniciar o próximo ciclo antes de atingir 85%..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Esta justificativa será registrada para fins de governança e relatórios.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={justification.trim().length < 10}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Confirmar e Iniciar {nextCycleId}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
