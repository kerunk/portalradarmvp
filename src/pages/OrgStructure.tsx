import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Layers,
  Clock,
  Briefcase,
  Users,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  type OrgStructure,
  getOrgStructure,
  setOrgStructure,
  getPopulation,
} from "@/lib/companyStorage";

type OrgCategory = "units" | "sectors" | "shifts" | "positions";

interface OrgItem {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

const categoryConfig: Record<OrgCategory, { label: string; singular: string; icon: any; description: string; populationField: string }> = {
  units: { label: "Unidades", singular: "Unidade", icon: Building2, description: "Unidades operacionais da empresa", populationField: "unit" },
  sectors: { label: "Setores", singular: "Setor", icon: Layers, description: "Setores e departamentos", populationField: "sector" },
  shifts: { label: "Turnos", singular: "Turno", icon: Clock, description: "Turnos de trabalho", populationField: "shift" },
  positions: { label: "Cargos", singular: "Cargo", icon: Briefcase, description: "Cargos e funções", populationField: "role" },
};

export default function OrgStructurePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId || "";

  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OrgCategory>("units");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [openSections, setOpenSections] = useState<Record<OrgCategory, boolean>>({
    units: true, sectors: true, shifts: false, positions: false,
  });

  const orgStructure = useMemo(() => getOrgStructure(companyId), [companyId, refreshKey]);
  const population = useMemo(() => getPopulation(companyId).filter(m => m.active), [companyId, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  // Build consolidated data: merge org structure items with population-derived values
  const getConsolidatedItems = (cat: OrgCategory) => {
    const config = categoryConfig[cat];
    const field = config.populationField as keyof typeof population[0];
    const orgItems = orgStructure[cat] || [];

    // Collect unique values from population
    const populationValues = new Set<string>();
    population.forEach(m => {
      const val = m[field];
      if (typeof val === "string" && val.trim()) populationValues.add(val.trim());
    });

    // Count collaborators per value
    const countMap: Record<string, number> = {};
    population.forEach(m => {
      const val = m[field];
      if (typeof val === "string" && val.trim()) {
        countMap[val.trim()] = (countMap[val.trim()] || 0) + 1;
      }
    });

    // Merge: keep all org items + add any population values not yet in org
    const existingNames = new Set(orgItems.map(i => i.name.toLowerCase()));
    const autoItems: OrgItem[] = [];
    populationValues.forEach(val => {
      if (!existingNames.has(val.toLowerCase())) {
        autoItems.push({
          id: `auto-${cat}-${val}`,
          name: val,
          archived: false,
          order: orgItems.length + autoItems.length,
        });
      }
    });

    const allItems = [...orgItems, ...autoItems];
    return allItems
      .filter(i => !i.archived)
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        ...item,
        count: countMap[item.name] || 0,
        isAuto: item.id.startsWith("auto-"),
      }));
  };

  const openAdd = (cat: OrgCategory) => {
    setFormName("");
    setEditingId(null);
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const openEdit = (cat: OrgCategory, item: OrgItem) => {
    setFormName(item.name);
    setEditingId(item.id);
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    const structure = getOrgStructure(companyId);
    const list = [...(structure[editingCategory] || [])];

    const duplicate = list.find(
      i => i.name.toLowerCase() === formName.trim().toLowerCase() && i.id !== editingId
    );
    if (duplicate) {
      toast({ title: "Nome duplicado", description: "Já existe um item com este nome.", variant: "destructive" });
      return;
    }

    if (editingId) {
      const idx = list.findIndex(i => i.id === editingId);
      if (idx >= 0) list[idx] = { ...list[idx], name: formName.trim() };
      toast({ title: "Atualizado!" });
    } else {
      list.push({
        id: `org-${editingCategory}-${Date.now()}`,
        name: formName.trim(),
        archived: false,
        order: list.length,
      });
      toast({ title: "Adicionado!" });
    }

    structure[editingCategory] = list;
    setOrgStructure(companyId, structure);
    setDialogOpen(false);
    refresh();
  };

  const toggleArchive = (cat: OrgCategory, item: OrgItem) => {
    const structure = getOrgStructure(companyId);
    const list = structure[cat].map(i =>
      i.id === item.id ? { ...i, archived: !i.archived } : i
    );
    structure[cat] = list;
    setOrgStructure(companyId, structure);
    toast({ title: item.archived ? "Restaurado" : "Arquivado" });
    refresh();
  };

  const toggleSection = (cat: OrgCategory) => {
    setOpenSections(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Global stats
  const totalColaboradores = population.length;

  return (
    <AppLayout title="Estrutura da Empresa" subtitle={`Visão consolidada — ${user?.companyName || "Empresa"}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Explanation banner */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Visão consolidada da sua estrutura organizacional</p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta área reúne automaticamente as unidades, setores, turnos e cargos identificados na sua base de colaboradores.
                Você também pode adicionar ou editar itens manualmente. Os dados são atualizados conforme novos colaboradores são cadastrados.
              </p>
            </div>
          </div>
        </Card>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground">Colaboradores Ativos</p>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{totalColaboradores}</p>
          </Card>
          {(Object.keys(categoryConfig) as OrgCategory[]).map(cat => {
            const items = getConsolidatedItems(cat);
            const Icon = categoryConfig[cat].icon;
            return (
              <Card key={cat} className="p-4">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-primary" />
                  <p className="text-xs text-muted-foreground">{categoryConfig[cat].label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">{items.length}</p>
              </Card>
            );
          })}
        </div>

        {/* Collapsible sections for each category */}
        <div className="space-y-3">
          {(Object.keys(categoryConfig) as OrgCategory[]).map(cat => {
            const config = categoryConfig[cat];
            const items = getConsolidatedItems(cat);
            const Icon = config.icon;
            const isOpen = openSections[cat];
            const archivedCount = (orgStructure[cat] || []).filter(i => i.archived).length;

            return (
              <Card key={cat} className="overflow-hidden">
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(cat)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon size={18} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{config.label}</h3>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {items.length} {items.length === 1 ? "item" : "itens"}
                        </Badge>
                        {archivedCount > 0 && (
                          <Badge variant="outline" className="text-muted-foreground">
                            {archivedCount} arquivados
                          </Badge>
                        )}
                        {isOpen ? <ChevronDown size={18} className="text-muted-foreground" /> : <ChevronRight size={18} className="text-muted-foreground" />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-center w-32">Colaboradores</TableHead>
                            <TableHead className="text-center w-28">Origem</TableHead>
                            <TableHead className="text-right w-24">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                Nenhum item encontrado. Cadastre colaboradores ou adicione manualmente.
                              </TableCell>
                            </TableRow>
                          )}
                          {items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="text-center">
                                {item.count > 0 ? (
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    {item.count}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={item.isAuto
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs"
                                  : "text-muted-foreground text-xs"
                                }>
                                  {item.isAuto ? "Automático" : "Manual"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {!item.isAuto && (
                                    <>
                                      <Button variant="ghost" size="sm" onClick={() => openEdit(cat, item)}>
                                        <Pencil size={14} />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => toggleArchive(cat, item)}>
                                        <Archive size={14} />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="p-3 border-t border-border flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {items.length} ativos{archivedCount > 0 && ` · ${archivedCount} arquivados`}
                        </p>
                        <Button size="sm" variant="outline" onClick={() => openAdd(cat)}>
                          <Plus size={14} className="mr-1" /> Adicionar {config.singular}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Adicionar"} {categoryConfig[editingCategory].singular}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={`Nome do(a) ${categoryConfig[editingCategory].singular.toLowerCase()}`}
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
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
