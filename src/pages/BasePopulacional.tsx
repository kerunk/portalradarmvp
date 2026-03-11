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
  Download,
  Upload,
  ShieldCheck,
  Star,
  Crown,
  ExternalLink,
} from "lucide-react";
import {
  type PopulationMember,
  getPopulation,
  setPopulation,
  getOrgStructure,
  isEmailUsedInCompany,
  getPopulationStats,
  generatePopulationTemplate,
  parsePopulationCSV,
  exportPopulationCSV,
} from "@/lib/companyStorage";

interface MemberForm {
  name: string;
  email: string;
  sector: string;
  role: string;
  unit: string;
  shift: string;
  admissionDate: string;
  facilitator: boolean;
  nucleo: boolean;
  leadership: boolean;
  active: boolean;
}

const emptyForm: MemberForm = {
  name: "",
  email: "",
  sector: "",
  role: "",
  unit: "",
  shift: "",
  admissionDate: "",
  facilitator: false,
  nucleo: false,
  leadership: false,
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
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [filterNucleo, setFilterNucleo] = useState("all");
  const [filterFacilitador, setFilterFacilitador] = useState("all");
  const [filterLeadership, setFilterLeadership] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);

  // Load data
  const population = useMemo(() => getPopulation(companyId), [companyId, refreshKey]);
  const stats = useMemo(() => getPopulationStats(companyId), [companyId, refreshKey]);
  const orgStructure = useMemo(() => getOrgStructure(companyId), [companyId, refreshKey]);

  // Org structure options (source of truth for selects in form)
  const orgSectors = useMemo(() => orgStructure.sectors.filter(s => !s.archived).map(s => s.name).sort(), [orgStructure]);
  const orgUnits = useMemo(() => orgStructure.units.filter(u => !u.archived).map(u => u.name).sort(), [orgStructure]);
  const orgShifts = useMemo(() => orgStructure.shifts.filter(s => !s.archived).map(s => s.name).sort(), [orgStructure]);
  const orgPositions = useMemo(() => orgStructure.positions.filter(p => !p.archived).map(p => p.name).sort(), [orgStructure]);

  // Filter options: combine org structure + existing population values for backwards compat
  const filterSectors = useMemo(() => {
    const all = new Set([...orgSectors, ...population.map(m => m.sector).filter(Boolean)]);
    return Array.from(all).sort();
  }, [orgSectors, population]);
  const filterUnits = useMemo(() => {
    const all = new Set([...orgUnits, ...population.map(m => m.unit).filter(Boolean)]);
    return Array.from(all).sort();
  }, [orgUnits, population]);
  const filterShifts = useMemo(() => {
    const all = new Set([...orgShifts, ...population.map(m => m.shift).filter(Boolean)]);
    return Array.from(all).sort();
  }, [orgShifts, population]);
  const filterRoles = useMemo(() => {
    const all = new Set([...orgPositions, ...population.map(m => m.role).filter(Boolean)]);
    return Array.from(all).sort();
  }, [orgPositions, population]);

  // Filtered list
  const filtered = useMemo(() => {
    return population.filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSector !== "all" && m.sector !== filterSector) return false;
      if (filterUnit !== "all" && m.unit !== filterUnit) return false;
      if (filterShift !== "all" && m.shift !== filterShift) return false;
      if (filterRole !== "all" && m.role !== filterRole) return false;
      if (filterActive === "active" && !m.active) return false;
      if (filterActive === "inactive" && m.active) return false;
      if (filterNucleo === "yes" && !m.nucleo) return false;
      if (filterNucleo === "no" && m.nucleo) return false;
      if (filterFacilitador === "yes" && !m.facilitator) return false;
      if (filterFacilitador === "no" && m.facilitator) return false;
      if (filterLeadership === "yes" && !m.leadership) return false;
      if (filterLeadership === "no" && m.leadership) return false;
      return true;
    });
  }, [population, search, filterSector, filterUnit, filterShift, filterRole, filterActive, filterNucleo, filterFacilitador, filterLeadership]);

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
      unit: member.unit,
      shift: member.shift,
      admissionDate: member.admissionDate,
      facilitator: member.facilitator,
      nucleo: member.nucleo,
      leadership: member.leadership,
      active: member.active,
    });
    setEditingId(member.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Email inválido", description: "Informe um email válido.", variant: "destructive" });
      return;
    }
    if (form.email && isEmailUsedInCompany(companyId, form.email, editingId || undefined)) {
      toast({ title: "Email duplicado", description: "Este email já está cadastrado.", variant: "destructive" });
      return;
    }

    const pop = getPopulation(companyId);

    if (editingId) {
      const updated = pop.map(m =>
        m.id === editingId ? { ...m, ...form } : m
      );
      setPopulation(companyId, updated);
      toast({ title: "Atualizado!", description: `${form.name} foi atualizado.` });
    } else {
      const newMember: PopulationMember = {
        ...form,
        id: `pop-${Date.now()}`,
      };
      setPopulation(companyId, [...pop, newMember]);
      toast({ title: "Adicionado!", description: `${form.name} foi incluído na base.` });
    }

    setDialogOpen(false);
    refresh();
  };

  const toggleField = (member: PopulationMember, field: "facilitator" | "nucleo" | "leadership" | "active") => {
    const pop = getPopulation(companyId);
    setPopulation(companyId, pop.map(m => m.id === member.id ? { ...m, [field]: !m[field] } : m));
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

  const handleExportCSV = () => {
    const csv = exportPopulationCSV(companyId);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base_populacional_${companyId}.csv`;
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
          facilitator: false,
          nucleo: false,
          leadership: false,
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Ativos</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Inativos</p>
            <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Núcleo</p>
            <p className="text-2xl font-bold text-foreground">{stats.nucleoCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Facilitadores</p>
            <p className="text-2xl font-bold text-foreground">{stats.facilitators}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Liderança</p>
            <p className="text-2xl font-bold text-foreground">{stats.leaders}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Setores</p>
            <p className="text-2xl font-bold text-foreground">{stats.sectors}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Unidades</p>
            <p className="text-2xl font-bold text-foreground">{stats.units}</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterSector} onValueChange={setFilterSector}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Setor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos setores</SelectItem>
              {filterSectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterUnit} onValueChange={setFilterUnit}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas unidades</SelectItem>
              {filterUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterShift} onValueChange={setFilterShift}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Turno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos turnos</SelectItem>
              {filterShifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Cargo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos cargos</SelectItem>
              {filterRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterNucleo} onValueChange={setFilterNucleo}>
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Núcleo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Núcleo</SelectItem>
              <SelectItem value="no">Não-núcleo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterFacilitador} onValueChange={setFilterFacilitador}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Facilitador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Facilitadores</SelectItem>
              <SelectItem value="no">Não-facilitadores</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLeadership} onValueChange={setFilterLeadership}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Liderança" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Liderança</SelectItem>
              <SelectItem value="no">Não-liderança</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAdd}>
            <UserPlus size={16} className="mr-2" /> Adicionar Colaborador
          </Button>
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download size={16} className="mr-2" /> Modelo CSV
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" /> Importar CSV
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download size={16} className="mr-2" /> Exportar CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="text-center">Núcleo</TableHead>
                <TableHead className="text-center">Facilitador</TableHead>
                <TableHead className="text-center">Status</TableHead>
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
                <TableRow key={member.id} className={!member.active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {member.leadership && <Crown size={14} className="text-amber-500" />}
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell>{member.role || "—"}</TableCell>
                  <TableCell>{member.sector || "—"}</TableCell>
                  <TableCell>{member.shift || "—"}</TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleField(member, "nucleo")} title="Alternar núcleo">
                      <ShieldCheck
                        size={18}
                        className={member.nucleo ? "text-primary fill-primary/20" : "text-muted-foreground/30"}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleField(member, "facilitator")} title="Alternar facilitador">
                      <Star
                        size={18}
                        className={member.facilitator ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={member.active} onCheckedChange={() => toggleField(member, "active")} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <p className="text-xs text-muted-foreground">
          Mostrando {filtered.length} de {population.length} colaboradores
        </p>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Colaborador" : "Adicionar Colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
            </div>
            {renderOrgSelect("Cargo", "role", orgPositions, "positions")}
            {renderOrgSelect("Setor", "sector", orgSectors, "sectors")}
            <div className="grid grid-cols-2 gap-3">
              {renderOrgSelect("Unidade", "unit", orgUnits, "units")}
              {renderOrgSelect("Turno", "shift", orgShifts, "shifts")}
            </div>
            <div className="space-y-1">
              <Label>Data de Admissão</Label>
              <Input type="date" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} />
            </div>
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label>Participa do Núcleo</Label>
                <Switch checked={form.nucleo} onCheckedChange={v => setForm(f => ({ ...f, nucleo: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Facilitador Habilitado</Label>
                <Switch checked={form.facilitator} onCheckedChange={v => setForm(f => ({ ...f, facilitator: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Liderança</Label>
                <Switch checked={form.leadership} onCheckedChange={v => setForm(f => ({ ...f, leadership: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Colaborador Ativo</Label>
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              </div>
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
