import { useState, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Download,
  Upload,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  type PopulationMember,
  getPopulation,
  setPopulation,
  getNucleo,
  setNucleo,
  isEmailUsedInCompany,
  getPopulationStats,
  generatePopulationTemplate,
  parsePopulationCSV,
} from "@/lib/companyStorage";

interface MemberForm {
  name: string;
  email: string;
  sector: string;
  role: string;
  facilitator: boolean;
  nucleo: boolean;
  active: boolean;
}

const emptyForm: MemberForm = {
  name: "",
  email: "",
  sector: "",
  role: "",
  facilitator: false,
  nucleo: false,
  active: true,
};

export default function BasePopulacional() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [filterNucleo, setFilterNucleo] = useState("all");
  const [filterFacilitador, setFilterFacilitador] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);

  // Load data
  const population = useMemo(() => getPopulation(companyId), [companyId, refreshKey]);
  const nucleo = useMemo(() => getNucleo(companyId), [companyId, refreshKey]);
  const stats = useMemo(() => getPopulationStats(companyId), [companyId, refreshKey]);

  const nucleoIds = useMemo(() => {
    const nucleoEmails = new Set(nucleo.map(n => n.email.toLowerCase()).filter(Boolean));
    const nucleoNames = new Set(nucleo.map(n => n.name.toLowerCase()));
    return new Set(
      population
        .filter(p =>
          (p.email && nucleoEmails.has(p.email.toLowerCase())) ||
          nucleoNames.has(p.name.toLowerCase())
        )
        .map(p => p.id)
    );
  }, [population, nucleo]);

  // Sectors for filter
  const sectors = useMemo(() => {
    const s = new Set(population.map(m => m.sector).filter(Boolean));
    return Array.from(s).sort();
  }, [population]);

  // Filtered list
  const filtered = useMemo(() => {
    return population.filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSector !== "all" && m.sector !== filterSector) return false;
      if (filterActive === "active" && !m.active) return false;
      if (filterActive === "inactive" && m.active) return false;
      if (filterNucleo === "yes" && !nucleoIds.has(m.id)) return false;
      if (filterNucleo === "no" && nucleoIds.has(m.id)) return false;
      if (filterFacilitador === "yes" && !m.facilitator) return false;
      if (filterFacilitador === "no" && m.facilitator) return false;
      return true;
    });
  }, [population, search, filterSector, filterActive, filterNucleo, filterFacilitador, nucleoIds]);

  const refresh = () => setRefreshKey(k => k + 1);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (member: PopulationMember) => {
    setForm({
      name: member.name,
      email: member.email,
      sector: member.sector,
      role: member.role,
      facilitator: member.facilitator,
      nucleo: nucleoIds.has(member.id),
      active: member.active,
    });
    setEditingId(member.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.sector.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome e setor.", variant: "destructive" });
      return;
    }
    if (form.email && isEmailUsedInCompany(companyId, form.email, editingId || undefined)) {
      toast({ title: "Email duplicado", description: "Este email já está cadastrado.", variant: "destructive" });
      return;
    }

    const pop = getPopulation(companyId);

    if (editingId) {
      const updated = pop.map(m =>
        m.id === editingId
          ? { ...m, name: form.name, email: form.email, sector: form.sector, role: form.role, facilitator: form.facilitator, active: form.active }
          : m
      );
      setPopulation(companyId, updated);

      // Sync nucleo
      const nuc = getNucleo(companyId);
      if (form.nucleo) {
        if (!nuc.some(n => n.id === editingId || (n.email && n.email.toLowerCase() === form.email.toLowerCase()))) {
          setNucleo(companyId, [...nuc, { id: editingId, name: form.name, email: form.email, sector: form.sector, role: form.role }]);
        }
      } else {
        setNucleo(companyId, nuc.filter(n => n.id !== editingId && !(n.email && form.email && n.email.toLowerCase() === form.email.toLowerCase())));
      }

      toast({ title: "Atualizado!", description: `${form.name} foi atualizado.` });
    } else {
      const newId = `pop-${Date.now()}`;
      const newMember: PopulationMember = {
        id: newId,
        name: form.name,
        email: form.email,
        sector: form.sector,
        role: form.role,
        facilitator: form.facilitator,
        active: form.active,
      };
      setPopulation(companyId, [...pop, newMember]);

      if (form.nucleo) {
        const nuc = getNucleo(companyId);
        setNucleo(companyId, [...nuc, { id: newId, name: form.name, email: form.email, sector: form.sector, role: form.role }]);
      }

      toast({ title: "Adicionado!", description: `${form.name} foi incluído na base.` });
    }

    setDialogOpen(false);
    refresh();
  };

  const handleRemove = (member: PopulationMember) => {
    const pop = getPopulation(companyId);
    setPopulation(companyId, pop.filter(m => m.id !== member.id));
    // Also remove from nucleo if present
    const nuc = getNucleo(companyId);
    setNucleo(companyId, nuc.filter(n => n.id !== member.id && !(n.email && member.email && n.email.toLowerCase() === member.email.toLowerCase())));
    toast({ title: "Removido", description: `${member.name} foi removido.` });
    refresh();
  };

  const toggleFacilitator = (member: PopulationMember) => {
    const pop = getPopulation(companyId);
    setPopulation(companyId, pop.map(m => m.id === member.id ? { ...m, facilitator: !m.facilitator } : m));
    toast({ title: member.facilitator ? "Facilitador removido" : "Facilitador habilitado", description: member.name });
    refresh();
  };

  const toggleActive = (member: PopulationMember) => {
    const pop = getPopulation(companyId);
    setPopulation(companyId, pop.map(m => m.id === member.id ? { ...m, active: !m.active } : m));
    refresh();
  };

  const handleDownloadTemplate = () => {
    const csv = generatePopulationTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_base_populacional.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const { members, errors } = parsePopulationCSV(content);
      if (errors.length > 0) {
        toast({ title: "Erros na importação", description: errors.slice(0, 3).join("; "), variant: "destructive" });
      }
      if (members.length > 0) {
        const pop = getPopulation(companyId);
        const newMembers: PopulationMember[] = members.map((m, i) => ({
          ...m,
          id: `pop-import-${Date.now()}-${i}`,
          active: true,
        }));
        setPopulation(companyId, [...pop, ...newMembers]);
        toast({ title: "Importação concluída", description: `${newMembers.length} colaboradores importados.` });
        refresh();
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AppLayout title="Base Populacional" subtitle={`Gestão de colaboradores — ${user?.companyName || "Empresa"}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Ativos</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Facilitadores</p>
            <p className="text-2xl font-bold text-foreground">{stats.facilitators}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Setores</p>
            <p className="text-2xl font-bold text-foreground">{stats.sectors}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Núcleo</p>
            <p className="text-2xl font-bold text-foreground">{nucleo.length}</p>
          </Card>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterSector} onValueChange={setFilterSector}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Setor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterNucleo} onValueChange={setFilterNucleo}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Núcleo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Núcleo</SelectItem>
              <SelectItem value="no">Não-núcleo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterFacilitador} onValueChange={setFilterFacilitador}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Facilitador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Facilitadores</SelectItem>
              <SelectItem value="no">Não-facilitadores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={openAdd}>
            <UserPlus size={16} className="mr-2" /> Adicionar Colaborador
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download size={16} className="mr-2" /> Modelo CSV
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" /> Importar CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Núcleo</TableHead>
                <TableHead className="text-center">Facilitador</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {population.length === 0
                      ? "Nenhum colaborador cadastrado. Adicione manualmente ou importe um CSV."
                      : "Nenhum colaborador encontrado com os filtros aplicados."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.sector}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email || "—"}</TableCell>
                  <TableCell className="text-center">
                    {nucleoIds.has(member.id) && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                        <ShieldCheck size={12} className="mr-1" /> Núcleo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleFacilitator(member)} title="Alternar facilitador">
                      <Star
                        size={18}
                        className={member.facilitator ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40"}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={member.active} onCheckedChange={() => toggleActive(member)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(member)} className="text-destructive hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} de {population.length} colaboradores · {stats.facilitators} facilitadores · {nucleo.length} no núcleo
        </p>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Colaborador" : "Adicionar Colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Setor *</Label>
                <Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="Ex: Operações" />
              </div>
              <div className="space-y-1">
                <Label>Cargo/Função</Label>
                <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Técnico" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch checked={form.facilitator} onCheckedChange={v => setForm(f => ({ ...f, facilitator: v }))} />
                <Label>Facilitador habilitado</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.nucleo} onCheckedChange={v => setForm(f => ({ ...f, nucleo: v }))} />
                <Label>Integrante do Núcleo</Label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
