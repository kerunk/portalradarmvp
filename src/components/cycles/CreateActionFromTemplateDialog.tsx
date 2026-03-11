import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, User, Target, Zap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CYCLE_IDS } from "@/lib/constants";
import { getNucleoMembers, type PopulationMember } from "@/lib/companyStorage";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ActionType = 
  | "communication" 
  | "meeting" 
  | "training" 
  | "agenda" 
  | "material" 
  | "logistics" 
  | "other";

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  communication: "Comunicação",
  meeting: "Reunião",
  training: "Treinamento",
  agenda: "Agenda",
  material: "Material",
  logistics: "Logística",
  other: "Outro",
};

export interface NewActionData {
  title: string;
  description: string;
  type: ActionType;
  cycleId: string;
  factorId: string;
  responsible: string;
  dueDate: string;
  sourceDecisionId?: string;
  sourceBestPracticeId?: string;
}

interface CreateActionFromTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: NewActionData) => void;
  // Pre-filled data
  defaultTitle?: string;
  defaultDescription?: string;
  defaultCycleId?: string;
  defaultFactorId?: string;
  defaultDaysToComplete?: number;
  sourceDecisionId?: string;
  sourceBestPracticeId?: string;
  dialogTitle?: string;
  dialogDescription?: string;
}

export function CreateActionFromTemplateDialog({
  isOpen,
  onClose,
  onConfirm,
  defaultTitle = "",
  defaultDescription = "",
  defaultCycleId = "M1",
  defaultFactorId = "communication",
  defaultDaysToComplete = 14,
  sourceDecisionId,
  sourceBestPracticeId,
  dialogTitle = "Criar Nova Ação",
  dialogDescription = "Defina os detalhes da ação a ser criada",
}: CreateActionFromTemplateDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [nucleoMembers, setNucleoMembers] = useState<PopulationMember[]>([]);
  
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [type, setType] = useState<ActionType>("communication");
  const [cycleId, setCycleId] = useState(defaultCycleId);
  const [factorId, setFactorId] = useState(defaultFactorId);
  const [responsible, setResponsible] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    addDays(new Date(), defaultDaysToComplete)
  );

  // Load nucleus members as responsible options
  useEffect(() => {
    setNucleoMembers(getNucleoMembers(companyId));
  }, [companyId]);

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setCycleId(defaultCycleId);
      setFactorId(defaultFactorId);
      setDueDate(addDays(new Date(), defaultDaysToComplete));
    }
  }, [isOpen, defaultTitle, defaultDescription, defaultCycleId, defaultFactorId, defaultDaysToComplete]);

  const handleConfirm = () => {
    if (!title.trim()) {
      toast({ 
        title: "Erro", 
        description: "Título é obrigatório", 
        variant: "destructive" 
      });
      return;
    }

    if (!responsible) {
      toast({ 
        title: "Erro", 
        description: "Selecione um responsável", 
        variant: "destructive" 
      });
      return;
    }

    if (!dueDate) {
      toast({ 
        title: "Erro", 
        description: "Defina uma data prevista", 
        variant: "destructive" 
      });
      return;
    }

    const actionData: NewActionData = {
      title: title.trim(),
      description: description.trim(),
      type,
      cycleId,
      factorId,
      responsible,
      dueDate: dueDate.toISOString(),
      sourceDecisionId,
      sourceBestPracticeId,
    };

    onConfirm(actionData);
    
    // Reset form
    setTitle("");
    setDescription("");
    setType("communication");
    setResponsible("");
    setDueDate(addDays(new Date(), 14));
    
    onClose();
  };

  const factorOptions = [
    { id: "communication", name: "Comunicação do Ciclo" },
    { id: "structure", name: "Atuação do Núcleo de Sustentação" },
    { id: "leadership", name: "Liderança Visível e Aplicada" },
    { id: "practice", name: "Aplicação Prática no Dia a Dia" },
    { id: "indicators", name: "Acompanhamento e Validação" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Título da Ação *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Realizar campanha de comunicação"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Descrição</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre a ação..."
              rows={2}
            />
          </div>

          {/* Type and Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de Ação</label>
              <Select value={type} onValueChange={(v) => setType(v as ActionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ciclo</label>
              <Select value={cycleId} onValueChange={setCycleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_IDS.map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Factor */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Fator de Sucesso</label>
            <Select value={factorId} onValueChange={setFactorId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {factorOptions.map(factor => (
                  <SelectItem key={factor.id} value={factor.id}>{factor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsible and Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Responsável *</label>
              <Select value={responsible} onValueChange={setResponsible}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    <SelectValue placeholder="Selecionar" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.name}>
                      {emp.name} - {emp.sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data Prevista *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left h-10",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Source info */}
          {(sourceDecisionId || sourceBestPracticeId) && (
            <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
              {sourceDecisionId && (
                <span>Vinculada à decisão: {sourceDecisionId}</span>
              )}
              {sourceBestPracticeId && (
                <span>Baseada na melhor prática: {sourceBestPracticeId}</span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Plus size={16} />
            Criar Ação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
