import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  BookOpen, Layers, Database, ShieldCheck, Rocket, Users, Target,
  FileText, BarChart3, HelpCircle, TrendingUp, Gauge, Radar, LineChart, Zap
} from "lucide-react";

const manualSections = [
  {
    id: "intro",
    title: "Introdução ao Programa MVP",
    icon: BookOpen,
    content: "O Programa MVP (Mudança, Validação e Perpetuação) é uma metodologia estruturada para transformação cultural nas organizações. O programa é dividido em três fases — Monitorar, Validar e Perpetuar — cada uma com ciclos específicos de atividades que promovem a evolução comportamental e cultural dos colaboradores."
  },
  {
    id: "portal",
    title: "Como usar o Portal",
    icon: HelpCircle,
    content: "O portal MVP é sua central de gestão do programa. Use o menu lateral para navegar entre as seções. O Dashboard apresenta uma visão geral com indicadores estratégicos. Cada seção permite cadastrar, acompanhar e analisar diferentes aspectos da implementação do programa na sua organização."
  },
  {
    id: "estrutura",
    title: "Estrutura Organizacional",
    icon: Layers,
    content: "A Estrutura Organizacional permite cadastrar setores e unidades da empresa. Essa organização é fundamental para segmentar a base populacional e gerar relatórios de cobertura por setor. Cadastre primeiro os setores e depois associe colaboradores a cada um."
  },
  {
    id: "base",
    title: "Base Populacional",
    icon: Database,
    content: "A Base Populacional é o cadastro completo dos colaboradores que participarão do programa. Você pode importar via CSV ou cadastrar manualmente. Cada colaborador deve ter nome, setor, cargo e turno. A base é usada para calcular cobertura e progresso do programa."
  },
  {
    id: "nucleo",
    title: "Núcleo de Sustentação",
    icon: ShieldCheck,
    content: "O Núcleo de Sustentação é formado por lideranças e facilitadores que conduzem o programa. Facilitadores habilitados são responsáveis por aplicar turmas e práticas. Quanto maior e mais engajado o núcleo, maior a capacidade de expansão do programa."
  },
  {
    id: "ciclos",
    title: "Ciclos MVP",
    icon: Rocket,
    content: "Os Ciclos MVP são as etapas do programa: M1, M2, M3 (Monitorar), V1, V2, V3 (Validar) e P1, P2, P3 (Perpetuar). Cada ciclo contém ações específicas que devem ser executadas. Acompanhe o progresso de cada ciclo e encerre-os conforme as ações forem concluídas."
  },
  {
    id: "turmas",
    title: "Turmas",
    icon: Users,
    content: "As Turmas são sessões de treinamento onde os colaboradores participam das atividades do programa. Crie turmas, defina facilitadores, datas e participantes. Registre presenças para calcular a cobertura do programa automaticamente."
  },
  {
    id: "acoes",
    title: "Ações e Alertas",
    icon: Target,
    content: "Ações são atividades práticas derivadas dos ciclos MVP. Cada ação tem prazo, responsável e status. Ações atrasadas geram alertas automáticos. Acompanhe a taxa de conversão de decisões em ações para medir a efetividade operacional do programa."
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: FileText,
    content: "O módulo de Relatórios oferece análises executivas completas: Relatório Executivo com visão geral, Progresso por Colaborador com busca inteligente, Maturidade por Setor com comparativos. Todos os relatórios podem ser exportados em PDF e Excel."
  },
  {
    id: "indicadores",
    title: "Indicadores Estratégicos",
    icon: BarChart3,
    content: "Os Indicadores Estratégicos apresentam métricas de alto nível: cobertura do programa, taxa de execução, maturidade cultural e evolução temporal. Use esses indicadores para tomada de decisão e apresentações executivas."
  },
];

const indicatorExplanations = [
  {
    id: "cultura",
    title: "Índice de Cultura MVP",
    icon: Gauge,
    description: "Índice global de 0 a 100 que representa o nível de evolução cultural do programa na empresa.",
    details: "Calculado com base em: cobertura de treinamentos (25%), execução de práticas (25%), participação nas turmas (20%), evolução dos ciclos (20%) e presença nas atividades (10%). Níveis: Inicial (0-25), Estruturando (26-50), Evoluindo (51-75), Consolidando (76-90), Cultura Forte (91-100)."
  },
  {
    id: "radar",
    title: "Radar de Maturidade Cultural",
    icon: Radar,
    description: "Gráfico radar que mostra a pontuação em 6 dimensões do programa.",
    details: "Dimensões avaliadas: Monitorar (progresso dos ciclos M), Validar (progresso dos ciclos V), Perpetuar (progresso dos ciclos P), Governança (núcleo e facilitadores), Engajamento (participação e presenças) e Execução (ações concluídas vs planejadas)."
  },
  {
    id: "cobertura",
    title: "Cobertura do Programa",
    icon: Users,
    description: "Percentual de colaboradores da base populacional que já foram treinados.",
    details: "Calculada dividindo o número de colaboradores com pelo menos uma presença registrada pelo total da base populacional ativa. Uma cobertura acima de 70% indica boa penetração do programa."
  },
  {
    id: "decisao",
    title: "Taxa Decisão → Ação",
    icon: Zap,
    description: "Percentual de decisões tomadas nos ciclos que foram convertidas em ações práticas.",
    details: "Mede a efetividade operacional: quanto maior a taxa, mais decisões estão sendo transformadas em ações concretas. Uma taxa acima de 50% é considerada saudável."
  },
  {
    id: "evolucao",
    title: "Evolução do Programa",
    icon: LineChart,
    description: "Gráfico de linha mostrando a progressão temporal da cobertura, práticas e maturidade.",
    details: "Permite visualizar tendências e identificar períodos de aceleração ou estagnação do programa. Use para planejar intervenções e ajustar o ritmo de implementação."
  },
];

export default function HelpCenter() {
  return (
    <AppLayout title="Manual MVP" subtitle="Centro de ajuda e documentação do programa">
      <div className="space-y-8 max-w-4xl animate-fade-in">
        {/* Manual do Programa */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Manual do Programa MVP</h2>
              <p className="text-sm text-muted-foreground">Tudo que você precisa saber sobre o portal e o programa</p>
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
                  <p className="text-muted-foreground leading-relaxed pl-9">
                    {section.content}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>

        {/* Como interpretar os indicadores */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Como interpretar os indicadores</h2>
              <p className="text-sm text-muted-foreground">Entenda cada métrica do seu dashboard</p>
            </div>
          </div>

          <div className="space-y-4">
            {indicatorExplanations.map((item) => (
              <div key={item.id} className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed">{item.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
