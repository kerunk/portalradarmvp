import { cn } from "@/lib/utils";

interface CoverageDonutProps {
  title: string;
  value: number;
  total: number;
  label: string;
  color?: "primary" | "success" | "warning" | "destructive";
}

export function CoverageDonut({ title, value, total, label, color = "primary" }: CoverageDonutProps) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percent / 100) * circumference;

  const colorMap = {
    primary: { stroke: "hsl(var(--primary))", text: "text-primary", bg: "bg-primary/10" },
    success: { stroke: "hsl(var(--success))", text: "text-success", bg: "bg-success/10" },
    warning: { stroke: "hsl(var(--warning))", text: "text-warning", bg: "bg-warning/10" },
    destructive: { stroke: "hsl(var(--destructive))", text: "text-destructive", bg: "bg-destructive/10" },
  };

  const c = colorMap[color];

  return (
    <div className="metric-card flex flex-col items-center">
      <h3 className="font-medium text-foreground mb-4 self-start">{title}</h3>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={c.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold", c.text)}>{percent}%</span>
          <span className="text-[10px] text-muted-foreground">{value}/{total}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">{label}</p>
    </div>
  );
}
