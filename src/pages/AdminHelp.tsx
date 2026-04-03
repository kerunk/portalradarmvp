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
  LayoutDashboard, FolderOpen, Database, Bell, Eye, Lock, AlertTriangle,
  RefreshCw, Download, Upload, ToggleLeft, Trash2, UserPlus, FolderInput
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminRoleForUser, type AdminRole, ADMIN_ROLE_LABELS } from "@/lib/permissions";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  content: string[];
  /** Restrict to specific admin roles. undefined = all roles */
  roles?: AdminRole[];
}

/* ═══════════════════════════════════════════════════════════
   CONTEÚDO DO MANUAL — ATUALIZADO CONFORME PLATAFORMA ATUAL
   ═══════════════════════════════════════════════════════════ */

const helpSections: HelpSection[] = [
  // ── FUNDAMENTOS ──
  {
    id: "overview",
    title: "Visão Geral da Plataforma",
    icon: LayoutDashboard,
    category: "Fundamentos",
    content: [
      "A plataforma MVP é o sistema centralizado de gestão do Programa MVP (Mudança, Validação e Perpetuação). Ela permite que a equipe MVP gerencie múltiplas empresas clientes e acompanhe a evolução da transformação cultural de cada organização.",
      "**Perfis administrativos:**",
      "• **Administrador MVP Master** — Controle total da plataforma: cria e gerencia outros administradores, edita configurações globais (indicadores, manual, prateleira de práticas, fatores de sucesso), visualiza todas as empresas da carteira",
      "• **Administrador MVP** — Equipe interna MVP: cria empresas, visualiza toda a carteira, acompanha indicadores e relatórios. Não pode gerenciar outros administradores nem editar configurações globais",
      "• **Gerente de Conta** — Responsável pelas empresas que criou: visualiza e gerencia apenas sua carteira própria. Não pode ver empresas de outros gerentes nem editar configurações globais",
      "**Estrutura do menu lateral (Admin Master):**",
      "• **Controle da Plataforma** — Dashboard, Empresas, Usuários, Notificações",
      "• **Inteligência** — Indicadores, Relatórios",
      "• **Administração do Sistema** — Fatores de Sucesso Globais, Prateleira de Práticas, Manual Global MVP, Config. Indicadores, Ajuda da Plataforma, Configurações",
      "**Observação:** O menu lateral se adapta automaticamente ao perfil do administrador. Itens de Administração do Sistema só aparecem para o Admin Master.",
    ],
  },
  {
    id: "login-seguranca",
    title: "Login e Segurança",
    icon: Lock,
    category: "Fundamentos",
    content: [
      "O sistema possui um fluxo de segurança obrigatório para todos os usuários:",
      "**Primeiro acesso:**",
      "1. O administrador cria o usuário (admin ou empresa) e uma senha temporária é gerada",
      "2. No primeiro login, o sistema exige obrigatoriamente a troca da senha",
      "3. Somente após trocar a senha o usuário tem acesso ao portal",
      "**Proteção contra força bruta:**",
      "• Após 5 tentativas de login incorretas, a conta é bloqueada temporariamente",
      "• O tempo de bloqueio é progressivo",
      "**Usuários inativos:**",
      "• Usuários desativados pelo administrador não conseguem fazer login",
      "• A mensagem exibida é genérica ('Credenciais inválidas') para evitar enumeração de contas",
      "**Troca de senha:**",
      "• Disponível em Configurações para qualquer usuário logado",
      "• Exige a senha atual antes de definir a nova",
    ],
  },
  {
    id: "dashboard-admin",
    title: "Dashboard Administrativo",
    icon: BarChart3,
    category: "Fundamentos",
    content: [
      "O Dashboard é o painel de inteligência da carteira. Mostra dados consolidados de todas as empresas ativas sem revelar detalhes operacionais internos de cada empresa.",
      "**Indicadores principais (cards superiores):**",
      "• **Empresas Ativas** — Total de empresas com status ativo (exclui inativas e excluídas)",
      "• **Empresas Inativas** — Total de empresas desativadas pelo administrador",
      "• **Colaboradores** — Total cadastrados + quantos já foram treinados",
      "• **Maturidade Média** — Índice médio de maturidade de todas as empresas ativas",
      "• **Cobertura Média** — Percentual médio de treinamento da carteira",
      "• **Turmas Realizadas** — Total de turmas concluídas em todas as empresas",
      "• **Ações Concluídas** — Total agregado de ações concluídas",
      "• **Ações Atrasadas** — Total agregado de ações em atraso",
      "• **Ciclos em Andamento** — Total de ciclos ativos em progresso",
      "**Painel de Saúde da Implementação:**",
      "• 🟢 **Saudável** — Sem ações atrasadas, cobertura acima de 15%, maturidade adequada",
      "• 🟡 **Atenção** — 1-2 ações atrasadas, cobertura < 15% ou maturidade < 20%",
      "• 🔴 **Risco** — 3+ ações atrasadas ou cobertura < 5%",
      "**Cards clicáveis (drill-down administrativo):**",
      "• Clique em 'Empresas Ativas' → abre a lista de empresas",
      "• Clique em 'Ações Atrasadas' → abre a tela de ações atrasadas com detalhamento por empresa",
      "• Clique em 'Ciclos em Andamento' → abre a tela de ciclos ativos",
      "**Importante:** Os drill-downs são sempre administrativos e consolidados. Nunca levam diretamente ao portal operacional do cliente.",
    ],
  },

  // ── CONTROLE ──
  {
    id: "companies",
    title: "Gestão de Empresas",
    icon: Building2,
    category: "Controle",
    content: [
      "A tela **Empresas** é onde você cadastra, gerencia e monitora todas as empresas clientes.",
      "**Criar empresa:**",
      "1. Clique em 'Nova Empresa'",
      "2. Preencha: Nome da empresa, Número de colaboradores, Nome do administrador, Email do administrador",
      "3. Uma senha temporária é gerada automaticamente",
      "4. Um PDF de boas-vindas com credenciais pode ser exportado",
      "5. O cliente recebe acesso ao portal com onboarding obrigatório",
      "**Editar empresa:**",
      "• Clique no ícone de edição para alterar dados cadastrais (nome, setor, contato)",
      "• Alterações são refletidas imediatamente em todas as telas",
      "**Inativar empresa:**",
      "• Bloqueia o login de todos os usuários da empresa",
      "• Preserva 100% do histórico para os administradores",
      "• A empresa some dos dashboards de empresas ativas, mas é contada separadamente como 'Inativa'",
      "• Pode ser reativada a qualquer momento",
      "**Excluir empresa:**",
      "• Exclusão lógica (soft delete) — a empresa é ocultada permanentemente",
      "• Operação irreversível na interface (apenas Admin Master pode excluir)",
      "**Modo Espelho (Portal-Espelho):**",
      "• Clique no nome de uma empresa para acessar o portal dela em modo somente leitura",
      "• Um banner amarelo identifica que você está em modo espelho",
      "• Nenhuma interação é permitida — apenas visualização",
      "• Para sair, clique em 'Voltar ao painel administrativo'",
      "**Transferência de empresas entre gerentes:**",
      "• Ao excluir um Gerente de Conta que possui empresas, o sistema exige transferência em lote (bulk transfer)",
      "• As empresas podem ser transferidas para outro gerente ou para a Carteira Administrativa",
      "**Visibilidade por perfil:**",
      "• Admin Master e Admin MVP veem todas as empresas",
      "• Gerente de Conta vê apenas as empresas que criou ou que lhe foram vinculadas",
    ],
  },
  {
    id: "users",
    title: "Gestão de Usuários Administrativos",
    icon: UserCog,
    category: "Controle",
    roles: ["admin_master"],
    content: [
      "A tela **Usuários** é exclusiva do Admin Master e permite gerenciar todos os acessos administrativos.",
      "**Perfis disponíveis para criação:**",
      "• **Administrador MVP Master** — Controle total (deve haver pelo menos 1)",
      "• **Administrador MVP** — Equipe interna com acesso à carteira completa",
      "• **Gerente de Conta** — Responsável por sua carteira específica",
      "**Criar usuário administrativo:**",
      "1. Clique em 'Novo Usuário'",
      "2. Preencha: Nome, Email, Perfil administrativo",
      "3. Uma senha temporária é gerada automaticamente",
      "4. Um PDF com credenciais pode ser exportado",
      "5. O novo usuário deverá trocar a senha no primeiro acesso",
      "**Editar usuário:**",
      "• Altere nome, email ou perfil a qualquer momento",
      "**Inativar usuário:**",
      "• Bloqueia o login sem excluir a conta",
      "• O usuário pode ser reativado depois",
      "**Excluir usuário:**",
      "• Exclusão definitiva (Admin Master apenas)",
      "• Se o usuário for Gerente de Conta com carteira ativa, é obrigatório transferir ou redistribuir as empresas antes",
      "**Regras de segurança:**",
      "• Não é possível excluir a si mesmo",
      "• Deve existir pelo menos 1 Admin Master ativo no sistema",
      "• Todas as operações são registradas no log de auditoria",
    ],
  },
  {
    id: "notifications",
    title: "Central de Notificações",
    icon: Bell,
    category: "Controle",
    content: [
      "A **Central de Notificações** centraliza todos os alertas operacionais e estratégicos.",
      "**Tipos de notificação para administradores:**",
      "• Empresa criada / inativada / reativada / excluída",
      "• Usuário criado / alterado / inativado",
      "• Empresas com ações atrasadas",
      "• Empresas paradas (30+ dias sem atividade)",
      "• Ciclos prontos para encerramento",
      "**Isolamento de alertas (RBAC):**",
      "• Admin Master e Admin MVP veem todos os alertas globais",
      "• Gerente de Conta vê apenas alertas de gestão das empresas da sua carteira",
      "• Clientes veem apenas alertas da própria empresa (sem vazamento de dados de outras)",
      "**Boas práticas:**",
      "• Verifique a central diariamente",
      "• Trate alertas de risco (🔴) imediatamente",
      "• Use os alertas como ponto de partida para entrar no modo espelho e investigar",
    ],
  },

  // ── OPERAÇÃO ──
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
      "**Público-alvo por ciclo:**",
      "• M1, M2, V1, V2, P1, P2 → Todos os colaboradores",
      "• M3, V3, P3 → Exclusivo para liderança",
      "**Estrutura de cada ciclo:**",
      "• Cada ciclo possui **Fatores de Sucesso** com ações pré-definidas pela metodologia",
      "• As ações são a estrutura principal de acompanhamento do ciclo",
      "• Cada ação pode ter: responsável, data prevista, observações e status (pendente/andamento/concluído)",
      "• Ações podem ser ativadas/desativadas pelo cliente (com justificativa se desativada)",
      "**Progresso do ciclo (3 componentes):**",
      "• Treinamento (peso 70%) — Colaboradores únicos treinados vs base populacional",
      "• Fatores de Sucesso (peso 20%) — Ações dos fatores concluídas",
      "• Ações do Ciclo (peso 10%) — Ações criadas pelo cliente dentro do ciclo",
      "**Encerramento do ciclo:**",
      "• O ciclo só pode ser encerrado quando os critérios mínimos forem atingidos",
      "• O encerramento é irreversível",
      "• Após encerrar, o próximo ciclo é liberado automaticamente",
      "**Cards clicáveis (no portal do cliente):**",
      "• Card de Treinamento → navega para Turmas do ciclo",
      "• Card de Fatores → abre os fatores de sucesso do ciclo",
      "• Card de Ações → navega para Ações & Alertas",
    ],
  },
  {
    id: "turmas",
    title: "Turmas",
    icon: Users,
    category: "Operação",
    content: [
      "As **turmas** são sessões de treinamento vinculadas a ciclos específicos.",
      "**Criar turma:**",
      "1. Defina o facilitador responsável (do Núcleo de Sustentação)",
      "2. Escolha o módulo do ciclo (ex: M1, M2)",
      "3. Selecione os participantes da Base Populacional",
      "4. Defina data de início e fim",
      "5. Registre presenças após a realização",
      "**Finalização de turma:**",
      "• Ao finalizar, a turma muda de status para 'Concluída'",
      "• A contagem de 'Turmas Realizadas' atualiza automaticamente",
      "• O critério de encerramento do ciclo reconhece turmas concluídas",
      "**Controle de duplicidade:**",
      "• Colaborador treinado em mais de uma turma do mesmo módulo conta como 1 pessoa treinada",
      "• Isso evita inflação artificial do indicador de cobertura",
      "**Impacto nos indicadores:**",
      "• Turmas alimentam a Cobertura do Programa",
      "• Turmas alimentam o componente Treinamento (70%) do progresso do ciclo",
      "• Turmas concluídas liberam o critério para encerrar o ciclo",
    ],
  },
  {
    id: "fatores-sucesso",
    title: "Fatores de Sucesso",
    icon: Target,
    category: "Operação",
    content: [
      "Os **Fatores de Sucesso** são a estrutura principal de acompanhamento dos ciclos.",
      "**Estrutura:**",
      "• Cada ciclo possui fatores de sucesso pré-definidos pela metodologia",
      "• Cada fator contém ações específicas que devem ser executadas",
      "• As ações são definidas globalmente pelo Admin Master e replicadas para todas as empresas",
      "**No portal do cliente, cada ação exibe:**",
      "• Imagem ilustrativa (quando disponível)",
      "• Título da ação",
      "• Texto explicativo ('O que deve ser feito')",
      "• Dica prática",
      "• Campos operacionais: Responsável, Data prevista, Observações, Status",
      "• Toggle ON/OFF (desativar ação com justificativa)",
      "**Contagem dinâmica:**",
      "• O contador de ações (ex: 2/5 tratadas) é recalculado automaticamente quando:",
      "  - Uma ação é criada ou excluída no Admin Master",
      "  - Uma ação muda de status",
      "  - Uma ação é desativada pelo cliente",
      "**Admin Master — Edição global:**",
      "• Em 'Fatores de Sucesso' (menu Administração do Sistema), o Master pode:",
      "  - Editar título, texto explicativo, dica prática e imagem de cada ação",
      "  - Criar ou excluir ações dentro de cada fator",
      "  - Reordenar ações",
      "• Alterações são replicadas automaticamente para todas as empresas (existentes e futuras)",
      "• Preenchimentos já feitos pelo cliente (responsável, data, observações) não são apagados",
    ],
    roles: ["admin_master"],
  },
  {
    id: "base-populacional",
    title: "Base Populacional",
    icon: Database,
    category: "Operação",
    content: [
      "A **Base Populacional** é o cadastro de todos os colaboradores da empresa que participam do programa.",
      "**Funcionalidades:**",
      "• Cadastro manual individual",
      "• Importação em lote via Excel/CSV",
      "• Exportação da base para Excel",
      "• Download do modelo de planilha para importação",
      "**Campos do colaborador:**",
      "• Nome completo, Email, Cargo, Setor, Turno",
      "**Gestão de status:**",
      "• Colaboradores são **inativados** (não excluídos) para preservar histórico",
      "• Filtros disponíveis: Ativos / Inativos / Todos",
      "• Colaboradores inativos aparecem destacados na visualização 'Todos'",
      "**Impacto nos indicadores:**",
      "• Total de ativos = denominador para cálculo de Cobertura",
      "• Inativar um colaborador recalcula automaticamente a cobertura",
      "• A importação detecta duplicatas por email e não duplica registros",
    ],
  },

  // ── INTELIGÊNCIA ──
  {
    id: "indicators",
    title: "Indicadores",
    icon: BarChart3,
    category: "Inteligência",
    content: [
      "Os **indicadores** são calculados automaticamente com base nos dados registrados.",
      "**Indicadores principais:**",
      "• **Índice de Cultura MVP** — Média ponderada: cobertura (25%), execução (25%), participação (20%), evolução (20%), presença (10%)",
      "• **Cobertura do Programa** — % de colaboradores ativos treinados (pessoas únicas ÷ base ativa × 100)",
      "• **Índice de Maturidade** — Base (15pts) + Núcleo (10pts) + Facilitadores (5pts) + Ciclos (30pts) + Ações (25pts) + Cobertura (15pts)",
      "• **Taxa Decisão → Ação** — % de decisões que geraram ações concretas",
      "• **Ações Concluídas** — Total de ações finalizadas no programa",
      "• **Ações Atrasadas** — Ações com prazo vencido e não concluídas",
      "**Faixas de maturidade:**",
      "• 0-25 → Inicial",
      "• 26-50 → Estruturando",
      "• 51-75 → Evoluindo",
      "• 76-100 → Consolidado",
      "**Visão administrativa:**",
      "• Na tela de Indicadores, o admin vê dados consolidados da carteira",
      "• Drill-downs levam a telas administrativas consolidadas (nunca ao portal do cliente)",
    ],
  },
  {
    id: "indicator-settings",
    title: "Configuração de Indicadores",
    icon: SlidersHorizontal,
    category: "Inteligência",
    roles: ["admin_master"],
    content: [
      "Em **Config. Indicadores** o Admin Master pode ajustar os parâmetros de cálculo:",
      "**Configurações disponíveis:**",
      "• Pesos de cada componente do Índice de Cultura MVP",
      "• Faixas de maturidade (limiares entre Inicial, Estruturando, Evoluindo, Consolidado)",
      "• Limites de alerta para cobertura e ações atrasadas",
      "**Boas práticas:**",
      "• Altere os pesos com cuidado — eles afetam todos os indicadores de todas as empresas",
      "• Documente qualquer alteração nos limiares",
      "• Revise semestralmente os parâmetros",
    ],
  },
  {
    id: "reports",
    title: "Relatórios",
    icon: FileText,
    category: "Inteligência",
    content: [
      "A seção **Relatórios** permite gerar análises consolidadas.",
      "**Relatórios disponíveis para admins:**",
      "• **Relatório da Carteira** — Visão consolidada de todas as empresas ativas: distribuição de maturidade, cobertura média, ranking",
      "• **Relatório por Empresa** — Indicadores individuais, progresso, pontos de atenção",
      "• **PDF de Encerramento de Ciclo** — Documentação formal do ciclo encerrado",
      "**Fonte de dados:**",
      "• Relatórios usam apenas empresas reais cadastradas e ativas",
      "• Não exibem dados de empresas inativas, excluídas ou residuais",
      "• Dados são filtrados conforme perfil do usuário (gerente vê apenas sua carteira)",
      "**Boas práticas:**",
      "• Gere relatórios mensais para reuniões de governança",
      "• Use o relatório por empresa antes de reuniões com clientes",
    ],
  },

  // ── ADMINISTRAÇÃO ──
  {
    id: "shelf",
    title: "Prateleira Global de Práticas",
    icon: BookOpen,
    category: "Administração",
    roles: ["admin_master"],
    content: [
      "A **Prateleira Global** é o repositório de melhores práticas da metodologia.",
      "**Funcionalidades:**",
      "• Cadastre práticas organizadas por categoria e módulo",
      "• As práticas ficam disponíveis como biblioteca de apoio nos portais clientes",
      "• Práticas servem como referência para inspirar ações nos fatores de sucesso",
      "**Relação com Fatores de Sucesso:**",
      "• As práticas NÃO são a mesma coisa que ações dos fatores de sucesso",
      "• Fatores de Sucesso = ações obrigatórias do ciclo (estrutura principal)",
      "• Práticas = biblioteca de referência (apoio complementar)",
      "**Boas práticas de gestão:**",
      "• Mantenha descrições claras e objetivas",
      "• Atualize regularmente com novos aprendizados do programa",
    ],
  },
  {
    id: "manual-editor",
    title: "Manual Global MVP (CMS)",
    icon: BookMarked,
    category: "Administração",
    roles: ["admin_master"],
    content: [
      "O **Manual Global MVP** é o CMS para editar o conteúdo de ajuda que aparece no portal do cliente.",
      "**Como funciona:**",
      "• Edite textos, explicações de indicadores e instruções",
      "• Adicione ou remova seções do manual",
      "• Publique uma nova versão para refletir em todos os portais clientes",
      "**Versionamento:**",
      "• Cada publicação incrementa o número da versão",
      "• A data de publicação fica registrada",
      "**Boas práticas:**",
      "• Mantenha explicações simples e voltadas para o usuário final (cliente)",
      "• Atualize o manual sempre que novas funcionalidades forem adicionadas",
      "• Use exemplos práticos para facilitar o entendimento",
    ],
  },
  {
    id: "settings",
    title: "Configurações da Plataforma",
    icon: Settings,
    category: "Administração",
    roles: ["admin_master"],
    content: [
      "Em **Configurações** o Admin Master gerencia os parâmetros gerais da plataforma.",
      "**Funcionalidades:**",
      "• Definir responsáveis pela implementação",
      "• Configurações de segurança e acesso",
      "• Troca de senha do próprio usuário",
      "**Boas práticas:**",
      "• Revise periodicamente os responsáveis cadastrados",
      "• Garanta que pelo menos 1 Admin Master esteja sempre ativo",
    ],
  },

  // ── GOVERNANÇA ──
  {
    id: "modo-espelho",
    title: "Modo Espelho (Portal-Espelho)",
    icon: Eye,
    category: "Governança",
    content: [
      "O **Modo Espelho** permite ao administrador visualizar o portal de uma empresa cliente como o próprio cliente o veria.",
      "**Como acessar:**",
      "• Na tela de Empresas, clique no nome da empresa",
      "• O portal carrega em modo somente leitura",
      "• Um banner amarelo no topo identifica que você está em modo espelho",
      "**Comportamento:**",
      "• Nenhuma interação é permitida (apenas visualização)",
      "• O menu lateral muda para o menu do cliente",
      "• Todos os dados exibidos são os da empresa selecionada",
      "• Alertas exibidos são apenas os da empresa (sem vazamento de outras)",
      "**Quando usar:**",
      "• Para investigar alertas de risco",
      "• Para preparar reuniões com o cliente",
      "• Para validar se os dados estão sendo registrados corretamente",
      "• Para entender o que o cliente está vendo",
      "**Para sair:** Clique em 'Voltar ao painel administrativo' ou use o seletor de perfil no menu",
    ],
  },
  {
    id: "rbac",
    title: "Permissões e Controle de Acesso (RBAC)",
    icon: ShieldCheck,
    category: "Governança",
    content: [
      "O sistema utiliza controle de acesso baseado em perfil (RBAC) em todas as camadas.",
      "**Admin Master pode:**",
      "• Tudo: criar/editar/inativar/excluir empresas e usuários",
      "• Editar fatores de sucesso globais, prateleira de práticas, manual, indicadores",
      "• Gerenciar outros administradores",
      "• Acessar todas as empresas via modo espelho",
      "**Admin MVP pode:**",
      "• Criar empresas e visualizar toda a carteira",
      "• Acessar indicadores, relatórios e modo espelho",
      "• NÃO pode: gerenciar usuários, editar configurações globais",
      "**Gerente de Conta pode:**",
      "• Criar empresas (que ficam automaticamente na sua carteira)",
      "• Visualizar apenas empresas da sua carteira",
      "• Acessar indicadores e relatórios da sua carteira",
      "• NÃO pode: ver empresas de outros gerentes, editar configurações globais, gerenciar usuários",
      "**Rotas protegidas:**",
      "• Cada perfil só consegue acessar as rotas permitidas",
      "• Tentativa de acessar rota sem permissão redireciona automaticamente",
      "**Log de auditoria:**",
      "• Todas as operações críticas (criar, editar, excluir, inativar) são registradas no log",
    ],
  },
  {
    id: "fluxo-onboarding",
    title: "Fluxo de Onboarding da Empresa",
    icon: RefreshCw,
    category: "Governança",
    content: [
      "Quando uma empresa é criada, ela passa por um fluxo obrigatório de onboarding.",
      "**Etapas do onboarding:**",
      "1. Admin cria a empresa → credenciais são geradas",
      "2. Cliente faz primeiro login → é obrigado a trocar a senha",
      "3. Após troca de senha → o wizard de onboarding é iniciado",
      "4. O onboarding guia a configuração inicial: logo, estrutura organizacional, base populacional, núcleo de sustentação",
      "5. Após completar o onboarding → o portal operacional completo é liberado",
      "**Enquanto o onboarding não estiver completo:**",
      "• O cliente fica restrito ao wizard e não pode acessar outras áreas",
      "• Ambas as telas (troca de senha e onboarding) possuem botão 'Sair' como escape seguro",
      "**Guia de Primeiros Passos:**",
      "• No Dashboard do cliente, um checklist automático monitora 5 etapas fundamentais",
      "• Itens validados: Núcleo definido, Base cadastrada, Estrutura validada, Primeira turma, Primeira prática",
    ],
  },
];

