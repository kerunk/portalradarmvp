import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search, BookOpen, Building2, UserCog, Rocket, Users, Target,
  FileText, BarChart3, ShieldCheck, Settings, Layers, SlidersHorizontal,
  BookMarked, HelpCircle, Info, CheckCircle2, ArrowRight, Lightbulb,
  LayoutDashboard, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  content: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "overview",
    title: "Visão Geral da Plataforma",
    icon: LayoutDashboard,
    category: "Fundamentos",
    content: [
      "A plataforma MVP é o sistema centralizado de gestão do Programa MVP (Mudança, Validação e Perpetuação). Como administrador, você tem acesso completo a todas as funcionalidades e pode gerenciar múltiplas empresas clientes simultaneamente.",
      "**Seu papel como Admin MVP:**",
      "• Gerenciar a carteira de empresas clientes",
      "• Criar e controlar acessos de usuários",
      "• Monitorar indicadores consolidados de todas as empresas",
      "• Configurar pesos dos indicadores e faixas de maturidade",
      "• Editar o conteúdo do Manual MVP para todos os clientes",
      "• Manter a Prateleira Global de melhores práticas",
      "**Estrutura do menu administrativo:**",
      "O menu é organizado em 4 blocos lógicos: Controle da Plataforma, Operação do Programa, Inteligência e Administração do Sistema.",
    ],
  },
  {
    id: "dashboard-admin",
    title: "Leitura do Dashboard Administrativo",
    icon: BarChart3,
    category: "Fundamentos",
    content: [
      "O Dashboard Administrativo é seu painel de gestão estratégica da carteira de clientes. Ele NÃO mostra detalhes operacionais (ações individuais, nomes de colaboradores ou práticas específicas). Esses dados pertencem ao portal de cada empresa.",
      "**Visão Geral da Carteira (4 cards):**",
      "• **Empresas Ativas** — Total de empresas com onboarding concluído",
      "• **Colaboradores** — Soma de todos os colaboradores cadastrados na carteira",
      "• **Maturidade Média** — Índice médio de maturidade de todas as empresas",
      "• **Cobertura Média** — Percentual médio de treinamento da carteira",
      "**Painel de Saúde da Implementação:**",
      "• 🟢 **Saudável** — Empresa sem ações atrasadas, cobertura acima de 15% e maturidade adequada",
      "• 🟡 **Atenção** — Empresa com 1-2 ações atrasadas, cobertura abaixo de 15% ou maturidade abaixo de 20%",
      "• 🔴 **Risco** — Empresa com 3+ ações atrasadas ou cobertura abaixo de 5%",
      "**Tabela de Empresas:**",
      "• Mostra empresa, ciclo atual, status de saúde, maturidade e o alerta principal",
      "• Alertas são contextualizados: indicam empresa + tipo de problema específico",
      "**Distribuição por Ciclo:**",
      "• Gráfico de barras mostrando quantas empresas estão em cada ciclo (M1 a P3)",
      "• Cores azul (Monitorar), amarelo (Validar) e verde (Perpetuar) identificam as fases",
      "**Distribuição de Maturidade:**",
      "• Gráfico de rosca: Inicial (0-25%), Estruturando (26-50%), Evoluindo (51-75%), Consolidando (76-100%)",
      "**Cobertura de Treinamento:**",
      "• Mostra a média de cobertura da carteira e barras individuais por empresa",
      "**Empresas com Ações Atrasadas:**",
      "• Lista empresas com mais ações atrasadas (sem mostrar ações individuais) para intervenção prioritária",
      "**Velocímetro de Maturidade:**",
      "• Mostra o índice médio de maturidade da carteira MVP como gauge visual",
      "**Alertas Estratégicos:**",
      "• 🔴 **Crítico** — Ações atrasadas graves, cobertura zero. Ação imediata necessária.",
      "• 🟡 **Atenção** — Baixa cobertura, sem turmas ativas, engajamento baixo. Monitore de perto.",
      "• 🔵 **Insight** — Marcos positivos, oportunidades de intervenção.",
      "**Como agir diante dos indicadores:**",
      "• 🔴 Risco: Entre em contato com a empresa, revise prazos e responsáveis",
      "• 🟡 Atenção: Sugira criação de turmas ou revisão do plano de ação",
      "• 🟢 Saudável: Acompanhe a evolução e incentive o avanço para o próximo ciclo",
      "**Relatórios da Carteira:**",
      "• Na seção Relatórios, o admin vê dados agregados de todas as empresas",
      "• Relatórios operacionais detalhados estão disponíveis apenas no portal de cada empresa",
    ],
  },
  {
    id: "companies",
    title: "Gestão de Empresas",
    icon: Building2,
    category: "Controle",
    content: [
      "Na seção **Empresas** você cadastra e gerencia todas as empresas clientes da carteira.",
      "**Como adicionar uma empresa:**",
      "• Clique em 'Nova Empresa'",
      "• Preencha nome, setor e número de colaboradores",
      "• O sistema criará automaticamente um ambiente isolado para a empresa",
      "**Dados por empresa:**",
      "• Cada empresa tem seus próprios ciclos, turmas e indicadores",
      "• Os dados são isolados entre empresas (multi-tenant)",
      "• O Dashboard Administrativo consolida dados de todas as empresas",
      "**Monitoramento:**",
      "• Acompanhe o status de implementação de cada empresa",
      "• Veja o nível de maturidade MVP individualizado",
      "• Identifique empresas que precisam de atenção",
    ],
  },
  {
    id: "users",
    title: "Gestão de Usuários",
    icon: UserCog,
    category: "Controle",
    content: [
      "Na seção **Usuários** você controla todos os acessos à plataforma.",
      "**Perfis disponíveis:**",
      "• **Administrador MVP** — Acesso total à plataforma e todas as empresas",
      "• **Administrador Cliente** — Acesso completo ao portal da sua empresa",
      "• **Facilitador** — Pode gerenciar turmas e registrar ações",
      "• **Visualizador** — Acesso somente leitura aos dashboards e relatórios",
      "**Funcionalidades:**",
      "• Criar novos usuários com perfil e empresa vinculados",
      "• Ativar ou desativar acessos sem excluir o usuário",
      "• Editar perfis e reatribuir empresas",
      "• Filtrar por empresa, perfil ou status",
    ],
  },
  {
    id: "cycles",
    title: "Ciclos MVP",
    icon: Rocket,
    category: "Operação",
    content: [
      "O programa é dividido em **9 ciclos** organizados em 3 fases:",
      "• **Monitorar (M1, M2, M3)** — Diagnóstico e primeiras ações",
      "• **Validar (V1, V2, V3)** — Consolidação e validação de resultados",
      "• **Perpetuar (P1, P2, P3)** — Sustentação e evolução contínua",
      "**Regras de progressão:**",
      "• Os ciclos são sequenciais: M1 → M2 → M3 → V1 → ...",
      "• Para avançar, o ciclo anterior deve ser encerrado formalmente",
      "• Critérios mínimos: ≥80% ações concluídas, ≥1 turma finalizada",
      "**Gestão de ações:**",
      "• Cada ciclo tem Fatores de Sucesso com ações pré-definidas",
      "• Ações podem ser ativadas/desativadas com justificativa",
      "• Toda ação ativa deve ter responsável e prazo",
      "• O status pode ser: Pendente, Em Andamento ou Concluído",
    ],
  },
  {
    id: "turmas",
    title: "Turmas",
    icon: Users,
    category: "Operação",
    content: [
      "As **turmas** são grupos de treinamento vinculados a ciclos específicos.",
      "**Criação de turmas:**",
      "• Crie turmas dentro de cada ciclo MVP",
      "• Defina nome, datas de início e fim, e participantes",
      "• Registre presenças para alimentar os indicadores de cobertura",
      "**Acompanhamento:**",
      "• Monitore turmas ativas, concluídas e atrasadas",
      "• As turmas impactam diretamente no critério de encerramento do ciclo",
      "• Turmas atrasadas geram alertas automáticos no Dashboard",
    ],
  },
  {
    id: "actions",
    title: "Ações e Alertas",
    icon: Target,
    category: "Operação",
    content: [
      "As **ações** são as unidades de trabalho do programa MVP.",
      "**Tipos de ações:**",
      "• Ações pré-definidas nos Fatores de Sucesso de cada ciclo",
      "• Ações criadas a partir de decisões registradas",
      "• Ações criadas a partir de melhores práticas da Prateleira",
      "**Alertas inteligentes:**",
      "• O sistema gera alertas automáticos para ações atrasadas",
      "• Alertas de ciclos prontos para encerrar",
      "• Alertas de turmas com prazo vencido",
      "• Alertas de ações sem responsável ou prazo definido",
      "• Clique em qualquer alerta para ir diretamente ao item relacionado",
    ],
  },
  {
    id: "indicators",
    title: "Indicadores",
    icon: BarChart3,
    category: "Inteligência",
    content: [
      "Os **indicadores** são calculados automaticamente a partir dos dados registrados.",
      "**Indicadores principais:**",
      "• **Índice de Cultura MVP** — Média ponderada de cobertura, execução, decisão e maturidade",
      "• **Cobertura do Programa** — % de colaboradores treinados vs. base populacional",
      "• **Índice de Maturidade** — Nível de evolução cultural da organização",
      "• **Taxa Decisão → Ação** — % de decisões que geraram ações concretas",
      "• **Ações Concluídas** — Total de ações finalizadas no programa",
      "• **Ações Atrasadas** — Ações com prazo vencido e não concluídas",
      "**Configuração:**",
      "• Em 'Config. Indicadores' você pode ajustar os pesos de cada indicador",
      "• Altere faixas de maturidade e limites de alerta conforme necessário",
    ],
  },
  {
    id: "shelf",
    title: "Prateleira Global",
    icon: BookOpen,
    category: "Administração",
    content: [
      "A **Prateleira Global** é o repositório de melhores práticas do programa MVP.",
      "**Funcionalidades:**",
      "• Cadastre e organize melhores práticas por categoria",
      "• As práticas ficam disponíveis para todos os portais clientes",
      "• Clientes podem criar ações a partir dessas práticas dentro dos ciclos",
      "**Boas práticas de gestão:**",
      "• Mantenha descrições claras e objetivas",
      "• Vincule práticas a fatores de sucesso específicos",
      "• Atualize regularmente com novos aprendizados do programa",
    ],
  },
  {
    id: "manual",
    title: "Manual Global MVP",
    icon: BookMarked,
    category: "Administração",
    content: [
      "O **Manual Global MVP** é o CMS que permite editar o conteúdo de ajuda do sistema.",
      "**Como funciona:**",
      "• Edite textos, explicações de indicadores e instruções",
      "• Adicione novas seções ao manual",
      "• Publique alterações que refletem em todos os portais clientes automaticamente",
      "**Dicas:**",
      "• Mantenha as explicações simples e voltadas para o usuário final",
      "• Use exemplos práticos para facilitar o entendimento",
      "• Versione as publicações para controle de alterações",
    ],
  },
  {
    id: "reports",
    title: "Relatórios",
    icon: FileText,
    category: "Inteligência",
    content: [
      "A seção de **Relatórios** permite gerar análises consolidadas do programa.",
      "**Tipos de relatório:**",
      "• Relatório executivo por empresa",
      "• Relatório consolidado da carteira",
      "• PDF de encerramento de ciclo",
      "• Exportação de indicadores",
      "**Boas práticas:**",
      "• Gere relatórios periodicamente para acompanhar evolução",
      "• Use os PDFs de encerramento como documentação formal",
      "• Compartilhe relatórios executivos com stakeholders",
    ],
  },
];

