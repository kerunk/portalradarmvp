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
      { id: "intro", title: "Introdução à Plataforma MVP", content: "O Programa MVP (Mudança, Validação e Perpetuação) é uma metodologia estruturada para transformação cultural nas organizações. A plataforma é dividida em três fases — Monitorar, Validar e Perpetuar — com 9 ciclos sequenciais.\n\nA plataforma MVP é o sistema digital que apoia toda a execução do programa. Através dela você cadastra a estrutura da empresa, registra atividades, acompanha turmas de treinamento, gerencia fatores de sucesso e monitora indicadores estratégicos em tempo real.\n\nTodos os dados registrados — presenças, ações concluídas, encerramento de ciclos — alimentam automaticamente os indicadores do Dashboard.\n\nBoas práticas: Mantenha os dados sempre atualizados para indicadores precisos.", order: 0, updatedAt: new Date().toISOString() },
      { id: "primeiro-acesso", title: "Primeiro Acesso e Segurança", content: "No primeiro acesso ao portal, o fluxo obrigatório é:\n\n1. Login com senha temporária\n2. Troca de senha obrigatória (não pode ser ignorada)\n3. Wizard de onboarding: logo, estrutura organizacional, base de colaboradores, núcleo\n4. Portal operacional liberado após completar o onboarding\n\nSegurança:\n• 5 tentativas incorretas = bloqueio temporário progressivo\n• Usuários inativos não conseguem fazer login\n• Troca de senha disponível em Configurações a qualquer momento", order: 1, updatedAt: new Date().toISOString() },
      { id: "metodologia", title: "Estrutura da Metodologia MVP", content: "A metodologia é dividida em 3 fases com 9 ciclos:\n\nFase Monitorar (M1, M2, M3): Diagnóstico inicial e primeiras ações.\nFase Validar (V1, V2, V3): Consolidação das práticas.\nFase Perpetuar (P1, P2, P3): Sustentabilidade da cultura.\n\nPúblico-alvo:\n• M1, M2, V1, V2, P1, P2 → Todos os colaboradores\n• M3, V3, P3 → Exclusivo para liderança\n\nOs ciclos são sequenciais. Cada ciclo possui Fatores de Sucesso com ações pré-definidas.\n\nBoas práticas: Não pule etapas. Avance somente após encerrar o ciclo anterior.", order: 2, updatedAt: new Date().toISOString() },
      { id: "portal-empresa", title: "Portal da Empresa (Cliente)", content: "Menu lateral do cliente:\n\n• Dashboard — Indicadores e guia de primeiros passos\n• Estrutura Organizacional — Setores e unidades\n• Base Populacional — Colaboradores (cadastro individual, importação Excel/CSV, exportação, inativação)\n• Governança do Núcleo — Lideranças e facilitadores\n• Ciclos MVP — 9 ciclos com fatores de sucesso e progresso\n• Turmas — Criação, presenças e finalização\n• Ações & Alertas — Monitoramento de ações e prazos\n• Relatórios — PDF executivo, por colaborador, por setor\n• Configurações — Responsáveis e troca de senha\n• Manual MVP — Ajuda completa\n\nAlertás são isolados por empresa — o cliente nunca vê alertas de outras empresas.", order: 3, updatedAt: new Date().toISOString() },
      { id: "portal-admin", title: "Portal Administrativo", content: "Perfis administrativos:\n\n• Administrador MVP Master: Controle total, gestão de administradores, edição de configurações globais\n• Administrador MVP: Equipe interna, acesso à carteira completa, sem edição de configurações\n• Gerente de Conta: Acesso restrito às empresas que criou\n\nMenu do Admin Master:\n• Controle: Dashboard, Empresas, Usuários, Notificações\n• Inteligência: Indicadores, Relatórios\n• Administração: Fatores de Sucesso, Prateleira de Práticas, Manual Global, Config. Indicadores, Ajuda, Configurações\n\nO menu se adapta automaticamente ao perfil do administrador.", order: 4, updatedAt: new Date().toISOString() },
      { id: "gestao-empresas", title: "Gestão de Empresas", content: "Criar empresa: Nome, Nº colaboradores, Nome e Email do administrador.\n• Senha temporária gerada automaticamente\n• PDF de boas-vindas exportável\n• Cliente troca senha no primeiro acesso\n• Onboarding automático\n\nEditar empresa: Dados cadastrais (nome, setor, contato).\n\nInativar empresa: Bloqueia login, preserva histórico, pode ser reativada.\nA empresa sai dos dashboards de ativas e é contada separadamente.\n\nExcluir empresa: Exclusão lógica irreversível (apenas Admin Master).\n\nModo Espelho: Clique no nome da empresa para ver o portal em modo somente leitura (banner amarelo).\n\nTransferência: Ao excluir gerente com carteira, transferência em lote é obrigatória.", order: 5, updatedAt: new Date().toISOString() },
      { id: "gestao-usuarios", title: "Gestão de Usuários", content: "Perfis administrativos:\n\n• Administrador MVP Master: Controle total, gestão de administradores\n• Administrador MVP: Equipe interna, carteira completa\n• Gerente de Conta: Apenas suas empresas\n\nCriar: Nome, Email, Perfil → senha temporária gerada → PDF exportável.\nEditar: Nome, email ou perfil a qualquer momento.\nInativar: Bloqueia login sem excluir. Pode reativar.\nExcluir: Definitivo (Admin Master). Se gerente com carteira, exige transferência.\n\nRegras: Não pode excluir a si mesmo. Deve existir pelo menos 1 Admin Master ativo.\nTodas as operações são registradas no log de auditoria.", order: 6, updatedAt: new Date().toISOString() },
      { id: "ciclos", title: "Ciclos MVP e Fatores de Sucesso", content: "Cada ciclo possui Fatores de Sucesso com ações pré-definidas.\n\nProgresso do ciclo (3 componentes):\n• Treinamento (peso 70%) — Colaboradores únicos treinados ÷ base ativa\n• Fatores de Sucesso (peso 20%) — Ações dos fatores concluídas\n• Ações do Ciclo (peso 10%) — Ações criadas pelo cliente\n\nCards clicáveis:\n• Treinamento → Turmas\n• Fatores → Fatores de sucesso do ciclo\n• Ações → Ações & Alertas\n\nFatores de Sucesso:\n• Cada ação exibe: imagem, título, texto explicativo, dica prática\n• Campos operacionais: responsável, data, observações, status, toggle ON/OFF\n• Contagem dinâmica recalculada automaticamente\n\nEncerramento: Critérios mínimos (≥80% ações, ≥1 turma finalizada). Irreversível.", order: 7, updatedAt: new Date().toISOString() },
      { id: "dashboards", title: "Dashboards", content: "Dashboard Administrativo:\n• Empresas Ativas/Inativas, Colaboradores, Maturidade, Cobertura\n• Turmas Realizadas, Ações Concluídas/Atrasadas, Ciclos em Andamento\n• Saúde: Saudável (🟢), Atenção (🟡), Risco (🔴)\n• Cards clicáveis com drill-down administrativo (nunca operacional)\n\nDashboard da Empresa:\n• Indicadores operacionais, Índice de Cultura, Cobertura, Maturidade\n• Guia de Primeiros Passos (5 etapas automáticas)\n• Jornada da implementação e checklist\n• Sugestões automáticas\n\nBoas práticas: Use o dashboard admin para visão macro e o modo espelho para análise individual.", order: 8, updatedAt: new Date().toISOString() },
      { id: "indicadores", title: "Indicadores da Implementação", content: "Calculados automaticamente:\n\nÍndice de Cultura MVP (0-100): Cobertura (25%) + Execução (25%) + Participação (20%) + Evolução (20%) + Presença (10%)\n\nCobertura: Pessoas únicas treinadas ÷ base ativa × 100\n\nMaturidade (0-100): Base (15pts) + Núcleo (10pts) + Facilitadores (5pts) + Ciclos (30pts) + Ações (25pts) + Cobertura (15pts)\n\nFaixas: Inicial (0-25) · Estruturando (26-50) · Evoluindo (51-75) · Consolidado (76-100)\n\nTaxa Decisão→Ação: Decisões convertidas em ações ÷ total de decisões × 100\n\nConfig. Indicadores (Admin Master): Ajuste pesos e faixas de maturidade.", order: 9, updatedAt: new Date().toISOString() },
      { id: "alertas", title: "Alertas e RBAC", content: "Alertas automáticos:\n• Ações atrasadas\n• Implementação parada (30+ dias)\n• Ciclo pronto para encerramento\n• Cobertura abaixo de 30%\n\nIsolamento por perfil (RBAC):\n• Admin Master/MVP: todos os alertas globais\n• Gerente de Conta: apenas alertas de gestão da sua carteira\n• Cliente: apenas alertas da própria empresa (sem vazamento)\n\nRadar de Implementação:\n• 🟢 Saudável: indicadores dentro do esperado\n• 🟡 Atenção: 1+ ação atrasada, cobertura < 15% ou maturidade < 20%\n• 🔴 Risco: 3+ ações atrasadas ou cobertura < 5%", order: 10, updatedAt: new Date().toISOString() },
      { id: "relatorios", title: "Relatórios", content: "Relatórios Admin:\n• Relatório da Carteira: todas as empresas ativas, distribuição de maturidade, ranking\n• Relatório por Empresa: indicadores individuais, progresso, atenção\n• PDF de Encerramento de Ciclo\n\nRelatórios Cliente:\n• Relatório Executivo: todos os indicadores da empresa\n• Progresso por Colaborador: busca por nome\n• Maturidade por Setor: comparativo\n\nFonte de dados: Apenas empresas reais ativas (sem mock/seed/residuais).\nDados filtrados por perfil (gerente vê só sua carteira).\n\nBoas práticas: Gere relatórios mensais para governança.", order: 11, updatedAt: new Date().toISOString() },
      { id: "permissoes", title: "Permissões e Controle de Acesso", content: "Admin Master: Tudo (empresas, usuários, configurações globais, modo espelho).\n\nAdmin MVP: Criar empresas, ver carteira completa, indicadores, relatórios, modo espelho. NÃO pode: gerenciar usuários, editar configurações globais.\n\nGerente de Conta: Criar empresas (ficam na sua carteira), ver apenas sua carteira, indicadores/relatórios da carteira. NÃO pode: ver empresas de outros, editar configurações, gerenciar usuários.\n\nCliente: Acesso completo ao portal da sua empresa. Sem acesso administrativo.\n\nRotas protegidas: Acesso sem permissão redireciona automaticamente.\nLog de auditoria: Todas as operações críticas são registradas.", order: 12, updatedAt: new Date().toISOString() },
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
