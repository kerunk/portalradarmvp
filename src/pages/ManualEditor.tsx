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
      { id: "intro", title: "Introdução à Plataforma MVP", content: "O Programa MVP (Mudança, Validação e Perpetuação) é uma metodologia estruturada para transformação cultural nas organizações.\n\nA plataforma MVP é o sistema digital que apoia toda a execução do programa. Através dela você cadastra a estrutura da empresa, registra atividades, acompanha turmas de treinamento e monitora indicadores estratégicos em tempo real.\n\nO que é: Sistema completo de gestão da implementação da metodologia MVP.\nComo utilizar: Acesse pelo navegador com suas credenciais. A plataforma se adapta ao seu perfil (administrador ou cliente).\nQuando utilizar: Diariamente para registros operacionais e semanalmente para análise de indicadores.\nBoas práticas: Mantenha os dados sempre atualizados para indicadores precisos.", order: 0, updatedAt: new Date().toISOString() },
      { id: "metodologia", title: "Estrutura da Metodologia MVP", content: "A metodologia é dividida em 3 fases com 9 ciclos:\n\nFase Monitorar (M1, M2, M3): Diagnóstico inicial e primeiras ações de transformação cultural.\nFase Validar (V1, V2, V3): Consolidação das práticas e validação dos resultados.\nFase Perpetuar (P1, P2, P3): Sustentabilidade da cultura e autonomia organizacional.\n\nComo utilizar: Siga a sequência dos ciclos. Cada ciclo possui ações pré-definidas que devem ser executadas e registradas.\nQuando utilizar: Avance para o próximo ciclo somente após encerrar o anterior.\nBoas práticas: Não pule etapas. A metodologia é sequencial e cada fase depende das anteriores.", order: 1, updatedAt: new Date().toISOString() },
      { id: "portal-empresa", title: "Portal das Empresas", content: "O portal da empresa é o ambiente onde o cliente gerencia sua implementação.\n\nFuncionalidades disponíveis:\n• Dashboard executivo com indicadores em tempo real\n• Estrutura organizacional (setores e unidades)\n• Base populacional (cadastro de colaboradores)\n• Núcleo de sustentação (lideranças e facilitadores)\n• Ciclos MVP (acompanhamento dos 9 ciclos)\n• Turmas de treinamento\n• Ações e alertas automáticos\n• Relatórios executivos\n• Manual MVP\n\nComo utilizar: Navegue pelo menu lateral para acessar cada módulo.\nBoas práticas: Complete os módulos na sequência recomendada pelo checklist de implementação.", order: 2, updatedAt: new Date().toISOString() },
      { id: "portal-admin", title: "Portal Administrativo", content: "O portal administrativo é exclusivo da equipe MVP e oferece visão consolidada de toda a carteira.\n\nFuncionalidades:\n• Dashboard estratégico com KPIs da carteira\n• Gestão de empresas (criar, editar, acompanhar)\n• Gestão de usuários administrativos\n• Modo espelho (visualizar portal da empresa em modo somente leitura)\n• Indicadores consolidados\n• Relatórios da carteira\n• Prateleira global de boas práticas\n• Manual global MVP\n• Central de notificações\n\nComo utilizar: Acesse com credenciais de administrador. Use o modo espelho para ver a realidade de cada empresa.\nBoas práticas: Monitore diariamente os alertas estratégicos e empresas que precisam de atenção.", order: 3, updatedAt: new Date().toISOString() },
      { id: "gestao-empresas", title: "Gestão de Empresas", content: "Módulo para cadastrar e gerenciar empresas no programa.\n\nCampos obrigatórios para criar empresa:\n• Nome da empresa\n• Número de colaboradores\n• Nome do administrador\n• Email do administrador\n\nAo criar uma empresa:\n• Uma senha temporária é gerada automaticamente\n• Um PDF de boas-vindas pode ser exportado\n• O cliente deve trocar a senha no primeiro acesso\n• O onboarding é iniciado automaticamente\n\nBoas práticas: Sempre gere o PDF de boas-vindas e envie ao cliente junto com as credenciais.", order: 4, updatedAt: new Date().toISOString() },
      { id: "gestao-usuarios", title: "Gestão de Usuários", content: "O sistema possui três perfis administrativos:\n\nAdministrador MVP Master: Controle total da plataforma, gestão de outros administradores.\nAdministrador MVP: Equipe interna, visualiza toda a carteira, cria empresas.\nGerente de Conta: Visualiza e gerencia apenas as empresas que criou.\n\nCampos obrigatórios para criar usuário:\n• Nome completo\n• Email\n• Perfil administrativo\n\nBoas práticas: Atribua o perfil mínimo necessário. Gerentes de conta devem ser responsáveis por suas próprias empresas.", order: 5, updatedAt: new Date().toISOString() },
      { id: "dashboards", title: "Dashboards", content: "A plataforma possui dois tipos de dashboard:\n\nDashboard Administrativo:\n• KPIs consolidados da carteira (empresas ativas, colaboradores, maturidade)\n• Saúde da carteira (saudável, atenção, risco)\n• Pipeline de implementação\n• Alertas estratégicos agrupados por tipo\n• Distribuição de maturidade\n• Ranking de evolução\n• Cards com navegação drill-down\n\nDashboard da Empresa:\n• Indicadores operacionais (base, núcleo, turmas, ciclos)\n• Índice de Cultura MVP, Cobertura, Maturidade\n• Progresso do plano de ações\n• Jornada da implementação\n• Checklist da metodologia\n• Sugestões automáticas\n\nBoas práticas: Use o dashboard administrativo para visão macro e o modo espelho para análise individual.", order: 6, updatedAt: new Date().toISOString() },
      { id: "indicadores", title: "Indicadores da Implementação", content: "Indicadores calculados automaticamente:\n\nÍndice de Cultura MVP (0-100): Termômetro principal. Combina cobertura (25%), execução (25%), participação (20%), evolução (20%) e presença (10%).\n\nCobertura do Programa: Percentual de colaboradores treinados. Fórmula: pessoas treinadas ÷ base ativa × 100.\n\nÍndice de Maturidade (0-100): Avalia implementação. Base (15pts) + Núcleo (10pts) + Facilitadores (5pts) + Ciclos (30pts) + Ações (25pts) + Cobertura (15pts).\n\nTaxa Decisão→Ação: Percentual de decisões convertidas em ações registradas.\n\nBoas práticas: Acompanhe a evolução mensal dos indicadores. Meta: maturidade acima de 50% nos primeiros 6 meses.", order: 7, updatedAt: new Date().toISOString() },
      { id: "radar", title: "Radar de Implementação", content: "O radar monitora a saúde da implementação em três níveis:\n\n🟢 Saudável: Empresa com indicadores dentro do esperado.\n🟡 Atenção: Empresa com 1+ ação atrasada, cobertura < 15% ou maturidade < 20%.\n🔴 Risco: Empresa com 3+ ações atrasadas ou cobertura < 5%.\n\nAlertas automáticos são gerados para:\n• Empresas sem iniciar implementação\n• Empresas paradas (30+ dias sem atividade)\n• Ciclos atrasados (40+ dias)\n• Ações com prazo vencido\n\nBoas práticas: Trate alertas de risco imediatamente. Use o modo espelho para investigar a causa.", order: 8, updatedAt: new Date().toISOString() },
      { id: "checklist", title: "Checklist da Implementação", content: "Cada empresa possui um checklist automático da metodologia:\n\nOnboarding:\n• Núcleo de sustentação definido\n• Base populacional cadastrada\n\nPré-Implementação:\n• Estrutura organizacional validada\n• Primeira turma criada\n• Planejamento do primeiro ciclo\n\nImplementação:\n• Ciclos M1 a M3 iniciados\n• Ciclos V1 a V3 iniciados\n• Ciclos P1 a P3 iniciados\n\nO checklist é atualizado automaticamente quando a ação correspondente ocorre no sistema.\n\nBoas práticas: Use o checklist como guia para orientar cada empresa sobre o próximo passo.", order: 9, updatedAt: new Date().toISOString() },
      { id: "notificacoes", title: "Sistema de Notificações", content: "A plataforma gera notificações automáticas para situações críticas:\n\nTipos de notificação:\n• Alerta de atraso (ações com prazo vencido)\n• Alerta de implementação parada (30+ dias sem atividade)\n• Sugestão de próximo passo\n• Relatório executivo mensal\n\nDestinatários:\n• Responsável pela implementação (cliente)\n• Gerente de conta MVP\n• Administrador MVP\n\nCentral de Notificações: Área centralizada com mensagens recentes, alertas ativos e histórico.\n\nBoas práticas: Configure responsáveis pela implementação em cada empresa para garantir que alertas cheguem às pessoas certas.", order: 10, updatedAt: new Date().toISOString() },
      { id: "relatorios", title: "Relatórios Executivos", content: "A plataforma oferece relatórios automáticos em PDF:\n\nRelatório da Carteira MVP:\n• Número total de empresas\n• Distribuição de maturidade\n• Empresas em risco e em evolução\n• Cobertura média de treinamento\n• Ranking de evolução\n\nRelatório Executivo (por empresa):\n• Informações da empresa\n• Progresso da metodologia\n• Indicadores de implementação\n• Pontos fortes e de atenção\n\nRelatório para Reuniões:\n• Versão simplificada para diretoria\n• Status, progresso, indicadores e próximos passos\n\nBoas práticas: Gere relatórios mensais para acompanhamento e reuniões de governança.", order: 11, updatedAt: new Date().toISOString() },
      { id: "navegacao", title: "Navegação entre Telas", content: "A plataforma possui navegação inteligente (drill-down):\n\nCards clicáveis no dashboard:\n• Empresas Ativas → lista de empresas\n• Ações Atrasadas → detalhamento com responsável e dias de atraso\n• Ciclos em Andamento → empresas com ciclos ativos\n\nNavegação fluida:\n• Dashboard → Empresas em risco → Portal da empresa\n• Lista de empresas → Clicar empresa → Portal espelho\n• Lista de ações → Clicar ação → Abrir empresa\n\nModo Espelho:\n• Permite ao administrador ver o portal da empresa como o cliente vê\n• Modo somente leitura (não permite alterações)\n• Identificado por faixa amarela no topo\n\nBoas práticas: Use o drill-down para investigar alertas rapidamente. O modo espelho é a melhor forma de entender a realidade de cada empresa.", order: 12, updatedAt: new Date().toISOString() },
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
