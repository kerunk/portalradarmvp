// ─── ExperiencesMVP.tsx ──────────────────────────────────────────────────────
// Migrado de localStorage (companyStorage.ts) para Supabase (tabela experiences)

import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Plus, Pencil, Trash2, Search, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Experience {
  id: string;
  companyId: string;
  date: string;
  context: string;
  humanFactors: string;
  deviations: string;
  actionTaken: string;
  learning: string;
  createdAt: string;
  updatedAt: string;
}

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

// ── Funções Supabase ──────────────────────────────────────────────────────────
async function fetchExperiences(companyId: string): Promise<Experience[]> {
  const { data, error } = await sb
    .from("experiences")
    .select("*")
    .eq("company_id", companyId)
    .order("date", { ascending: false });
  if (error) {
    console.error("[db] fetchExperiences", error);
    return [];
  }
  return (data ?? []).map(
    (r: any): Experience => ({
      id: r.id,
      companyId: r.company_id,
      date: r.date,
      context: r.context ?? "",
      humanFactors: r.human_factors ?? "",
      deviations: r.deviations ?? "",
      actionTaken: r.action_taken ?? "",
      learning: r.learning ?? "",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }),
  );
}

async function upsertExperience(companyId: string, form: ExperienceForm, id?: string): Promise<boolean> {
  const row: any = {
    company_id: companyId,
    date: form.date,
    context: form.context,
    human_factors: form.humanFactors,
    deviations: form.deviations,
    action_taken: form.actionTaken,
    learning: form.learning,
    updated_at: new Date().toISOString(),
  };
  if (id) row.id = id;

  const { error } = await sb.from("experiences").upsert(row, { onConflict: "id" });
  if (error) {
    console.error("[db] upsertExperience", error);
    return false;
  }
  return true;
}

async function deleteExperience(id: string): Promise<boolean> {
  const { error } = await sb.from("experiences").delete().eq("id", id);
  if (error) {
    console.error("[db] deleteExperience", error);
    return false;
  }
  return true;
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function ExperiencesMVPPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const companyId = user?.companyId || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExperienceForm>(emptyForm);

  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    setExperiences(await fetchExperiences(companyId));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const filtered = useMemo(() => {
    if (!search) return experiences;
    const q = search.toLowerCase();
    return experiences.filter(
      (e) =>
        e.context.toLowerCase().includes(q) ||
        e.humanFactors.toLowerCase().includes(q) ||
        e.learning.toLowerCase().includes(q),
    );
  }, [experiences, search]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };
  const openEdit = (exp: Experience) => {
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

  const handleSave = async () => {
    if (!form.context.trim()) {
      toast({ title: "Contexto é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const ok = await upsertExperience(companyId, form, editingId ?? undefined);
    setSaving(false);
    if (ok) {
      toast({ title: editingId ? "Experiência atualizada!" : "Experiência registrada!" });
      setDialogOpen(false);
      await loadData();
    } else {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir esta experiência?")) return;
    const ok = await deleteExperience(id);
    if (ok) {
      toast({ title: "Experiência excluída." });
      await loadData();
    } else toast({ title: "Erro ao excluir", variant: "destructive" });
  };

  const f = (k: keyof ExperienceForm) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) {
    return (
      <AppLayout title="Experiências MVP" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Experiências MVP"
      subtitle={`${experiences.length} experiência(s) registrada(s) — ${user?.companyName || "Empresa"}`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Toolbar */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              className="pl-9"
              placeholder="Buscar por contexto, fatores ou aprendizado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={openAdd}>
            <Plus size={14} className="mr-1" /> Nova Experiência
          </Button>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
            {experiences.length === 0
              ? "Nenhuma experiência registrada ainda."
              : "Nenhuma experiência corresponde à busca."}
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((exp) => (
              <Card key={exp.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(exp.date).toLocaleDateString("pt-BR")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Contexto
                      </p>
                      <p className="text-sm text-foreground">{exp.context}</p>
                    </div>
                    {exp.humanFactors && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Fatores Humanos
                        </p>
                        <p className="text-sm text-muted-foreground">{exp.humanFactors}</p>
                      </div>
                    )}
                    {exp.learning && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Aprendizado
                        </p>
                        <p className="text-sm text-muted-foreground">{exp.learning}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(exp)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Registrar"} Experiência MVP</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={f("date")} />
              </div>
              <div className="space-y-1">
                <Label>Contexto *</Label>
                <Textarea placeholder="Descreva o contexto..." value={form.context} onChange={f("context")} rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Fatores Humanos Envolvidos</Label>
                <Textarea
                  placeholder="Quais fatores humanos estavam presentes..."
                  value={form.humanFactors}
                  onChange={f("humanFactors")}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Desvios Observados</Label>
                <Textarea
                  placeholder="Quais desvios foram identificados..."
                  value={form.deviations}
                  onChange={f("deviations")}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Ação Tomada</Label>
                <Textarea
                  placeholder="O que foi feito..."
                  value={form.actionTaken}
                  onChange={f("actionTaken")}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Aprendizado</Label>
                <Textarea
                  placeholder="O que foi aprendido..."
                  value={form.learning}
                  onChange={f("learning")}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                {editingId ? "Salvar" : "Registrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
