import { Badge } from "@/components/ui/badge";
import { 
  Circle, 
  Play, 
  CheckCircle, 
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CycleGovernance } from "@/lib/governance";

interface CycleStatusBadgeProps {
  status: CycleGovernance['status'];
  isLocked?: boolean;
  size?: "sm" | "default";
}

const statusConfig = {
  pending: {
    label: "Não Iniciado",
    color: "bg-muted text-muted-foreground",
    icon: Circle,
  },
  in_progress: {
    label: "Em Execução",
    color: "bg-warning/10 text-warning border-warning/30",
    icon: Play,
  },
  ready_to_close: {
    label: "Pronto para Encerrar",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    icon: Unlock,
  },
  closed: {
    label: "Encerrado",
    color: "bg-success/10 text-success border-success/30",
    icon: CheckCircle,
  },
};

export function CycleStatusBadge({ 
  status, 
  isLocked = false,
  size = "default" 
}: CycleStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = isLocked ? Lock : config.icon;

  if (isLocked && status === 'pending') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "gap-1.5 font-medium",
          "bg-muted/50 text-muted-foreground border-muted",
          size === "sm" && "text-xs py-0.5"
        )}
      >
        <Lock size={size === "sm" ? 10 : 12} />
        Bloqueado
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 font-medium",
        config.color,
        size === "sm" && "text-xs py-0.5"
      )}
    >
      <Icon size={size === "sm" ? 10 : 12} />
      {config.label}
    </Badge>
  );
}
