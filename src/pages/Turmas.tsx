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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search, Plus, CalendarIcon, Users, User, Edit2, Trash2, Copy,
  FileDown, Clock, Target, CheckCircle2, AlertCircle, ClipboardCheck, X, RotateCcw, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchTurmas, upsertTurma, deleteTurmaDB, fetchPopulation,
  type Turma, type PopulationMember,
} from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { CYCLE_IDS, TURMA_STATUS } from "@/lib/constants";
import { generateTurmaPDF } from "@/lib/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  planned:     { label: "Planejada",    icon: Clock,        color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "Em andamento", icon: Target,       color: "bg-yellow-100 text-yellow-800" },
  completed:   { label: "Concluída",    icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  delayed:     { label: "Atrasada",     icon: AlertCircle,  color: "bg-red-100 text-red-800" },
};

const emptyTurma: Partial<Turma> = {
  name: "", cycleId: "M1", facilitator: "", participants: [],
  startDate: null, endDate: null, trainingDate: null, status: "planned", notes: "",
};

export default function Turmas() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [population, setPopulationState] = useState<PopulationMember[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState(searchParams.get("cycle") || "all");
  const [facilitatorFilter, setFacilitatorFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Partial<Turma>>(emptyTurma);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const [partSearch, setPartSearch] = useState("");
  const [partSectorFilter, setPartSectorFilter] = useState("all");

  const [attendanceTurma, setAttendanceTurma] = useState<Turma | null>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, "present" | "absent">>({});

  // ── Carrega dados ──────────────────────────────────────────────────────────
  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    const [t, p] = await Promise.all([
      fetchTurmas(companyId),
      fetchPopulation(companyId),
    ]);
    setTurmas(t);
    setPopulationState(p);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [companyId]);

  const activePopulation = useMemo(() => population.filter(m => m.active), [population]);

  const allFacilitators = useMemo(() => {
    const s = new Set(turmas.map(t => t.facilitator).filter(Boolean));
    activePopulation.filter(m => m.facilitator).forEach(m => s.add(m.name));
    return Array.from(s).sort();
  }, [turmas, activePopulation]);

  const allSectors = useMemo(() => {
    const s = new Set(activePopulation.map(m => m.sector).filter(Boolean));
    return Array.from(s).sort();
  }, [activePopulation]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => turmas.filter(t => {
    const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.facilitator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesCycle = cycleFilter === "all" || t.cycleId === cycleFilter;
    const matchesFacilitator = facilitatorFilter === "all" || t.facilitator === facilitatorFilter;
    return matchesSearch && matchesStatus && matchesCycle && matchesFacilitator;
  }).sort((a, b) => {
    const cycleOrder = CYCLE_IDS.indexOf(a.cycleId as any) - CYCLE_IDS.indexOf(b.cycleId as any);
    if (cycleOrder !== 0) return cycleOrder;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  }), [turmas, searchTerm, statusFilter, cycleFilter, facilitatorFilter]);

  const stats = useMemo(() => ({
    total: turmas.length,
    completed: turmas.filter(t => t.status === "completed").length,
    inProgress: turmas.filter(t => t.status === "in_progress").length,
    totalParticipants: turmas.reduce((s, t) => s + t.participants.length, 0),
  }), [turmas]);

  // ── Participantes dialog ────────────────────────────────────────────────────
  const filteredParticipants = useMemo(() => activePopulation.filter(m => {
    if (partSearch && !m.name.toLowerCase().includes(partSearch.toLowerCase())) return false;
    if (partSectorFilter !== "all" && m.sector !== partSectorFilter) return false;
    return true;
  }), [activePopulation, partSearch, partSectorFilter]);

  const handleOpenNew = () => {
    setEditingTurma({ ...emptyTurma, cycleId: cycleFilter !== "all" ? cycleFilter : "M1" });
    setSelectedParticipants([]);
    setPartSearch(""); setPartSectorFilter("all");
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setSelectedParticipants(turma.participants.map(p => p.id));
    setPartSearch(""); setPartSectorFilter("all");
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDuplicate = (turma: Turma) => {
    setEditingTurma({ ...turma, id: undefined, name: `${turma.name} (cópia)`, status: "planned", attendance: undefined });
    setSelectedParticipants(turma.participants.map(p => p.id));
    setPartSearch(""); setPartSectorFilter("all");
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── Salvar turma ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!editingTurma.name?.trim()) {
      toast({ title: "Nome da turma é obrigatório", variant: "destructive" }); return;
    }
    if (!editingTurma.facilitator?.trim()) {
      toast({ title: "Facilitador é obrigatório", variant: "destructive" }); return;
    }

    const participants = selectedParticipants
      .map(id => activePopulation.find(e => e.id === id))
      .filter(Boolean)
      .map(m => ({ id: m!.id, name: m!.name, sector: m!.sector, role: m!.role }));

    setSaving(true);
    const result = await upsertTurma(companyId, {
      id: isEditing ? editingTurma.id : undefined,
      name: editingTurma.name!,
      cycleId: editingTurma.cycleId!,
      facilitator: editingTurma.facilitator!,
      startDate: editingTurma.startDate ?? null,
      endDate: editingTurma.endDate ?? null,
      trainingDate: editingTurma.trainingDate ?? null,
      status: (editingTurma.status as Turma["status"]) ?? "planned",
      notes: editingTurma.notes ?? "",
      participants,
      attendance: editingTurma.attendance,
    });
    setSaving(false);

    if (!result) {
      toast({ title: "Erro ao salvar turma", variant: "destructive" }); return;
    }
    toast({ title: isEditing ? "Turma atualizada!" : "Turma criada!" });
    setIsDialogOpen(false);
    await loadData();
  };

  // ── Excluir ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;
    await deleteTurmaDB(id);
    toast({ title: "Turma excluída!" });
    await loadData();
  };

  // ── Presença ───────────────────────────────────────────────────────────────
  const openAttendance = (turma: Turma) => {
    setAttendanceTurma(turma);
    setAttendanceData(turma.attendance ?? {});
  };

  const saveAttendance = async () => {
    if (!attendanceTurma) return;
    setSaving(true);
    await upsertTurma(companyId, { ...attendanceTurma, attendance: attendanceData });
    setSaving(false);
    toast({ title: "Presença salva!" });
    setAttendanceTurma(null);
    await loadData();
  };

  if (loading) {
    return (
      <AppLayout title="Turmas" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Turmas de Treinamento" subtitle={`${stats.total} turmas — ${user?.companyName || "Empresa"}`}>
      <div className="space-y-6 animate-fade-in">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Turmas",    value: stats.total },
            { label: "Concluídas",         value: stats.completed },
            { label: "Em andamento",       value: stats.inProgress },
            { label: "Total Participantes",value: stats.totalParticipants },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input className="pl-9" placeholder="Buscar turmas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Ciclo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {CYCLE_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleOpenNew}>
            <Plus size={14} className="mr-1" /> Nova Turma
          </Button>
        </div>

        {/* Lista */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              {turmas.length === 0 ? "Nenhuma turma criada ainda." : "Nenhuma turma corresponde ao filtro."}
            </Card>
          )}
          {filtered.map(turma => {
            const cfg = statusConfig[turma.status] ?? statusConfig.planned;
            const StatusIcon = cfg.icon;
            const attendedCount = turma.attendance
              ? Object.values(turma.attendance).filter(v => v === "present").length
              : 0;
            return (
              <Card key={turma.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{turma.name}</span>
                      <Badge className={cn("text-xs", cfg.color)}>
                        <StatusIcon size={10} className="mr-1" />{cfg.label}
                      </Badge>
                      <Badge variant="outline">{turma.cycleId}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User size={12} />{turma.facilitator}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{turma.participants.length} participantes</span>
                      {turma.trainingDate && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={12} />
                          {format(new Date(turma.trainingDate), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      {turma.attendance && (
                        <span className="flex items-center gap-1">
                          <ClipboardCheck size={12} />{attendedCount}/{turma.participants.length} presentes
                        </span>
                      )}
                    </div>
                    {turma.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{turma.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" title="Registrar presença" onClick={() => openAttendance(turma)}>
                      <ClipboardCheck size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" title="PDF" onClick={() => { generateTurmaPDF(turma as any); toast({ title: "PDF gerado!" }); }}>
                      <FileDown size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" title="Duplicar" onClick={() => handleDuplicate(turma)}>
                      <Copy size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" title="Editar" onClick={() => handleOpenEdit(turma)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" title="Excluir" onClick={() => handleDelete(turma.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Dialog criar/editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Editar Turma" : "Nova Turma"}</DialogTitle>
              <DialogDescription>Preencha os dados da turma de treinamento.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label>Nome da Turma *</Label>
                  <Input value={editingTurma.name ?? ""} onChange={e => setEditingTurma(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Turma M1 - Produção" />
                </div>
                <div className="space-y-1">
                  <Label>Ciclo *</Label>
                  <Select value={editingTurma.cycleId ?? "M1"} onValueChange={v => setEditingTurma(p => ({ ...p, cycleId: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CYCLE_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Facilitador *</Label>
                  <Input
                    list="facilitator-list"
                    value={editingTurma.facilitator ?? ""}
                    onChange={e => setEditingTurma(p => ({ ...p, facilitator: e.target.value }))}
                    placeholder="Nome do facilitador"
                  />
                  <datalist id="facilitator-list">
                    {allFacilitators.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label>Data do Treinamento</Label>
                  <Input type="date" value={editingTurma.trainingDate ?? ""} onChange={e => setEditingTurma(p => ({ ...p, trainingDate: e.target.value || null }))} />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={editingTurma.status ?? "planned"} onValueChange={v => setEditingTurma(p => ({ ...p, status: v as Turma["status"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={editingTurma.notes ?? ""} onChange={e => setEditingTurma(p => ({ ...p, notes: e.target.value }))} rows={2} />
                </div>
              </div>

              {/* Participantes */}
              <div className="space-y-2">
                <Label>Participantes ({selectedParticipants.length} selecionados)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                    <Input className="pl-8 h-8 text-sm" placeholder="Buscar..." value={partSearch} onChange={e => setPartSearch(e.target.value)} />
                  </div>
                  <Select value={partSectorFilter} onValueChange={setPartSectorFilter}>
                    <SelectTrigger className="w-36 h-8 text-sm"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos setores</SelectItem>
                      {allSectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedParticipants.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedParticipants([])}>
                      <X size={12} className="mr-1" /> Limpar
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {filteredParticipants.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum colaborador encontrado.</p>
                  )}
                  {filteredParticipants.map(m => (
                    <div key={m.id} className="flex items-center gap-2 py-1.5 hover:bg-muted/30 px-1 rounded cursor-pointer" onClick={() => toggleParticipant(m.id)}>
                      <Checkbox checked={selectedParticipants.includes(m.id)} onCheckedChange={() => toggleParticipant(m.id)} />
                      <span className="text-sm flex-1">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.sector}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                {isEditing ? "Salvar" : "Criar Turma"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog presença */}
        {attendanceTurma && (
          <Dialog open={!!attendanceTurma} onOpenChange={() => setAttendanceTurma(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Presença — {attendanceTurma.name}</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-72 border rounded-md p-3">
                {attendanceTurma.participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{p.name}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant={attendanceData[p.id] === "present" ? "default" : "outline"}
                        onClick={() => setAttendanceData(d => ({ ...d, [p.id]: "present" }))}>
                        Presente
                      </Button>
                      <Button size="sm" variant={attendanceData[p.id] === "absent" ? "destructive" : "outline"}
                        onClick={() => setAttendanceData(d => ({ ...d, [p.id]: "absent" }))}>
                        Ausente
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAttendanceTurma(null)}>Cancelar</Button>
                <Button onClick={saveAttendance} disabled={saving}>
                  {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                  Salvar Presença
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </AppLayout>
  );
}