const categories = ["Fundamentos", "Controle", "Operação", "Inteligência", "Administração", "Governança"];

const quickTutorials = [
  { title: "Cadastrar nova empresa", steps: ["Acesse Empresas", "Clique em 'Nova Empresa'", "Preencha os dados e salve", "Exporte o PDF de boas-vindas"], roles: undefined as AdminRole[] | undefined },
  { title: "Criar usuário administrativo", steps: ["Acesse Usuários", "Clique em 'Novo Usuário'", "Defina nome, email e perfil", "Exporte as credenciais"], roles: ["admin_master"] as AdminRole[] },
  { title: "Acessar portal de uma empresa", steps: ["Acesse Empresas", "Clique no nome da empresa", "O portal abre em modo espelho (leitura)"], roles: undefined as AdminRole[] | undefined },
  { title: "Editar fatores de sucesso", steps: ["Acesse Fatores de Sucesso (menu Administração)", "Selecione o ciclo e fator", "Edite as ações", "As alterações replicam automaticamente"], roles: ["admin_master"] as AdminRole[] },
  { title: "Encerrar um ciclo", steps: ["Acesse o portal da empresa (espelho)", "Vá em Ciclos MVP", "Verifique os critérios", "Clique em 'Encerrar Ciclo'"], roles: undefined as AdminRole[] | undefined },
  { title: "Inativar uma empresa", steps: ["Acesse Empresas", "Localize a empresa na lista", "Clique no botão 'Inativar'", "O login da empresa será bloqueado"], roles: undefined as AdminRole[] | undefined },
  { title: "Transferir empresas de um gerente", steps: ["Acesse Usuários", "Localize o gerente", "Ao excluir, selecione destino para as empresas", "As empresas são transferidas em lote"], roles: ["admin_master"] as AdminRole[] },
  { title: "Gerar relatório da carteira", steps: ["Acesse Relatórios", "Selecione 'Relatório da Carteira'", "Exporte em PDF"], roles: undefined as AdminRole[] | undefined },
];

