import { cn } from "@/lib/utils";

const MATURITY_LEVELS = [
  { level: 1, name: "Inicial", min: 0, max: 20 },
  { level: 2, name: "Estruturando", min: 20, max: 40 },
  { level: 3, name: "Em Desenvolvimento", min: 40, max: 60 },
  { level: 4, name: "Consolidado", min: 60, max: 80 },
  { level: 5, name: "Sustentado", min: 80, max: 100 },
];

function getLevel(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score < l.max) || MATURITY_LEVELS[MATURITY_LEVELS.length - 1];
}

interface MaturityGaugePremiumProps {
  score: number; // 0-100
}

export function MaturityGaugePremium({ score }: MaturityGaugePremiumProps) {
  const current = getLevel(score);
  const clampedScore = Math.min(100, Math.max(0, score));
  // Semi-circle: angle from -90 to 90 degrees (180 deg arc)
  const angle = -90 + (clampedScore / 100) * 180;
  
  return (
    <div className="metric-card">
      <h3 className="font-medium text-foreground mb-2">Índice de Maturidade MVP</h3>
      
      {/* Gauge SVG */}
      <div className="flex justify-center py-2">
        <div className="relative w-48 h-28">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Background arc segments */}
            {MATURITY_LEVELS.map((level, i) => {
              const startAngle = -90 + (level.min / 100) * 180;
              const endAngle = -90 + (level.max / 100) * 180;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const r = 80;
              const cx = 100, cy = 95;
              
              return (
                <path
                  key={level.level}
                  d={`M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`}
                  fill="none"
                  stroke={level.level <= current.level ? `hsl(var(--primary) / ${0.2 + level.level * 0.18})` : "hsl(var(--muted))"}
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              );
            })}
            
            {/* Needle */}
            {(() => {
              const needleAngle = (angle * Math.PI) / 180;
              const cx = 100, cy = 95;
              const needleLen = 60;
              return (
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + needleLen * Math.cos(needleAngle)}
                  y2={cy + needleLen * Math.sin(needleAngle)}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              );
            })()}
            
            {/* Center dot */}
            <circle cx="100" cy="95" r="5" fill="hsl(var(--primary))" />
          </svg>
          
          {/* Score */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <span className="text-2xl font-bold text-foreground">{clampedScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      {/* Current level badge */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
          Nível {current.level}: {current.name}
        </span>
      </div>

      {/* Level bar */}
      <div className="flex gap-1">
        {MATURITY_LEVELS.map((level) => (
          <div
            key={level.level}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors",
              level.level <= current.level ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground">Inicial</span>
        <span className="text-[10px] text-muted-foreground">Sustentado</span>
      </div>
    </div>
  );
}
