import { cn } from "@/lib/utils";

interface ProgressCardProps {
  title: string;
  progress: number;
  total: number;
  items: {
    label: string;
    value: number;
    color: "primary" | "success" | "warning" | "danger";
  }[];
}

export function ProgressCard({ title, progress, total, items }: ProgressCardProps) {
  const percentage = Math.round((progress / total) * 100);

  const colorStyles = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">
          {progress} de {total}
        </span>
      </div>

      {/* Main progress bar */}
      <div className="progress-bar mb-6">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", colorStyles[item.color])} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