export default function AdminHelp() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const adminRole: AdminRole = getAdminRoleForUser(user?.email || "");

  const filteredSections = useMemo(() => {
    let sections = helpSections.filter(s => !s.roles || s.roles.includes(adminRole));
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      s => s.title.toLowerCase().includes(q) || 
           s.content.some(c => c.toLowerCase().includes(q)) ||
           s.category.toLowerCase().includes(q)
    );
  }, [searchQuery, adminRole]);

  const filteredTutorials = useMemo(() => {
    let tutorials = quickTutorials.filter(t => !t.roles || t.roles.includes(adminRole));
    if (!searchQuery.trim()) return tutorials;
    const q = searchQuery.toLowerCase();
    return tutorials.filter(
      t => t.title.toLowerCase().includes(q) || t.steps.some(s => s.toLowerCase().includes(q))
    );
  }, [searchQuery, adminRole]);

  return (
    <AppLayout
      title="Manual da Plataforma"
      subtitle={`Manual do ${ADMIN_ROLE_LABELS[adminRole]} — referência completa do sistema`}
    >
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Profile Badge */}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Você está vendo o manual do perfil: <strong>{ADMIN_ROLE_LABELS[adminRole]}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O manual exibe apenas as funcionalidades que o seu perfil pode acessar.
                {adminRole === "admin_master" && " Como Admin Master, você tem acesso a todas as seções."}
              </p>
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar no manual... (ex: indicadores, turmas, ciclos, permissões)"
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
              Fluxo do Programa MVP (Visão Administrativa)
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                { label: "Criar Empresa", icon: Building2 },
                { label: "Onboarding", icon: RefreshCw },
                { label: "Estrutura Org.", icon: Layers },
                { label: "Base Populacional", icon: Database },
                { label: "Núcleo", icon: ShieldCheck },
                { label: "Turmas", icon: Users },
                { label: "Ciclos MVP", icon: Rocket },
                { label: "Fatores de Sucesso", icon: Target },
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
                Este manual é atualizado automaticamente conforme as funcionalidades da plataforma.
                Para o manual do cliente (ponto de vista da empresa), consulte o Manual MVP no portal do cliente via modo espelho.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
