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

// Standard success factors template
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
      { title: "Reunião semanal do núcleo", bestPractice: "Máximo 30 min, pauta fixa" },
      { title: "Checklist de acompanhamento", bestPractice: "Usar este portal para registrar" },
      { title: "Definição de responsáveis", bestPractice: "Cada ação deve ter um dono claro" },
    ]),
  },
  {
    id: "training",
    name: "Qualidade da Implementação dos Treinamentos",
    icon: "🎓",
    color: "purple",
    actions: createActions(cycleSpecificActions?.training || [
      { title: "Preparação do conteúdo", bestPractice: "Revisar materiais 1 semana antes" },
      { title: "Logística de sala/equipamentos", bestPractice: "Testar projetor e som no dia anterior" },
      { title: "Lista de presença", bestPractice: "Registrar participantes para métricas" },
    ]),
  },
  {
    id: "indicators",
    name: "Gestão de Indicadores e Evidências",
    icon: "📊",
    color: "rose",
    actions: createActions(cycleSpecificActions?.indicators || [
      { title: "Registro de indicadores do ciclo", bestPractice: "Atualizar semanalmente no portal" },
      { title: "Documentação de resultados", bestPractice: "Anotar observações relevantes" },
      { title: "Análise de desvios", bestPractice: "Identificar e reportar problemas cedo" },
    ]),
  },
];

