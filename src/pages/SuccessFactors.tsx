import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Megaphone, Settings2, GraduationCap, BarChart3, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessFactor {
  id: number;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  responsiblePair: string;
  progress: number;
  actions: string[];
}

const successFactors: SuccessFactor[] = [
  {
    id: 1,
    name: "Envolvimento e Exemplo da Liderança",
    description: "Responsável por garantir patrocínio ativo, presença, discurso coerente e exemplo prático da liderança em todos os níveis.",
    icon: Users,
    color: "bg-primary/10 text-primary",
    responsiblePair: "Diretor Geral + Gerente de RH",
    progress: 72,
    actions: [
      "Participação em reuniões de kick-off",
      "Comunicação de apoio ao programa",
      "Presença em eventos de reconhecimento",
      "Exemplo pessoal de comportamentos esperados",
    ],
  },
  {
    id: 2,
    name: "Comunicação e Marketing Interno",
    description: "Responsável por manter o programa vivo na organização por meio de campanhas, mensagens, símbolos visuais e reforços contínuos.",
    icon: Megaphone,
    color: "bg-success/10 text-success",
    responsiblePair: "Coordenador de Comunicação + Analista de Endomarketing",
    progress: 58,
    actions: [
      "Criação de campanhas visuais mensais",
      "Envio de newsletters sobre o programa",
      "Atualização de murais e painéis",
      "Gestão de canais internos (intranet, TV corporativa)",
    ],
  },
  {
    id: 3,
    name: "Estrutura do Núcleo de Sustentação",
    description: "Responsável pela organização, funcionamento e disciplina do núcleo (papéis claros, reuniões, acompanhamento e execução).",
    icon: Settings2,
    color: "bg-warning/10 text-warning",
    responsiblePair: "Líder do Núcleo + Facilitador MVP",
    progress: 85,
    actions: [
      "Definição de papéis e responsabilidades",
      "Realização de reuniões semanais do núcleo",
      "Acompanhamento do cronograma de ações",
      "Resolução de impedimentos operacionais",
    ],
  },
  {
    id: 4,
    name: "Qualidade da Implementação dos Treinamentos",
    description: "Responsável por assegurar que os módulos sejam aplicados conforme a metodologia, com qualidade, consistência e aderência ao plano.",
    icon: GraduationCap,
    color: "bg-accent/10 text-accent",
    responsiblePair: "Instrutor Interno + Coordenador de T&D",
    progress: 45,
    actions: [
      "Preparação de materiais e logística",
      "Aplicação dos módulos conforme cronograma",
      "Coleta de feedback pós-treinamento",
      "Ajustes metodológicos quando necessário",
    ],
  },
  {
    id: 5,
    name: "Gestão de Indicadores e Evidências",
    description: "Responsável por acompanhar indicadores, registrar evidências, analisar dados e apoiar decisões de ajuste e melhoria do programa.",
    icon: BarChart3,
    color: "bg-destructive/10 text-destructive",
    responsiblePair: "Analista de Dados + Coordenador MVP",
    progress: 63,
    actions: [
      "Coleta mensal de indicadores",
      "Registro e organização de evidências",
      "Análise de tendências e alertas",
      "Geração de relatórios executivos",
    ],
  },
];

export default function SuccessFactors() {
  const [selectedFactor, setSelectedFactor] = useState<SuccessFactor | null>(null);
  const [observations, setObservations] = useState("");

  return (
    <AppLayout
      title="Fatores de Sucesso"
      subtitle="Pilares estruturais do Programa MVP (padrão fixo)"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Factors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {successFactors.map((factor) => {
            const Icon = factor.icon;
            return (
              <Card
                key={factor.id}
                className="p-5 cursor-pointer hover:shadow-elevated transition-all group"
                onClick={() => setSelectedFactor(factor)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", factor.color)}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {factor.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {factor.description}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium text-foreground">{factor.progress}%</span>
                  </div>
                  <Progress value={factor.progress} className="h-2" />
                </div>

                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Dupla responsável:</p>
                  <p className="text-xs font-medium text-foreground truncate">{factor.responsiblePair}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Info Note */}
        <p className="text-xs text-muted-foreground text-center">
          Os Fatores de Sucesso são padrão do programa MVP e não podem ser alterados pelas empresas.
        </p>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedFactor} onOpenChange={() => setSelectedFactor(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFactor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", selectedFactor.color)}>
                    <selectedFactor.icon size={20} />
                  </div>
                  <DialogTitle className="text-xl">{selectedFactor.name}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Descrição
                  </h4>
                  <p className="text-muted-foreground bg-secondary/30 p-4 rounded-lg">
                    {selectedFactor.description}
                  </p>
                </div>

                {/* Responsible */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Dupla Responsável
                  </h4>
                  <Badge variant="secondary" className="text-sm py-1.5 px-3">
                    {selectedFactor.responsiblePair}
                  </Badge>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <h4 className="font-semibold text-foreground uppercase tracking-wide">Progresso</h4>
                    <span className="font-medium text-foreground">{selectedFactor.progress}%</span>
                  </div>
                  <Progress value={selectedFactor.progress} className="h-3" />
                </div>

                {/* Actions */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                    Ações Vinculadas
                  </h4>
                  <div className="space-y-2">
                    {selectedFactor.actions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50"
                      >
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </div>
                        <span className="text-foreground text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
                    Observações
                  </h4>
                  <Textarea
                    placeholder="Adicione observações sobre este fator de sucesso..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Campo placeholder - dados não são salvos nesta versão.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
