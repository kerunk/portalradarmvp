// MVP Official Cycles Data
// Source of truth for MVP methodology cycles

export interface MVPCycle {
  id: string;
  phase: "M" | "V" | "P";
  phaseName: "Monitorar" | "Validar" | "Perpetuar";
  title: string;
  context: string;
  impactedGroups: string[];
  estimatedDuration: string;
  expectations: {
    whatHappens: string[];
    expectedResults: string[];
    successCriteria: string[];
  };
  successFactors: MVPSuccessFactor[];
}

export interface MVPSuccessFactor {
  id: string;
  name: string;
  icon: string;
  color: string;
  actions: MVPSuggestedAction[];
}

export interface MVPSuggestedAction {
  id: string;
  title: string;
  bestPractice: string;
}

// Standard success factors template
const createSuccessFactors = (customActions?: Record<string, MVPSuggestedAction[]>): MVPSuccessFactor[] => [
  {
    id: "communication",
    name: "Comunicação do Ciclo",
    icon: "📢",
    color: "amber",
    actions: customActions?.communication || [
      { id: "comm-1", title: "Campanha de divulgação interna", bestPractice: "Usar múltiplos canais: email, mural, WhatsApp" },
      { id: "comm-2", title: "Material visual do ciclo", bestPractice: "Banners, cartazes ou posts digitais" },
      { id: "comm-3", title: "Mensagens-chave para engajamento", bestPractice: "Definir 3 mensagens principais do ciclo" },
    ],
  },
  {
    id: "structure",
    name: "Atuação do Núcleo de Sustentação",
    icon: "⚙️",
    color: "emerald",
    actions: customActions?.structure || [
      { id: "struct-1", title: "Reunião semanal do núcleo de sustentação", bestPractice: "Máximo 30 min, pauta fixa" },
      { id: "struct-2", title: "Checklist de acompanhamento operacional", bestPractice: "Usar este portal para registrar" },
      { id: "struct-3", title: "Definição de responsáveis por ação", bestPractice: "Cada ação deve ter um dono claro" },
    ],
  },
  {
    id: "leadership",
    name: "Liderança Visível e Aplicada",
    icon: "👔",
    color: "blue",
    actions: customActions?.leadership || [
      { id: "lead-1", title: "Participação visível em atividades", bestPractice: "Líderes devem estar presentes nos treinamentos" },
      { id: "lead-2", title: "Comunicação formal da liderança", bestPractice: "Email ou vídeo curto do diretor" },
      { id: "lead-3", title: "Reunião de alinhamento com gestores", bestPractice: "Agendar no início do ciclo, máximo 1h" },
    ],
  },
  {
    id: "practice",
    name: "Aplicação Prática no Dia a Dia",
    icon: "🎯",
    color: "purple",
    actions: customActions?.practice || [
      { id: "prac-1", title: "Exercícios de campo estruturados", bestPractice: "Aplicar conceitos em situações reais" },
      { id: "prac-2", title: "Diálogos de liderança sobre fatores humanos", bestPractice: "Mínimo 1 diálogo semanal por equipe" },
      { id: "prac-3", title: "Registro de aplicações práticas", bestPractice: "Documentar exemplos reais de aplicação" },
    ],
  },
  {
    id: "indicators",
    name: "Acompanhamento e Validação",
    icon: "📊",
    color: "rose",
    actions: customActions?.indicators || [
      { id: "ind-1", title: "Registro de indicadores do ciclo", bestPractice: "Atualizar semanalmente no portal" },
      { id: "ind-2", title: "Documentação de evidências comportamentais", bestPractice: "Anotar observações e resultados relevantes" },
      { id: "ind-3", title: "Análise de desvios e ajustes", bestPractice: "Identificar e reportar problemas cedo" },
    ],
  },
];

