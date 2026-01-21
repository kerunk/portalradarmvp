import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Calendar as CalendarIcon,
  Plus,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TurmaStatus = "planned" | "in_progress" | "completed" | "delayed";

export interface Participant {
  id: string;
  name: string;
  sector: string;
  role: string;
}

export interface Turma {
  id: string;
  name: string;
  cycleId: string;
  facilitator: string;
  participants: Participant[];
  startDate: Date | null;
  endDate: Date | null;
  status: TurmaStatus;
}

interface CycleTurmasProps {
  cycleId: string;
  cycleName: string;
  turmas: Turma[];
  onAddTurma: (turma: Omit<Turma, "id">) => void;
  onUpdateTurma: (turmaId: string, updates: Partial<Turma>) => void;
  onDeleteTurma: (turmaId: string) => void;
}

const statusConfig: Record<TurmaStatus, { label: string; color: string; icon: React.ReactNode }> = {
  planned: {
    label: "Planejada",
    color: "bg-muted text-muted-foreground",
    icon: <Clock size={14} />,
  },
  in_progress: {
    label: "Em Andamento",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <Users size={14} />,
  },
  completed: {
    label: "Concluída",
    color: "bg-success/10 text-success border-success/20",
    icon: <CheckCircle2 size={14} />,
  },
  delayed: {
    label: "Atrasada",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <AlertCircle size={14} />,
  },
};

// Mock facilitators
const availableFacilitators = [
  "Maria Silva",
  "João Santos",
  "Ana Oliveira",
  "Carlos Pereira",
  "Fernanda Costa",
];

// Mock participants (would come from employee database)
const mockEmployees: Participant[] = [
  { id: "1", name: "Pedro Almeida", sector: "Operações", role: "Técnico" },
  { id: "2", name: "Juliana Lima", sector: "Operações", role: "Supervisor" },
  { id: "3", name: "Roberto Souza", sector: "Manutenção", role: "Técnico" },
  { id: "4", name: "Carla Mendes", sector: "Manutenção", role: "Coordenador" },
  { id: "5", name: "Lucas Ferreira", sector: "Administrativo", role: "Analista" },
  { id: "6", name: "Mariana Costa", sector: "Segurança", role: "Técnico" },
  { id: "7", name: "André Santos", sector: "Produção", role: "Operador" },
  { id: "8", name: "Patricia Rocha", sector: "Produção", role: "Líder" },
];

export function CycleTurmas({
  cycleId,
  cycleName,
  turmas,
  onAddTurma,
  onUpdateTurma,
  onDeleteTurma,
}: CycleTurmasProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTurmaName, setNewTurmaName] = useState("");
  const [selectedFacilitator, setSelectedFacilitator] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const handleAddTurma = () => {
    if (!newTurmaName || !selectedFacilitator) return;

    const participants = mockEmployees.filter((e) =>
      selectedParticipants.includes(e.id)
    );

    onAddTurma({
      name: newTurmaName,
      cycleId,
      facilitator: selectedFacilitator,
      participants,
      startDate: startDate || null,
      endDate: endDate || null,
      status: "planned",
    });

    // Reset form
    setNewTurmaName("");
    setSelectedFacilitator("");
    setSelectedParticipants([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setIsAddDialogOpen(false);
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  const cycleTurmas = turmas.filter((t) => t.cycleId === cycleId);
  const totalParticipants = cycleTurmas.reduce(
    (sum, t) => sum + t.participants.length,
    0
  );
  const completedTurmas = cycleTurmas.filter((t) => t.status === "completed").length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Turmas do Ciclo
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as turmas móveis para o ciclo {cycleName}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus size={16} />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="turma-name">Nome da Turma</Label>
                <Input
                  id="turma-name"
                  placeholder={`Ex: Turma ${cycleId} – Maio`}
                  value={newTurmaName}
                  onChange={(e) => setNewTurmaName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Facilitador Responsável</Label>
                <Select
                  value={selectedFacilitator}
                  onValueChange={setSelectedFacilitator}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o facilitador" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFacilitators.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate
                          ? format(endDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Participantes ({selectedParticipants.length} selecionados)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Clique para selecionar os participantes desta turma
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {mockEmployees.map((employee) => {
                    const isSelected = selectedParticipants.includes(employee.id);
                    return (
                      <button
                        key={employee.id}
                        onClick={() => toggleParticipant(employee.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-left transition-all text-sm",
                          isSelected
                            ? "bg-primary/10 border-primary/30 text-foreground"
                            : "bg-muted/30 border-transparent hover:bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <User size={14} />
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{employee.name}</div>
                          <div className="text-xs opacity-70">
                            {employee.sector} • {employee.role}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTurma} disabled={!newTurmaName || !selectedFacilitator}>
                Criar Turma
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{cycleTurmas.length}</div>
          <div className="text-xs text-muted-foreground">Turmas criadas</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{totalParticipants}</div>
          <div className="text-xs text-muted-foreground">Participantes</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-success">{completedTurmas}</div>
          <div className="text-xs text-muted-foreground">Concluídas</div>
        </div>
      </div>

      {/* Turmas List */}
      {cycleTurmas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users size={40} className="mx-auto mb-2 opacity-50" />
          <p>Nenhuma turma criada para este ciclo</p>
          <p className="text-sm">Clique em "Nova Turma" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cycleTurmas.map((turma) => {
            const status = statusConfig[turma.status];
            return (
              <div
                key={turma.id}
                className="p-4 border rounded-lg bg-card hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{turma.name}</span>
                      <Badge className={cn("text-xs gap-1", status.color)}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {turma.facilitator}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {turma.participants.length} participantes
                      </span>
                      {turma.startDate && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={14} />
                          {format(turma.startDate, "dd/MM", { locale: ptBR })}
                          {turma.endDate && ` - ${format(turma.endDate, "dd/MM", { locale: ptBR })}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select
                      value={turma.status}
                      onValueChange={(value) =>
                        onUpdateTurma(turma.id, { status: value as TurmaStatus })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planejada</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="delayed">Atrasada</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteTurma(turma.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
