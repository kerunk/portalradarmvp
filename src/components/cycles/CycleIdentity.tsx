import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Users, Layers, Crown, AlertTriangle, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCycleAudience, getConsultantReminder, isLeadershipCycle } from "@/lib/cycleAudience";

interface CycleIdentityProps {
  cycleId: string;
  moduleTitle: string;
  moduleNumber?: number;
  phaseName: string;
  phase: "M" | "V" | "P";
  estimatedDuration: string;
  impactedGroups: string[];
}

const phaseConfig = {
  M: {
    label: "Monitorar",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    bgGradient: "from-blue-500/5 to-blue-600/10",
    iconColor: "text-blue-600",
  },
  V: {
    label: "Validar",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    bgGradient: "from-amber-500/5 to-amber-600/10",
    iconColor: "text-amber-600",
  },
  P: {
    label: "Perpetuar",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    bgGradient: "from-emerald-500/5 to-emerald-600/10",
    iconColor: "text-emerald-600",
  },
};

export function CycleIdentity({
  cycleId,
  moduleTitle,
  moduleNumber,
  phaseName,
  phase,
  estimatedDuration,
  impactedGroups,
}: CycleIdentityProps) {
  const config = phaseConfig[phase];
  const audienceInfo = getCycleAudience(cycleId);
  const consultantReminder = getConsultantReminder(cycleId);
  const isLeadership = isLeadershipCycle(cycleId);

  return (
    <Card className={cn("p-6 border-l-4 bg-gradient-to-r", config.bgGradient, {
      "border-l-blue-500": phase === "M",
      "border-l-amber-500": phase === "V",
      "border-l-emerald-500": phase === "P",
    })}>
      <div className="flex flex-col gap-4">
        {/* Header with Cycle ID and Phase */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-xl",
              config.color
            )}>
              {cycleId}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={cn(config.color)}>
                  <Layers size={12} className="mr-1" />
                  Fase {phaseName}
                </Badge>
                {/* Audience Badge */}
                <Badge 
                  variant="outline"
                  className={cn(
                    "gap-1",
                    isLeadership 
                      ? "bg-purple-500/10 text-purple-600 border-purple-500/30" 
                      : "bg-teal-500/10 text-teal-600 border-teal-500/30"
                  )}
                >
                  {isLeadership ? <Crown size={12} /> : <Users size={12} />}
                  {audienceInfo.audienceLabel}
                </Badge>
              </div>
              <h2 className="text-xl font-display font-semibold text-foreground">
                {moduleNumber ? `Módulo ${moduleNumber}: ` : ""}{moduleTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={16} className={config.iconColor} />
            <span>Duração: <strong className="text-foreground">{estimatedDuration}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} className={config.iconColor} />
            <span>Público: </span>
            <div className="flex flex-wrap gap-1">
              {impactedGroups.map((group, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal">
                  {group}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Leadership Tasks Alert */}
        {audienceInfo.hasLeadershipTasks && audienceInfo.leadershipTasksNote && (
          <Alert className="bg-purple-500/5 border-purple-500/20 mt-2">
            <Crown className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-700 font-medium">
              ⚠️ {audienceInfo.leadershipTasksNote}
            </AlertDescription>
          </Alert>
        )}

        {/* Consultant Return Reminder */}
        {consultantReminder && (
          <Alert className="bg-warning/10 border-warning/30 mt-2">
            <CalendarCheck className="h-4 w-4 text-warning" />
            <AlertDescription className="text-foreground">
              <strong>Ação Obrigatória:</strong> {consultantReminder.reminderText}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
