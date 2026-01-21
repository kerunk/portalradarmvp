import type { SuggestedAction, SuccessFactor } from "@/components/cycles/SuccessFactorActions";

export interface CycleData {
  id: string;
  phase: "M" | "V" | "P";
  name: string;
  description: string;
  impactedGroups: string[];
  estimatedDuration: string;
  expectations: {
    whatHappens: string[];
    expectedResults: string[];
    successCriteria: string[];
  };
  successFactors: SuccessFactor[];
}

// Helper to generate actions for a factor
function createActions(actions: { title: string; bestPractice: string }[]): SuggestedAction[] {
  return actions.map((a, idx) => ({
    id: `action-${idx + 1}`,
    title: a.title,
    bestPractice: a.bestPractice,
    enabled: true,
    disabledReason: "",
  }));
}

// Standard success factors template - aligned with MVP methodology
const createSuccessFactors = (cycleSpecificActions?: Record<string, { title: string; bestPractice: string }[]>): SuccessFactor[] => [
  {
    id: "leadership",
    name: "Envolvimento e Exemplo da Liderança",
    icon: "👔",
    color: "blue",
    actions: createActions(cycleSpecificActions?.leadership || [
      { title: "Reunião de alinhamento com gestores", bestPractice: "Agendar no início do ciclo, máximo 1h" },
      { title: "Comunicação formal da liderança", bestPractice: "Email ou vídeo curto do diretor" },
      { title: "Participação visível em atividades", bestPractice: "Líderes devem estar presentes nos treinamentos" },
    ]),
  },
  {
    id: "communication",
    name: "Comunicação e Marketing Interno",
    icon: "📢",
    color: "amber",
    actions: createActions(cycleSpecificActions?.communication || [
      { title: "Campanha de divulgação interna", bestPractice: "Usar múltiplos canais: email, mural, WhatsApp" },
      { title: "Material visual do ciclo", bestPractice: "Banners, cartazes ou posts digitais" },
      { title: "FAQ para dúvidas comuns", bestPractice: "Documento simples com perguntas frequentes" },
    ]),
  },
  {
    id: "structure",
    name: "Estrutura e Disciplina do Núcleo",
    icon: "⚙️",
    color: "emerald",
    actions: createActions(cycleSpecificActions?.structure || [
      { title: "Reunião semanal do núcleo de sustentação", bestPractice: "Máximo 30 min, pauta fixa" },
      { title: "Checklist de acompanhamento operacional", bestPractice: "Usar este portal para registrar" },
      { title: "Definição de responsáveis por ação", bestPractice: "Cada ação deve ter um dono claro" },
    ]),
  },
  {
    id: "training",
    name: "Qualidade da Implementação dos Treinamentos",
    icon: "🎓",
    color: "purple",
    actions: createActions(cycleSpecificActions?.training || [
      { title: "Preparação do conteúdo MVP", bestPractice: "Revisar materiais 1 semana antes" },
      { title: "Logística de sala/equipamentos", bestPractice: "Testar projetor e som no dia anterior" },
      { title: "Lista de presença e engajamento", bestPractice: "Registrar participantes para métricas" },
    ]),
  },
  {
    id: "indicators",
    name: "Gestão de Indicadores e Evidências",
    icon: "📊",
    color: "rose",
    actions: createActions(cycleSpecificActions?.indicators || [
      { title: "Registro de indicadores do ciclo", bestPractice: "Atualizar semanalmente no portal" },
      { title: "Documentação de evidências", bestPractice: "Anotar observações e resultados relevantes" },
      { title: "Análise de desvios e ajustes", bestPractice: "Identificar e reportar problemas cedo" },
    ]),
  },
];

