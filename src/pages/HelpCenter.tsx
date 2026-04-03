import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  BookOpen, Layers, Database, ShieldCheck, Rocket, Users, Target,
  FileText, BarChart3, HelpCircle, TrendingUp, Gauge, LineChart, Zap,
  CheckCircle2, AlertTriangle, Lightbulb, GraduationCap, Activity,
  ArrowRight, Star, Info, Settings, Bell, Lock, ToggleLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── INTRODUCTION ─── */
const introContent = {
  title: "O que é o Programa MVP?",
  paragraphs: [
    "O Programa MVP (Mudança, Validação e Perpetuação) é uma metodologia estruturada para transformação cultural nas organizações. O programa é dividido em três fases — Monitorar, Validar e Perpetuar — cada uma com ciclos específicos que promovem a evolução comportamental e cultural dos colaboradores.",
    "A plataforma MVP é o sistema digital que apoia toda a execução do programa. Através dela você cadastra a estrutura da empresa, registra atividades, acompanha turmas de treinamento, gerencia fatores de sucesso e monitora indicadores estratégicos em tempo real.",
    "Todos os dados que você registra — presenças em turmas, conclusão de ações, encerramento de ciclos — alimentam automaticamente os indicadores do Dashboard. Quanto mais completo e atualizado for o registro, mais precisos serão os indicadores da sua organização.",
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
      "O portal MVP é sua central de gestão do programa. Use o menu lateral para navegar entre as seções:",
      "• **Dashboard** — Visão geral com todos os indicadores estratégicos e guia de primeiros passos",
      "• **Estrutura Organizacional** — Cadastro de setores e unidades da empresa",
      "• **Base Populacional** — Cadastro e gestão de colaboradores participantes",
      "• **Governança do Núcleo** — Gestão de lideranças e facilitadores do programa",
      "• **Ciclos MVP** — Acompanhamento dos 9 ciclos do programa com fatores de sucesso",
      "• **Turmas** — Criação e gestão de turmas de treinamento",
      "• **Ações & Alertas** — Monitoramento de ações pendentes, prazos e alertas automáticos",
      "• **Relatórios** — Exportação de análises executivas em PDF",
      "• **Configurações** — Responsáveis pela implementação e troca de senha",
      "• **Manual MVP** — Esta página de ajuda",
    ],
  },
  {
    id: "primeiro-acesso",
    title: "Primeiro Acesso e Segurança",
    icon: Lock,
    content: [
      "No seu primeiro acesso ao portal, você passará por um fluxo obrigatório de configuração:",
      "**1. Troca de senha obrigatória:**",
      "• Ao fazer login com a senha temporária, o sistema exige que você defina uma nova senha",
      "• Essa etapa é obrigatória e não pode ser ignorada",
      "**2. Onboarding da empresa:**",
      "• Após trocar a senha, o wizard de configuração inicial é apresentado",
      "• Você será guiado para configurar: logo da empresa, estrutura organizacional, base de colaboradores e núcleo de sustentação",
      "• O portal operacional completo só é liberado após completar o onboarding",
      "**Troca de senha posterior:**",
      "• A qualquer momento, acesse Configurações para alterar sua senha",
      "**Botão 'Sair':**",
      "• Nas telas de troca de senha e onboarding existe um botão 'Sair' como escape seguro",
    ],
  },
  {
    id: "estrutura",
    title: "Estrutura Organizacional",
    icon: Layers,
    content: [
      "A Estrutura Organizacional permite cadastrar setores e unidades da empresa.",
      "**O que é:** Organização hierárquica da empresa dentro da plataforma.",
      "**Como usar:**",
      "1. Acesse 'Estrutura da Empresa' no menu lateral",
      "2. Cadastre os setores da empresa (ex: Produção, Administrativo, Logística)",
      "3. Dentro de cada setor, cadastre as unidades se aplicável",
      "4. Depois associe colaboradores a cada setor na Base Populacional",
      "**Quando utilizar:** Antes de cadastrar a base populacional. A estrutura é pré-requisito.",
      "**Boas práticas:** Crie setores que reflitam a realidade operacional. Uma fábrica com 3 turnos pode criar 'Produção Turno A', 'Produção Turno B' e 'Administrativo'.",
    ],
  },
  {
    id: "base",
    title: "Base Populacional",
    icon: Database,
    content: [
      "A Base Populacional é o cadastro completo dos colaboradores participantes do programa.",
      "**Como cadastrar:**",
      "• **Cadastro individual** — Clique em 'Novo Colaborador' e preencha os dados",
      "• **Importação em lote** — Faça upload de arquivo Excel ou CSV com os dados dos colaboradores",
      "• **Modelo de planilha** — Baixe o modelo padrão para garantir o formato correto na importação",
      "**Dados necessários:** Nome completo, Email, Cargo, Setor e Turno",
      "**Gestão de status:**",
      "• Colaboradores são **inativados** (não excluídos) para preservar histórico",
      "• Use os filtros: **Ativos** / **Inativos** / **Todos** para visualizar",
      "• Colaboradores inativos não contam no denominador de cobertura",
      "**Exportação:** Exporte a base completa para Excel a qualquer momento",
      "**Controle de duplicidade:** A importação detecta duplicatas por email e não cria registros duplicados",
      "**Quando utilizar:** Logo após cadastrar a estrutura organizacional.",
      "**Boas práticas:** Mantenha a base atualizada. Colaboradores desligados devem ser inativados para não distorcer os indicadores de cobertura.",
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
      "**Como usar:**",
      "1. Acesse 'Governança do Núcleo' no menu lateral",
      "2. Cadastre as lideranças do programa",
      "3. Cadastre os facilitadores habilitados",
      "**Importância:** O Núcleo é utilizado como fonte de responsáveis nos Fatores de Sucesso dos ciclos.",
      "**Quando utilizar:** Defina o núcleo antes de criar turmas.",
      "**Boas práticas:** Tenha pelo menos 1 facilitador para cada 30 colaboradores da base.",
    ],
  },
  {
    id: "ciclos",
    title: "Ciclos MVP",
    icon: Rocket,
    content: [
      "Os Ciclos MVP são as **9 etapas** do programa, organizadas em 3 fases:",
      "**Fase Monitorar:** M1, M2, M3 — Diagnóstico e primeiras ações",
      "**Fase Validar:** V1, V2, V3 — Consolidação das práticas",
      "**Fase Perpetuar:** P1, P2, P3 — Sustentabilidade da cultura",
      "**Público-alvo por ciclo:**",
      "• M1, M2, V1, V2, P1, P2 → Todos os colaboradores",
      "• M3, V3, P3 → Exclusivo para liderança",
      "**Estrutura de cada ciclo:**",
      "• Cada ciclo possui **Fatores de Sucesso** com ações pré-definidas pela metodologia",
      "• As ações são a estrutura principal de acompanhamento",
      "**Progresso do ciclo (3 componentes):**",
      "• **Treinamento (peso 70%)** — Colaboradores únicos treinados no ciclo ÷ base ativa",
      "• **Fatores de Sucesso (peso 20%)** — Ações dos fatores concluídas ou tratadas",
      "• **Ações do Ciclo (peso 10%)** — Ações criadas por você dentro do ciclo",
      "**Cards clicáveis na tela de progresso:**",
      "• Clique em Treinamento → navega para a tela de Turmas do ciclo",
      "• Clique em Fatores → abre os fatores de sucesso do ciclo",
      "• Clique em Ações → navega para Ações & Alertas",
      "**Encerramento:**",
      "• Atinja os critérios mínimos (≥80% ações concluídas, ≥1 turma finalizada)",
      "• Clique em 'Encerrar Ciclo' para avançar",
      "• O próximo ciclo é liberado automaticamente",
      "**Boas práticas:** Não pule ciclos. A metodologia é sequencial. Ciclos encerrados aumentam o Índice de Maturidade.",
    ],
  },
  {
    id: "fatores-sucesso",
    title: "Fatores de Sucesso",
    icon: Target,
    content: [
      "Os **Fatores de Sucesso** são a estrutura principal de cada ciclo. Eles contêm ações práticas que orientam a implementação da metodologia.",
      "**Estrutura de cada ação:**",
      "• **Imagem ilustrativa** — Referência visual da prática",
      "• **Título** — Nome da ação",
      "• **Texto explicativo** — 'O que deve ser feito' (orientação prática)",
      "• **Dica prática** — Sugestões adicionais de execução",
      "**Campos operacionais (preenchidos por você):**",
      "• **Responsável** — Pessoa encarregada da ação (sugestão vem do Núcleo)",
      "• **Data prevista** — Prazo para conclusão",
      "• **Observações** — Anotações livres",
      "• **Status** — Pendente → Em Andamento → Concluído",
      "• **Toggle ON/OFF** — Desativar uma ação que não se aplica (requer justificativa)",
      "**Contagem dinâmica:**",
      "• O contador (ex: '2/5 tratadas') reflete sempre a quantidade real de ações existentes",
      "• Se uma ação for removida ou desativada, o total é recalculado automaticamente",
      "**Boas práticas:**",
      "• Defina responsáveis e prazos para todas as ações",
      "• Atualize o status regularmente",
      "• Se uma ação não se aplica, desative-a com justificativa (não deixe pendente)",
    ],
  },
  {
    id: "turmas",
    title: "Turmas de Treinamento",
    icon: GraduationCap,
    content: [
      "As Turmas são sessões de treinamento onde os colaboradores participam das atividades do programa.",
      "**Como criar uma turma:**",
      "1. Acesse 'Turmas' no menu lateral",
      "2. Clique em 'Nova Turma'",
      "3. Defina o facilitador responsável (do Núcleo de Sustentação)",
      "4. Escolha o módulo do ciclo (ex: M1, M2)",
      "5. Selecione os participantes da Base Populacional",
      "6. Defina data de início e fim",
      "**Após realizar a turma:**",
      "• Registre as presenças dos participantes",
      "• Finalize a turma para que ela conte como 'Concluída'",
      "**Controle de duplicidade:**",
      "• Colaborador treinado em mais de uma turma do mesmo módulo conta como 1 pessoa treinada",
      "• Isso evita inflação do indicador de cobertura",
      "**Impacto nos indicadores:**",
      "• Turmas alimentam a Cobertura do Programa (% de colaboradores treinados)",
      "• Turmas alimentam o componente Treinamento (70%) do progresso do ciclo",
      "• Turmas concluídas liberam o critério para encerrar o ciclo",
      "**Boas práticas:** Planeje turmas regulares. Amplie progressivamente a cobertura.",
    ],
  },
  {
    id: "acoes",
    title: "Ações e Alertas",
    icon: AlertTriangle,
    content: [
      "A tela **Ações & Alertas** centraliza o monitoramento de todas as ações e prazos do programa.",
      "**Tipos de ação:**",
      "• Ações dos Fatores de Sucesso de cada ciclo (pré-definidas pela metodologia)",
      "• Ações criadas manualmente por você dentro do ciclo",
      "**Status possíveis:** Pendente → Em Andamento → Concluído → Atrasada (automático)",
      "**Alertas automáticos:**",
      "• ⚠️ Ação com prazo vencido → marcada como 'Atrasada' automaticamente",
      "• ⚠️ Cobertura do programa abaixo de 30%",
      "• ✅ Ciclo pronto para ser encerrado",
      "• ⚠️ Ações sem responsável ou prazo definido",
      "**Isolamento de alertas:**",
      "• Você vê apenas os alertas da sua empresa",
      "• Nenhum alerta de outras empresas aparece no seu portal",
      "**Boas práticas:** Acompanhe semanalmente. Ações atrasadas reduzem a pontuação de maturidade.",
    ],
  },
  {
    id: "checklist",
    title: "Checklist da Implementação",
    icon: CheckCircle2,
    content: [
      "O Dashboard inclui um **Guia de Primeiros Passos** que monitora automaticamente o progresso da configuração inicial.",
      "**Etapas monitoradas:**",
      "• ✅ Núcleo de sustentação definido",
      "• ✅ Base populacional cadastrada",
      "• ✅ Estrutura organizacional validada",
      "• ✅ Primeira turma criada",
      "• ✅ Primeira prática registrada",
      "**Como funciona:** Cada item é marcado automaticamente quando a ação correspondente ocorre no sistema. Não é necessário marcar manualmente.",
      "**Boas práticas:** Use o checklist como guia para saber qual é o próximo passo da implementação. Complete todas as etapas antes de avançar para os ciclos.",
    ],
  },
  {
    id: "notificacoes",
    title: "Alertas e Notificações",
    icon: Bell,
    content: [
      "O sistema gera notificações automáticas para situações que requerem sua atenção.",
      "**Tipos de notificação:**",
      "• Ações com prazo vencido (atrasadas)",
      "• Implementação parada (30+ dias sem atividade)",
      "• Sugestão de próximo passo",
      "• Ciclo pronto para encerramento",
      "**Isolamento por empresa:**",
      "• Você vê apenas os alertas da sua empresa",
      "• Alertas de gestão da plataforma (ex: 'Empresa BBM inativada') não aparecem para clientes",
      "**Boas práticas:** Verifique os alertas regularmente e trate as pendências em ordem de prioridade.",
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios Executivos",
    icon: FileText,
    content: [
      "O módulo de Relatórios oferece análises executivas completas.",
      "**Tipos de relatório disponíveis:**",
      "• **Relatório Executivo** — Visão geral com todos os indicadores da empresa",
      "• **Progresso por Colaborador** — Busca por nome com histórico individual de participação",
      "• **Maturidade por Setor** — Comparativo entre os setores da empresa",
      "**Exportação:** Relatórios podem ser exportados em PDF para apresentações e reuniões de governança.",
      "**Quando utilizar:** Mensalmente para acompanhamento interno e antes de reuniões executivas.",
      "**Boas práticas:** Use o Relatório Executivo para reuniões mensais e o relatório por Setor para identificar áreas que precisam de atenção.",
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações",
    icon: Settings,
    content: [
      "A tela de **Configurações** permite gerenciar aspectos operacionais do seu portal.",
      "**Funcionalidades:**",
      "• Definir responsáveis pela implementação do programa na empresa",
      "• Alterar sua senha de acesso",
      "**Boas práticas:**",
      "• Defina pelo menos 1 responsável pela implementação",
      "• Troque sua senha periodicamente",
    ],
  },
  {
    id: "navegacao",
    title: "Navegação Inteligente",
    icon: ArrowRight,
    content: [
      "A plataforma possui navegação inteligente (drill-down) para facilitar a análise e a ação.",
      "**Cards clicáveis no dashboard:**",
      "• Clique em indicadores para ver detalhes",
      "• Clique em alertas para ir diretamente ao item que precisa de atenção",
      "**Na tela de Ciclos MVP:**",
      "• Card de Treinamento → abre a tela de Turmas",
      "• Card de Fatores de Sucesso → abre os fatores do ciclo",
      "• Card de Ações → abre Ações & Alertas",
      "**Boas práticas:** Use os links diretos para resolver pendências rapidamente sem navegar por múltiplas telas.",
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
      "Realizar mais turmas e registrar presenças corretamente",
      "Concluir ações pendentes dos fatores de sucesso",
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
    dataSource: "Cruzamento entre a Base Populacional ativa e os registros de presença nas Turmas. Colaboradores únicos são contados (repetição no mesmo módulo não infla o indicador).",
    calculation: [
      "Numerador: colaboradores únicos com pelo menos 1 presença registrada",
      "Denominador: total de colaboradores ativos na base",
      "Fórmula: (pessoas únicas treinadas ÷ base ativa) × 100",
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
      "Ciclos encerrados → até 30 pontos (proporcional aos 9 ciclos)",
      "Ações concluídas → até 25 pontos (proporcional)",
      "Cobertura do programa → até 15 pontos (proporcional)",
    ],
    levels: "0-25 → Inicial · 26-50 → Estruturando · 51-75 → Evoluindo · 76-100 → Consolidado",
    howToImprove: [
      "Garantir que base populacional esteja cadastrada e atualizada",
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
    dataSource: "Registro de status das ações nos Fatores de Sucesso e ações criadas manualmente nos ciclos.",
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
    dataSource: "Comparação entre a data de prazo definida para cada ação e a data atual. Ações com prazo vencido e status diferente de 'concluída' são contadas automaticamente.",
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
  { icon: Lock, title: "Primeiro Acesso", desc: "Troque a senha temporária e complete o onboarding" },
  { icon: Layers, title: "Estrutura Organizacional", desc: "Cadastre setores e unidades da empresa" },
  { icon: Database, title: "Base Populacional", desc: "Cadastre os colaboradores participantes" },
  { icon: ShieldCheck, title: "Núcleo de Sustentação", desc: "Defina lideranças e facilitadores" },
  { icon: GraduationCap, title: "Turmas", desc: "Crie turmas e registre presenças" },
  { icon: Rocket, title: "Ciclos MVP", desc: "Inicie e acompanhe os fatores de sucesso" },
  { icon: Target, title: "Fatores de Sucesso", desc: "Execute as ações de cada fator do ciclo" },
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
      "Concluir ações práticas dos fatores de sucesso",
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
              <p className="text-sm text-muted-foreground">O caminho completo desde o primeiro acesso até os indicadores</p>
            </div>
          </div>

          <div className="relative">
            {flowSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 relative">
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
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">O que mede</p>
                      <p className="text-sm text-muted-foreground">{ind.whatMeasures}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">De onde vêm os dados</p>
                      <p className="text-sm text-muted-foreground">{ind.dataSource}</p>
                    </div>
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
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-foreground mb-1">Faixas de referência</p>
                      <p className="text-xs text-muted-foreground">{ind.levels}</p>
                    </div>
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
