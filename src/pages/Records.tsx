import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search, Plus, Calendar, User, FileText, Edit2, Trash2,
  MessageSquare, AlertTriangle, Megaphone, CheckCircle2, ArrowRight, Link2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchRecords, insertRecord, updateRecord, type DBRecord } from "@/lib/db";
import { RECORD_TYPES, RECORD_STATUS, CYCLE_IDS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  CreateActionFromTemplateDialog,
  type NewActionData,
} from "@/components/cycles/CreateActionFromTemplateDialog";

const typeIcons: Record<string, any> = {
  meeting: MessageSquare,
  decision: CheckCircle2,
  observation: FileText,
  risk: AlertTriangle,
  communication: Megaphone,
  validation: CheckCircle2,
};

const emptyRecord: Partial<DBRecord> = {
  title: "", description: "", type: "observation",
  status: "open", cycleId: null, owner: "", tags: [],
};

export default function Records() {
  const { toast } = useToast();
  const { user } = useAuth();
  const companyId = user?.companyId || "";
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<DBRecord[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") || "all");
  const [cycleFilter, setCycleFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<DBRecord>>(emptyRecord);
  const [isEditing, setIsEditing] = useState(false);

  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<DBRecord | null>(null);

  // ── Carrega do Supabase ───────────────────────────────────────────────────
  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    const data = await fetchRecords(companyId);
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [companyId]);

  useEffect(() => {
    const t = searchParams.get("type");
    if (t && RECORD_TYPES[t as keyof typeof RECORD_TYPES]) setTypeFilter(t);
  }, [searchParams]);

  // ── Filtros ───────────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() => records.filter(r => {
    const q = searchTerm.toLowerCase();
    if (q && !r.title.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q) &&
        !r.owner.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (cycleFilter !== "all") {
      if (cycleFilter === "none" && r.cycleId) return false;
      if (cycleFilter !== "none" && r.cycleId !== cycleFilter) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  [records, searchTerm, statusFilter, typeFilter, cycleFilter]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleOpenNew = () => { setEditingRecord(emptyRecord); setIsEditing(false); setIsDialogOpen(true); };
  const handleOpenEdit = (r: DBRecord) => { setEditingRecord(r); setIsEditing(true); setIsDialogOpen(true); };

  const handleSave = async () => {
    if (!editingRecord.title?.trim()) {
      toast({ title: "Título é obrigatório", variant: "destructive" }); return;
    }
    setSaving(true);
    const now = new Date().toISOString();

    if (isEditing && editingRecord.id) {
      const ok = await updateRecord(editingRecord.id, {
        title: editingRecord.title,
        description: editingRecord.description || "",
        type: editingRecord.type,
        status: editingRecord.status,
        cycleId: editingRecord.cycleId || null,
        owner: editingRecord.owner || "",
        tags: editingRecord.tags || [],
      });
      toast({ title: ok ? "Registro atualizado!" : "Erro ao salvar", variant: ok ? "default" : "destructive" });
    } else {
      const created = await insertRecord(companyId, {
        date: now.split("T")[0],
        cycleId: editingRecord.cycleId || null,
        factorId: null,
        type: editingRecord.type || "observation",
        status: editingRecord.status || "open",
        title: editingRecord.title || "",
        description: editingRecord.description || "",
        owner: editingRecord.owner || "",
        tags: editingRecord.tags || [],
        createsActions: false,
        linkedActionIds: [] as string[],
      });
      toast({ title: created ? "Registro criado!" : "Erro ao criar", variant: created ? "default" : "destructive" });
    }

    setSaving(false);
    setIsDialogOpen(false);
    setEditingRecord(emptyRecord);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    // soft delete via status
    await updateRecord(id, { status: "deleted" } as any);
    await loadData();
    toast({ title: "Registro excluído!" });
  };

  const handleCreateActionFromDecision = async (actionData: NewActionData) => {
    if (!selectedDecision) return;
    // Link action to decision via linkedActionIds
    const newId = `custom-${Date.now()}`;
    await updateRecord(selectedDecision.id, {
      createsActions: true,
      linkedActionIds: [...(selectedDecision.linkedActionIds || []), newId],
    });
    toast({ title: "Ação criada!", description: `Vinculada à decisão "${selectedDecision.title}"` });
    setSelectedDecision(null);
    setIsActionDialogOpen(false);
    await loadData();
  };

  if (loading) {
    return (
      <AppLayout title="Registros" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Registros"
      subtitle="Diário operacional do comitê — reuniões, decisões, observações e riscos"
    >
      <div className="space-y-6 animate-fade-in">

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Buscar registros..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(RECORD_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(RECORD_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Ciclo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Ciclos</SelectItem>
                <SelectItem value="none">Sem ciclo</SelectItem>
                {CYCLE_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="gap-2">
                <Plus size={16} /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{isEditing ? "Editar Registro" : "Novo Registro"}</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Atualize as informações do registro" : "Registre uma ocorrência do comitê"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Título *</label>
                  <Input value={editingRecord.title || ""}
                    onChange={e => setEditingRecord(p => ({ ...p, title: e.target.value }))}
                    placeholder="Título do registro" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipo</label>
                    <Select value={editingRecord.type || "observation"}
                      onValueChange={v => setEditingRecord(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECORD_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Status</label>
                    <Select value={editingRecord.status || "open"}
                      onValueChange={v => setEditingRecord(p => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECORD_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ciclo (opcional)</label>
                    <Select value={editingRecord.cycleId || "none"}
                      onValueChange={v => setEditingRecord(p => ({ ...p, cycleId: v === "none" ? null : v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {CYCLE_IDS.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Responsável</label>
                    <Input value={editingRecord.owner || ""}
                      onChange={e => setEditingRecord(p => ({ ...p, owner: e.target.value }))}
                      placeholder="Nome" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                  <Textarea value={editingRecord.description || ""}
                    onChange={e => setEditingRecord(p => ({ ...p, description: e.target.value }))}
                    placeholder="Detalhes do registro..." rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                  {isEditing ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filteredRecords.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              {records.length === 0 ? "Nenhum registro ainda. Crie o primeiro!" : "Nenhum registro corresponde ao filtro."}
            </Card>
          )}
          {filteredRecords.map(record => {
            const typeConfig = RECORD_TYPES[record.type] ?? RECORD_TYPES.observation;
            const statusConfig = RECORD_STATUS[record.status] ?? RECORD_STATUS.open;
            const TypeIcon = typeIcons[record.type] ?? FileText;
            return (
              <Card key={record.id} className="p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", typeConfig.color)}>
                    <TypeIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{record.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                          {record.cycleId && <Badge variant="outline">{record.cycleId}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {record.type === "decision" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            title="Criar ação a partir desta decisão"
                            onClick={() => { setSelectedDecision(record); setIsActionDialogOpen(true); }}>
                            <ArrowRight size={14} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => handleOpenEdit(record)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(record.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    {record.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{record.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {record.owner && (
                        <span className="flex items-center gap-1"><User size={11} />{record.owner}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {format(new Date(record.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {record.linkedActionIds?.length > 0 && (
                        <span className="flex items-center gap-1 text-primary">
                          <Link2 size={11} />{record.linkedActionIds.length} ação(ões) vinculada(s)
                        </span>
                      )}
                      {record.tags?.length > 0 && record.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Dialog criar ação a partir de decisão */}
        {selectedDecision && (
          <CreateActionFromTemplateDialog
            isOpen={isActionDialogOpen}
            onClose={() => { setIsActionDialogOpen(false); setSelectedDecision(null); }}
            onConfirm={handleCreateActionFromDecision}
            sourceDecisionId={selectedDecision.id}
            dialogTitle={`Criar ação a partir de: "${selectedDecision.title}"`}
          />
        )}
      </div>
    </AppLayout>
  );
}
