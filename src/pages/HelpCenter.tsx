import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  BookOpen, Layers, Database, ShieldCheck, Rocket, Users, Target,
  FileText, BarChart3, HelpCircle, TrendingUp, Gauge, Radar, LineChart, Zap,
  ArrowDown, CheckCircle2, AlertTriangle, Lightbulb, GraduationCap, Activity,
  ArrowRight, Star, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── INTRODUCTION ─── */
const introContent = {
  title: "O que é o Programa MVP?",
  paragraphs: [
    "O Programa MVP (Mudança, Validação e Perpetuação) é uma metodologia estruturada para transformação cultural nas organizações. O programa é dividido em três fases — Monitorar, Validar e Perpetuar — cada uma com ciclos específicos de atividades que promovem a evolução comportamental e cultural dos colaboradores.",
    "A plataforma MVP é o sistema digital que apoia toda a execução do programa. Através dela você cadastra a estrutura da empresa, registra atividades, acompanha turmas de treinamento e monitora indicadores estratégicos em tempo real.",
    "Todos os dados que você registra no sistema — presenças em turmas, conclusão de ações, encerramento de ciclos — alimentam automaticamente os indicadores do Dashboard. Isso significa que quanto mais completo e atualizado for o registro, mais precisos serão os indicadores estratégicos da sua organização.",
  ],
  highlights: [
    { icon: Target, text: "Metodologia comprovada para transformação cultural" },
    { icon: BarChart3, text: "Indicadores calculados automaticamente a partir dos dados reais" },
    { icon: TrendingUp, text: "Acompanhamento em tempo real da evolução do programa" },
  ],
};