export const mvpCycles: MVPCycle[] = [
  // =====================================================
  // MONITORAR (M1-M3) - Fase de Consciência e Diagnóstico
  // =====================================================
  {
    id: "M1",
    phase: "M",
    phaseName: "Monitorar",
    title: "Conceito MVP e Radar Pessoal",
    context: "O colaborador inicia sua jornada de consciência aplicando o Radar Pessoal. Este instrumento revela como os fatores humanos (atenção, fadiga, estresse, pressa, complacência) influenciam seu desempenho individual. A linha de base comportamental é estabelecida, conectando percepção pessoal com segurança operacional e produtividade.",
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
        { id: "m1-comm-1", title: "Campanha de lançamento do Programa MVP", bestPractice: "Gerar expectativa positiva, usar múltiplos canais" },
        { id: "m1-comm-2", title: "Kit de comunicação visual do M1", bestPractice: "Cartazes, banners digitais, mensagens padrão" },
        { id: "m1-comm-3", title: "FAQ sobre o Radar Pessoal", bestPractice: "Antecipar dúvidas comuns dos colaboradores" },
      ],
      leadership: [
        { id: "m1-lead-1", title: "Comunicação de abertura pelo líder máximo", bestPractice: "Demonstrar compromisso visível da alta direção" },
        { id: "m1-lead-2", title: "Líderes aplicam o Radar Pessoal primeiro", bestPractice: "Dar o exemplo antes da equipe" },
        { id: "m1-lead-3", title: "Presença obrigatória nos workshops", bestPractice: "100% da liderança nos eventos de abertura" },
      ],
      practice: [
        { id: "m1-prac-1", title: "Workshop de sensibilização sobre fatores humanos", bestPractice: "Máximo 2h, conectar com segurança e desempenho" },
        { id: "m1-prac-2", title: "Aplicação guiada do Radar Pessoal", bestPractice: "Ambiente tranquilo para reflexão individual" },
        { id: "m1-prac-3", title: "Sessão de esclarecimento pós-diagnóstico", bestPractice: "Responder dúvidas sobre os resultados" },
      ],
    }),
  },
  {
    id: "M2",
    phase: "M",
    phaseName: "Monitorar",
    title: "Radar Social: Percepção que Salva",
    context: "A consciência individual expande para o coletivo. O Radar Social revela como os fatores humanos se manifestam nas relações de trabalho e na dinâmica das equipes. Padrões coletivos de comportamento são identificados, fortalecendo a capacidade da equipe de observar e intervir em vulnerabilidades operacionais.",
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
        { id: "m2-comm-1", title: "Comunicação sobre confidencialidade do Radar Social", bestPractice: "Enfatizar segurança dos dados e propósito construtivo" },
        { id: "m2-comm-2", title: "Materiais de apoio para gestores", bestPractice: "Guia prático de diálogos de liderança MVP" },
        { id: "m2-comm-3", title: "Boletim interno com insights do M1", bestPractice: "Compartilhar aprendizados sem expor indivíduos" },
      ],
      practice: [
        { id: "m2-prac-1", title: "Facilitação do Radar Social em equipes", bestPractice: "Grupos de 8-12 pessoas, ambiente seguro" },
        { id: "m2-prac-2", title: "Capacitação de gestores em diálogos MVP", bestPractice: "Treinar antes de aplicar com equipes" },
        { id: "m2-prac-3", title: "Análise coletiva dos resultados por área", bestPractice: "Apresentar padrões, proteger indivíduos" },
      ],
      indicators: [
        { id: "m2-ind-1", title: "Consolidação dos dados do Radar Social", bestPractice: "Cruzar com resultados do Radar Pessoal" },
        { id: "m2-ind-2", title: "Mapa de vulnerabilidades por setor", bestPractice: "Identificar áreas que precisam de mais atenção" },
        { id: "m2-ind-3", title: "Baseline de equipe registrado", bestPractice: "Documentar para comparação futura" },
      ],
    }),
  },
  {
    id: "M3",
    phase: "M",
    phaseName: "Monitorar",
    title: "Liderança em Movimento: Ativando o Radar em Todos",
    context: "O ciclo de Monitorar se consolida com foco na preparação da liderança. Gestores aprendem a exercer influência positiva sobre fatores humanos, transformando diagnósticos em ações práticas de reforço comportamental. A organização se prepara para a transição estruturada à fase Validar.",
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
        { id: "m3-lead-1", title: "Treinamento de liderança aplicada MVP", bestPractice: "Foco em comportamentos observáveis e intervenções práticas" },
        { id: "m3-lead-2", title: "Elaboração de planos de ação por gestor", bestPractice: "Ações específicas, mensuráveis e realistas" },
        { id: "m3-lead-3", title: "Mentoria cruzada entre gestores", bestPractice: "Troca de experiências e boas práticas entre pares" },
      ],
      indicators: [
        { id: "m3-ind-1", title: "Consolidação do diagnóstico Monitorar", bestPractice: "Relatório completo da fase M1-M3" },
        { id: "m3-ind-2", title: "Definição de indicadores para Validar", bestPractice: "Métricas que comprovem mudança comportamental" },
        { id: "m3-ind-3", title: "Baseline de fatores humanos documentado", bestPractice: "Ponto de partida para comparação futura" },
      ],
      structure: [
        { id: "m3-struct-1", title: "Validação da transição pelo núcleo", bestPractice: "Checklist formal de prontidão para fase V" },
        { id: "m3-struct-2", title: "Ajustes no cronograma de turmas", bestPractice: "Replanejar se necessário antes de avançar" },
        { id: "m3-struct-3", title: "Comunicação de fechamento da fase M", bestPractice: "Celebrar conquistas e preparar próxima fase" },
      ],
    }),
  },

  // =====================================================
  // VALIDAR (V1-V3) - Fase de Comprovação e Reforço
  // =====================================================
  {
    id: "V1",
    phase: "V",
    phaseName: "Validar",
    title: "Da Atenção à Validação: Transformando a Consciência em Consistência",
    context: "Inicia a fase de comprovação. Colaboradores e líderes aplicam os conceitos MVP em situações reais de trabalho, identificando e intervindo em fatores humanos críticos. As primeiras evidências concretas de mudança comportamental são documentadas, transformando a consciência adquirida em consistência prática.",
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
        { id: "v1-prac-1", title: "Treinamento de validação em campo", bestPractice: "Simulações e role-play de situações reais" },
        { id: "v1-prac-2", title: "Exercícios guiados de identificação de fatores", bestPractice: "Observação estruturada em atividades de rotina" },
        { id: "v1-prac-3", title: "Intervenções de liderança supervisionadas", bestPractice: "Acompanhamento do núcleo nas primeiras intervenções" },
      ],
      structure: [
        { id: "v1-struct-1", title: "Rotina de acompanhamento diário", bestPractice: "Check-ins rápidos com áreas piloto" },
        { id: "v1-struct-2", title: "Sistema de registro de evidências operacional", bestPractice: "Portal atualizado com casos práticos" },
        { id: "v1-struct-3", title: "Reunião semanal de validação", bestPractice: "Revisão de evidências e ajustes táticos" },
      ],
      indicators: [
        { id: "v1-ind-1", title: "Dashboard de evidências em tempo real", bestPractice: "Visibilidade de intervenções por área" },
        { id: "v1-ind-2", title: "Análise qualitativa das intervenções", bestPractice: "Classificar por tipo e efetividade" },
        { id: "v1-ind-3", title: "Comparativo com baseline da fase M", bestPractice: "Medir evolução comportamental" },
      ],
    }),
  },
  {
    id: "V2",
    phase: "V",
    phaseName: "Validar",
    title: "Validação Coletiva: O Poder de Reforçar o Certo",
    context: "Intensifica as práticas de reforço positivo para consolidar comportamentos desejados. Através de reconhecimento, feedback estruturado e diálogos contínuos, a cultura de fatores humanos se estabelece. O foco é transformar ações pontuais em hábitos organizacionais, fortalecendo o poder coletivo de reforçar o certo.",
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
        { id: "v2-lead-1", title: "Capacitação em técnicas de reforço comportamental", bestPractice: "Feedback positivo, corretivo e construtivo" },
        { id: "v2-lead-2", title: "Agenda fixa de diálogos de liderança", bestPractice: "Mínimo 1 diálogo semanal por equipe" },
        { id: "v2-lead-3", title: "Mentoria ativa de comportamentos", bestPractice: "Líderes como modelos de referência visíveis" },
      ],
      communication: [
        { id: "v2-comm-1", title: "Campanha de reconhecimento MVP", bestPractice: "Visibilidade ampla para bons exemplos" },
        { id: "v2-comm-2", title: "Painel de destaques comportamentais", bestPractice: "Mural físico ou digital atualizado semanalmente" },
        { id: "v2-comm-3", title: "Histórias de sucesso compartilhadas", bestPractice: "Cases reais da organização em múltiplos canais" },
      ],
      indicators: [
        { id: "v2-ind-1", title: "Métricas de reconhecimento por área", bestPractice: "Quantificar e qualificar reconhecimentos" },
        { id: "v2-ind-2", title: "Índice de diálogos realizados", bestPractice: "Acompanhar aderência da liderança" },
        { id: "v2-ind-3", title: "Evolução de indicadores comportamentais", bestPractice: "Comparar com baseline e V1" },
      ],
    }),
  },
  {
    id: "V3",
    phase: "V",
    phaseName: "Validar",
    title: "Liderança em Ação: Validar para Perpetuar",
    context: "Fechamento da fase Validar com mensuração rigorosa de resultados. Indicadores objetivos comprovam a efetividade das mudanças comportamentais. O ROI comportamental é documentado, e a liderança demonstra domínio prático que será essencial para perpetuar a cultura MVP.",
    impactedGroups: ["Toda a organização", "Núcleo de sustentação", "Alta direção"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Auditoria comportamental com métricas objetivas",
        "Relatório de ROI do programa documentado",
        "Reconhecimento formal de áreas de destaque",
        "Planejamento estruturado da fase Perpetuar",
      ],
      expectedResults: [
        "Comprovação numérica de resultados do programa",
        "Áreas de excelência e melhoria identificadas",
        "Líderes prontos para sustentar a cultura",
        "Organização validada para fase de perpetuação",
      ],
      successCriteria: [
        "Melhoria de 15% nos indicadores comportamentais",
        "ROI positivo documentado e apresentado à direção",
        "100% das áreas com plano de perpetuação",
        "Transição aprovada para fase P",
      ],
    },
    successFactors: createSuccessFactors({
      indicators: [
        { id: "v3-ind-1", title: "Auditoria comportamental abrangente", bestPractice: "Avaliar todas as áreas com critérios padronizados" },
        { id: "v3-ind-2", title: "Cálculo do ROI comportamental", bestPractice: "Documentar ganhos tangíveis e intangíveis" },
        { id: "v3-ind-3", title: "Comparativo M1-V3 completo", bestPractice: "Evidenciar evolução desde o baseline" },
      ],
      leadership: [
        { id: "v3-lead-1", title: "Certificação de líderes MVP", bestPractice: "Reconhecer formalmente líderes qualificados" },
        { id: "v3-lead-2", title: "Definição de guardiões da cultura", bestPractice: "Identificar multiplicadores por área" },
        { id: "v3-lead-3", title: "Plano de desenvolvimento contínuo", bestPractice: "Agenda de formação para fase P" },
      ],
      structure: [
        { id: "v3-struct-1", title: "Consolidação do relatório V1-V3", bestPractice: "Documento executivo para alta direção" },
        { id: "v3-struct-2", title: "Planejamento da fase Perpetuar", bestPractice: "Cronograma, recursos e responsáveis definidos" },
        { id: "v3-struct-3", title: "Cerimônia de transição para fase P", bestPractice: "Celebração e comunicação formal" },
      ],
    }),
  },

  // =====================================================
  // PERPETUAR (P1-P3) - Fase de Sustentação e Cultura
  // =====================================================
  {
    id: "P1",
    phase: "P",
    phaseName: "Perpetuar",
    title: "Do Hábito à Identidade: Quando o Radar se Torna Parte de Quem Somos",
    context: "Inicia a fase de perpetuação, onde comportamentos aprendidos se transformam em hábitos arraigados. O Radar deixa de ser uma ferramenta externa e passa a ser uma extensão natural da forma de trabalhar. A mudança comportamental se enraíza na identidade organizacional.",
    impactedGroups: ["Toda a organização", "Novos colaboradores", "Liderança"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Integração do MVP aos processos de onboarding",
        "Rotinas de reforço incorporadas à gestão diária",
        "Sistema de mentoria interno operacional",
        "Indicadores comportamentais em dashboards de gestão",
      ],
      expectedResults: [
        "Novos colaboradores já entram na cultura MVP",
        "Comportamentos MVP visíveis sem supervisão",
        "Líderes mentorando naturalmente suas equipes",
        "Indicadores comportamentais estáveis ou em melhoria",
      ],
      successCriteria: [
        "100% dos novos colaboradores com onboarding MVP",
        "Mínimo 90% de aderência aos rituais de gestão",
        "Zero regressão nos indicadores comportamentais",
        "Mentoria ativa em todas as áreas",
      ],
    },
    successFactors: createSuccessFactors({
      structure: [
        { id: "p1-struct-1", title: "Integração do MVP ao onboarding", bestPractice: "Radar e conceitos no primeiro dia" },
        { id: "p1-struct-2", title: "Rituais de gestão com componente MVP", bestPractice: "Fatores humanos em todas as reuniões operacionais" },
        { id: "p1-struct-3", title: "Sistema de mentoria estruturado", bestPractice: "Cada novo colaborador com um mentor MVP" },
      ],
      leadership: [
        { id: "p1-lead-1", title: "Liderança como guardiã da cultura", bestPractice: "Comportamento exemplar e consistente" },
        { id: "p1-lead-2", title: "Coaching comportamental contínuo", bestPractice: "Feedback regular e específico" },
        { id: "p1-lead-3", title: "Reconhecimento natural e frequente", bestPractice: "Integrado à rotina, não só em eventos" },
      ],
      indicators: [
        { id: "p1-ind-1", title: "Monitoramento de regressão", bestPractice: "Alertas precoces para quedas de indicadores" },
        { id: "p1-ind-2", title: "Indicadores em dashboards de gestão", bestPractice: "Visibilidade para toda liderança" },
        { id: "p1-ind-3", title: "Pesquisa de percepção cultural", bestPractice: "Medir enraizamento da cultura MVP" },
      ],
    }),
  },
  {
    id: "P2",
    phase: "P",
    phaseName: "Perpetuar",
    title: "O Legado MVP: Sustentando o Futuro",
    context: "Consolida os mecanismos de sustentação de longo prazo. A organização desenvolve capacidade interna de renovar e adaptar o programa. O legado MVP se materializa em estruturas, processos e pessoas capazes de manter a cultura viva independentemente de mudanças organizacionais.",
    impactedGroups: ["Liderança sênior", "RH e Desenvolvimento", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Formação de multiplicadores internos avançados",
        "Documentação do conhecimento MVP da organização",
        "Integração com sistemas de gestão de desempenho",
        "Planejamento de sucessão para papéis-chave do MVP",
      ],
      expectedResults: [
        "Multiplicadores capazes de treinar novos colaboradores",
        "Base de conhecimento documentada e acessível",
        "MVP conectado a avaliações e reconhecimentos formais",
        "Plano de continuidade para todos os papéis críticos",
      ],
      successCriteria: [
        "Mínimo 3 multiplicadores certificados por área",
        "100% do conhecimento MVP documentado",
        "Critérios MVP em avaliação de desempenho",
        "Plano de sucessão para núcleo de sustentação",
      ],
    },
    successFactors: createSuccessFactors({
      structure: [
        { id: "p2-struct-1", title: "Programa de multiplicadores internos", bestPractice: "Formar pessoas capazes de sustentar o MVP" },
        { id: "p2-struct-2", title: "Base de conhecimento documentada", bestPractice: "Wiki, manuais e materiais de referência" },
        { id: "p2-struct-3", title: "Planejamento de sucessão", bestPractice: "Garantir continuidade dos papéis-chave" },
      ],
      practice: [
        { id: "p2-prac-1", title: "Certificação de multiplicadores", bestPractice: "Avaliação prática e teórica" },
        { id: "p2-prac-2", title: "Simulações de cenários de risco", bestPractice: "Testar resposta a fatores humanos críticos" },
        { id: "p2-prac-3", title: "Casos práticos documentados", bestPractice: "Histórias reais para treinamento" },
      ],
      indicators: [
        { id: "p2-ind-1", title: "MVP em avaliação de desempenho", bestPractice: "Critérios comportamentais na avaliação" },
        { id: "p2-ind-2", title: "Métricas de sustentação", bestPractice: "Indicadores de longo prazo definidos" },
        { id: "p2-ind-3", title: "Auditoria de capacidade interna", bestPractice: "Avaliar prontidão para independência" },
      ],
    }),
  },
  {
    id: "P3",
    phase: "P",
    phaseName: "Perpetuar",
    title: "Cultura Viva: Integrando o MVP à Gestão e à Organização",
    context: "O ciclo final do programa. O MVP deixa de ser um 'programa' e se torna parte inseparável da identidade organizacional. A cultura de fatores humanos está plenamente integrada à gestão, aos processos e às pessoas. A organização demonstra capacidade autônoma de sustentar e evoluir sua cultura comportamental.",
    impactedGroups: ["Toda a organização", "Alta direção", "Núcleo de sustentação"],
    estimatedDuration: "~30 dias",
    expectations: {
      whatHappens: [
        "Celebração formal da conclusão do programa",
        "Relatório final com todos os resultados do programa",
        "Definição do modelo de gestão contínua pós-programa",
        "Transição do núcleo para estrutura permanente",
      ],
      expectedResults: [
        "Cultura MVP plenamente integrada à organização",
        "Resultados do programa documentados e celebrados",
        "Modelo de gestão contínua definido e aprovado",
        "Estrutura permanente de sustentação estabelecida",
      ],
      successCriteria: [
        "Melhoria de 25%+ nos indicadores desde M1",
        "100% de sustentação por capacidade interna",
        "Aprovação formal da alta direção",
        "Plano de evolução para próximos 12 meses",
      ],
    },
    successFactors: createSuccessFactors({
      leadership: [
        { id: "p3-lead-1", title: "Comunicação de conclusão pela alta direção", bestPractice: "Mensagem de celebração e continuidade" },
        { id: "p3-lead-2", title: "Compromisso público de sustentação", bestPractice: "Declaração formal de manutenção da cultura" },
        { id: "p3-lead-3", title: "Reconhecimento de contribuições especiais", bestPractice: "Celebrar pessoas-chave do programa" },
      ],
      structure: [
        { id: "p3-struct-1", title: "Transição para estrutura permanente", bestPractice: "Núcleo evolui para função permanente" },
        { id: "p3-struct-2", title: "Modelo de governança contínua", bestPractice: "Rituais, papéis e responsabilidades definidos" },
        { id: "p3-struct-3", title: "Plano de evolução 12 meses", bestPractice: "Próximos passos claros e aprovados" },
      ],
      indicators: [
        { id: "p3-ind-1", title: "Relatório final do programa", bestPractice: "Documento executivo com todos os resultados" },
        { id: "p3-ind-2", title: "Comparativo M1-P3 completo", bestPractice: "Evolução total documentada" },
        { id: "p3-ind-3", title: "Indicadores de sustentação definidos", bestPractice: "Métricas contínuas para o futuro" },
      ],
    }),
  },
];

export function getCycleById(id: string): MVPCycle | undefined {
  return mvpCycles.find(c => c.id === id);
}

export function getCyclesByPhase(phase: "M" | "V" | "P"): MVPCycle[] {
  return mvpCycles.filter(c => c.phase === phase);
}
