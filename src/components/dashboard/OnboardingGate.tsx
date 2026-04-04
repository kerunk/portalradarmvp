import { Card } from "@/components/ui/card";
import { Shield, Clock, BarChart3 } from "lucide-react";

interface OnboardingGateProps {
  companyName: string;
}

export function OnboardingGate({ companyName }: OnboardingGateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full p-8 text-center space-y-6 border-border/50">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Shield size={32} className="text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-foreground">
            Empresa ainda não iniciou o onboarding
          </h2>
          <p className="text-sm text-muted-foreground">
            O portal de <strong>{companyName}</strong> será liberado quando o administrador da empresa realizar o primeiro acesso e concluir a configuração inicial.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Clock size={18} className="text-muted-foreground/60 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Status</p>
              <p className="text-xs text-muted-foreground">Aguardando primeiro acesso</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <BarChart3 size={18} className="text-muted-foreground/60 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Progresso</p>
              <p className="text-xs text-muted-foreground">0 de 5 passos · 0%</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
