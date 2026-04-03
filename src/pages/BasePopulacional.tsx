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
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Users, UserPlus, Search, Pencil, Download, Upload,
  ShieldCheck, Star, Crown, FileSpreadsheet,
} from "lucide-react";
import {
  type PopulationMember,
  getPopulation, setPopulation,
  getOrgStructure, setOrgStructure,
  isEmailUsedInCompany, getPopulationStats,
} from "@/lib/companyStorage";
import {
  downloadExcelTemplate, exportPopulationExcel,
  exportPopulationCSVCompat, parseImportFile,
} from "@/lib/excelUtils";

interface MemberForm {
  name: string; email: string; sector: string; role: string;
  unit: string; shift: string; admissionDate: string;
  facilitator: boolean; nucleo: boolean; leadership: boolean; active: boolean;
}

const emptyForm: MemberForm = {
  name: "", email: "", sector: "", role: "", unit: "", shift: "",
  admissionDate: "", facilitator: false, nucleo: false, leadership: false, active: true,
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
  const [filterStatus, setFilterStatus] = useState("active"); // default: Ativos
  const [filterNucleo, setFilterNucleo] = useState("all");
  const [filterFacilitador, setFilterFacilitador] = useState("all");
  const [filterLeadership, setFilterLeadership] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);

  const population = useMemo(() => getPopulation(companyId), [companyId, refreshKey]);
  const stats = useMemo(() => getPopulationStats(companyId), [companyId, refreshKey]);
  const orgStructure = useMemo(() => getOrgStructure(companyId), [companyId, refreshKey]);

  const orgSectors = useMemo(() => orgStructure.sectors.filter(s => !s.archived).map(s => s.name).sort(), [orgStructure]);
  const orgUnits = useMemo(() => orgStructure.units.filter(u => !u.archived).map(u => u.name).sort(), [orgStructure]);
  const orgShifts = useMemo(() => orgStructure.shifts.filter(s => !s.archived).map(s => s.name).sort(), [orgStructure]);
  const orgPositions = useMemo(() => orgStructure.positions.filter(p => !p.archived).map(p => p.name).sort(), [orgStructure]);

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

  const filtered = useMemo(() => {
    return population.filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSector !== "all" && m.sector !== filterSector) return false;
      if (filterUnit !== "all" && m.unit !== filterUnit) return false;
      if (filterShift !== "all" && m.shift !== filterShift) return false;
      if (filterRole !== "all" && m.role !== filterRole) return false;
      if (filterStatus === "active" && !m.active) return false;
      if (filterStatus === "inactive" && m.active) return false;
      if (filterNucleo === "yes" && !m.nucleo) return false;
      if (filterNucleo === "no" && m.nucleo) return false;
      if (filterFacilitador === "yes" && !m.facilitator) return false;
      if (filterFacilitador === "no" && m.facilitator) return false;
      if (filterLeadership === "yes" && !m.leadership) return false;
      if (filterLeadership === "no" && m.leadership) return false;
      return true;
    });
  }, [population, search, filterSector, filterUnit, filterShift, filterRole, filterStatus, filterNucleo, filterFacilitador, filterLeadership]);

  const refresh = () => setRefreshKey(k => k + 1);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = (member: PopulationMember) => {
    setForm({
      name: member.name, email: member.email, sector: member.sector,
      role: member.role, unit: member.unit, shift: member.shift,
      admissionDate: member.admissionDate, facilitator: member.facilitator,
      nucleo: member.nucleo, leadership: member.leadership, active: member.active,
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
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    if (form.email && isEmailUsedInCompany(companyId, form.email, editingId || undefined)) {
      toast({ title: "Email duplicado", variant: "destructive" });
      return;
    }
    ensureOrgValue("positions", form.role);
    ensureOrgValue("sectors", form.sector);
    ensureOrgValue("units", form.unit);
    ensureOrgValue("shifts", form.shift);

    const pop = getPopulation(companyId);
    if (editingId) {
      setPopulation(companyId, pop.map(m => m.id === editingId ? { ...m, ...form } : m));
      toast({ title: "Atualizado!", description: `${form.name} foi atualizado.` });
    } else {
      setPopulation(companyId, [...pop, { ...form, id: `pop-${Date.now()}` }]);
      toast({ title: "Adicionado!", description: `${form.name} foi incluído na base.` });
    }
    setDialogOpen(false);
    refresh();
  };

  const toggleActive = (member: PopulationMember) => {
    const pop = getPopulation(companyId);
    const newActive = !member.active;
    setPopulation(companyId, pop.map(m => m.id === member.id ? { ...m, active: newActive } : m));
    toast({
      title: newActive ? "Colaborador reativado" : "Colaborador inativado",
      description: `${member.name} foi ${newActive ? "reativado" : "inativado"}.`,
    });
    refresh();
  };

  const toggleField = (member: PopulationMember, field: "facilitator" | "nucleo" | "leadership") => {
    const pop = getPopulation(companyId);
    setPopulation(companyId, pop.map(m => m.id === member.id ? { ...m, [field]: !m[field] } : m));
    refresh();
  };

  const handleExportExcel = () => {
    const data = filterStatus === "all" ? population : filtered;
    exportPopulationExcel(data, `base_populacional_${companyId}.xlsx`);
    toast({ title: "Excel exportado com sucesso" });
  };

  const handleExportCSV = () => {
    const data = filterStatus === "all" ? population : filtered;
    exportPopulationCSVCompat(data, `base_populacional_${companyId}.csv`);
    toast({ title: "CSV exportado com sucesso" });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    parseImportFile(file, getPopulation(companyId), (result) => {
      if (result.errors.length > 0) {
        toast({ title: "Erros na importação", description: result.errors.slice(0, 3).join("; "), variant: "destructive" });
      }
      if (result.members.length > 0) {
        const pop = getPopulation(companyId);
        const newMembers: PopulationMember[] = result.members.map((m, i) => ({
          ...m, id: `pop-import-${Date.now()}-${i}`,
          facilitator: false, nucleo: false, leadership: false, active: true,
        }));
        setPopulation(companyId, [...pop, ...newMembers]);
        let desc = `${result.added} colaboradores importados.`;
        if (result.duplicatesSkipped > 0) desc += ` ${result.duplicatesSkipped} duplicados ignorados (email já existente).`;
        toast({ title: "Importação concluída", description: desc });
        refresh();
      } else if (result.duplicatesSkipped > 0) {
        toast({ title: "Nenhum novo colaborador", description: `${result.duplicatesSkipped} registros ignorados por email duplicado.` });
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const ensureOrgValue = (category: "positions" | "sectors" | "units" | "shifts", value: string) => {
    if (!value.trim()) return;
    const structure = getOrgStructure(companyId);
    const list = structure[category] || [];
    if (!list.some(item => item.name.toLowerCase() === value.trim().toLowerCase())) {
      list.push({
        id: `org-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: value.trim(), archived: false, order: list.length,
      });
      structure[category] = list;
      setOrgStructure(companyId, structure);
    }
  };

  const renderOrgSelect = (label: string, field: keyof MemberForm, options: string[], datalistId: string) => {
    const currentValue = (form[field] as string) || "";
    const allOptions = new Set<string>(options);
    if (currentValue.trim()) allOptions.add(currentValue);
    population.forEach(m => {
      const val = m[field as keyof PopulationMember];
      if (typeof val === "string" && val.trim()) allOptions.add(val);
    });
    const sortedOptions = Array.from(allOptions).sort();
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <Input value={currentValue} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder="Selecione ou digite um novo" list={datalistId} autoComplete="off" />
        {sortedOptions.length > 0 && (
          <datalist id={datalistId}>
            {sortedOptions.map(o => <option key={o} value={o} />)}
          </datalist>
        )}
      </div>
    );
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

        {/* Filters - Row 1: Search + Status */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters - Row 2: Structural filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Setor:</Label>
              <Select value={filterSector} onValueChange={setFilterSector}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filterSectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Unidade:</Label>
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {filterUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Cargo:</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filterRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Turno:</Label>
              <Select value={filterShift} onValueChange={setFilterShift}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {filterShifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Núcleo:</Label>
              <Select value={filterNucleo} onValueChange={setFilterNucleo}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Facilitador:</Label>
              <Select value={filterFacilitador} onValueChange={setFilterFacilitador}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Liderança:</Label>
              <Select value={filterLeadership} onValueChange={setFilterLeadership}>
                <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAdd}>
            <UserPlus size={16} className="mr-2" /> Adicionar Colaborador
          </Button>
          <Button variant="outline" onClick={() => downloadExcelTemplate()}>
            <FileSpreadsheet size={16} className="mr-2" /> Modelo Excel
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" /> Importar
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} className="mr-2" /> Exportar Excel
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download size={16} className="mr-2" /> Exportar CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
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
                      ? "Nenhum colaborador cadastrado. Adicione manualmente ou importe uma planilha."
                      : "Nenhum colaborador encontrado com os filtros aplicados."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(member => (
                <TableRow key={member.id} className={!member.active ? "opacity-50 bg-muted/30" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {member.leadership && <Crown size={14} className="text-amber-500" />}
                      {member.name}
                      {!member.active && (
                        <Badge variant="outline" className="text-[10px] ml-1 text-muted-foreground">Inativo</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{member.role || "—"}</TableCell>
                  <TableCell>{member.sector || "—"}</TableCell>
                  <TableCell>{member.shift || "—"}</TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleField(member, "nucleo")} title="Alternar núcleo">
                      <ShieldCheck size={18} className={member.nucleo ? "text-primary fill-primary/20" : "text-muted-foreground/30"} />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleField(member, "facilitator")} title="Alternar facilitador">
                      <Star size={18} className={member.facilitator ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"} />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={member.active ? "outline" : "secondary"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => toggleActive(member)}
                    >
                      {member.active ? "Inativar" : "Reativar"}
                    </Button>
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
          {filterStatus === "active" && " (filtro: ativos)"}
          {filterStatus === "inactive" && " (filtro: inativos)"}
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
            {renderOrgSelect("Cargo", "role", orgPositions, "dl-positions")}
            {renderOrgSelect("Setor", "sector", orgSectors, "dl-sectors")}
            <div className="grid grid-cols-2 gap-3">
              {renderOrgSelect("Unidade", "unit", orgUnits, "dl-units")}
              {renderOrgSelect("Turno", "shift", orgShifts, "dl-shifts")}
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
