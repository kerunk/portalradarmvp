import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Compass, ArrowRight } from "lucide-react";
import { getClientSuggestions } from "@/lib/implementationEngine";

interface Props {
  companyId: string;
  refreshKey: number;
}

export function ClientSuggestions({ companyId, refreshKey }: Props) {
  const suggestions = useMemo(() => getClientSuggestions(companyId), [companyId, refreshKey]);

  if (suggestions.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <Compass size={18} className="text-primary" />
        Sugestões para Avançar
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Próximos passos recomendados para a implementação</p>

      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
          >
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            </div>
            <p className="text-sm text-foreground flex-1">{suggestion}</p>
            <ArrowRight size={14} className="text-primary shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}
