// ============================================================
// MVP Best Practices Database
// Curated practices per cycle with actionable checklists
// ============================================================

export interface BestPractice {
  id: string;
  cycleId: string;
  title: string;
  description: string;
  whenToUse: string;
  checklist: string[];
  suggestedActionTitle: string;
  suggestedDaysToComplete: number;
  category: "communication" | "leadership" | "practice" | "structure" | "indicators";
  imageUrl?: string;
}

// Placeholder images for best practices (using Unsplash for demo)
const PRACTICE_IMAGES = {
  communication: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop",
  leadership: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
  practice: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=250&fit=crop",
  structure: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
  indicators: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
};

export const bestPractices: BestPractice[] = [
  // =====================================================
  // M1 - Conceito MVP e Radar Pessoal
  // =====================================================
  {
    id: "bp-m1-1",
    cycleId: "M1",
    title: "Campanha de Lançamento Impactante",
    description: "Crie uma campanha de comunicação multicanal que gere expectativa e curiosidade sobre o programa MVP antes do lançamento oficial.",
    whenToUse: "No início do programa, 1-2 semanas antes do primeiro workshop",
    checklist: [
      "Definir 3 mensagens-chave do programa",
      "Criar material visual (banners, cartazes)",
      "Preparar email de convocação da liderança",
      "Agendar posts em canais internos",
      "Preparar FAQ básico sobre o programa",
    ],
    suggestedActionTitle: "Executar campanha de lançamento M1",
    suggestedDaysToComplete: 14,
    category: "communication",
    imageUrl: PRACTICE_IMAGES.communication,
  },
  {
    id: "bp-m1-2",
    cycleId: "M1",
    title: "Workshop de Sensibilização Estruturado",
    description: "Realize workshops de até 2 horas conectando fatores humanos com segurança e produtividade, garantindo participação ativa da liderança.",
    whenToUse: "Para aplicar o Radar Pessoal com qualidade e engajamento",
    checklist: [
      "Reservar sala adequada (máx. 20 pessoas)",
      "Confirmar presença de 100% da liderança",
      "Preparar material de apoio e dinâmicas",
      "Garantir ambiente calmo para reflexão",
      "Prever tempo para dúvidas e esclarecimentos",
    ],
    suggestedActionTitle: "Conduzir workshop de sensibilização",
    suggestedDaysToComplete: 7,
    category: "practice",
    imageUrl: PRACTICE_IMAGES.practice,
  },
  {
    id: "bp-m1-3",
    cycleId: "M1",
    title: "Liderança pelo Exemplo",
    description: "Garanta que todos os líderes apliquem o Radar Pessoal antes de suas equipes, demonstrando compromisso visível com o programa.",
    whenToUse: "Antes de iniciar a aplicação em massa",
    checklist: [
      "Agendar sessão exclusiva com liderança",
      "Comunicar importância do exemplo",
      "Documentar participação de 100% dos líderes",
      "Preparar feedback inicial para compartilhar",
    ],
    suggestedActionTitle: "Aplicar Radar Pessoal com liderança",
    suggestedDaysToComplete: 5,
    category: "leadership",
    imageUrl: PRACTICE_IMAGES.leadership,
  },

  // =====================================================
  // M2 - Radar Social
  // =====================================================
  {
    id: "bp-m2-1",
    cycleId: "M2",
    title: "Facilitação Segura do Radar Social",
    description: "Conduza aplicações do Radar Social em grupos de 8-12 pessoas, criando ambiente psicologicamente seguro para respostas honestas.",
    whenToUse: "Para mapear fatores humanos no nível de equipe",
    checklist: [
      "Dividir organização em grupos menores",
      "Garantir confidencialidade dos dados",
      "Treinar facilitadores internos",
      "Preparar roteiro de aplicação padrão",
      "Definir horários sem interrupções",
    ],
    suggestedActionTitle: "Facilitar Radar Social por área",
    suggestedDaysToComplete: 21,
    category: "practice",
    imageUrl: PRACTICE_IMAGES.practice,
  },
  {
    id: "bp-m2-2",
    cycleId: "M2",
    title: "Diálogos de Liderança MVP",
    description: "Implemente conversas estruturadas entre líderes e equipes sobre fatores humanos, usando técnicas de escuta ativa e questionamento.",
    whenToUse: "Para iniciar a cultura de feedback comportamental",
    checklist: [
      "Treinar gestores em técnicas de diálogo",
      "Definir pauta mínima para conversas",
      "Estabelecer frequência semanal",
      "Criar registro simples de diálogos realizados",
    ],
    suggestedActionTitle: "Iniciar diálogos de liderança semanais",
    suggestedDaysToComplete: 7,
    category: "leadership",
    imageUrl: PRACTICE_IMAGES.leadership,
  },
  {
    id: "bp-m2-3",
    cycleId: "M2",
    title: "Mapa de Vulnerabilidades por Setor",
    description: "Consolide resultados do Radar Social em um mapa visual que identifica áreas com maior necessidade de atenção comportamental.",
    whenToUse: "Após concluir aplicação do Radar Social em todas as áreas",
    checklist: [
      "Consolidar dados por setor/área",
      "Identificar padrões recorrentes",
      "Classificar vulnerabilidades por criticidade",
      "Apresentar resultados ao núcleo",
      "Definir prioridades de intervenção",
    ],
    suggestedActionTitle: "Elaborar mapa de vulnerabilidades",
    suggestedDaysToComplete: 10,
    category: "indicators",
    imageUrl: PRACTICE_IMAGES.indicators,
  },

  // =====================================================
  // M3 - Liderança em Movimento
  // =====================================================
  {
    id: "bp-m3-1",
    cycleId: "M3",
    title: "Treinamento Intensivo de Líderes",
    description: "Capacitação focada em comportamentos observáveis e técnicas de intervenção prática para transformar diagnósticos em ações.",
    whenToUse: "Para preparar liderança para a fase Validar",
    checklist: [
      "Definir competências-alvo do treinamento",
      "Incluir simulações práticas",
      "Usar cases reais da organização",
      "Garantir 100% de participação",
      "Avaliar aprendizado ao final",
    ],
    suggestedActionTitle: "Executar treinamento intensivo de líderes",
    suggestedDaysToComplete: 14,
    category: "leadership",
    imageUrl: PRACTICE_IMAGES.leadership,
  },
  {
    id: "bp-m3-2",
    cycleId: "M3",
    title: "Planos de Ação por Gestor",
    description: "Cada gestor elabora seu plano de ação específico com mínimo 2 ações mensuráveis para a fase Validar.",
    whenToUse: "Antes de encerrar a fase Monitorar",
    checklist: [
      "Disponibilizar template de plano de ação",
      "Definir ações específicas e mensuráveis",
      "Estabelecer prazos realistas",
      "Validar planos com núcleo de sustentação",
    ],
    suggestedActionTitle: "Elaborar planos de ação individuais",
    suggestedDaysToComplete: 10,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
  {
    id: "bp-m3-3",
    cycleId: "M3",
    title: "Relatório Consolidado M1-M3",
    description: "Documente formalmente a jornada da fase Monitorar com diagnósticos, aprendizados e recomendações para próxima fase.",
    whenToUse: "Ao concluir a fase Monitorar",
    checklist: [
      "Compilar dados dos três ciclos",
      "Analisar evolução de indicadores",
      "Documentar lições aprendidas",
      "Incluir recomendações para fase V",
      "Apresentar para alta direção",
    ],
    suggestedActionTitle: "Produzir relatório consolidado da fase M",
    suggestedDaysToComplete: 7,
    category: "indicators",
    imageUrl: PRACTICE_IMAGES.indicators,
  },

  // =====================================================
  // V1 - Da Atenção à Validação
  // =====================================================
  {
    id: "bp-v1-1",
    cycleId: "V1",
    title: "Exercícios de Campo Estruturados",
    description: "Aplique conceitos MVP em situações reais de trabalho com observação guiada e registro sistemático de intervenções.",
    whenToUse: "Para transformar teoria em prática no dia a dia",
    checklist: [
      "Definir áreas piloto para início",
      "Preparar checklist de observação",
      "Treinar observadores internos",
      "Estabelecer rotina de registro",
      "Fazer debriefing diário nos primeiros dias",
    ],
    suggestedActionTitle: "Implantar exercícios de campo estruturados",
    suggestedDaysToComplete: 14,
    category: "practice",
    imageUrl: PRACTICE_IMAGES.practice,
  },
  {
    id: "bp-v1-2",
    cycleId: "V1",
    title: "Sistema de Registro de Evidências",
    description: "Implemente processo simples e eficiente para documentar aplicações práticas de fatores humanos no cotidiano.",
    whenToUse: "Para criar base de casos reais",
    checklist: [
      "Definir formato padrão de registro",
      "Treinar equipe no uso do portal",
      "Estabelecer meta semanal de registros",
      "Criar ritual de revisão de evidências",
    ],
    suggestedActionTitle: "Ativar sistema de registro de evidências",
    suggestedDaysToComplete: 7,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
  {
    id: "bp-v1-3",
    cycleId: "V1",
    title: "Supervisão de Primeiras Intervenções",
    description: "Acompanhe de perto as primeiras intervenções de liderança para garantir qualidade e dar feedback construtivo.",
    whenToUse: "Nas primeiras semanas da fase Validar",
    checklist: [
      "Definir critérios de qualidade de intervenção",
      "Acompanhar primeiras intervenções presencialmente",
      "Dar feedback imediato e construtivo",
      "Documentar boas práticas observadas",
    ],
    suggestedActionTitle: "Supervisionar primeiras intervenções",
    suggestedDaysToComplete: 21,
    category: "leadership",
    imageUrl: PRACTICE_IMAGES.leadership,
  },

  // =====================================================
  // V2 - Validação Coletiva
  // =====================================================
  {
    id: "bp-v2-1",
    cycleId: "V2",
    title: "Programa de Reconhecimento MVP",
    description: "Implemente sistema de reconhecimento público para comportamentos positivos relacionados a fatores humanos.",
    whenToUse: "Para consolidar cultura de reforço positivo",
    checklist: [
      "Definir critérios de reconhecimento",
      "Criar canal de visibilidade (mural, digital)",
      "Estabelecer frequência mínima por área",
      "Envolver liderança no processo",
      "Celebrar casos de destaque",
    ],
    suggestedActionTitle: "Lançar programa de reconhecimento MVP",
    suggestedDaysToComplete: 14,
    category: "communication",
    imageUrl: PRACTICE_IMAGES.communication,
  },
  {
    id: "bp-v2-2",
    cycleId: "V2",
    title: "Agenda Fixa de Diálogos",
    description: "Estabeleça rotina semanal de conversas estruturadas entre líderes e equipes sobre fatores humanos.",
    whenToUse: "Para criar hábito de feedback contínuo",
    checklist: [
      "Definir dia/horário fixo por equipe",
      "Preparar pauta mínima estruturada",
      "Garantir participação de 100% da liderança",
      "Registrar realização no portal",
    ],
    suggestedActionTitle: "Implementar agenda fixa de diálogos",
    suggestedDaysToComplete: 7,
    category: "leadership",
    imageUrl: PRACTICE_IMAGES.leadership,
  },
  {
    id: "bp-v2-3",
    cycleId: "V2",
    title: "Painel de Destaques Comportamentais",
    description: "Crie espaço físico ou digital para visibilidade de bons exemplos e cases de sucesso comportamental.",
    whenToUse: "Para amplificar reconhecimento e engajamento",
    checklist: [
      "Escolher local de alta visibilidade",
      "Definir formato e frequência de atualização",
      "Incluir fotos e depoimentos",
      "Renovar conteúdo semanalmente",
    ],
    suggestedActionTitle: "Criar e manter painel de destaques",
    suggestedDaysToComplete: 10,
    category: "communication",
    imageUrl: PRACTICE_IMAGES.communication,
  },

  // =====================================================
  // V3 - Liderança em Ação
  // =====================================================
  {
    id: "bp-v3-1",
    cycleId: "V3",
    title: "Multiplicadores Internos",
    description: "Forme agentes de mudança capacitados a multiplicar conhecimento e práticas MVP em suas áreas.",
    whenToUse: "Para escalar o programa de forma sustentável",
    checklist: [
      "Selecionar candidatos por critérios claros",
      "Desenvolver programa de formação",
      "Definir papel e responsabilidades",
      "Criar rede de suporte entre multiplicadores",
    ],
    suggestedActionTitle: "Formar multiplicadores internos",
    suggestedDaysToComplete: 21,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
  {
    id: "bp-v3-2",
    cycleId: "V3",
    title: "Relatório Consolidado da Fase V",
    description: "Documente resultados da fase Validar com evidências de mudança comportamental e preparação para Perpetuar.",
    whenToUse: "Ao concluir a fase Validar",
    checklist: [
      "Compilar evidências dos três ciclos V",
      "Analisar evolução de indicadores vs. baseline",
      "Documentar cases de sucesso",
      "Preparar recomendações para fase P",
    ],
    suggestedActionTitle: "Produzir relatório consolidado da fase V",
    suggestedDaysToComplete: 10,
    category: "indicators",
    imageUrl: PRACTICE_IMAGES.indicators,
  },
  {
    id: "bp-v3-3",
    cycleId: "V3",
    title: "Validação Formal de Transição",
    description: "Realize checklist formal de prontidão para avançar à fase Perpetuar com aprovação do núcleo e alta direção.",
    whenToUse: "Antes de encerrar a fase Validar",
    checklist: [
      "Aplicar checklist de prontidão",
      "Verificar indicadores de conclusão",
      "Obter aprovação formal do núcleo",
      "Comunicar transição à organização",
    ],
    suggestedActionTitle: "Executar validação formal de transição",
    suggestedDaysToComplete: 7,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },

  // =====================================================
  // P1 - Do Hábito à Identidade
  // =====================================================
  {
    id: "bp-p1-1",
    cycleId: "P1",
    title: "Rituais Organizacionais MVP",
    description: "Incorpore práticas MVP em rituais existentes da organização (reuniões, DDS, check-ins) para torná-las naturais.",
    whenToUse: "Para transformar hábitos em identidade organizacional",
    checklist: [
      "Mapear rituais existentes na organização",
      "Identificar pontos de integração MVP",
      "Adaptar práticas aos rituais",
      "Treinar responsáveis pelos rituais",
      "Monitorar aderência nas primeiras semanas",
    ],
    suggestedActionTitle: "Integrar MVP aos rituais organizacionais",
    suggestedDaysToComplete: 21,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
  {
    id: "bp-p1-2",
    cycleId: "P1",
    title: "Histórias de Identidade MVP",
    description: "Colete e compartilhe narrativas de como o MVP transformou comportamentos e resultados na organização.",
    whenToUse: "Para criar conexão emocional com a cultura MVP",
    checklist: [
      "Identificar cases de transformação pessoal",
      "Documentar histórias em formato envolvente",
      "Criar canal de compartilhamento",
      "Incluir líderes como contadores de histórias",
    ],
    suggestedActionTitle: "Coletar e compartilhar histórias MVP",
    suggestedDaysToComplete: 14,
    category: "communication",
    imageUrl: PRACTICE_IMAGES.communication,
  },
  {
    id: "bp-p1-3",
    cycleId: "P1",
    title: "Autonomia dos Multiplicadores",
    description: "Transfira gradualmente responsabilidades de facilitação e acompanhamento para multiplicadores internos.",
    whenToUse: "Para garantir sustentabilidade sem dependência externa",
    checklist: [
      "Definir atividades a serem transferidas",
      "Capacitar multiplicadores adicionalmente",
      "Acompanhar primeiras conduções autônomas",
      "Estabelecer suporte de retaguarda",
    ],
    suggestedActionTitle: "Ampliar autonomia dos multiplicadores",
    suggestedDaysToComplete: 21,
    category: "leadership",
    imageUrl: PRACTICE_IMAGES.leadership,
  },

  // =====================================================
  // P2 - O Legado MVP
  // =====================================================
  {
    id: "bp-p2-1",
    cycleId: "P2",
    title: "Documentação do Legado",
    description: "Registre formalmente todo conhecimento, processos e lições aprendidas do programa MVP para perpetuação.",
    whenToUse: "Para garantir memória organizacional",
    checklist: [
      "Compilar todos os materiais do programa",
      "Documentar processos e procedimentos",
      "Registrar lições aprendidas",
      "Criar repositório acessível",
      "Definir responsável pela manutenção",
    ],
    suggestedActionTitle: "Criar documentação formal do legado MVP",
    suggestedDaysToComplete: 21,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
  {
    id: "bp-p2-2",
    cycleId: "P2",
    title: "Plano de Sustentação",
    description: "Elabore plano detalhado de como manter o MVP vivo após o término do programa formal.",
    whenToUse: "Para garantir continuidade a longo prazo",
    checklist: [
      "Definir estrutura de governança permanente",
      "Estabelecer indicadores de acompanhamento",
      "Planejar reciclagens periódicas",
      "Incluir MVP em onboarding de novos colaboradores",
    ],
    suggestedActionTitle: "Elaborar plano de sustentação MVP",
    suggestedDaysToComplete: 14,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
  {
    id: "bp-p2-3",
    cycleId: "P2",
    title: "Reconhecimento do Legado",
    description: "Celebre formalmente as conquistas do programa e reconheça os protagonistas da transformação.",
    whenToUse: "Ao concluir a jornada principal do MVP",
    checklist: [
      "Planejar evento de celebração",
      "Preparar reconhecimentos individuais",
      "Documentar resultados alcançados",
      "Comunicar conquistas à organização",
    ],
    suggestedActionTitle: "Organizar celebração do legado MVP",
    suggestedDaysToComplete: 14,
    category: "communication",
    imageUrl: PRACTICE_IMAGES.communication,
  },

  // =====================================================
  // P3 - Cultura Viva
  // =====================================================
  {
    id: "bp-p3-1",
    cycleId: "P3",
    title: "MVP na Gestão de Pessoas",
    description: "Integre conceitos MVP aos processos de avaliação, feedback e desenvolvimento de pessoas.",
    whenToUse: "Para incorporar MVP ao ciclo de gestão de pessoas",
    checklist: [
      "Incluir competências MVP em avaliações",
      "Integrar ao processo de feedback contínuo",
      "Considerar em decisões de promoção",
      "Incluir em programas de desenvolvimento",
    ],
    suggestedActionTitle: "Integrar MVP à gestão de pessoas",
    suggestedDaysToComplete: 30,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
  {
    id: "bp-p3-2",
    cycleId: "P3",
    title: "Indicadores de Cultura MVP",
    description: "Estabeleça métricas permanentes para monitorar a saúde da cultura comportamental na organização.",
    whenToUse: "Para garantir acompanhamento contínuo",
    checklist: [
      "Definir indicadores-chave de cultura",
      "Estabelecer frequência de medição",
      "Incluir em dashboards executivos",
      "Definir metas e alertas automáticos",
    ],
    suggestedActionTitle: "Implantar indicadores permanentes de cultura",
    suggestedDaysToComplete: 21,
    category: "indicators",
    imageUrl: PRACTICE_IMAGES.indicators,
  },
  {
    id: "bp-p3-3",
    cycleId: "P3",
    title: "Ciclo de Melhoria Contínua",
    description: "Estabeleça processo permanente de revisão e aprimoramento das práticas MVP na organização.",
    whenToUse: "Para garantir evolução contínua do programa",
    checklist: [
      "Definir frequência de revisão (ex: trimestral)",
      "Estabelecer fórum de melhoria contínua",
      "Criar canal para sugestões",
      "Documentar e implementar melhorias aprovadas",
    ],
    suggestedActionTitle: "Implantar ciclo de melhoria contínua MVP",
    suggestedDaysToComplete: 14,
    category: "structure",
    imageUrl: PRACTICE_IMAGES.structure,
  },
];

// Get best practices by cycle
export function getBestPracticesByCycle(cycleId: string): BestPractice[] {
  return bestPractices.filter(bp => bp.cycleId === cycleId);
}

// Get all best practices
export function getAllBestPractices(): BestPractice[] {
  return bestPractices;
}
