import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookMarked, Plus, Pencil, Trash2, Save, Eye, GripVertical, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MANUAL_KEY = "mvp_manual_global";

interface ManualSection {
  id: string;
  title: string;
  content: string;
  order: number;
  updatedAt: string;
}

interface ManualState {
  sections: ManualSection[];
  version: number;
  publishedAt: string | null;
}

function loadManual(): ManualState {
  try {
    const stored = localStorage.getItem(MANUAL_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}

  // Default sections matching HelpCenter content
  const defaults: ManualState = {
    sections: [
      { id: "intro", title: "O que é o Programa MVP?", content: "O Programa MVP (Mudança, Validação e Perpetuação) é uma metodologia estruturada para transformação cultural nas organizações. O programa é dividido em três fases — Monitorar, Validar e Perpetuar — cada uma com ciclos específicos de atividades que promovem a evolução comportamental e cultural dos colaboradores.\n\nA plataforma MVP é o sistema digital que apoia toda a execução do programa. Através dela você cadastra a estrutura da empresa, registra atividades, acompanha turmas de treinamento e monitora indicadores estratégicos em tempo real.", order: 0, updatedAt: new Date().toISOString() },
      { id: "portal", title: "Como usar o Portal", content: "O portal MVP é sua central de gestão do programa. Use o menu lateral para navegar entre as seções:\n\n• Dashboard — Visão geral com indicadores\n• Estrutura Organizacional — Cadastro de setores\n• Base Populacional — Cadastro de colaboradores\n• Governança do Núcleo — Gestão de lideranças\n• Ciclos MVP — Acompanhamento dos 9 ciclos\n• Turmas — Criação e gestão de turmas\n• Ações & Alertas — Monitoramento de prazos\n• Relatórios — Exportação de análises\n• Manual MVP — Página de ajuda", order: 1, updatedAt: new Date().toISOString() },
      { id: "indicadores", title: "Indicadores do Dashboard", content: "Os indicadores do Dashboard são calculados automaticamente a partir dos dados registrados no sistema.\n\nÍndice de Cultura MVP: Índice global de 0 a 100 que mede a maturidade cultural.\nCobertura do Programa: Percentual de colaboradores treinados.\nÍndice de Maturidade: Avalia o grau de implementação do programa.\nTaxa Decisão → Ação: Percentual de decisões convertidas em ações.", order: 2, updatedAt: new Date().toISOString() },
      { id: "fluxo", title: "Fluxo do Programa", content: "O fluxo operacional segue a sequência:\n\n1. Estrutura Organizacional\n2. Base Populacional\n3. Núcleo de Sustentação\n4. Turmas\n5. Ciclos MVP\n6. Ações & Alertas\n7. Indicadores\n8. Dashboard", order: 3, updatedAt: new Date().toISOString() },
      { id: "melhoria", title: "Como melhorar os indicadores", content: "Para aumentar a Cobertura: criar novas turmas, ampliar base treinada.\n\nPara melhorar a Taxa Decisão → Ação: transformar decisões em ações registradas, acompanhar prazos.\n\nPara aumentar Maturidade: encerrar ciclos, concluir ações dentro do prazo.\n\nPara melhorar o Índice de Cultura: combinar todas as ações acima de forma consistente.", order: 4, updatedAt: new Date().toISOString() },
    ],
    version: 1,
    publishedAt: null,
  };
  localStorage.setItem(MANUAL_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveManual(manual: ManualState) {
  localStorage.setItem(MANUAL_KEY, JSON.stringify(manual));
}

export default function ManualEditor() {
  const [manual, setManual] = useState<ManualState>(loadManual);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ManualSection | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");

  const sortedSections = [...manual.sections].sort((a, b) => a.order - b.order);

  const openCreate = () => {
    setEditingSection(null);
    setFormTitle("");
    setFormContent("");
    setDialogOpen(true);
  };

  const openEdit = (section: ManualSection) => {
    setEditingSection(section);
    setFormTitle(section.title);
    setFormContent(section.content);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast({ title: "Insira um título para a seção", variant: "destructive" });
      return;
    }

    let updated: ManualState;
    if (editingSection) {
      updated = {
        ...manual,
        sections: manual.sections.map((s) =>
          s.id === editingSection.id
            ? { ...s, title: formTitle, content: formContent, updatedAt: new Date().toISOString() }
            : s
        ),
      };
    } else {
      const newSection: ManualSection = {
        id: `section-${Date.now()}`,
        title: formTitle,
        content: formContent,
        order: manual.sections.length,
        updatedAt: new Date().toISOString(),
      };
      updated = { ...manual, sections: [...manual.sections, newSection] };
    }
    setManual(updated);
    saveManual(updated);
    setDialogOpen(false);
    toast({ title: editingSection ? "Seção atualizada" : "Seção criada" });
  };

  const handleDelete = (sectionId: string) => {
    const updated = {
      ...manual,
      sections: manual.sections.filter((s) => s.id !== sectionId),
    };
    setManual(updated);
    saveManual(updated);
    toast({ title: "Seção removida" });
  };

  const handlePublish = () => {
    const updated = {
      ...manual,
      version: manual.version + 1,
      publishedAt: new Date().toISOString(),
    };
    setManual(updated);
    saveManual(updated);
    toast({ title: `Manual v${updated.version} publicado com sucesso!`, description: "As alterações estão disponíveis nos portais clientes." });
  };

  return (
    <AppLayout title="Manual Global MVP" subtitle="Editor de conteúdo do manual — alterações refletem nos portais clientes">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Versão {manual.version}
            </Badge>
            {manual.publishedAt && (
              <span className="text-xs text-muted-foreground">
                Publicado em {new Date(manual.publishedAt).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1" /> Nova Seção
            </Button>
            <Button size="sm" onClick={handlePublish}>
              <Save size={14} className="mr-1" /> Publicar Versão {manual.version + 1}
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <BookMarked size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Editor do Manual MVP</p>
              <p className="text-xs text-muted-foreground mt-1">
                Edite os textos, atualize explicações dos indicadores, adicione novas seções e publique novas versões.
                Todas as alterações refletem automaticamente nos portais clientes ao publicar.
              </p>
            </div>
          </div>
        </Card>

        {/* Sections */}
        <div className="space-y-3">
          {sortedSections.map((section, index) => (
            <Card key={section.id} className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Atualizado em {new Date(section.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(section)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(section.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed line-clamp-4">
                  {section.content}
                </p>
              </div>
            </Card>
          ))}

          {sortedSections.length === 0 && (
            <Card className="p-8 text-center">
              <FileText size={32} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma seção criada ainda</p>
            </Card>
          )}
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSection ? "Editar Seção" : "Nova Seção do Manual"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Título da seção</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Como usar os indicadores" />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escreva o conteúdo da seção..."
                  className="min-h-[250px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use quebras de linha para parágrafos e "•" para listas.
                </p>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingSection ? "Salvar Alterações" : "Criar Seção"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
