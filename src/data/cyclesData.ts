import type { SuggestedAction, SuccessFactor } from "@/components/cycles/SuccessFactorActions";

export interface CycleData {
  id: string;
  phase: "M" | "V" | "P";
  phaseName: string;
  moduleTitle: string; // Título oficial da apostila
  shortDescription: string; // Introdução curta (3-4 linhas)
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
    id: "communication",
    name: "Comunicação do Ciclo",
    icon: "📢",
    color: "amber",
    actions: createActions(cycleSpecificActions?.communication || [
      { title: "Campanha de divulgação interna", bestPractice: "Usar múltiplos canais: email, mural, WhatsApp" },
      { title: "Material visual do ciclo", bestPractice: "Banners, cartazes ou posts digitais" },
      { title: "Mensagens-chave para engajamento", bestPractice: "Definir 3 mensagens principais do ciclo" },
    ]),
  },
  {
    id: "structure",
    name: "Atuação do Núcleo de Sustentação",
    icon: "⚙️",
    color: "emerald",
    actions: createActions(cycleSpecificActions?.structure || [
      { title: "Reunião semanal do núcleo de sustentação", bestPractice: "Máximo 30 min, pauta fixa" },
      { title: "Checklist de acompanhamento operacional", bestPractice: "Usar este portal para registrar" },
      { title: "Definição de responsáveis por ação", bestPractice: "Cada ação deve ter um dono claro" },
    ]),
  },
  {
    id: "leadership",
    name: "Liderança Visível e Aplicada",
    icon: "👔",
    color: "blue",
    actions: createActions(cycleSpecificActions?.leadership || [
      { title: "Participação visível em atividades", bestPractice: "Líderes devem estar presentes nos treinamentos" },
      { title: "Comunicação formal da liderança", bestPractice: "Email ou vídeo curto do diretor" },
      { title: "Reunião de alinhamento com gestores", bestPractice: "Agendar no início do ciclo, máximo 1h" },
    ]),
  },
  {
    id: "practice",
    name: "Aplicação Prática no Dia a Dia",
    icon: "🎯",
    color: "purple",
    actions: createActions(cycleSpecificActions?.practice || [
      { title: "Exercícios de campo estruturados", bestPractice: "Aplicar conceitos em situações reais" },
      { title: "Diálogos de liderança sobre fatores humanos", bestPractice: "Mínimo 1 diálogo semanal por equipe" },
      { title: "Registro de aplicações práticas", bestPractice: "Documentar exemplos reais de aplicação" },
    ]),
  },
  {
    id: "indicators",
    name: "Acompanhamento e Validação",
    icon: "📊",
    color: "rose",
    actions: createActions(cycleSpecificActions?.indicators || [
      { title: "Registro de indicadores do ciclo", bestPractice: "Atualizar semanalmente no portal" },
      { title: "Documentação de evidências comportamentais", bestPractice: "Anotar observações e resultados relevantes" },
      { title: "Análise de desvios e ajustes", bestPractice: "Identificar e reportar problemas cedo" },
    ]),
  },
];

