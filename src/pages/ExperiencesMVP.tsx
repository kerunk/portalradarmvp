import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Calendar,
} from "lucide-react";
import {
  type ExperienceMVP,
  getExperiences,
  setExperiences,
} from "@/lib/companyStorage";

interface ExperienceForm {
  date: string;
  context: string;
  humanFactors: string;
  deviations: string;
  actionTaken: string;
  learning: string;
}

const emptyForm: ExperienceForm = {
  date: new Date().toISOString().split("T")[0],
  context: "",
  humanFactors: "",
  deviations: "",
  actionTaken: "",
  learning: "",
};

export default function ExperiencesMVPPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId || "";

  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExperienceForm>(emptyForm);

  const experiences = useMemo(() => getExperiences(companyId), [companyId, refreshKey]);
  const refresh = () => setRefreshKey(k => k + 1);

  const filtered = useMemo(() => {
    if (!search) return experiences;
    const q = search.toLowerCase();
    return experiences.filter(e =>
      e.context.toLowerCase().includes(q) ||
      e.humanFactors.toLowerCase().includes(q) ||
      e.learning.toLowerCase().includes(q)
    );
  }, [experiences, search]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (exp: ExperienceMVP) => {
    setForm({
      date: exp.date,
      context: exp.context,
      humanFactors: exp.humanFactors,
      deviations: exp.deviations,
      actionTaken: exp.actionTaken,
      learning: exp.learning,
    });
    setEditingId(exp.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.context.trim()) {
      toast({ title: "Contexto é obrigatório", variant: "destructive" });
      return;
    }

    const list = getExperiences(companyId);
    const now = new Date().toISOString();

    if (editingId) {
      const updated = list.map(e =>
        e.id === editingId ? { ...e, ...form, updatedAt: now } : e
      );
      setExperiences(companyId, updated);
      toast({ title: "Experiência atualizada!" });
    } else {
      const newExp: ExperienceMVP = {
        ...form,
        id: `exp-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setExperiences(companyId, [...list, newExp]);
      toast({ title: "Experiência registrada!" });
    }

    setDialogOpen(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    const list = getExperiences(companyId);
    setExperiences(companyId, list.filter(e => e.id !== id));
    toast({ title: "Experiência removida" });
    refresh();
  };

  return (
    <AppLayout title="Experiências MVP" subtitle={`Registro de experiências e aprendizados — ${user?.companyName || "Empresa"}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar experiências..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={openAdd}>
            <Plus size={16} className="mr-2" /> Nova Experiência
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total de Registros</p>
            <p className="text-2xl font-bold text-foreground">{experiences.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Este Mês</p>
            <p className="text-2xl font-bold text-foreground">
              {experiences.filter(e => {
                const d = new Date(e.date);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Resultados</p>
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          </Card>
        </div>

        {/* Experience Cards */}
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {experiences.length === 0
                ? "Nenhuma experiência registrada. Clique em 'Nova Experiência' para começar."
                : "Nenhuma experiência encontrada com os filtros aplicados."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.sort((a, b) => b.date.localeCompare(a.date)).map(exp => (
              <Card key={exp.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{exp.date}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(exp)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)} className="text-destructive hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">CONTEXTO</p>
                    <p className="text-sm text-foreground">{exp.context}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">FATORES HUMANOS</p>
                    <p className="text-sm text-foreground">{exp.humanFactors || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">DESVIOS OBSERVADOS</p>
                    <p className="text-sm text-foreground">{exp.deviations || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">AÇÃO TOMADA</p>
                    <p className="text-sm text-foreground">{exp.actionTaken || "—"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">APRENDIZADO</p>
                    <p className="text-sm text-foreground">{exp.learning || "—"}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Registrar"} Experiência MVP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Contexto *</Label>
              <Textarea placeholder="Descreva o contexto da experiência..." value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Fatores Humanos Envolvidos</Label>
              <Textarea placeholder="Quais fatores humanos estavam presentes..." value={form.humanFactors} onChange={e => setForm(f => ({ ...f, humanFactors: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Desvios Observados</Label>
              <Textarea placeholder="Quais desvios foram identificados..." value={form.deviations} onChange={e => setForm(f => ({ ...f, deviations: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Ação Tomada</Label>
              <Textarea placeholder="O que foi feito..." value={form.actionTaken} onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Aprendizado</Label>
              <Textarea placeholder="O que foi aprendido com esta experiência..." value={form.learning} onChange={e => setForm(f => ({ ...f, learning: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