export const cyclesData: CycleData[] = [
  // MONITORAR CYCLES (M1-M3) - Fase de consciência e diagnóstico
  {
    id: "M1",
    phase: "M",
    name: "Radar Pessoal",
    description: "Ciclo inicial de ativação da consciência individual. Cada colaborador aplica o Radar Pessoal para identificar seu estado atual em relação aos fatores humanos críticos. Este diagnóstico gera a linha de base comportamental da organização e desperta a percepção sobre a influência dos fatores humanos no desempenho.",
    impactedGroups: ["Todos os colaboradores", "Liderança direta", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Aplicação do Radar Pessoal para todos os colaboradores",
        "Workshop de sensibilização sobre fatores humanos",
        "Reuniões de alinhamento com a liderança sobre o diagnóstico",
      ],
      expectedResults: [
        "100% dos colaboradores com Radar Pessoal aplicado",
        "Mapa de consciência comportamental da organização",
        "Liderança ciente do ponto de partida da equipe",
      ],
      successCriteria: [
        "Participação mínima de 80% na aplicação do Radar",
        "Diagnósticos válidos e completos",
        "Liderança presente nos workshops de abertura",
      ],
    },
    successFactors: createSuccessFactors({
      training: [
        { title: "Workshop de abertura sobre fatores humanos", bestPractice: "Máximo 2h, conectar com segurança e desempenho" },
        { title: "Aplicação guiada do Radar Pessoal", bestPractice: "Garantir ambiente tranquilo para reflexão individual" },
        { title: "Sessão de esclarecimento pós-diagnóstico", bestPractice: "Responder dúvidas sobre o processo" },
      ],
      leadership: [
        { title: "Comunicação de abertura do programa", bestPractice: "Líder máximo deve demonstrar compromisso" },
        { title: "Participação da liderança no Radar Pessoal", bestPractice: "Líderes aplicam primeiro, dando exemplo" },
        { title: "Reunião de alinhamento sobre resultados", bestPractice: "Apresentar panorama geral sem expor indivíduos" },
      ],
    }),
  },
  {
    id: "M2",
    phase: "M",
    name: "Radar Social",
    description: "Expansão da consciência para o ambiente de trabalho. O Radar Social avalia como os fatores humanos se manifestam nas relações interpessoais e na dinâmica das equipes. Este ciclo identifica padrões coletivos de comportamento e áreas de vulnerabilidade operacional.",
    impactedGroups: ["Equipes de trabalho", "Gestores diretos", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Aplicação do Radar Social por equipes",
        "Análise de padrões comportamentais coletivos",
        "Diálogos de liderança sobre fatores humanos",
      ],
      expectedResults: [
        "Mapeamento de fatores humanos por equipe",
        "Identificação de áreas de vulnerabilidade",
        "Gestores preparados para diálogos de reforço",
      ],
      successCriteria: [
        "Todas as equipes com Radar Social aplicado",
        "Pelo menos 3 diálogos de liderança realizados por área",
        "Relatório consolidado por setor disponível",
      ],
    },
    successFactors: createSuccessFactors({
      training: [
        { title: "Facilitação do Radar Social em equipes", bestPractice: "Grupos de 8-12 pessoas, ambiente seguro" },
        { title: "Capacitação de gestores em diálogos MVP", bestPractice: "Treinar antes de aplicar com equipes" },
        { title: "Análise coletiva dos resultados", bestPractice: "Apresentar padrões, não indivíduos" },
      ],
      communication: [
        { title: "Comunicação sobre o processo de Radar Social", bestPractice: "Enfatizar confidencialidade e propósito" },
        { title: "Materiais de apoio para gestores", bestPractice: "Guia prático de diálogos de liderança" },
        { title: "Compartilhamento de insights por área", bestPractice: "Boletim interno com aprendizados" },
      ],
    }),
  },
  {
    id: "M3",
    phase: "M",
    name: "Liderança e Influência",
    description: "Consolidação da fase Monitorar com foco na atuação da liderança. Este ciclo prepara gestores para exercerem influência positiva sobre os fatores humanos, transformando diagnósticos em ações de reforço comportamental. Transição estruturada para a fase Validar.",
    impactedGroups: ["Liderança formal e informal", "Núcleo de sustentação", "Alta direção"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Capacitação de líderes em influência comportamental",
        "Plano de ação de liderança por área",
        "Preparação da transição para fase Validar",
      ],
      expectedResults: [
        "Líderes capacitados em diálogos de reforço",
        "Planos de ação documentados",
        "Equipe pronta para fase de validação",
      ],
      successCriteria: [
        "100% da liderança capacitada",
        "Cada gestor com pelo menos 2 ações planejadas",
        "Transição aprovada pelo núcleo de sustentação",
      ],
    },
    successFactors: createSuccessFactors({
      leadership: [
        { title: "Treinamento de liderança aplicada MVP", bestPractice: "Foco em comportamentos observáveis" },
        { title: "Elaboração de planos de ação por gestor", bestPractice: "Ações específicas, mensuráveis e realistas" },
        { title: "Mentoria cruzada entre gestores", bestPractice: "Troca de experiências e boas práticas" },
      ],
      indicators: [
        { title: "Consolidação do diagnóstico Monitorar", bestPractice: "Relatório completo da fase M1-M3" },
        { title: "Definição de indicadores para Validar", bestPractice: "Métricas que comprovem mudança comportamental" },
        { title: "Baseline de fatores humanos registrado", bestPractice: "Documentar ponto de partida para comparação" },
      ],
    }),
  },

  // VALIDAR CYCLES (V1-V3) - Fase de comprovação e reforço
  {
    id: "V1",
    phase: "V",
    name: "Validação de Campo",
    description: "Início da fase de comprovação prática. Este ciclo testa a aplicação dos conceitos MVP em situações reais de trabalho. Colaboradores e líderes praticam a identificação e intervenção em fatores humanos críticos, gerando evidências de mudança comportamental.",
    impactedGroups: ["Todos os colaboradores", "Gestores de campo", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Exercícios práticos de identificação de fatores humanos",
        "Intervenções de liderança em situações reais",
        "Registro de evidências comportamentais",
      ],
      expectedResults: [
        "Primeiras evidências de aplicação prática",
        "Líderes intervindo em fatores humanos",
        "Colaboradores reconhecendo padrões comportamentais",
      ],
      successCriteria: [
        "Pelo menos 3 intervenções documentadas por área",
        "Participação ativa de 80% da liderança",
        "Evidências registradas no portal",
      ],
    },
    successFactors: createSuccessFactors({
      training: [
        { title: "Treinamento de validação em campo", bestPractice: "Simulações e role-play de situações reais" },
        { title: "Acompanhamento de aplicação prática", bestPractice: "Supervisão e feedback imediato" },
        { title: "Registro estruturado de evidências", bestPractice: "Formulário simples de observação" },
      ],
      structure: [
        { title: "Rotina de acompanhamento do núcleo", bestPractice: "Check-ins diários com áreas piloto" },
        { title: "Sistema de registro de evidências", bestPractice: "Portal atualizado com casos práticos" },
        { title: "Reunião semanal de validação", bestPractice: "Revisão de evidências e ajustes" },
      ],
    }),
  },
  {
    id: "V2",
    phase: "V",
    name: "Reforço Comportamental",
    description: "Intensificação das práticas de reforço positivo. Este ciclo foca em consolidar comportamentos desejados através de reconhecimento, feedback estruturado e diálogos de liderança contínuos. A cultura de fatores humanos começa a se estabelecer.",
    impactedGroups: ["Todos os colaboradores", "Liderança em todos os níveis"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Programa de reconhecimento comportamental",
        "Diálogos de liderança estruturados",
        "Feedback contínuo sobre fatores humanos",
      ],
      expectedResults: [
        "Comportamentos positivos reconhecidos",
        "Cultura de feedback estabelecida",
        "Líderes praticando reforço comportamental",
      ],
      successCriteria: [
        "Pelo menos 1 reconhecimento semanal por área",
        "100% dos gestores realizando diálogos estruturados",
        "Redução mensurável de desvios comportamentais",
      ],
    },
    successFactors: createSuccessFactors({
      leadership: [
        { title: "Capacitação em reforço comportamental", bestPractice: "Técnicas de feedback positivo e corretivo" },
        { title: "Agenda fixa de diálogos de liderança", bestPractice: "Mínimo 1 diálogo por semana por equipe" },
        { title: "Mentoria ativa de comportamentos", bestPractice: "Líderes como modelos de referência" },
      ],
      communication: [
        { title: "Campanha de reconhecimento MVP", bestPractice: "Visibilidade para bons exemplos" },
        { title: "Painel de destaques comportamentais", bestPractice: "Mural físico ou digital atualizado" },
        { title: "Histórias de sucesso compartilhadas", bestPractice: "Cases reais da organização" },
      ],
    }),
  },
  {
    id: "V3",
    phase: "V",
    name: "Consolidação e Métricas",
    description: "Fechamento da fase Validar com mensuração de resultados. Este ciclo comprova a efetividade das mudanças comportamentais através de indicadores objetivos. Prepara a organização para a fase Perpetuar, onde as práticas se tornam permanentes.",
    impactedGroups: ["Toda a organização", "Núcleo de sustentação", "Alta direção"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Mensuração de indicadores de mudança",
        "Análise comparativa com baseline",
        "Planejamento da fase Perpetuar",
      ],
      expectedResults: [
        "Evidências quantitativas de mudança",
        "ROI comportamental documentado",
        "Estratégia de perpetuação definida",
      ],
      successCriteria: [
        "Melhoria mensurável nos indicadores chave",
        "Relatório de validação aprovado pela direção",
        "Plano de perpetuação estruturado",
      ],
    },
    successFactors: createSuccessFactors({
      indicators: [
        { title: "Análise comparativa de indicadores", bestPractice: "Comparar com baseline da fase Monitorar" },
        { title: "Relatório de ROI comportamental", bestPractice: "Traduzir mudanças em resultados de negócio" },
        { title: "Apresentação para alta direção", bestPractice: "Resumo executivo com evidências" },
      ],
      structure: [
        { title: "Documentação de lições aprendidas", bestPractice: "O que funcionou e o que ajustar" },
        { title: "Planejamento da fase Perpetuar", bestPractice: "Definir rituais e práticas permanentes" },
        { title: "Preparação de multiplicadores", bestPractice: "Identificar e capacitar agentes de mudança" },
      ],
    }),
  },

  // PERPETUAR CYCLES (P1-P3) - Fase de sustentabilidade e autonomia
  {
    id: "P1",
    phase: "P",
    name: "Rituais de Sustentação",
    description: "Início da fase de perpetuação com implementação de rituais permanentes. Este ciclo estabelece as práticas diárias, semanais e mensais que garantem a sustentabilidade da cultura MVP. Foco em criar hábitos organizacionais duradouros.",
    impactedGroups: ["Todos os colaboradores", "Gestores", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Implementação de rituais diários de consciência",
        "Reuniões de reforço semanais",
        "Check-ins mensais de sustentação",
      ],
      expectedResults: [
        "Rituais funcionando de forma autônoma",
        "Equipes praticando sem supervisão constante",
        "Cultura MVP integrada ao dia a dia",
      ],
      successCriteria: [
        "80% de adesão aos rituais diários",
        "Reuniões semanais acontecendo em todas as áreas",
        "Núcleo atuando apenas como suporte",
      ],
    },
    successFactors: createSuccessFactors({
      structure: [
        { title: "Implantação de rituais diários", bestPractice: "Máximo 5 minutos, integrado à rotina" },
        { title: "Calendário de reuniões de sustentação", bestPractice: "Pauta fixa, horário protegido" },
        { title: "Sistema de monitoramento autônomo", bestPractice: "Equipes registrando próprios indicadores" },
      ],
      training: [
        { title: "Capacitação de facilitadores internos", bestPractice: "Multiplicadores por área" },
        { title: "Treinamento de novos colaboradores", bestPractice: "Onboarding inclui cultura MVP" },
        { title: "Reciclagem periódica de conceitos", bestPractice: "Reforço trimestral para todos" },
      ],
    }),
  },
  {
    id: "P2",
    phase: "P",
    name: "Autonomia Operacional",
    description: "Expansão da autonomia das equipes na gestão de fatores humanos. Este ciclo transfere a responsabilidade da sustentação para a operação, com o núcleo atuando como suporte estratégico. Integração completa entre comportamento e resultados operacionais.",
    impactedGroups: ["Equipes operacionais", "Liderança intermediária", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Transferência de responsabilidade para áreas",
        "Gestão integrada de fatores humanos e operação",
        "Núcleo em papel consultivo",
      ],
      expectedResults: [
        "Áreas autônomas na gestão comportamental",
        "Indicadores comportamentais integrados a KPIs",
        "Núcleo liberado para estratégia",
      ],
      successCriteria: [
        "Cada área gerindo próprios indicadores MVP",
        "Redução de 50% na dependência do núcleo",
        "Dashboard integrado funcionando",
      ],
    },
    successFactors: createSuccessFactors({
      leadership: [
        { title: "Gestores como donos do processo MVP", bestPractice: "Responsabilidade clara e accountability" },
        { title: "Integração MVP nas reuniões operacionais", bestPractice: "Fatores humanos na pauta fixa" },
        { title: "Tomada de decisão baseada em comportamento", bestPractice: "Usar dados MVP para gestão" },
      ],
      indicators: [
        { title: "Dashboard integrado por área", bestPractice: "Indicadores MVP junto com operacionais" },
        { title: "Relatórios automáticos de sustentação", bestPractice: "Geração automática pelo sistema" },
        { title: "Alertas proativos de desvio", bestPractice: "Sistema identifica tendências negativas" },
      ],
    }),
  },
  {
    id: "P3",
    phase: "P",
    name: "Maturidade e Evolução",
    description: "Ciclo final focado em garantir maturidade sustentável e evolução contínua. Este ciclo consolida a cultura MVP como parte permanente da organização, estabelece métricas de longo prazo e prepara para o próximo ciclo anual de evolução.",
    impactedGroups: ["Toda a organização", "Alta liderança", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Avaliação de maturidade organizacional",
        "Documentação do ciclo completo",
        "Planejamento do próximo ciclo anual",
      ],
      expectedResults: [
        "Nível de maturidade certificado",
        "ROI anual do programa documentado",
        "Estratégia de evolução definida",
      ],
      successCriteria: [
        "Certificação MVP obtida ou renovada",
        "Alta direção comprometida com continuidade",
        "Próximo ciclo anual aprovado",
      ],
    },
    successFactors: createSuccessFactors({
      indicators: [
        { title: "Avaliação final de maturidade", bestPractice: "Aplicar instrumento padronizado MVP" },
        { title: "Relatório anual de resultados", bestPractice: "Consolidar todos os indicadores do ano" },
        { title: "Apresentação executiva de ROI", bestPractice: "Traduzir para linguagem de negócio" },
      ],
      leadership: [
        { title: "Reunião de governança anual", bestPractice: "Alta direção valida resultados e próximo ciclo" },
        { title: "Renovação do compromisso da liderança", bestPractice: "Formalizar continuidade do programa" },
        { title: "Reconhecimento de contribuições", bestPractice: "Celebrar núcleo e destaques" },
      ],
      structure: [
        { title: "Planejamento do próximo ciclo MVP", bestPractice: "Definir focos e metas do próximo ano" },
        { title: "Ajustes na estrutura do núcleo", bestPractice: "Revisar composição e responsabilidades" },
        { title: "Benchmark com outras organizações", bestPractice: "Comparar e aprender com referências" },
      ],
    }),
  },
];