const categories = ["Fundamentos", "Controle", "Operação", "Inteligência", "Administração"];

const quickTutorials = [
  { title: "Cadastrar nova empresa", steps: ["Acesse Empresas", "Clique em 'Nova Empresa'", "Preencha os dados e salve"] },
  { title: "Criar usuário", steps: ["Acesse Usuários", "Clique em 'Novo Usuário'", "Defina perfil e empresa"] },
  { title: "Encerrar um ciclo", steps: ["Acesse Ciclos MVP", "Selecione o ciclo", "Verifique critérios e clique 'Encerrar'"] },
  { title: "Ajustar indicadores", steps: ["Acesse Config. Indicadores", "Altere pesos e faixas", "Salve as configurações"] },
  { title: "Editar manual", steps: ["Acesse Manual Global MVP", "Edite as seções", "Publique a nova versão"] },
];

export default function AdminHelp() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return helpSections;
    const q = searchQuery.toLowerCase();
    return helpSections.filter(
      s => s.title.toLowerCase().includes(q) || 
           s.content.some(c => c.toLowerCase().includes(q)) ||
           s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredTutorials = useMemo(() => {
    if (!searchQuery.trim()) return quickTutorials;
    const q = searchQuery.toLowerCase();
    return quickTutorials.filter(
      t => t.title.toLowerCase().includes(q) || t.steps.some(s => s.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <AppLayout
      title="Ajuda da Plataforma"
      subtitle="Manual do administrador, tutoriais e referência completa do sistema."
    >
      <div className="space-y-6 animate-fade-in">
        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar no manual... (ex: indicadores, turmas, ciclos)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredSections.length} seções e {filteredTutorials.length} tutoriais encontrados
            </p>
          )}
        </Card>

        {/* Quick Tutorials */}
        {filteredTutorials.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-warning" />
              Tutoriais Rápidos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTutorials.map((tutorial, i) => (
                <div key={i} className="p-3 rounded-lg border bg-secondary/30">
                  <p className="text-sm font-medium text-foreground mb-2">{tutorial.title}</p>
                  <ol className="space-y-1">
                    {tutorial.steps.map((step, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {j + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Program Flow */}
        {!searchQuery && (
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ArrowRight size={18} className="text-primary" />
              Fluxo do Programa MVP
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                { label: "Empresas", icon: Building2 },
                { label: "Estrutura Org.", icon: Layers },
                { label: "Base Populacional", icon: Users },
                { label: "Ciclos MVP", icon: Rocket },
                { label: "Turmas", icon: Users },
                { label: "Ações", icon: Target },
                { label: "Indicadores", icon: BarChart3 },
                { label: "Dashboard", icon: LayoutDashboard },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                    <step.icon size={14} />
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight size={14} className="text-muted-foreground" />}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Manual Sections by Category */}
        {categories.map(cat => {
          const sections = filteredSections.filter(s => s.category === cat);
          if (sections.length === 0) return null;

          return (
            <div key={cat}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                {cat}
              </h3>
              <Accordion type="multiple" className="space-y-2">
                {sections.map(section => (
                  <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <section.icon size={16} className="text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-11 pb-2">
                        {section.content.map((line, i) => {
                          if (line.startsWith("**") && line.endsWith("**")) {
                            return <p key={i} className="font-semibold text-sm text-foreground mt-3">{line.replace(/\*\*/g, "")}</p>;
                          }
                          if (line.startsWith("•")) {
                            const boldMatch = line.match(/• \*\*(.+?)\*\* — (.+)/);
                            if (boldMatch) {
                              return (
                                <p key={i} className="text-sm text-muted-foreground pl-2">
                                  • <strong className="text-foreground">{boldMatch[1]}</strong> — {boldMatch[2]}
                                </p>
                              );
                            }
                            return <p key={i} className="text-sm text-muted-foreground pl-2">{line}</p>;
                          }
                          return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        })}

        {/* Tip */}
        <Card className="p-5 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground mb-1">Suporte</p>
              <p className="text-xs text-muted-foreground">
                Este manual cobre as funcionalidades administrativas da plataforma.
                Para dúvidas sobre a metodologia MVP do ponto de vista do cliente, consulte o Manual MVP no portal do cliente.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
