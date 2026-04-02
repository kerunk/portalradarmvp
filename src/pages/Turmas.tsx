import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  ClipboardCheck,
  X,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTurmas,
  setTurmas,
  type TurmaState,
} from "@/lib/storage";
import {
  getPopulation,
  getFacilitators as getCompanyFacilitators,
  type PopulationMember,
} from "@/lib/companyStorage";
import { useAuth } from "@/contexts/AuthContext";
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
  trainingDate: null,
  status: "planned",
  notes: "",
};

export default function Turmas() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const [turmas, setTurmasState] = useState<TurmaState[]>([]);
  const [population, setPopulationState] = useState<PopulationMember[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState(searchParams.get("cycle") || "all");
  const [facilitatorFilter, setFacilitatorFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Partial<TurmaState>>(emptyTurma);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Participant filters inside dialog
  const [partSectorFilter, setPartSectorFilter] = useState("all");
  const [partShiftFilter, setPartShiftFilter] = useState("all");
  const [partRoleFilter, setPartRoleFilter] = useState("all");
  const [partSearch, setPartSearch] = useState("");

  // Attendance dialog
  const [attendanceTurma, setAttendanceTurma] = useState<TurmaState | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, "present" | "absent" | "reschedule">>({});

  // Load data
  useEffect(() => {
    setTurmasState(getTurmas());
    setPopulationState(getPopulation(companyId));
  }, [companyId]);

  // Derived: facilitators from population
  const facilitators = useMemo(() => population.filter(m => m.facilitator && m.active), [population]);
  const activePopulation = useMemo(() => population.filter(m => m.active), [population]);

  // Unique values for participant filters
  const sectors = useMemo(() => [...new Set(activePopulation.map(m => m.sector).filter(Boolean))].sort(), [activePopulation]);
  const shifts = useMemo(() => [...new Set(activePopulation.map(m => m.shift).filter(Boolean))].sort(), [activePopulation]);
  const roles = useMemo(() => [...new Set(activePopulation.map(m => m.role).filter(Boolean))].sort(), [activePopulation]);

  // Filtered participants in dialog
  const filteredParticipants = useMemo(() => {
    return activePopulation.filter(m => {
      if (partSectorFilter !== "all" && m.sector !== partSectorFilter) return false;
      if (partShiftFilter !== "all" && m.shift !== partShiftFilter) return false;
      if (partRoleFilter !== "all" && m.role !== partRoleFilter) return false;
      if (partSearch && !m.name.toLowerCase().includes(partSearch.toLowerCase())) return false;
      return true;
    });
  }, [activePopulation, partSectorFilter, partShiftFilter, partRoleFilter, partSearch]);

  // Filtered turmas list
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
    const totalPresent = turmas.reduce((sum, t) => {
      if (!t.attendance) return sum;
      return sum + Object.values(t.attendance).filter(v => v === "present").length;
    }, 0);
    return { total, completed, inProgress, totalParticipants, totalPresent };
  }, [turmas]);

  const resetPartFilters = () => {
    setPartSectorFilter("all");
    setPartShiftFilter("all");
    setPartRoleFilter("all");
    setPartSearch("");
  };

  const handleOpenNew = () => {
    setEditingTurma({ ...emptyTurma, cycleId: cycleFilter !== "all" ? cycleFilter : "M1" });
    setSelectedParticipants([]);
    resetPartFilters();
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (turma: TurmaState) => {
    setEditingTurma(turma);
    setSelectedParticipants(turma.participants.map(p => p.id));
    resetPartFilters();
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (turma: TurmaState) => {
    setEditingTurma({
      ...turma,
      id: undefined,
      name: `${turma.name} (cópia)`,
      status: "planned",
      attendance: undefined,
    });
    setSelectedParticipants(turma.participants.map(p => p.id));
    resetPartFilters();
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
      const emp = activePopulation.find(e => e.id === id);
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
              trainingDate: editingTurma.trainingDate || null,
              status: editingTurma.status as TurmaState["status"],
              participants: participantData,
              notes: editingTurma.notes || "",
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
        trainingDate: editingTurma.trainingDate || null,
        status: editingTurma.status as TurmaState["status"] || "planned",
        participants: participantData,
        notes: editingTurma.notes || "",
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

  // Attendance
  const openAttendance = (turma: TurmaState) => {
    setAttendanceTurma(turma);
    setAttendanceData(turma.attendance || {});
  };

  const setParticipantAttendance = (participantId: string, status: "present" | "absent" | "reschedule") => {
    setAttendanceData(prev => ({ ...prev, [participantId]: status }));
  };

  const saveAttendance = () => {
    if (!attendanceTurma) return;
    const updated = turmas.map(t =>
      t.id === attendanceTurma.id ? { ...t, attendance: attendanceData } : t
    );
    setTurmasState(updated);
    setTurmas(updated);
    setAttendanceTurma(null);
    toast({ title: "Presença registrada!", description: "Os dados de presença foram salvos." });
  };

  // Finalize turma
  const [finalizingTurmaId, setFinalizingTurmaId] = useState<string | null>(null);

  const handleFinalizeTurma = (turmaId: string) => {
    const turma = turmas.find(t => t.id === turmaId);
    if (!turma) return;

    const hasAttendance = turma.attendance && Object.values(turma.attendance).some(v => v === "present");
    if (!hasAttendance) {
      toast({ title: "Erro", description: "Registre pelo menos 1 presença antes de finalizar.", variant: "destructive" });
      return;
    }

    // Check future training date
    if (turma.trainingDate) {
      const trainingDate = new Date(turma.trainingDate);
      trainingDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (trainingDate > today) {
        if (!confirm("A data do treinamento é futura. Deseja finalizar mesmo assim?")) return;
      }
    }

    setFinalizingTurmaId(turmaId);
  };

  const confirmFinalizeTurma = () => {
    if (!finalizingTurmaId) return;
    const updated = turmas.map(t =>
      t.id === finalizingTurmaId
        ? { ...t, status: "completed" as const, completedAt: new Date().toISOString() }
        : t
    );
    setTurmasState(updated);
    setTurmas(updated);
    setFinalizingTurmaId(null);
    toast({ title: "Turma finalizada!", description: "A turma foi marcada como concluída e os indicadores foram atualizados." });
  };

  // Unique facilitators for list filter
  const uniqueFacilitators = useMemo(() => {
    const names = [...new Set(turmas.map(t => t.facilitator).filter(Boolean))];
    return names.sort();
  }, [turmas]);

  return (
    <AppLayout
      title="Turmas Móveis"
      subtitle="Gerencie turmas de treinamento por ciclo da metodologia MVP"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Presenças Registradas</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalPresent}</p>
          </Card>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                {uniqueFacilitators.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Dialog */}
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
                    <label className="text-sm font-medium mb-1.5 block">Programa (Ciclo) *</label>
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
                        <SelectValue placeholder="Selecionar facilitador" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilitators.length === 0 && (
                          <SelectItem value="_empty" disabled>
                            Nenhum facilitador habilitado na Base Populacional
                          </SelectItem>
                        )}
                        {facilitators.map(f => (
                          <SelectItem key={f.id} value={f.name}>
                            {f.name} {f.sector ? `— ${f.sector}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Data do Treinamento</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !editingTurma.trainingDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingTurma.trainingDate ? format(new Date(editingTurma.trainingDate), "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editingTurma.trainingDate ? new Date(editingTurma.trainingDate) : undefined}
                          onSelect={date => setEditingTurma(prev => ({ ...prev, trainingDate: date?.toISOString() || null }))}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
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
                  <label className="text-sm font-medium mb-1.5 block">Observações</label>
                  <Textarea
                    value={editingTurma.notes || ""}
                    onChange={e => setEditingTurma(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Anotações opcionais sobre a turma..."
                    rows={2}
                  />
                </div>

                {/* Participants Section with Filters */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Participantes ({selectedParticipants.length} selecionados)
                  </label>

                  {/* Participant Filters */}
                  <div className="flex gap-2 flex-wrap mb-2">
                    <div className="relative flex-1 min-w-[140px]">
                      <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar nome..."
                        value={partSearch}
                        onChange={e => setPartSearch(e.target.value)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                    <Select value={partSectorFilter} onValueChange={setPartSectorFilter}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue placeholder="Setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Setores</SelectItem>
                        {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={partShiftFilter} onValueChange={setPartShiftFilter}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue placeholder="Turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Turnos</SelectItem>
                        {shifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={partRoleFilter} onValueChange={setPartRoleFilter}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue placeholder="Cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Cargos</SelectItem>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <ScrollArea className="h-48 border rounded-md p-3">
                    <div className="space-y-1">
                      {filteredParticipants.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Nenhum colaborador encontrado. Cadastre na Base Populacional.
                        </p>
                      )}
                      {filteredParticipants.map(emp => (
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
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[emp.role, emp.sector, emp.shift].filter(Boolean).join(" • ")}
                            </p>
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
              const attendanceCount = turma.attendance ? Object.values(turma.attendance).filter(v => v === "present").length : 0;
              const hasAttendance = turma.attendance && Object.keys(turma.attendance).length > 0;

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
                            {hasAttendance && (
                              <span className="text-sm text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={14} />
                                {attendanceCount} presentes
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openAttendance(turma)}
                            title="Registrar Presença"
                          >
                            <ClipboardCheck size={14} />
                          </Button>
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

                      {turma.trainingDate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <CalendarIcon size={14} />
                          Treinamento: {format(new Date(turma.trainingDate), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      )}

                      {turma.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{turma.notes}</p>
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

      {/* Attendance Dialog */}
      <Dialog open={!!attendanceTurma} onOpenChange={(open) => !open && setAttendanceTurma(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-primary" />
              Registro de Presença
            </DialogTitle>
            <DialogDescription>
              {attendanceTurma?.name} — {attendanceTurma?.cycleId}
            </DialogDescription>
          </DialogHeader>

          {attendanceTurma && (
            <div className="space-y-2">
              {attendanceTurma.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum participante nesta turma.
                </p>
              ) : (
                attendanceTurma.participants.map(p => {
                  const status = attendanceData[p.id];
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[p.role, p.sector].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={status === "present" ? "default" : "outline"}
                          className={cn("h-8 px-2 text-xs gap-1", status === "present" && "bg-emerald-600 hover:bg-emerald-700")}
                          onClick={() => setParticipantAttendance(p.id, "present")}
                        >
                          <CheckCircle2 size={14} />
                          Presente
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "absent" ? "default" : "outline"}
                          className={cn("h-8 px-2 text-xs gap-1", status === "absent" && "bg-destructive hover:bg-destructive/90")}
                          onClick={() => setParticipantAttendance(p.id, "absent")}
                        >
                          <X size={14} />
                          Faltou
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "reschedule" ? "default" : "outline"}
                          className={cn("h-8 px-2 text-xs gap-1", status === "reschedule" && "bg-warning hover:bg-warning/90")}
                          onClick={() => setParticipantAttendance(p.id, "reschedule")}
                        >
                          <RotateCcw size={14} />
                          Remarcar
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceTurma(null)}>Cancelar</Button>
            <Button onClick={saveAttendance} className="gap-2">
              <CheckCircle2 size={16} />
              Salvar Presença
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
