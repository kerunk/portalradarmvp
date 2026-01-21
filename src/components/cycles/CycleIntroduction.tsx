import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface CycleIntroductionProps {
  description: string;
}

export function CycleIntroduction({ description }: CycleIntroductionProps) {
  return (
    <Card className="p-6 bg-secondary/20 border-dashed">
      <h3 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
        <BookOpen size={20} className="text-primary" />
        Contexto do Ciclo
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  );
}
