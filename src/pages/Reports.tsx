import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportSection {
  title: string;
  type: "success" | "warning" | "info";
  content: string[];
}

const reportSections: ReportSection[] = [
  {
    title: "Onde Estamos",
    type: "info",
    content: [
      "O programa está na Fase 3 (Implementação) com 65% de progresso",
      "78% de adesão geral ao programa, acima da meta de 70%",
      "82% de participação da liderança nos rituais e atividades",
      "24 de 32 ações do plano já foram concluídas",
    ],
  },
  {
    title: "Pontos Fortes",
    type: "success",
    content: [
      "Alta participação da diretoria nas atividades do programa",
      "Engajamento crescente das equipes de produção",
      "Rituais diários sendo executados com consistência",
      "Feedback positivo sobre os workshops de liderança",
    ],
  },
  {
    title: "Pontos de Atenção",
    type: "warning",
    content: [
      "Baixa participação na pesquisa de percepção (45% de resposta)",
      "Workshop de liderança comportamental está 5 dias atrasado",
      "Área comercial com menor engajamento (68%)",
      "Índice de percepção caiu 2% em relação ao mês anterior",
    ],
  },
];

const recommendations = [
  "Intensificar comunicação sobre a pesquisa de percepção para aumentar participação",
  "Reagendar workshop de liderança para a próxima semana",
  "Criar ação específica para engajar área comercial",
  "Investigar causas da queda no índice de percepção com entrevistas direcionadas",
];

const historicalReports = [
  { id: "1", month: "Janeiro 2025", status: "current" },
  { id: "2", month: "Dezembro 2024", status: "available" },
  { id: "3", month: "Novembro 2024", status: "available" },
  { id: "4", month: "Outubro 2024", status: "available" },
];

export default function Reports() {
  const sectionIcons = {
    info: FileText,
    success: CheckCircle2,
    warning: AlertTriangle,
  };

  const sectionColors = {
    info: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
  };

  return (
    <AppLayout
      title="Relatórios"
      subtitle="Relatórios executivos e acompanhamento"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Select defaultValue="jan-2025">
              <SelectTrigger className="w-48">
                <Calendar size={16} className="mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {historicalReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw size={16} />
            </Button>
          </div>
          <Button className="btn-primary-gradient">
            <Download size={16} className="mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Executive Summary */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground">
                Relatório Executivo
              </h2>
              <p className="text-sm text-muted-foreground">
                Janeiro 2025 - Empresa Alpha
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">78%</p>
              <p className="text-sm text-muted-foreground">Adesão</p>
              <div className="flex items-center justify-center gap-1 text-success text-xs mt-1">
                <TrendingUp size={12} />
                <span>+5%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">82%</p>
              <p className="text-sm text-muted-foreground">Liderança</p>
              <div className="flex items-center justify-center gap-1 text-success text-xs mt-1">
                <TrendingUp size={12} />
                <span>+8%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">75%</p>
              <p className="text-sm text-muted-foreground">Ações</p>
              <p className="text-xs text-muted-foreground mt-1">24/32</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">7.2</p>
              <p className="text-sm text-muted-foreground">Percepção</p>
              <div className="flex items-center justify-center gap-1 text-destructive text-xs mt-1">
                <TrendingDown size={12} />
                <span>-2%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Report Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {reportSections.map((section) => {
            const Icon = sectionIcons[section.type];
            return (
              <Card
                key={section.title}
                className={cn("p-5 border-l-4", sectionColors[section.type])}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Icon size={18} />
                  <h3 className="font-semibold text-foreground">{section.title}</h3>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* Recommendations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-warning" />
            <h3 className="font-semibold text-foreground">
              Recomendações Automáticas
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <span className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-sm text-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Historical Reports */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Relatórios Anteriores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {historicalReports.map((report) => (
              <div
                key={report.id}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                  report.status === "current"
                    ? "bg-primary/5 border-primary/30"
                    : "bg-muted/50 border-border hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{report.month}</span>
                  </div>
                  {report.status === "current" && (
                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                      Atual
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
