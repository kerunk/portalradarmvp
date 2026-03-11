import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building2,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  GripVertical,
  Layers,
  Clock,
  Briefcase,
} from "lucide-react";
import {
  type OrgStructure,
  getOrgStructure,
  setOrgStructure,
} from "@/lib/companyStorage";

type OrgCategory = "units" | "sectors" | "shifts" | "positions";

interface OrgItem {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

const categoryConfig: Record<OrgCategory, { label: string; icon: any; description: string }> = {
  units: { label: "Unidades", icon: Building2, description: "Unidades operacionais da empresa" },
  sectors: { label: "Setores", icon: Layers, description: "Setores e departamentos" },
  shifts: { label: "Turnos", icon: Clock, description: "Turnos de trabalho" },
  positions: { label: "Cargos", icon: Briefcase, description: "Cargos e funções" },
};

export default function OrgStructurePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId || "";

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<OrgCategory>("units");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const orgStructure = useMemo(() => getOrgStructure(companyId), [companyId, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const items = useMemo(() => {
    const list = orgStructure[activeTab] || [];
    return list
      .filter(item => showArchived || !item.archived)
      .sort((a, b) => a.order - b.order);
  }, [orgStructure, activeTab, showArchived, refreshKey]);

  const openAdd = () => {
    setFormName("");
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (item: OrgItem) => {
    setFormName(item.name);
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    const structure = getOrgStructure(companyId);
    const list = [...(structure[activeTab] || [])];

    // Check duplicates
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
        id: `org-${activeTab}-${Date.now()}`,
        name: formName.trim(),
        archived: false,
        order: list.length,
      });
      toast({ title: "Adicionado!" });
    }

    structure[activeTab] = list;
    setOrgStructure(companyId, structure);
    setDialogOpen(false);
    refresh();
  };

  const toggleArchive = (item: OrgItem) => {
    const structure = getOrgStructure(companyId);
    const list = structure[activeTab].map(i =>
      i.id === item.id ? { ...i, archived: !i.archived } : i
    );
    structure[activeTab] = list;
    setOrgStructure(companyId, structure);
    toast({ title: item.archived ? "Restaurado" : "Arquivado" });
    refresh();
  };

  const config = categoryConfig[activeTab];
  const totalActive = (orgStructure[activeTab] || []).filter(i => !i.archived).length;
  const totalArchived = (orgStructure[activeTab] || []).filter(i => i.archived).length;

  return (
    <AppLayout title="Estrutura Organizacional" subtitle={`Configuração da estrutura — ${user?.companyName || "Empresa"}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(categoryConfig) as OrgCategory[]).map(cat => {
            const count = (orgStructure[cat] || []).filter(i => !i.archived).length;
            const Icon = categoryConfig[cat].icon;
            return (
              <Card key={cat} className="p-4">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-primary" />
                  <p className="text-xs text-muted-foreground">{categoryConfig[cat].label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
              </Card>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as OrgCategory)}>
          <TabsList className="grid grid-cols-4 w-full">
            {(Object.keys(categoryConfig) as OrgCategory[]).map(cat => (
              <TabsTrigger key={cat} value={cat}>{categoryConfig[cat].label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{config.label}</h3>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                <div className="flex gap-2">
                  {totalArchived > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>
                      <Archive size={14} className="mr-1" />
                      {showArchived ? "Ocultar arquivados" : `${totalArchived} arquivados`}
                    </Button>
                  )}
                  <Button size="sm" onClick={openAdd}>
                    <Plus size={14} className="mr-1" /> Adicionar
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum item cadastrado. Clique em "Adicionar" para começar.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item, idx) => (
                    <TableRow key={item.id} className={item.archived ? "opacity-50" : ""}>
                      <TableCell className="text-muted-foreground">
                        <GripVertical size={14} className="inline mr-1" />
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        {item.archived ? (
                          <Badge variant="outline" className="text-muted-foreground">Arquivado</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleArchive(item)}>
                            {item.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {totalActive} ativos{totalArchived > 0 && ` · ${totalArchived} arquivados`}
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Adicionar"} {config.label.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={`Nome do(a) ${config.label.slice(0, -1).toLowerCase()}`}
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