/* ─── MANUAL SECTIONS ─── */
const manualSections = [
  {
    id: "portal",
    title: "Como usar o Portal",
    icon: HelpCircle,
    content: [
      "O portal MVP é sua central de gestão do programa. Use o menu lateral para navegar entre as seções.",
      "• **Dashboard** — Visão geral com todos os indicadores estratégicos",
      "• **Estrutura Organizacional** — Cadastro de setores e unidades",
      "• **Base Populacional** — Cadastro de colaboradores",
      "• **Governança do Núcleo** — Gestão de lideranças e facilitadores",
      "• **Ciclos MVP** — Acompanhamento dos 9 ciclos do programa",
      "• **Turmas** — Criação e gestão de turmas de treinamento",
      "• **Ações & Alertas** — Monitoramento de ações e prazos",
      "• **Relatórios** — Exportação de análises executivas",
      "• **Manual MVP** — Esta página de ajuda",
    ],
  },
  {
    id: "estrutura",
    title: "Estrutura Organizacional",
    icon: Layers,
    content: [
      "A Estrutura Organizacional permite cadastrar setores e unidades da empresa.",
      "**Por que é importante?** Essa organização é fundamental para segmentar a base populacional e gerar relatórios de cobertura por setor.",
      "**Como usar:**",
      "1. Acesse Estrutura Organizacional no menu",
      "2. Cadastre os setores da empresa (ex: Produção, Administrativo, Logística)",
      "3. Dentro de cada setor, cadastre as unidades se aplicável",
      "4. Depois associe colaboradores a cada setor na Base Populacional",
      "**Exemplo prático:** Uma fábrica com 3 turnos pode criar setores como 'Produção Turno A', 'Produção Turno B' e 'Administrativo'. Isso permite comparar a evolução cultural entre turnos.",
    ],
  },
  {
    id: "base",
    title: "Base Populacional",
    icon: Database,
    content: [
      "A Base Populacional é o cadastro completo dos colaboradores que participarão do programa.",
      "**Formas de cadastro:**",
      "• Importação via arquivo CSV (recomendado para grandes volumes)",
      "• Cadastro manual individual",
      "**Dados necessários:** Nome, setor, cargo e turno de cada colaborador.",
      "**Impacto nos indicadores:** A base é usada como denominador para calcular a Cobertura do Programa. Quanto maior a base cadastrada e treinada, mais preciso será o indicador.",
      "**Dica:** Mantenha a base sempre atualizada. Colaboradores desligados devem ser inativados para não distorcer os indicadores.",
    ],
  },
  {
    id: "nucleo",
    title: "Núcleo de Sustentação",
    icon: ShieldCheck,
    content: [
      "O Núcleo de Sustentação é formado por lideranças e facilitadores que conduzem o programa.",
      "**Composição:**",
      "• **Lideranças** — Gestores que patrocinam e acompanham o programa",
      "• **Facilitadores** — Pessoas habilitadas a conduzir turmas e aplicar práticas",
      "**Por que é importante?** Quanto maior e mais engajado o núcleo, maior a capacidade de expansão do programa. Um núcleo fraco limita a velocidade de implementação.",
      "**Impacto nos indicadores:** O número de facilitadores habilitados influencia o Índice de Maturidade e as recomendações automáticas do sistema.",
      "**Dica:** Invista na formação de pelo menos 1 facilitador para cada 30 colaboradores da base.",
    ],
  },
  {
    id: "ciclos",
    title: "Ciclos MVP",
    icon: Rocket,
    content: [
      "Os Ciclos MVP são as 9 etapas do programa, organizadas em 3 fases:",
      "**Fase Monitorar:** M1, M2, M3 — Diagnóstico e primeiras ações",
      "**Fase Validar:** V1, V2, V3 — Consolidação das práticas",
      "**Fase Perpetuar:** P1, P2, P3 — Sustentabilidade da cultura",
      "**Como funciona cada ciclo:**",
      "1. Cada ciclo possui ações pré-definidas baseadas na metodologia",
      "2. Execute as ações e registre a conclusão no sistema",
      "3. Quando todas as ações obrigatórias estiverem concluídas, o ciclo fica pronto para encerramento",
      "4. Encerre o ciclo para avançar no programa",
      "**Impacto nos indicadores:** Ciclos encerrados aumentam o Índice de Maturidade e a progressão nas fases do programa.",
    ],
  },
  {
    id: "turmas",
    title: "Turmas",
    icon: GraduationCap,
    content: [
      "As Turmas são sessões de treinamento onde os colaboradores participam das atividades do programa.",
      "**Como criar uma turma:**",
      "1. Defina o facilitador responsável",
      "2. Escolha a data e horário",
      "3. Selecione os participantes da base populacional",
      "4. Realize a turma e registre as presenças",
      "**Registro de presenças:** Após a turma, marque cada participante como presente ou ausente. Isso é fundamental para o cálculo da Cobertura do Programa.",
      "**Exemplo prático:** Se sua base tem 200 colaboradores e 80 já tiveram presença registrada em turmas, sua cobertura será de 40%.",
      "**Dica:** Planeje turmas regulares para manter o ritmo do programa e aumentar a cobertura progressivamente.",
    ],
  },
  {
    id: "acoes",
    title: "Ações e Alertas",
    icon: Target,
    content: [
      "Ações são atividades práticas derivadas dos ciclos MVP que precisam ser executadas.",
      "**Cada ação contém:**",
      "• Descrição da atividade",
      "• Responsável pela execução",
      "• Prazo de conclusão",
      "• Status (pendente, em andamento, concluída, atrasada)",
      "**Alertas automáticos:** O sistema gera alertas quando:",
      "• Uma ação ultrapassa o prazo → aparece como 'Ação Atrasada'",
      "• A cobertura do programa está abaixo de 30%",
      "• Um ciclo está pronto para ser encerrado",
      "**Impacto nos indicadores:** A conclusão de ações aumenta a Taxa de Execução e o Índice de Maturidade. Ações atrasadas geram alertas e reduzem a pontuação.",
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: FileText,
    content: [
      "O módulo de Relatórios oferece análises executivas completas para acompanhamento e apresentação.",
      "**Tipos de relatório disponíveis:**",
      "• **Relatório Executivo** — Visão geral do programa com todos os indicadores",
      "• **Progresso por Colaborador** — Busca inteligente por nome com histórico individual",
      "• **Maturidade por Setor** — Comparativo entre setores e unidades",
      "**Exportação:** Todos os relatórios podem ser exportados em PDF e Excel para apresentações executivas e reuniões de governança.",
      "**Dica:** Use o Relatório Executivo para reuniões mensais de acompanhamento e o relatório por Setor para identificar áreas que precisam de mais atenção.",
    ],
  },
];

/* ─── INDICATOR EXPLANATIONS ─── */
const indicatorDetails = [
  {
    id: "cultura",
    title: "Índice de Cultura MVP",
    icon: Gauge,
    color: "primary",
    whatMeasures: "Índice global de 0 a 100 que representa o nível de evolução cultural do programa na empresa. É o principal termômetro da transformação cultural.",
    dataSource: "Calculado automaticamente a partir de 5 fontes de dados: presenças em turmas, ações concluídas, participação geral, progresso dos ciclos e cobertura da base.",
    calculation: [
      "Cobertura de treinamentos → peso 25%",
      "Execução de práticas (ações concluídas) → peso 25%",
      "Participação nas turmas → peso 20%",
      "Evolução dos ciclos → peso 20%",
      "Presença nas atividades → peso 10%",
    ],
    levels: "Inicial (0-25) · Estruturando (26-50) · Evoluindo (51-75) · Consolidando (76-90) · Cultura Forte (91-100)",
    howToImprove: [
      "Realizar mais turmas e registrar presenças",
      "Concluir ações pendentes dos ciclos",
      "Ampliar a cobertura treinando mais colaboradores",
      "Avançar nos ciclos MVP encerrando etapas concluídas",
    ],
  },
  {
    id: "cobertura",
    title: "Cobertura do Programa",
    icon: Users,
    color: "success",
    whatMeasures: "Percentual de colaboradores da base populacional que já participaram de pelo menos uma turma de treinamento.",
    dataSource: "Cruzamento entre a Base Populacional ativa e os registros de presença nas Turmas.",
    calculation: [
      "Numerador: colaboradores com pelo menos 1 presença registrada",
      "Denominador: total de colaboradores ativos na base",
      "Fórmula: (pessoas treinadas ÷ base ativa) × 100",
    ],
    levels: "Abaixo de 30% → crítico · 30-70% → em desenvolvimento · Acima de 70% → boa penetração",
    howToImprove: [
      "Criar novas turmas com colaboradores ainda não treinados",
      "Verificar se todos os setores estão sendo contemplados",
      "Aumentar a frequência de turmas",
      "Registrar corretamente as presenças após cada turma",
    ],
  },
  {
    id: "maturidade",
    title: "Índice de Maturidade MVP",
    icon: Activity,
    color: "primary",
    whatMeasures: "Pontuação de 0 a 100 que avalia o grau de implementação e sustentabilidade do programa na organização.",
    dataSource: "Combina dados de: base populacional, núcleo de sustentação, facilitadores, ciclos encerrados, ações concluídas e cobertura.",
    calculation: [
      "Base populacional cadastrada → 15 pontos",
      "Núcleo de sustentação ativo → 10 pontos",
      "Facilitadores habilitados → 5 pontos",
      "Ciclos encerrados → até 30 pontos (proporcional)",
      "Ações concluídas → até 25 pontos (proporcional)",
      "Cobertura do programa → até 15 pontos (proporcional)",
    ],
    levels: "0-25 → Inicial · 26-50 → Estruturando · 51-75 → Evoluindo · 76-100 → Consolidado",
    howToImprove: [
      "Garantir que base populacional esteja cadastrada",
      "Formar e habilitar mais facilitadores",
      "Encerrar ciclos concluídos para pontuar no progresso",
      "Executar e concluir ações dentro do prazo",
    ],
  },
  {
    id: "decisao",
    title: "Taxa Decisão → Ação",
    icon: Zap,
    color: "warning",
    whatMeasures: "Percentual de decisões tomadas nos ciclos que foram transformadas em ações práticas registradas no sistema.",
    dataSource: "Compara o número de decisões registradas nos ciclos com as ações efetivamente criadas a partir delas.",
    calculation: [
      "Numerador: decisões que geraram ações registradas",
      "Denominador: total de decisões tomadas nos ciclos",
      "Fórmula: (decisões com ações ÷ total de decisões) × 100",
    ],
    levels: "Abaixo de 30% → baixa efetividade · 30-50% → em melhoria · Acima de 50% → saudável",
    howToImprove: [
      "Após cada reunião de ciclo, criar ações no sistema para cada decisão",
      "Definir responsáveis e prazos claros para cada ação",
      "Acompanhar semanalmente as ações em aberto",
      "Encerrar ciclos apenas quando as decisões estiverem convertidas",
    ],
  },
  {
    id: "concluidas",
    title: "Ações Concluídas",
    icon: CheckCircle2,
    color: "success",
    whatMeasures: "Quantidade e percentual de ações do plano que já foram finalizadas com sucesso.",
    dataSource: "Registro de status das ações nos ciclos MVP. Uma ação é contada como concluída quando seu status é alterado para 'concluída'.",
    calculation: [
      "Exibido como: ações concluídas / total de ações",
      "Percentual: (concluídas ÷ total) × 100",
    ],
    levels: "Acompanhe a evolução mês a mês. Idealmente, o percentual deve crescer de forma constante.",
    howToImprove: [
      "Priorizar ações com prazo próximo do vencimento",
      "Dividir ações complexas em etapas menores",
      "Realizar check-ins semanais com os responsáveis",
      "Celebrar marcos de conclusão para manter o engajamento",
    ],
  },
  {
    id: "atrasadas",
    title: "Ações Atrasadas",
    icon: AlertTriangle,
    color: "danger",
    whatMeasures: "Número de ações que ultrapassaram o prazo de conclusão sem serem finalizadas.",
    dataSource: "Comparação entre a data de prazo definida para cada ação e a data atual. Ações com prazo vencido e status diferente de 'concluída' são contadas.",
    calculation: [
      "Contagem simples: ações com prazo < data atual e status ≠ concluída",
      "Também exibe o backlog total de ações pendentes",
    ],
    levels: "0 atrasadas → excelente · 1-3 → atenção · 4+ → situação crítica que requer intervenção",
    howToImprove: [
      "Revisar imediatamente as ações atrasadas e redefinir prazos realistas",
      "Identificar bloqueios que impedem a conclusão",
      "Redistribuir ações entre responsáveis se necessário",
      "Criar rotina semanal de acompanhamento de prazos",
    ],
  },
];

/* ─── FLOW STEPS ─── */
const flowSteps = [
  { icon: Layers, title: "Estrutura Organizacional", desc: "Cadastre setores e unidades da empresa" },
  { icon: Database, title: "Base Populacional", desc: "Cadastre os colaboradores participantes" },
  { icon: ShieldCheck, title: "Núcleo de Sustentação", desc: "Defina lideranças e facilitadores" },
  { icon: GraduationCap, title: "Turmas", desc: "Crie turmas e registre presenças" },
  { icon: Rocket, title: "Ciclos MVP", desc: "Execute e encerre os 9 ciclos do programa" },
  { icon: Target, title: "Ações & Alertas", desc: "Acompanhe ações e prazos" },
  { icon: BarChart3, title: "Indicadores", desc: "Dados alimentam os indicadores automaticamente" },
  { icon: Gauge, title: "Dashboard", desc: "Visualize a evolução cultural em tempo real" },
];

/* ─── IMPROVEMENT GUIDE ─── */
const improvementGuide = [
  {
    indicator: "Cobertura do Programa",
    icon: Users,
    actions: [
      "Criar novas turmas incluindo colaboradores ainda não treinados",
      "Ampliar a frequência de turmas mensais",
      "Garantir que todos os setores estejam sendo contemplados",
      "Registrar presenças corretamente após cada turma realizada",
    ],
  },
  {
    indicator: "Taxa Decisão → Ação",
    icon: Zap,
    actions: [
      "Transformar cada decisão de ciclo em uma ação registrada no sistema",
      "Definir responsáveis e prazos para cada ação",
      "Acompanhar semanalmente a execução das ações",
      "Fechar ciclos somente quando as decisões estiverem convertidas",
    ],
  },
  {
    indicator: "Índice de Maturidade",
    icon: Activity,
    actions: [
      "Completar o cadastro da base populacional",
      "Habilitar mais facilitadores para o programa",
      "Encerrar ciclos que já tiveram todas as ações concluídas",
      "Manter ações dentro do prazo para evitar penalização",
    ],
  },
  {
    indicator: "Índice de Cultura MVP",
    icon: Gauge,
    actions: [
      "Aumentar a cobertura de treinamentos (realizar mais turmas)",
      "Concluir ações práticas dos ciclos MVP",
      "Manter presença ativa nas atividades do programa",
      "Avançar progressivamente nas fases Monitorar → Validar → Perpetuar",
    ],
  },
];

/* ─── COMPONENT ─── */
export default function HelpCenter() {
  return (
    <AppLayout title="Manual MVP" subtitle="Guia completo de uso da plataforma e interpretação dos indicadores">
      <div className="space-y-8 max-w-4xl animate-fade-in">

        {/* ══════ INTRODUCTION ══════ */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">{introContent.title}</h2>
              <p className="text-sm text-muted-foreground">Entenda o programa e como a plataforma apoia sua execução</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {introContent.paragraphs.map((p, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {introContent.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <h.icon size={18} className="text-primary flex-shrink-0" />
                <span className="text-xs font-medium text-foreground">{h.text}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════ PROGRAM FLOW ══════ */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowRight size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Fluxo do Programa no Sistema</h2>
              <p className="text-sm text-muted-foreground">O caminho completo desde o cadastro até os indicadores</p>
            </div>
          </div>

          <div className="relative">
            {flowSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                {/* Vertical line */}
                {i < flowSteps.length - 1 && (
                  <div className="absolute left-[19px] top-10 w-0.5 h-[calc(100%-8px)] bg-border" />
                )}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10",
                  i === flowSteps.length - 1 ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
                )}>
                  <step.icon size={18} />
                </div>
                <div className="pb-6 flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════ MANUAL SECTIONS ══════ */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Guia de Uso do Portal</h2>
              <p className="text-sm text-muted-foreground">Aprenda a usar cada seção da plataforma</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {manualSections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <section.icon size={18} className="text-primary flex-shrink-0" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-9 space-y-2">
                    {section.content.map((line, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* ══════ INDICATOR DETAILS ══════ */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Indicadores do Dashboard</h2>
              <p className="text-sm text-muted-foreground">O que cada indicador mede, de onde vem e como melhorá-lo</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {indicatorDetails.map((ind) => (
              <AccordionItem key={ind.id} value={ind.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", `bg-${ind.color}/10`)}>
                      <ind.icon size={16} className={`text-${ind.color}`} />
                    </div>
                    <span className="font-medium">{ind.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-11 space-y-4">
                    {/* What it measures */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">O que mede</p>
                      <p className="text-sm text-muted-foreground">{ind.whatMeasures}</p>
                    </div>

                    {/* Data source */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">De onde vêm os dados</p>
                      <p className="text-sm text-muted-foreground">{ind.dataSource}</p>
                    </div>

                    {/* Calculation */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Como é calculado</p>
                      <ul className="space-y-1">
                        {ind.calculation.map((c, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>{c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Levels */}
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-1">Faixas de referência</p>
                      <p className="text-xs text-muted-foreground">{ind.levels}</p>
                    </div>

                    {/* How to improve */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-success mb-1">Como melhorar</p>
                      <ul className="space-y-1">
                        {ind.howToImprove.map((tip, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* ══════ IMPROVEMENT GUIDE ══════ */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Star size={22} className="text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Como melhorar os indicadores</h2>
              <p className="text-sm text-muted-foreground">Ações práticas para evoluir cada métrica do programa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {improvementGuide.map((item, i) => (
              <div key={i} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <item.icon size={18} className="text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">{item.indicator}</h3>
                </div>
                <ul className="space-y-2">
                  {item.actions.map((action, j) => (
                    <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                      <ArrowRight size={12} className="text-primary mt-0.5 flex-shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* ══════ TIPS FOOTER ══════ */}
        <Card className="p-5 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground mb-1">Dica importante</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Todos os indicadores do Dashboard são calculados automaticamente com base nos dados que você registra no sistema.
                Mantenha os registros sempre atualizados — presenças, conclusão de ações e encerramento de ciclos — para que os indicadores reflitam fielmente a realidade do programa na sua organização.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
