import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Crown, AlertTriangle } from "lucide-react";
import { getCycleAudience, getConsultantReminder, type CycleAudienceInfo } from "@/lib/cycleAudience";
import { cn } from "@/lib/utils";

interface CycleAudienceBadgeProps {
  cycleId: string;
  showAlert?: boolean;
  className?: string;
}

export function CycleAudienceBadge({ cycleId, showAlert = false, className }: CycleAudienceBadgeProps) {
  const audienceInfo = getCycleAudience(cycleId);
  const consultantReminder = getConsultantReminder(cycleId);
  
  const isLeadership = audienceInfo.audience === "leadership";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Audience Badge */}
      <Badge 
        variant="outline"
        className={cn(
          "gap-1.5 py-1",
          isLeadership 
            ? "bg-purple-500/10 text-purple-600 border-purple-500/30" 
            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
        )}
      >
        {isLeadership ? <Crown size={12} /> : <Users size={12} />}
        Público: {audienceInfo.audienceLabel}
      </Badge>

      {/* Leadership tasks alert */}
      {showAlert && audienceInfo.hasLeadershipTasks && audienceInfo.leadershipTasksNote && (
        <Alert className="bg-purple-500/5 border-purple-500/20">
          <Crown className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            {audienceInfo.leadershipTasksNote}
          </AlertDescription>
        </Alert>
      )}

      {/* Consultant reminder alert */}
      {showAlert && consultantReminder && (
        <Alert className="bg-warning/10 border-warning/30">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            <strong>Ação Obrigatória:</strong> {consultantReminder.reminderText}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface CycleAudienceInfoCardProps {
  cycleId: string;
}

export function CycleAudienceInfoCard({ cycleId }: CycleAudienceInfoCardProps) {
  const audienceInfo = getCycleAudience(cycleId);
  const isLeadership = audienceInfo.audience === "leadership";

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isLeadership 
        ? "bg-purple-500/5 border-purple-500/20" 
        : "bg-emerald-500/5 border-emerald-500/20"
    )}>
      <div className="flex items-center gap-2 mb-2">
        {isLeadership ? (
          <Crown className="h-5 w-5 text-purple-600" />
        ) : (
          <Users className="h-5 w-5 text-emerald-600" />
        )}
        <span className={cn(
          "font-semibold",
          isLeadership ? "text-purple-700" : "text-emerald-700"
        )}>
          {audienceInfo.audienceLabel}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {audienceInfo.audienceDescription}
      </p>
      {audienceInfo.leadershipTasksNote && (
        <p className="text-sm font-medium text-purple-700 mt-2 p-2 bg-purple-500/10 rounded">
          ⚠️ {audienceInfo.leadershipTasksNote}
        </p>
      )}
    </div>
  );
}
