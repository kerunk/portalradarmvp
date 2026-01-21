import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Plus,
  CalendarIcon,
  Users,
  User,
  Edit2,
  Trash2,
  Copy,
  FileDown,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTurmas,
  setTurmas,
  getEmployees,
  getFacilitators,
  type TurmaState,
  type EmployeeState,
  type FacilitatorState,
} from "@/lib/storage";
import { CYCLE_IDS, TURMA_STATUS } from "@/lib/constants";
import { generateTurmaPDF } from "@/lib/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

const statusIcons = {
  planned: Clock,
  in_progress: Target,
  completed: CheckCircle2,
  delayed: AlertCircle,
};

const emptyTurma: Partial<TurmaState> = {
  name: "",
  cycleId: "M1",
  facilitator: "",
  participants: [],
  startDate: null,
  endDate: null,
  status: "planned",
};

export default function Turmas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [turmas, setTurmasState] = useState<TurmaState[]>([]);
  const [employees, setEmployees] = useState<EmployeeState[]>([]);
  const [facilitators, setFacilitators] = useState<FacilitatorState[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState(searchParams.get("cycle") || "all");
  const [facilitatorFilter, setFacilitatorFilter] = useState("all");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Partial<TurmaState>>(emptyTurma);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Load data from storage
  useEffect(() => {
    setTurmasState(getTurmas());
    setEmployees(getEmployees());
    setFacilitators(getFacilitators());
  }, []);

  // Filtered turmas
  const filteredTurmas = useMemo(() => {
    return turmas.filter(turma => {
      const matchesSearch =
        turma.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.facilitator.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || turma.status === statusFilter;
      const matchesCycle = cycleFilter === "all" || turma.cycleId === cycleFilter;
      const matchesFacilitator = facilitatorFilter === "all" || turma.facilitator === facilitatorFilter;
      
      return matchesSearch && matchesStatus && matchesCycle && matchesFacilitator;
    }).sort((a, b) => {
      // Sort by cycle first, then by start date
      const cycleOrder = CYCLE_IDS.indexOf(a.cycleId as any) - CYCLE_IDS.indexOf(b.cycleId as any);
      if (cycleOrder !== 0) return cycleOrder;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [turmas, searchTerm, statusFilter, cycleFilter, facilitatorFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = turmas.length;
    const completed = turmas.filter(t => t.status === "completed").length;
    const inProgress = turmas.filter(t => t.status === "in_progress").length;
    const totalParticipants = turmas.reduce((sum, t) => sum + t.participants.length, 0);
    return { total, completed, inProgress, totalParticipants };
  }, [turmas]);

  const handleOpenNew = () => {
    setEditingTurma({ ...emptyTurma, cycleId: cycleFilter !== "all" ? cycleFilter : "M1" });
    setSelectedParticipants([]);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (turma: TurmaState) => {
    setEditingTurma(turma);
    setSelectedParticipants(turma.participants.map(p => p.id));
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (turma: TurmaState) => {
    setEditingTurma({
      ...turma,
      id: undefined,
      name: `${turma.name} (cópia)`,
      status: "planned",
    });
    setSelectedParticipants(turma.participants.map(p => p.id));
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const toggleParticipant = (empId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSave = () => {
    if (!editingTurma.name?.trim()) {
      toast({ title: "Erro", description: "Nome da turma é obrigatório", variant: "destructive" });
      return;
    }
    if (!editingTurma.facilitator?.trim()) {
      toast({ title: "Erro", description: "Facilitador é obrigatório", variant: "destructive" });
      return;
    }

    const participantData = selectedParticipants.map(id => {
      const emp = employees.find(e => e.id === id);
      return emp ? { id: emp.id, name: emp.name, sector: emp.sector, role: emp.role } : null;
    }).filter(Boolean) as TurmaState["participants"];

    if (isEditing && editingTurma.id) {
      const updated = turmas.map(t =>
        t.id === editingTurma.id
          ? {
              ...t,
              name: editingTurma.name!,
              cycleId: editingTurma.cycleId!,
              facilitator: editingTurma.facilitator!,
              startDate: editingTurma.startDate || null,
              endDate: editingTurma.endDate || null,
              status: editingTurma.status as TurmaState["status"],
              participants: participantData,
            }
          : t
      );
      setTurmasState(updated);
      setTurmas(updated);
      toast({ title: "Turma atualizada!" });
    } else {
      const newTurma: TurmaState = {
        id: `turma-${Date.now()}`,
        name: editingTurma.name!,
        cycleId: editingTurma.cycleId!,
        facilitator: editingTurma.facilitator!,
        startDate: editingTurma.startDate || null,
        endDate: editingTurma.endDate || null,
        status: editingTurma.status as TurmaState["status"] || "planned",
        participants: participantData,
      };
      const updated = [...turmas, newTurma];
      setTurmasState(updated);
      setTurmas(updated);
      toast({ title: "Turma criada!" });
    }

    setIsDialogOpen(false);
    setEditingTurma(emptyTurma);
    setSelectedParticipants([]);
  };

  const handleDelete = (turmaId: string) => {
    if (confirm("Tem certeza que deseja excluir esta turma?")) {
      const updated = turmas.filter(t => t.id !== turmaId);
      setTurmasState(updated);
      setTurmas(updated);
      toast({ title: "Turma excluída!" });
    }
  };

  const handleExportPDF = (turma: TurmaState) => {
    generateTurmaPDF(turma);
    toast({ title: "PDF gerado!", description: "O PDF da turma foi baixado." });
  };

  return (
    <AppLayout
      title="Turmas Móveis"
      subtitle="Gerencie turmas de treinamento por ciclo da metodologia MVP"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total de Turmas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Concluídas</p>
            <p className="text-2xl font-bold text-success">{stats.completed}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Em Andamento</p>
            <p className="text-2xl font-bold text-warning">{stats.inProgress}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Participantes</p>
            <p className="text-2xl font-bold text-primary">{stats.totalParticipants}</p>
          </Card>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Buscar turmas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Ciclos</SelectItem>
                {CYCLE_IDS.map(id => (
                  <SelectItem key={id} value={id}>{id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(TURMA_STATUS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={facilitatorFilter} onValueChange={setFacilitatorFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Facilitador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Facilitadores</SelectItem>
                {facilitators.map(f => (
                  <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="gap-2">
                <Plus size={16} />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Editar Turma" : "Nova Turma"}</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Atualize as informações da turma" : "Configure uma nova turma de treinamento"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Nome da Turma *</label>
                    <Input
                      value={editingTurma.name || ""}
                      onChange={e => setEditingTurma(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Turma Manhã - Operações"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ciclo *</label>
                    <Select
                      value={editingTurma.cycleId || "M1"}
                      onValueChange={value => setEditingTurma(prev => ({ ...prev, cycleId: value }))}
                    >
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
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Facilitador *</label>
                    <Select
                      value={editingTurma.facilitator || ""}
                      onValueChange={value => setEditingTurma(prev => ({ ...prev, facilitator: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilitators.map(f => (
                          <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !editingTurma.startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingTurma.startDate ? format(new Date(editingTurma.startDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editingTurma.startDate ? new Date(editingTurma.startDate) : undefined}
                          onSelect={date => setEditingTurma(prev => ({ ...prev, startDate: date?.toISOString() || null }))}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Data Término</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !editingTurma.endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingTurma.endDate ? format(new Date(editingTurma.endDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editingTurma.endDate ? new Date(editingTurma.endDate) : undefined}
                          onSelect={date => setEditingTurma(prev => ({ ...prev, endDate: date?.toISOString() || null }))}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Status</label>
                    <Select
                      value={editingTurma.status || "planned"}
                      onValueChange={value => setEditingTurma(prev => ({ ...prev, status: value as TurmaState["status"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TURMA_STATUS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Participantes ({selectedParticipants.length} selecionados)
                  </label>
                  <ScrollArea className="h-48 border rounded-md p-3">
                    <div className="space-y-2">
                      {employees.filter(e => e.active).map(emp => (
                        <div
                          key={emp.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-secondary/50",
                            selectedParticipants.includes(emp.id) && "bg-primary/10"
                          )}
                          onClick={() => toggleParticipant(emp.id)}
                        >
                          <Checkbox
                            checked={selectedParticipants.includes(emp.id)}
                            onCheckedChange={() => toggleParticipant(emp.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.sector} • {emp.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{isEditing ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Turmas List */}
        <div className="space-y-3">
          {filteredTurmas.length > 0 ? (
            filteredTurmas.map(turma => {
              const statusConfig = TURMA_STATUS[turma.status];
              const StatusIcon = statusIcons[turma.status];

              return (
                <Card key={turma.id} className="p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", statusConfig.color)}>
                      <StatusIcon size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-semibold">{turma.cycleId}</Badge>
                            <h3 className="font-medium text-foreground">{turma.name}</h3>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <User size={14} />
                              {turma.facilitator}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users size={14} />
                              {turma.participants.length} participantes
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleExportPDF(turma)}
                            title="Exportar PDF"
                          >
                            <FileDown size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDuplicate(turma)}
                            title="Duplicar"
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEdit(turma)}
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(turma.id)}
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      {(turma.startDate || turma.endDate) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <CalendarIcon size={14} />
                          {turma.startDate && format(new Date(turma.startDate), "dd/MM/yyyy", { locale: ptBR })}
                          {turma.startDate && turma.endDate && " - "}
                          {turma.endDate && format(new Date(turma.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      )}

                      {turma.participants.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {turma.participants.slice(0, 5).map(p => (
                            <Badge key={p.id} variant="secondary" className="text-xs">
                              {p.name}
                            </Badge>
                          ))}
                          {turma.participants.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{turma.participants.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nenhuma turma encontrada</p>
                <p className="text-sm">Crie uma nova turma para começar</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
