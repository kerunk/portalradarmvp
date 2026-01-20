import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Target, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const months = Array.from({ length: 12 }, (_, i) => ({
  id: `M${i + 1}`,
  label: `M${i + 1}`,
  focus: `Foco do mês ${i + 1} - Descrição placeholder do objetivo principal deste período do programa MVP.`,
  actions: [
    { id: 1, title: "Ação sugerida 1 - Exemplo de atividade estrutural", status: "completed" as const },
    { id: 2, title: "Ação sugerida 2 - Reunião de alinhamento com liderança", status: "in_progress" as const },
    { id: 3, title: "Ação sugerida 3 - Comunicação interna sobre o programa", status: "planned" as const },
    { id: 4, title: "Ação sugerida 4 - Treinamento de equipe operacional", status: "planned" as const },
    { id: 5, title: "Ação sugerida 5 - Registro de evidências e indicadores", status: "planned" as const },
  ],
}));

const statusConfig = {
  planned: { label: "Planejado", color: "bg-muted text-muted-foreground", icon: Clock },
  in_progress: { label: "Em andamento", color: "bg-warning/10 text-warning", icon: Target },
  completed: { label: "Concluído", color: "bg-success/10 text-success", icon: CheckCircle2 },
};

export default function Months() {
  const [selectedMonth, setSelectedMonth] = useState("M1");
  const currentMonth = months.find((m) => m.id === selectedMonth) || months[0];

  return (
    <AppLayout
      title="Meses (M1–M12)"
      subtitle="Execução do programa por mês (estrutura padrão MVP)."
    >
      <div className="space-y-6 animate-fade-in">
        {/* Month Selector */}
        <Tabs value={selectedMonth} onValueChange={setSelectedMonth}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
            {months.map((month) => (
              <TabsTrigger
                key={month.id}
                value={month.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
              >
                {month.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Month Content */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                {currentMonth.id}
              </h2>
              <p className="text-sm text-muted-foreground">Mês do programa</p>
            </div>
          </div>

          {/* Focus Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">
              Foco do Mês
            </h3>
            <p className="text-muted-foreground bg-secondary/30 p-4 rounded-lg">
              {currentMonth.focus}
            </p>
          </div>

          {/* Actions Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Ações Sugeridas
            </h3>
            <div className="space-y-3">
              {currentMonth.actions.map((action) => {
                const status = statusConfig[action.status];
                const StatusIcon = status.icon;
                return (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {action.id}
                      </div>
                      <span className="text-foreground">{action.title}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("flex items-center gap-1", status.color)}
                    >
                      <StatusIcon size={12} />
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Info Note */}
        <p className="text-xs text-muted-foreground text-center">
          Esta é uma visualização placeholder. A estrutura de meses e ações é definida pelo Admin MVP.
        </p>
      </div>
    </AppLayout>
  );
}
