import { cn } from "@/lib/utils";

const CULTURE_LEVELS = [
  { level: 1, name: "Inicial", min: 0, max: 25 },
  { level: 2, name: "Estruturando", min: 25, max: 50 },
  { level: 3, name: "Evoluindo", min: 50, max: 75 },
  { level: 4, name: "Consolidando", min: 75, max: 90 },
  { level: 5, name: "Cultura Forte", min: 90, max: 101 },
];

function getLevel(score: number) {
  return CULTURE_LEVELS.find(l => score >= l.min && score < l.max) || CULTURE_LEVELS[0];
}

interface CultureScoreGaugeProps {
  score: number;
}

export function CultureScoreGauge({ score }: CultureScoreGaugeProps) {
  const current = getLevel(score);
  const clamped = Math.min(100, Math.max(0, score));
  const angle = -90 + (clamped / 100) * 180;

  const arcColors = [
    "hsl(0 72% 51%)",       // red - Inicial
    "hsl(38 92% 50%)",      // amber - Estruturando
    "hsl(192 70% 35%)",     // teal - Evoluindo
    "hsl(158 64% 40%)",     // green - Consolidando
    "hsl(158 64% 30%)",     // dark green - Cultura Forte
  ];

  return (
    <div className="metric-card">
      <h3 className="font-medium text-foreground mb-2">Índice de Cultura MVP</h3>

      <div className="flex justify-center py-2">
        <div className="relative w-48 h-28">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {CULTURE_LEVELS.map((level, i) => {
              const startAngle = -90 + (level.min / 100) * 180;
              const endAngle = -90 + (Math.min(level.max, 100) / 100) * 180;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const r = 80;
              const cx = 100, cy = 95;

              return (
                <path
                  key={level.level}
                  d={`M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`}
                  fill="none"
                  stroke={level.level <= current.level ? arcColors[i] : "hsl(var(--muted))"}
                  strokeWidth="14"
                  strokeLinecap="round"
                  opacity={level.level <= current.level ? 1 : 0.4}
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
                  x1={cx} y1={cy}
                  x2={cx + needleLen * Math.cos(needleAngle)}
                  y2={cy + needleLen * Math.sin(needleAngle)}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              );
            })()}

            <circle cx="100" cy="95" r="5" fill="hsl(var(--primary))" />
          </svg>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <span className="text-2xl font-bold text-foreground">{clamped}</span>
            <span className="text-xs text-muted-foreground"> / 100</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
          Nível: {current.name}
        </span>
      </div>

      <div className="flex gap-1">
        {CULTURE_LEVELS.map((level) => (
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
        <span className="text-[10px] text-muted-foreground">Cultura Forte</span>
      </div>
    </div>
  );
}
