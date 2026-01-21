import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Lightbulb, 
  CheckCircle2, 
  Clock, 
  Zap,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBestPracticesByCycle, type BestPractice } from "@/data/bestPractices";
import { 
  CreateActionFromTemplateDialog,
  type NewActionData,
} from "./CreateActionFromTemplateDialog";

interface BestPracticesShelfProps {
  cycleId: string;
  onCreateAction: (action: NewActionData) => void;
}

const categoryColors = {
  communication: "bg-amber-500/10 text-amber-600",
  leadership: "bg-blue-500/10 text-blue-600",
  practice: "bg-purple-500/10 text-purple-600",
  structure: "bg-emerald-500/10 text-emerald-600",
  indicators: "bg-rose-500/10 text-rose-600",
};

const categoryLabels = {
  communication: "Comunicação",
  leadership: "Liderança",
  practice: "Prática",
  structure: "Estrutura",
  indicators: "Indicadores",
};

export function BestPracticesShelf({ cycleId, onCreateAction }: BestPracticesShelfProps) {
  const [selectedPractice, setSelectedPractice] = useState<BestPractice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const practices = getBestPracticesByCycle(cycleId);

  const handleCreateAction = (practice: BestPractice) => {
    setSelectedPractice(practice);
    setIsDialogOpen(true);
  };

  const handleConfirmAction = (actionData: NewActionData) => {
    onCreateAction({
      ...actionData,
      sourceBestPracticeId: selectedPractice?.id,
    });
    setSelectedPractice(null);
  };

  if (practices.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              Melhores Práticas (Prateleira MVP)
            </h3>
            <p className="text-sm text-muted-foreground">
              Práticas recomendadas para este ciclo. Clique para criar ações.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {practices.length} práticas
        </Badge>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {practices.map(practice => (
            <Card
              key={practice.id}
              className="flex-shrink-0 w-[340px] border hover:border-primary/50 transition-colors overflow-hidden"
            >
              {/* Image */}
              {practice.imageUrl && (
                <div className="h-36 w-full overflow-hidden bg-secondary">
                  <img
                    src={practice.imageUrl}
                    alt={practice.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={cn("text-xs", categoryColors[practice.category])}>
                    {categoryLabels[practice.category]}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{practice.suggestedDaysToComplete}d</span>
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {practice.title}
                </h4>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {practice.description}
                </p>

                {/* When to use */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded mb-3">
                  <Lightbulb size={14} className="text-warning flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{practice.whenToUse}</span>
                </div>

                {/* Checklist preview */}
                <div className="space-y-1 mb-4">
                  {practice.checklist.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 size={12} className="text-success flex-shrink-0" />
                      <span className="line-clamp-1">{item}</span>
                    </div>
                  ))}
                  {practice.checklist.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-5">
                      +{practice.checklist.length - 3} itens
                    </p>
                  )}
                </div>

                {/* Action button */}
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => handleCreateAction(practice)}
                >
                  <Zap size={14} />
                  Criar Ação a partir desta prática
                  <ChevronRight size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Dialog for creating action */}
      <CreateActionFromTemplateDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPractice(null);
        }}
        onConfirm={handleConfirmAction}
        defaultTitle={selectedPractice?.suggestedActionTitle || ""}
        defaultDescription={selectedPractice?.description || ""}
        defaultCycleId={cycleId}
        defaultFactorId={selectedPractice?.category || "communication"}
        defaultDaysToComplete={selectedPractice?.suggestedDaysToComplete || 14}
        sourceBestPracticeId={selectedPractice?.id}
        dialogTitle="Criar Ação a partir da Melhor Prática"
        dialogDescription={`Baseada em: ${selectedPractice?.title || ""}`}
      />
    </Card>
  );
}