export const cyclesData: CycleData[] = [
  // =====================================================
  // MONITORAR CYCLES (M1-M3) - Fase de Consciência e Diagnóstico
  // =====================================================
  {
    id: "M1",
    phase: "M",
    phaseName: "Monitorar",
    moduleTitle: "Módulo 1: Radar Pessoal – Consciência Individual dos Fatores Humanos",
    shortDescription: "O colaborador inicia sua jornada de consciência aplicando o Radar Pessoal. Este instrumento revela como os fatores humanos (atenção, fadiga, estresse, pressa, complacência) influenciam seu desempenho. A linha de base comportamental é estabelecida, conectando percepção individual com segurança operacional.",
    impactedGroups: ["Todos os colaboradores", "Liderança direta", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Aplicação do Radar Pessoal para 100% dos colaboradores",
        "Workshop de sensibilização sobre fatores humanos e desempenho",
        "Alinhamento da liderança sobre o diagnóstico inicial",
        "Primeira análise consolidada de fatores humanos da organização",
      ],
      expectedResults: [
        "Colaboradores conscientes de seus padrões comportamentais",
        "Mapa organizacional de fatores humanos disponível",
        "Liderança ciente do ponto de partida da equipe",
        "Base para comparação futura estabelecida",
      ],
      successCriteria: [
        "Participação mínima de 80% na aplicação do Radar Pessoal",
        "Todos os diagnósticos válidos e completos",
        "Liderança presente em 100% dos workshops de abertura",
        "Relatório consolidado entregue ao núcleo",
      ],
    },
    successFactors: createSuccessFactors({
      communication: [
        { title: "Campanha de lançamento do Programa MVP", bestPractice: "Gerar expectativa positiva, usar múltiplos canais" },
        { title: "Kit de comunicação visual do M1", bestPractice: "Cartazes, banners digitais, mensagens padrão" },
        { title: "FAQ sobre o Radar Pessoal", bestPractice: "Antecipar dúvidas comuns dos colaboradores" },
      ],
      leadership: [
        { title: "Comunicação de abertura pelo líder máximo", bestPractice: "Demonstrar compromisso visível da alta direção" },
        { title: "Líderes aplicam o Radar Pessoal primeiro", bestPractice: "Dar o exemplo antes da equipe" },
        { title: "Presença obrigatória nos workshops", bestPractice: "100% da liderança nos eventos de abertura" },
      ],
      practice: [
        { title: "Workshop de sensibilização sobre fatores humanos", bestPractice: "Máximo 2h, conectar com segurança e desempenho" },
        { title: "Aplicação guiada do Radar Pessoal", bestPractice: "Ambiente tranquilo para reflexão individual" },
        { title: "Sessão de esclarecimento pós-diagnóstico", bestPractice: "Responder dúvidas sobre os resultados" },
      ],
    }),
  },
  {
    id: "M2",
    phase: "M",
    phaseName: "Monitorar",
    moduleTitle: "Módulo 2: Radar Social – Consciência Coletiva e Dinâmica de Equipe",
    shortDescription: "A consciência individual expande para o coletivo. O Radar Social revela como os fatores humanos se manifestam nas relações de trabalho e na dinâmica das equipes. Padrões coletivos de comportamento são identificados, permitindo intervenções focadas em vulnerabilidades operacionais.",
    impactedGroups: ["Equipes de trabalho", "Gestores diretos", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Aplicação do Radar Social em todas as equipes",
        "Análise de padrões comportamentais coletivos por setor",
        "Capacitação inicial de gestores em diálogos de liderança",
        "Identificação de áreas com maior vulnerabilidade comportamental",
      ],
      expectedResults: [
        "Mapa de fatores humanos por equipe consolidado",
        "Gestores preparados para iniciar diálogos de reforço",
        "Áreas prioritárias para intervenção identificadas",
        "Cultura de observação comportamental em desenvolvimento",
      ],
      successCriteria: [
        "100% das equipes com Radar Social aplicado",
        "Mínimo 3 diálogos de liderança realizados por área",
        "Relatório consolidado por setor disponível",
        "Gestores capacitados em técnicas básicas de diálogo",
      ],
    },
    successFactors: createSuccessFactors({
      communication: [
        { title: "Comunicação sobre confidencialidade do Radar Social", bestPractice: "Enfatizar segurança dos dados e propósito construtivo" },
        { title: "Materiais de apoio para gestores", bestPractice: "Guia prático de diálogos de liderança MVP" },
        { title: "Boletim interno com insights do M1", bestPractice: "Compartilhar aprendizados sem expor indivíduos" },
      ],
      practice: [
        { title: "Facilitação do Radar Social em equipes", bestPractice: "Grupos de 8-12 pessoas, ambiente seguro" },
        { title: "Capacitação de gestores em diálogos MVP", bestPractice: "Treinar antes de aplicar com equipes" },
        { title: "Análise coletiva dos resultados por área", bestPractice: "Apresentar padrões, proteger indivíduos" },
      ],
      indicators: [
        { title: "Consolidação dos dados do Radar Social", bestPractice: "Cruzar com resultados do Radar Pessoal" },
        { title: "Mapa de vulnerabilidades por setor", bestPractice: "Identificar áreas que precisam de mais atenção" },
        { title: "Baseline de equipe registrado", bestPractice: "Documentar para comparação futura" },
      ],
    }),
  },
  {
    id: "M3",
    phase: "M",
    phaseName: "Monitorar",
    moduleTitle: "Módulo 3: Liderança Aplicada – Influência Positiva sobre Fatores Humanos",
    shortDescription: "O ciclo de Monitorar se consolida com foco na preparação da liderança. Gestores aprendem a exercer influência positiva sobre fatores humanos, transformando diagnósticos em ações práticas de reforço comportamental. A organização se prepara para a transição estruturada à fase Validar.",
    impactedGroups: ["Liderança formal e informal", "Núcleo de sustentação", "Alta direção"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Capacitação intensiva de líderes em influência comportamental",
        "Elaboração de planos de ação de liderança por área",
        "Consolidação do diagnóstico completo da fase Monitorar",
        "Preparação estruturada para transição à fase Validar",
      ],
      expectedResults: [
        "100% da liderança capacitada em diálogos de reforço MVP",
        "Planos de ação documentados e validados por área",
        "Relatório consolidado M1-M3 disponível",
        "Equipe alinhada e pronta para fase de validação",
      ],
      successCriteria: [
        "100% da liderança participou da capacitação",
        "Cada gestor com no mínimo 2 ações planejadas",
        "Transição aprovada formalmente pelo núcleo",
        "Indicadores de baseline documentados",
      ],
    },
    successFactors: createSuccessFactors({
      leadership: [
        { title: "Treinamento de liderança aplicada MVP", bestPractice: "Foco em comportamentos observáveis e intervenções práticas" },
        { title: "Elaboração de planos de ação por gestor", bestPractice: "Ações específicas, mensuráveis e realistas" },
        { title: "Mentoria cruzada entre gestores", bestPractice: "Troca de experiências e boas práticas entre pares" },
      ],
      indicators: [
        { title: "Consolidação do diagnóstico Monitorar", bestPractice: "Relatório completo da fase M1-M3" },
        { title: "Definição de indicadores para Validar", bestPractice: "Métricas que comprovem mudança comportamental" },
        { title: "Baseline de fatores humanos documentado", bestPractice: "Ponto de partida para comparação futura" },
      ],
      structure: [
        { title: "Validação da transição pelo núcleo", bestPractice: "Checklist formal de prontidão para fase V" },
        { title: "Ajustes no cronograma de turmas", bestPractice: "Replanejar se necessário antes de avançar" },
        { title: "Comunicação de fechamento da fase M", bestPractice: "Celebrar conquistas e preparar próxima fase" },
      ],
    }),
  },

  // =====================================================
  // VALIDAR CYCLES (V1-V3) - Fase de Comprovação e Reforço
  // =====================================================
  {
    id: "V1",
    phase: "V",
    phaseName: "Validar",
    moduleTitle: "Módulo 4: Validação de Campo – Aplicação Prática dos Conceitos MVP",
    shortDescription: "Inicia a fase de comprovação. Colaboradores e líderes aplicam os conceitos MVP em situações reais de trabalho, identificando e intervindo em fatores humanos críticos. As primeiras evidências concretas de mudança comportamental são documentadas, conectando teoria e prática operacional.",
    impactedGroups: ["Todos os colaboradores", "Gestores de campo", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Exercícios práticos de identificação de fatores humanos em campo",
        "Intervenções de liderança em situações reais documentadas",
        "Sistema de registro de evidências comportamentais ativo",
        "Supervisão e feedback imediato nas aplicações",
      ],
      expectedResults: [
        "Primeiras evidências concretas de aplicação prática",
        "Líderes intervindo ativamente em fatores humanos",
        "Colaboradores reconhecendo padrões comportamentais no dia a dia",
        "Base de casos reais para reforço e aprendizado",
      ],
      successCriteria: [
        "Mínimo 3 intervenções documentadas por área",
        "80% da liderança realizando intervenções ativas",
        "Evidências registradas semanalmente no portal",
        "Zero acidentes relacionados a fatores humanos identificados",
      ],
    },
    successFactors: createSuccessFactors({
      practice: [
        { title: "Treinamento de validação em campo", bestPractice: "Simulações e role-play de situações reais" },
        { title: "Exercícios guiados de identificação de fatores", bestPractice: "Observação estruturada em atividades de rotina" },
        { title: "Intervenções de liderança supervisionadas", bestPractice: "Acompanhamento do núcleo nas primeiras intervenções" },
      ],
      structure: [
        { title: "Rotina de acompanhamento diário", bestPractice: "Check-ins rápidos com áreas piloto" },
        { title: "Sistema de registro de evidências operacional", bestPractice: "Portal atualizado com casos práticos" },
        { title: "Reunião semanal de validação", bestPractice: "Revisão de evidências e ajustes táticos" },
      ],
      indicators: [
        { title: "Dashboard de evidências em tempo real", bestPractice: "Visibilidade de intervenções por área" },
        { title: "Análise qualitativa das intervenções", bestPractice: "Classificar por tipo e efetividade" },
        { title: "Comparativo com baseline da fase M", bestPractice: "Medir evolução comportamental" },
      ],
    }),
  },
  {
    id: "V2",
    phase: "V",
    phaseName: "Validar",
    moduleTitle: "Módulo 5: Reforço Comportamental – Consolidação de Novos Padrões",
    shortDescription: "Intensifica as práticas de reforço positivo para consolidar comportamentos desejados. Através de reconhecimento, feedback estruturado e diálogos contínuos, a cultura de fatores humanos se estabelece. O foco é transformar ações pontuais em hábitos organizacionais sustentáveis.",
    impactedGroups: ["Todos os colaboradores", "Liderança em todos os níveis"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Programa de reconhecimento comportamental MVP ativo",
        "Diálogos de liderança estruturados semanalmente",
        "Sistema de feedback contínuo sobre fatores humanos",
        "Campanha de visibilidade para bons exemplos",
      ],
      expectedResults: [
        "Comportamentos positivos reconhecidos publicamente",
        "Cultura de feedback estabelecida na organização",
        "Líderes praticando reforço comportamental ativamente",
        "Redução mensurável de desvios comportamentais",
      ],
      successCriteria: [
        "Mínimo 1 reconhecimento semanal por área",
        "100% dos gestores realizando diálogos estruturados",
        "Redução de 20% em desvios comportamentais",
        "Engajamento visível de 80% da liderança",
      ],
    },
    successFactors: createSuccessFactors({
      leadership: [
        { title: "Capacitação em técnicas de reforço comportamental", bestPractice: "Feedback positivo, corretivo e construtivo" },
        { title: "Agenda fixa de diálogos de liderança", bestPractice: "Mínimo 1 diálogo semanal por equipe" },
        { title: "Mentoria ativa de comportamentos", bestPractice: "Líderes como modelos de referência visíveis" },
      ],
      communication: [
        { title: "Campanha de reconhecimento MVP", bestPractice: "Visibilidade ampla para bons exemplos" },
        { title: "Painel de destaques comportamentais", bestPractice: "Mural físico ou digital atualizado semanalmente" },
        { title: "Histórias de sucesso compartilhadas", bestPractice: "Cases reais da organização em múltiplos canais" },
      ],
      indicators: [
        { title: "Métricas de reconhecimento por área", bestPractice: "Quantificar e qualificar reconhecimentos" },
        { title: "Índice de diálogos realizados", bestPractice: "Acompanhar aderência da liderança" },
        { title: "Evolução de indicadores comportamentais", bestPractice: "Comparar com baseline e V1" },
      ],
    }),
  },
  {
    id: "V3",
    phase: "V",
    phaseName: "Validar",
    moduleTitle: "Módulo 6: Consolidação e Métricas – Comprovação de Resultados",
    shortDescription: "Fechamento da fase Validar com mensuração rigorosa de resultados. Indicadores objetivos comprovam a efetividade das mudanças comportamentais. O ROI comportamental é documentado, e a organização se prepara para a fase Perpetuar, onde as práticas se tornam permanentes.",
    impactedGroups: ["Toda a organização", "Núcleo de sustentação", "Alta direção"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Mensuração completa de indicadores de mudança",
        "Análise comparativa detalhada com baseline da fase M",
        "Relatório de ROI comportamental para alta direção",
        "Planejamento estruturado da fase Perpetuar",
      ],
      expectedResults: [
        "Evidências quantitativas de mudança comportamental",
        "ROI do programa documentado e validado",
        "Estratégia de perpetuação definida e aprovada",
        "Organização pronta para autonomia operacional",
      ],
      successCriteria: [
        "Melhoria mensurável de 30% nos indicadores chave",
        "Relatório de validação aprovado pela alta direção",
        "Plano de perpetuação estruturado e validado",
        "Zero retrocessos nos indicadores comportamentais",
      ],
    },
    successFactors: createSuccessFactors({
      indicators: [
        { title: "Análise comparativa completa de indicadores", bestPractice: "Comparar todos os dados com baseline M1-M3" },
        { title: "Relatório de ROI comportamental", bestPractice: "Traduzir mudanças em resultados de negócio" },
        { title: "Apresentação executiva para alta direção", bestPractice: "Resumo executivo com evidências visuais" },
      ],
      structure: [
        { title: "Documentação de lições aprendidas V1-V3", bestPractice: "O que funcionou e o que ajustar" },
        { title: "Planejamento detalhado da fase Perpetuar", bestPractice: "Definir rituais e práticas permanentes" },
        { title: "Preparação de multiplicadores internos", bestPractice: "Identificar e capacitar agentes de mudança" },
      ],
      leadership: [
        { title: "Reunião de validação com alta direção", bestPractice: "Apresentar resultados e próximos passos" },
        { title: "Compromisso formal de continuidade", bestPractice: "Documentar apoio da liderança para fase P" },
        { title: "Reconhecimento do núcleo e destaques", bestPractice: "Celebrar contribuições e conquistas" },
      ],
    }),
  },

  // =====================================================
  // PERPETUAR CYCLES (P1-P3) - Fase de Sustentabilidade e Autonomia
  // =====================================================
  {
    id: "P1",
    phase: "P",
    phaseName: "Perpetuar",
    moduleTitle: "Módulo 7: Rituais de Sustentação – Práticas Permanentes",
    shortDescription: "Início da fase de perpetuação com implementação de rituais permanentes. Práticas diárias, semanais e mensais garantem a sustentabilidade da cultura MVP. O foco é criar hábitos organizacionais duradouros que funcionem independentemente de supervisão constante.",
    impactedGroups: ["Todos os colaboradores", "Gestores", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Implementação de rituais diários de consciência comportamental",
        "Reuniões de reforço semanais em todas as áreas",
        "Check-ins mensais de sustentação com núcleo",
        "Sistema de monitoramento autônomo operacional",
      ],
      expectedResults: [
        "Rituais funcionando de forma autônoma nas equipes",
        "Práticas MVP integradas naturalmente ao dia a dia",
        "Núcleo atuando como suporte, não como executor",
        "Cultura MVP visível e praticada consistentemente",
      ],
      successCriteria: [
        "80% de adesão aos rituais diários",
        "Reuniões semanais acontecendo em 100% das áreas",
        "Redução de 50% nas intervenções do núcleo",
        "Indicadores estáveis ou em melhoria contínua",
      ],
    },
    successFactors: createSuccessFactors({
      structure: [
        { title: "Implantação de rituais diários", bestPractice: "Máximo 5 minutos, integrado à rotina existente" },
        { title: "Calendário de reuniões de sustentação", bestPractice: "Pauta fixa, horário protegido, facilitador local" },
        { title: "Sistema de monitoramento autônomo", bestPractice: "Equipes registrando próprios indicadores" },
      ],
      practice: [
        { title: "Capacitação de facilitadores internos", bestPractice: "Multiplicadores capacitados por área" },
        { title: "Onboarding de novos colaboradores inclui MVP", bestPractice: "Integração de cultura desde o primeiro dia" },
        { title: "Reciclagem periódica de conceitos", bestPractice: "Reforço trimestral para todos" },
      ],
      leadership: [
        { title: "Líderes como donos dos rituais", bestPractice: "Responsabilidade clara por área" },
        { title: "Coaching de sustentação para gestores", bestPractice: "Suporte do núcleo para autonomia" },
        { title: "Reconhecimento de práticas consistentes", bestPractice: "Valorizar constância, não apenas eventos" },
      ],
    }),
  },
  {
    id: "P2",
    phase: "P",
    phaseName: "Perpetuar",
    moduleTitle: "Módulo 8: Autonomia Operacional – Gestão Integrada",
    shortDescription: "Expansão da autonomia das equipes na gestão de fatores humanos. A responsabilidade da sustentação é transferida para a operação, com núcleo atuando como consultoria estratégica. Indicadores comportamentais são integrados aos KPIs operacionais da organização.",
    impactedGroups: ["Equipes operacionais", "Liderança intermediária", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Transferência formal de responsabilidade para áreas",
        "Integração de indicadores MVP aos KPIs operacionais",
        "Núcleo assumindo papel consultivo estratégico",
        "Dashboard integrado comportamento + operação funcionando",
      ],
      expectedResults: [
        "Áreas 100% autônomas na gestão comportamental",
        "Indicadores MVP integrados às reuniões operacionais",
        "Núcleo liberado para estratégia e evolução",
        "Decisões de gestão baseadas em dados comportamentais",
      ],
      successCriteria: [
        "Cada área gerindo próprios indicadores MVP",
        "Redução de 70% na dependência do núcleo",
        "Dashboard integrado usado em 100% das áreas",
        "Zero regressões nos indicadores de cultura",
      ],
    },
    successFactors: createSuccessFactors({
      leadership: [
        { title: "Gestores como donos do processo MVP", bestPractice: "Accountability clara e documentada" },
        { title: "Integração MVP nas reuniões operacionais", bestPractice: "Fatores humanos na pauta fixa de gestão" },
        { title: "Tomada de decisão baseada em comportamento", bestPractice: "Usar dados MVP para decisões de gestão" },
      ],
      indicators: [
        { title: "Dashboard integrado por área operacional", bestPractice: "Indicadores MVP junto com operacionais" },
        { title: "Relatórios automáticos de sustentação", bestPractice: "Geração automática pelo sistema" },
        { title: "Alertas proativos de desvio comportamental", bestPractice: "Sistema identifica tendências negativas" },
      ],
      structure: [
        { title: "Protocolo de escalação para núcleo", bestPractice: "Quando e como solicitar suporte estratégico" },
        { title: "Revisão trimestral de autonomia", bestPractice: "Avaliar maturidade e ajustar suporte" },
        { title: "Documentação de boas práticas por área", bestPractice: "Registrar o que funciona para replicar" },
      ],
    }),
  },
  {
    id: "P3",
    phase: "P",
    phaseName: "Perpetuar",
    moduleTitle: "Módulo 9: Maturidade e Evolução Contínua – Certificação MVP",
    shortDescription: "Ciclo final focado em garantir maturidade sustentável e evolução contínua. A cultura MVP é consolidada como parte permanente da organização. Métricas de longo prazo são estabelecidas, e a preparação para o próximo ciclo anual de evolução é concluída com certificação formal.",
    impactedGroups: ["Toda a organização", "Alta liderança", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Avaliação formal de maturidade organizacional MVP",
        "Documentação completa do ciclo anual",
        "Apresentação de resultados para alta direção",
        "Planejamento do próximo ciclo anual de evolução",
      ],
      expectedResults: [
        "Nível de maturidade MVP certificado formalmente",
        "ROI anual do programa documentado e validado",
        "Estratégia de evolução contínua definida",
        "Compromisso de liderança renovado para próximo ciclo",
      ],
      successCriteria: [
        "Certificação MVP obtida ou renovada",
        "Alta direção formalmente comprometida com continuidade",
        "Próximo ciclo anual aprovado e orçado",
        "Maturidade estável ou em evolução vs ano anterior",
      ],
    },
    successFactors: createSuccessFactors({
      indicators: [
        { title: "Avaliação formal de maturidade MVP", bestPractice: "Aplicar instrumento padronizado de certificação" },
        { title: "Relatório anual consolidado de resultados", bestPractice: "Todos os indicadores e conquistas do ano" },
        { title: "Apresentação executiva de ROI anual", bestPractice: "Traduzir para linguagem de negócio e investimento" },
      ],
      leadership: [
        { title: "Reunião de governança anual com alta direção", bestPractice: "Validar resultados e aprovar próximo ciclo" },
        { title: "Renovação formal do compromisso de liderança", bestPractice: "Documentar apoio para continuidade" },
        { title: "Cerimônia de reconhecimento do núcleo e destaques", bestPractice: "Celebrar contribuições e conquistas do ano" },
      ],
      structure: [
        { title: "Planejamento estratégico do próximo ciclo MVP", bestPractice: "Definir focos, metas e investimentos" },
        { title: "Revisão e ajuste da estrutura do núcleo", bestPractice: "Avaliar composição e responsabilidades" },
        { title: "Benchmark com outras organizações MVP", bestPractice: "Comparar e aprender com melhores práticas" },
      ],
    }),
  },
];
