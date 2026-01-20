import { FileText, Image, CheckSquare, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "document" | "image" | "task" | "survey";
  title: string;
  description: string;
  user: string;
  time: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const typeConfig = {
    document: {
      icon: FileText,
      color: "bg-primary/10 text-primary",
    },
    image: {
      icon: Image,
      color: "bg-success/10 text-success",
    },
    task: {
      icon: CheckSquare,
      color: "bg-warning/10 text-warning",
    },
    survey: {
      icon: MessageSquare,
      color: "bg-accent/10 text-accent",
    },
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Atividades Recentes</h3>
        <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          Ver todas
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  config.color
                )}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.user}</span>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
