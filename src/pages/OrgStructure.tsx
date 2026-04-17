import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2, Plus, Pencil, Archive, ArchiveRestore,
  Layers, Clock, Briefcase, Users, ChevronDown, ChevronRight, Info, Loader2,
} from "lucide-react";
import {
  fetchOrgStructure, upsertOrgItem, deleteOrgItem, fetchPopulation,
  type OrgStructure, type OrgItem,
} from "@/lib/db";

type OrgCategory = "units" | "sectors" | "shifts" | "positions";

const categoryConfig: Record<OrgCategory, { label: string; singular: string; icon: any; description: string; populationField: keyof import("@/lib/db").PopulationMember }> = {
  units:     { label: "Unidades",  singular: "Unidade",  icon: Building2, description: "Unidades operacionais da empresa",  populationField: "unit" },
  sectors:   { label: "Setores",   singular: "Setor",    icon: Layers,    description: "Setores e departamentos",           populationField: "sector" },
  shifts:    { label: "Turnos",    singular: "Turno",    icon: Clock,     description: "Turnos de trabalho",                populationField: "shift" },
  positions: { label: "Cargos",    singular: "Cargo",    icon: Briefcase, description: "Cargos e funções da empresa",       populationField: "role" },
};

export default function OrgStructure() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [structure, setStructure] = useState<OrgStructure>({ units: [], sectors: [], shifts: [], positions: [] });
  const [populationCounts, setPopulationCounts] = useState<Record<string, Record<string, number>>>({});
  const [openSections, setOpenSections] = useState<Record<OrgCategory, boolean>>({ units: true, sectors: true, shifts: false, positions: false });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OrgCategory>("sectors");
  const [editingItem, setEditingItem] = useState<OrgItem | null>(null);
  const [itemName, setItemName] = useState("");

  const loadData = async () => {
    if (!companyId) {
      console.warn("[OrgStructure] companyId vazio, abortando load");
      return;
    }
    console.log("[OrgStructure] Carregando para companyId:", companyId);
    setLoading(true);
    const [org, pop] = await Promise.all([
      fetchOrgStructure(companyId),
      fetchPopulation(companyId),
    ]);
    setStructure(org);

    // Conta colaboradores por campo de org
    const counts: Record<string, Record<string, number>> = { units: {}, sectors: {}, shifts: {}, positions: {} };
    for (const m of pop.filter(p => p.active)) {
      if (m.unit)   counts.units[m.unit]         = (counts.units[m.unit] || 0) + 1;
      if (m.sector) counts.sectors[m.sector]     = (counts.sectors[m.sector] || 0) + 1;
      if (m.shift)  counts.shifts[m.shift]       = (counts.shifts[m.shift] || 0) + 1;
      if (m.role)   counts.positions[m.role]     = (counts.positions[m.role] || 0) + 1;
    }
    setPopulationCounts(counts);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [companyId]);

  const openAdd = (cat: OrgCategory) => {
    setEditingCategory(cat);
    setEditingItem(null);
    setItemName("");
    setDialogOpen(true);
  };

  const openEdit = (cat: OrgCategory, item: OrgItem) => {
    setEditingCategory(cat);
    setEditingItem(item);
    setItemName(item.name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!itemName.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" }); return;
    }
    setSaving(true);
    const list = structure[editingCategory];
    const result = await upsertOrgItem(companyId, editingCategory, {
      id: editingItem?.id,
      name: itemName.trim(),
      archived: editingItem?.archived ?? false,
      order: editingItem?.order ?? list.length,
    });
    setSaving(false);
    if (!result) {
      toast({ title: "Erro ao salvar", variant: "destructive" }); return;
    }
    toast({ title: editingItem ? "Atualizado!" : "Adicionado!" });
    setDialogOpen(false);
    await loadData();
  };

  const toggleArchive = async (cat: OrgCategory, item: OrgItem) => {
    await upsertOrgItem(companyId, cat, { ...item, archived: !item.archived });
    toast({ title: item.archived ? "Restaurado" : "Arquivado" });
    await loadData();
  };

  const toggleSection = (cat: OrgCategory) => setOpenSections(p => ({ ...p, [cat]: !p[cat] }));

  if (loading) {
    return (
      <AppLayout title="Estrutura da Empresa" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  const totalColaboradores = Object.values(populationCounts.sectors ?? {}).reduce((a, b) => a + b, 0);

  return (
    <AppLayout title="Estrutura da Empresa" subtitle={`Visão consolidada — ${user?.companyName || "Empresa"}`}>
      <div className="space-y-6 animate-fade-in">

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Estrutura organizacional da empresa</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cadastre unidades, setores, turnos e cargos. Os valores também são criados automaticamente
                ao cadastrar colaboradores na Base Populacional.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(categoryConfig) as OrgCategory[]).map(cat => {
            const cfg = categoryConfig[cat];
            const active = structure[cat].filter(i => !i.archived).length;
            return (
              <Card key={cat} className="p-4">
                <div className="flex items-center gap-2">
                  <cfg.icon size={14} className="text-primary" />
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">{active}</p>
              </Card>
            );
          })}
        </div>

        {(Object.keys(categoryConfig) as OrgCategory[]).map(cat => {
          const cfg = categoryConfig[cat];
          const items = structure[cat];
          const active = items.filter(i => !i.archived);
          const archived = items.filter(i => i.archived);
          return (
            <Card key={cat}>
              <Collapsible open={openSections[cat]} onOpenChange={() => toggleSection(cat)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <cfg.icon size={16} className="text-primary" />
                      <span className="font-semibold text-foreground">{cfg.label}</span>
                      <Badge variant="secondary">{active.length} ativo{active.length !== 1 ? "s" : ""}</Badge>
                      {archived.length > 0 && <Badge variant="outline" className="text-muted-foreground">{archived.length} arquivado{archived.length !== 1 ? "s" : ""}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); openAdd(cat); }}>
                        <Plus size={14} className="mr-1" /> Adicionar {cfg.singular}
                      </Button>
                      {openSections[cat] ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum(a) {cfg.singular.toLowerCase()} cadastrado(a).</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-center">Colaboradores</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(item => {
                            const count = (populationCounts[cat] ?? {})[item.name] ?? 0;
                            return (
                              <TableRow key={item.id} className={item.archived ? "opacity-50" : ""}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                    <Users size={12} />
                                    <span>{count}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={item.archived ? "outline" : "secondary"}>
                                    {item.archived ? "Arquivado" : "Ativo"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 justify-end">
                                    {!item.archived && (
                                      <Button variant="ghost" size="sm" onClick={() => openEdit(cat, item)}>
                                        <Pencil size={14} />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => toggleArchive(cat, item)}>
                                      {item.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? `Editar ${categoryConfig[editingCategory].singular}` : `Novo(a) ${categoryConfig[editingCategory].singular}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Nome *</Label>
              <Input
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder={`Nome do(a) ${categoryConfig[editingCategory].singular.toLowerCase()}`}
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                {editingItem ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}
