import { Users } from "lucide-react";

interface Leader {
  id: string;
  name: string;
  role: string;
  participation: number;
  avatar?: string;
}

interface LeadershipParticipationProps {
  leaders: Leader[];
  overallParticipation: number;
}

export function LeadershipParticipation({
  leaders,
  overallParticipation,
}: LeadershipParticipationProps) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Participação da Liderança</h3>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <span className="text-sm font-semibold text-primary">
            {overallParticipation}%
          </span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="progress-bar mb-6">
        <div
          className="progress-bar-fill"
          style={{ width: `${overallParticipation}%` }}
        />
      </div>

      {/* Individual leaders */}
      <div className="space-y-3">
        {leaders.map((leader) => (
          <div key={leader.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              {leader.avatar ? (
                <img
                  src={leader.avatar}
                  alt={leader.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-secondary-foreground">
                  {leader.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground truncate">
                  {leader.name}
                </p>
                <span className="text-xs font-medium text-muted-foreground">
                  {leader.participation}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{leader.role}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        Ver todos os líderes →
      </button>
    </div>
  );
}