export const cyclesData: CycleData[] = [
  // MINDSET CYCLES (M1-M3)
  {
    id: "M1",
    phase: "M",
    name: "Radar Pessoal",
    description: "Ciclo inicial de autoconhecimento onde cada colaborador identifica seu ponto de partida na jornada MVP. Foco em despertar a consciência sobre comportamentos atuais e potencial de desenvolvimento.",
    impactedGroups: ["Todos os colaboradores", "Liderança direta"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Aplicação da avaliação inicial de mindset",
        "Workshops de introdução ao programa",
        "Sessões de reflexão individual",
      ],
      expectedResults: [
        "100% dos colaboradores avaliados",
        "Mapa de mindset da organização",
        "Engajamento inicial medido",
      ],
      successCriteria: [
        "Participação mínima de 80%",
        "Avaliações completas e válidas",
        "Liderança presente nos workshops",
      ],
    },
    successFactors: createSuccessFactors({
      training: [
        { title: "Workshop de abertura do programa", bestPractice: "Máximo 2h, dinâmico e interativo" },
        { title: "Aplicação do diagnóstico inicial", bestPractice: "Garantir ambiente tranquilo para reflexão" },
        { title: "Sessão de dúvidas pós-diagnóstico", bestPractice: "Responder individualmente se necessário" },
      ],
    }),
  },
  {
    id: "M2",
    phase: "M",
    name: "Construção de Base",
    description: "Aprofundamento nos conceitos fundamentais do MVP. Colaboradores começam a internalizar os princípios e identificar oportunidades de aplicação no dia a dia.",
    impactedGroups: ["Todos os colaboradores", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Treinamentos conceituais do MVP",
        "Exercícios práticos em grupo",
        "Primeiras aplicações no trabalho",
      ],
      expectedResults: [
        "Compreensão dos conceitos base",
        "Primeiros casos de aplicação",
        "Formação de multiplicadores",
      ],
      successCriteria: [
        "Avaliação de conhecimento > 70%",
        "Pelo menos 3 casos práticos por área",
        "Multiplicadores identificados",
      ],
    },
    successFactors: createSuccessFactors(),
  },
  {
    id: "M3",
    phase: "M",
    name: "Consolidação Mental",
    description: "Fechamento da fase de Mindset com consolidação do aprendizado. Avaliação do progresso e preparação para a transição para Valores.",
    impactedGroups: ["Todos os colaboradores", "Liderança", "Núcleo"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Avaliação de progresso de mindset",
        "Celebração de conquistas iniciais",
        "Planejamento da fase de Valores",
      ],
      expectedResults: [
        "Evolução mensurável de mindset",
        "Cases documentados",
        "Equipe preparada para próxima fase",
      ],
      successCriteria: [
        "Melhoria de 15% no índice de mindset",
        "Liderança validando a evolução",
        "Transição planejada",
      ],
    },
    successFactors: createSuccessFactors(),
  },
  // VALUES CYCLES (V1-V3)
  {
    id: "V1",
    phase: "V",
    name: "Identificação de Valores",
    description: "Início da fase de Valores. Mapeamento e discussão dos valores organizacionais e pessoais, identificando alinhamentos e gaps.",
    impactedGroups: ["Todos os colaboradores", "RH", "Liderança"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Workshops de valores organizacionais",
        "Mapeamento de valores pessoais",
        "Discussões em grupo sobre alinhamento",
      ],
      expectedResults: [
        "Valores claramente definidos",
        "Gap analysis concluída",
        "Plano de alinhamento criado",
      ],
      successCriteria: [
        "Participação de 85% nos workshops",
        "Documento de valores aprovado",
        "Gaps prioritários identificados",
      ],
    },
    successFactors: createSuccessFactors(),
  },
  {
    id: "V2",
    phase: "V",
    name: "Vivência de Valores",
    description: "Prática ativa dos valores no cotidiano. Colaboradores são desafiados a demonstrar os valores em situações reais de trabalho.",
    impactedGroups: ["Todos os colaboradores", "Gestores diretos"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Desafios práticos de valores",
        "Feedback contínuo dos gestores",
        "Reconhecimento de bons exemplos",
      ],
      expectedResults: [
        "Comportamentos alinhados visíveis",
        "Cultura de feedback estabelecida",
        "Exemplos inspiradores compartilhados",
      ],
      successCriteria: [
        "Pelo menos 1 reconhecimento por área",
        "Feedbacks semanais acontecendo",
        "Redução de conflitos de valores",
      ],
    },
    successFactors: createSuccessFactors(),
  },
  {
    id: "V3",
    phase: "V",
    name: "Enraizamento de Valores",
    description: "Consolidação dos valores como parte da cultura. Avaliação do impacto e preparação para a fase de Práticas.",
    impactedGroups: ["Toda a organização"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Avaliação de cultura de valores",
        "Documentação de transformações",
        "Preparação para fase de Práticas",
      ],
      expectedResults: [
        "Valores integrados ao dia a dia",
        "Histórias de transformação",
        "Base sólida para práticas",
      ],
      successCriteria: [
        "Pesquisa de clima positiva",
        "Cases de sucesso documentados",
        "Transição aprovada pela liderança",
      ],
    },
    successFactors: createSuccessFactors(),
  },
  // PRACTICES CYCLES (P1-P3)
  {
    id: "P1",
    phase: "P",
    name: "Práticas Iniciais",
    description: "Implementação das primeiras práticas MVP no cotidiano. Foco em rituais simples e ferramentas básicas.",
    impactedGroups: ["Equipes operacionais", "Gestores", "Núcleo"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Implementação de rituais diários",
        "Treinamento em ferramentas MVP",
        "Acompanhamento intensivo",
      ],
      expectedResults: [
        "Rituais funcionando",
        "Ferramentas em uso",
        "Primeiros resultados visíveis",
      ],
      successCriteria: [
        "80% de adesão aos rituais",
        "Ferramentas implementadas",
        "Métricas de baseline definidas",
      ],
    },
    successFactors: createSuccessFactors(),
  },
  {
    id: "P2",
    phase: "P",
    name: "Práticas Avançadas",
    description: "Expansão e aprofundamento das práticas. Introdução de metodologias mais complexas e integração entre áreas.",
    impactedGroups: ["Toda a organização", "Liderança sênior"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Práticas avançadas introduzidas",
        "Integração entre departamentos",
        "Gestão por indicadores",
      ],
      expectedResults: [
        "Práticas maduras funcionando",
        "Silos reduzidos",
        "Dashboard de indicadores ativo",
      ],
      successCriteria: [
        "Indicadores melhorando",
        "Colaboração interdepartamental",
        "Autonomia das equipes",
      ],
    },
    successFactors: createSuccessFactors(),
  },
  {
    id: "P3",
    phase: "P",
    name: "Sustentabilidade",
    description: "Ciclo final focado em garantir a sustentabilidade do programa. Documentação, transferência de conhecimento e planejamento de continuidade.",
    impactedGroups: ["Toda a organização", "Alta liderança"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Avaliação final do programa",
        "Documentação completa",
        "Planejamento do próximo ciclo anual",
      ],
      expectedResults: [
        "Programa sustentável",
        "ROI documentado",
        "Próximo ano planejado",
      ],
      successCriteria: [
        "Certificação MVP obtida",
        "Liderança comprometida com continuidade",
        "Indicadores de sucesso atingidos",
      ],
    },
    successFactors: createSuccessFactors(),
  },
];
