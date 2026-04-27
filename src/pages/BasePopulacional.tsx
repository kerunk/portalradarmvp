import { useState, useEffect, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveCompanyId } from "@/hooks/useActiveCompanyId";
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
  ShieldCheck, Star, Crown, FileSpreadsheet, Loader2,
} from "lucide-react";
import {
  fetchPopulation, insertMember, updateMember,
  isEmailUsed, ensureOrgValue, fetchOrgStructure, bulkInsertMembers,
  type PopulationMember,
} from "@/lib/db";
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
  const companyId = useActiveCompanyId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [population, setPopulation] = useState<PopulationMember[]>([]);
  const [orgSectors, setOrgSectors] = useState<string[]>([]);
  const [orgUnits, setOrgUnits] = useState<string[]>([]);
  const [orgShifts, setOrgShifts] = useState<string[]>([]);
  const [orgPositions, setOrgPositions] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterNucleo, setFilterNucleo] = useState("all");
  const [filterFacilitador, setFilterFacilitador] = useState("all");
  const [filterLeadership, setFilterLeadership] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberForm>(emptyForm);

  // ── Carrega dados do Supabase ──────────────────────────────────────────────
  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    const [pop, org] = await Promise.all([
      fetchPopulation(companyId),
      fetchOrgStructure(companyId),
    ]);
    setPopulation(pop);
    setOrgSectors(org.sectors.filter(s => !s.archived).map(s => s.name).sort());
    setOrgUnits(org.units.filter(u => !u.archived).map(u => u.name).sort());
    setOrgShifts(org.shifts.filter(s => !s.archived).map(s => s.name).sort());
    setOrgPositions(org.positions.filter(p => !p.archived).map(p => p.name).sort());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [companyId]);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const allSectors = useMemo(() => {
    const s = new Set([...orgSectors, ...population.map(m => m.sector).filter(Boolean)]);
    return Array.from(s).sort();
  }, [orgSectors, population]);

  const allUnits = useMemo(() => {
    const s = new Set([...orgUnits, ...population.map(m => m.unit).filter(Boolean)]);
    return Array.from(s).sort();
  }, [orgUnits, population]);

  const allShifts = useMemo(() => {
    const s = new Set([...orgShifts, ...population.map(m => m.shift).filter(Boolean)]);
    return Array.from(s).sort();
  }, [orgShifts, population]);

  const allRoles = useMemo(() => {
    const s = new Set([...orgPositions, ...population.map(m => m.role).filter(Boolean)]);
    return Array.from(s).sort();
  }, [orgPositions, population]);

  const filtered = useMemo(() => population.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.email.toLowerCase().includes(search.toLowerCase())) return false;
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
  }), [population, search, filterSector, filterUnit, filterShift, filterRole,
       filterStatus, filterNucleo, filterFacilitador, filterLeadership]);

  const stats = useMemo(() => {
    const active = population.filter(m => m.active);
    return {
      total: active.length,
      facilitators: active.filter(m => m.facilitator).length,
      nucleoCount: active.filter(m => m.nucleo).length,
      leaders: active.filter(m => m.leadership).length,
      inactive: population.length - active.length,
    };
  }, [population]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
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

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" }); return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Email inválido", variant: "destructive" }); return;
    }
    if (form.email) {
      const used = await isEmailUsed(companyId, form.email, editingId ?? undefined);
      if (used) { toast({ title: "Email já cadastrado", variant: "destructive" }); return; }
    }

    setSaving(true);
    // Garante que os valores de org existem no Supabase
    await Promise.all([
      ensureOrgValue(companyId, "positions", form.role),
      ensureOrgValue(companyId, "sectors", form.sector),
      ensureOrgValue(companyId, "units", form.unit),
      ensureOrgValue(companyId, "shifts", form.shift),
    ]);

    if (editingId) {
      const ok = await updateMember(editingId, form);
      if (ok) {
        toast({ title: "Atualizado!", description: `${form.name} foi atualizado.` });
      } else {
        toast({ title: "Erro ao salvar", variant: "destructive" });
      }
    } else {
      const created = await insertMember(companyId, form);
      if (created) {
        toast({ title: "Adicionado!", description: `${form.name} foi incluído na base.` });
      } else {
        toast({ title: "Erro ao salvar", variant: "destructive" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    await loadData();
  };

  const toggleActive = async (member: PopulationMember) => {
    const newActive = !member.active;
    await updateMember(member.id, { active: newActive });
    toast({
      title: newActive ? "Colaborador reativado" : "Colaborador inativado",
      description: `${member.name} foi ${newActive ? "reativado" : "inativado"}.`,
    });
    await loadData();
  };

  const toggleField = async (member: PopulationMember, field: "facilitator" | "nucleo" | "leadership") => {
    await updateMember(member.id, { [field]: !member[field] });
    await loadData();
  };

  // ── Exportação ─────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    exportPopulationExcel(filtered, `base_populacional_${companyId}.xlsx`);
    toast({ title: "Excel exportado" });
  };

  const handleExportCSV = () => {
    exportPopulationCSVCompat(filtered, `base_populacional_${companyId}.csv`);
    toast({ title: "CSV exportado" });
  };

  // ── Importação ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // parseImportFile usa a lista atual apenas para detectar duplicatas por email
    parseImportFile(file, population, async (result) => {
      if (result.errors.length > 0) {
        toast({ title: "Erros na importação", description: result.errors.slice(0, 3).join("; "), variant: "destructive" });
      }
      if (result.members.length > 0) {
        setSaving(true);
        const count = await bulkInsertMembers(companyId, result.members.map(m => ({
          name: m.name, email: m.email, sector: m.sector ?? "",
          role: m.role ?? "", unit: m.unit ?? "", shift: m.shift ?? "",
          admissionDate: m.admissionDate ?? "",
          facilitator: false, nucleo: false, leadership: false, active: true,
        })));
        setSaving(false);
        let desc = `${count} colaboradores importados.`;
        if (result.duplicatesSkipped > 0) desc += ` ${result.duplicatesSkipped} duplicados ignorados.`;
        toast({ title: "Importação concluída", description: desc });
        await loadData();
      } else if (result.duplicatesSkipped > 0) {
        toast({ title: "Nenhum novo colaborador", description: `${result.duplicatesSkipped} duplicados ignorados.` });
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderOrgInput = (label: string, field: keyof MemberForm, options: string[]) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        list={`list-${field}`}
        value={(form[field] as string) || ""}
        onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        placeholder={`Digite ou selecione ${label.toLowerCase()}`}
      />
      <datalist id={`list-${field}`}>
        {options.map(o => <option key={o} value={o} />)}
      </datalist>
    </div>
  );

  if (loading) {
    return (
      <AppLayout title="Base Populacional" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Base Populacional"
      subtitle={`${stats.total} colaboradores ativos — ${user?.companyName || "Empresa"}`}
    >
      <div className="space-y-6 animate-fade-in">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Colaboradores Ativos", value: stats.total },
            { label: "Núcleo de Sustentação", value: stats.nucleoCount },
            { label: "Facilitadores", value: stats.facilitators },
            { label: "Lideranças", value: stats.leaders },
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input className="pl-9" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {allSectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadExcelTemplate()}>
              <FileSpreadsheet size={14} className="mr-1" /> Modelo
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download size={14} className="mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download size={14} className="mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} className="mr-1" /> Importar
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
            <Button size="sm" onClick={openAdd}>
              <UserPlus size={14} className="mr-1" /> Novo
            </Button>
          </div>
        </div>

        {/* Tabela */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-center">Núcleo</TableHead>
                <TableHead className="text-center">Facilitador</TableHead>
                <TableHead className="text-center">Liderança</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {population.length === 0 ? "Nenhum colaborador cadastrado." : "Nenhum colaborador corresponde ao filtro."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(m => (
                <TableRow key={m.id} className={!m.active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.email || "—"}</TableCell>
                  <TableCell className="text-sm">{m.role || "—"}</TableCell>
                  <TableCell className="text-sm">{m.sector || "—"}</TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleField(m, "nucleo")}>
                      <ShieldCheck size={16} className={m.nucleo ? "text-primary" : "text-muted-foreground/30"} />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleField(m, "facilitator")}>
                      <Star size={16} className={m.facilitator ? "text-amber-500" : "text-muted-foreground/30"} />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleField(m, "leadership")}>
                      <Crown size={16} className={m.leadership ? "text-purple-500" : "text-muted-foreground/30"} />
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={m.active} onCheckedChange={() => toggleActive(m)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Dialog add/edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" />
              </div>
              {renderOrgInput("Cargo", "role", allRoles)}
              {renderOrgInput("Setor", "sector", allSectors)}
              {renderOrgInput("Unidade", "unit", allUnits)}
              {renderOrgInput("Turno", "shift", allShifts)}
              <div className="space-y-1">
                <Label>Data de Admissão</Label>
                <Input type="date" value={form.admissionDate} onChange={e => setForm(p => ({ ...p, admissionDate: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(["nucleo", "facilitator", "leadership"] as const).map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <Switch checked={form[field]} onCheckedChange={v => setForm(p => ({ ...p, [field]: v }))} />
                    <Label className="cursor-pointer capitalize">
                      {field === "nucleo" ? "Núcleo" : field === "facilitator" ? "Facilitador" : "Liderança"}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
