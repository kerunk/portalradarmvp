import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  User,
  FileText,
  Edit2,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRecords,
  addRecord,
  updateRecord,
  deleteRecord,
  type RecordState,
} from "@/lib/storage";
import { RECORD_TYPES, RECORD_STATUS, CYCLE_IDS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const typeIcons = {
  meeting: MessageSquare,
  decision: CheckCircle2,
  observation: FileText,
  risk: AlertTriangle,
  communication: Megaphone,
};

const emptyRecord: Partial<RecordState> = {
  title: "",
  description: "",
  type: "observation",
  status: "open",
  cycleId: null,
  owner: "",
  tags: [],
};

export default function Records() {
  const { toast } = useToast();
  const [records, setRecords] = useState<RecordState[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Partial<RecordState>>(emptyRecord);
  const [isEditing, setIsEditing] = useState(false);

  // Load records from storage
  useEffect(() => {
    setRecords(getRecords());
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch =
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesType = typeFilter === "all" || record.type === typeFilter;
      const matchesCycle = cycleFilter === "all" || record.cycleId === cycleFilter || (cycleFilter === "none" && !record.cycleId);
      
      return matchesSearch && matchesStatus && matchesType && matchesCycle;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [records, searchTerm, statusFilter, typeFilter, cycleFilter]);

  const handleOpenNew = () => {
    setEditingRecord(emptyRecord);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (record: RecordState) => {
    setEditingRecord(record);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingRecord.title?.trim()) {
      toast({ title: "Erro", description: "Título é obrigatório", variant: "destructive" });
      return;
    }

    const now = new Date().toISOString();
    
    if (isEditing && editingRecord.id) {
      updateRecord(editingRecord.id, {
        title: editingRecord.title,
        description: editingRecord.description || "",
        type: editingRecord.type as RecordState["type"],
        status: editingRecord.status as RecordState["status"],
        cycleId: editingRecord.cycleId || null,
        owner: editingRecord.owner || "",
        tags: editingRecord.tags || [],
      });
      toast({ title: "Registro atualizado!" });
    } else {
      const newRecord: RecordState = {
        id: `rec-${Date.now()}`,
        companyId: "company-1",
        date: now.split("T")[0],
        cycleId: editingRecord.cycleId || null,
        type: editingRecord.type as RecordState["type"] || "observation",
        status: editingRecord.status as RecordState["status"] || "open",
        title: editingRecord.title || "",
        description: editingRecord.description || "",
        owner: editingRecord.owner || "",
        tags: editingRecord.tags || [],
        createdAt: now,
        updatedAt: now,
      };
      addRecord(newRecord);
      toast({ title: "Registro criado!" });
    }

    setRecords(getRecords());
    setIsDialogOpen(false);
    setEditingRecord(emptyRecord);
  };

  const handleDelete = (recordId: string) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      deleteRecord(recordId);
      setRecords(getRecords());
      toast({ title: "Registro excluído!" });
    }
  };

  return (
    <AppLayout
      title="Registros"
      subtitle="Diário operacional do comitê - registre reuniões, decisões, observações e riscos"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Buscar registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(RECORD_STATUS).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {Object.entries(RECORD_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Ciclos</SelectItem>
                <SelectItem value="none">Sem ciclo</SelectItem>
                {CYCLE_IDS.map(id => (
                  <SelectItem key={id} value={id}>{id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="gap-2">
                <Plus size={16} />
                Novo Registro
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
                  <Input
                    value={editingRecord.title || ""}
                    onChange={e => setEditingRecord(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título do registro"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipo</label>
                    <Select
                      value={editingRecord.type || "observation"}
                      onValueChange={value => setEditingRecord(prev => ({ ...prev, type: value as RecordState["type"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECORD_TYPES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Status</label>
                    <Select
                      value={editingRecord.status || "open"}
                      onValueChange={value => setEditingRecord(prev => ({ ...prev, status: value as RecordState["status"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RECORD_STATUS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ciclo (opcional)</label>
                    <Select
                      value={editingRecord.cycleId || "none"}
                      onValueChange={value => setEditingRecord(prev => ({ ...prev, cycleId: value === "none" ? null : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {CYCLE_IDS.map(id => (
                          <SelectItem key={id} value={id}>{id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Responsável</label>
                    <Input
                      value={editingRecord.owner || ""}
                      onChange={e => setEditingRecord(prev => ({ ...prev, owner: e.target.value }))}
                      placeholder="Nome"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                  <Textarea
                    value={editingRecord.description || ""}
                    onChange={e => setEditingRecord(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detalhes do registro..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{isEditing ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Records List */}
        <div className="space-y-3">
          {filteredRecords.length > 0 ? (
            filteredRecords.map(record => {
              const typeConfig = RECORD_TYPES[record.type];
              const statusConfig = RECORD_STATUS[record.status];
              const TypeIcon = typeIcons[record.type];

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
                            {record.cycleId && (
                              <Badge variant="outline">{record.cycleId}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEdit(record)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      {record.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {record.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {record.owner && (
                          <span className="inline-flex items-center gap-1">
                            <User size={12} />
                            {record.owner}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(record.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nenhum registro encontrado</p>
                <p className="text-sm">Crie um novo registro para começar</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
