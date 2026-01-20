import { cn } from "@/lib/utils";

interface MaturityLevel {
  level: 1 | 2 | 3 | 4;
  name: string;
  description: string;
}

const MATURITY_LEVELS: MaturityLevel[] = [
  { level: 1, name: "Inicial", description: "Primeiros passos do programa" },
  { level: 2, name: "Em Desenvolvimento", description: "Ações sendo implementadas" },
  { level: 3, name: "Consolidado", description: "Programa estável e rodando" },
  { level: 4, name: "Sustentado", description: "Cultura incorporada" },
];

interface MaturityGaugeProps {
  currentLevel: 1 | 2 | 3 | 4;
  score: number;
}

export function MaturityGauge({ currentLevel, score }: MaturityGaugeProps) {
  const current = MATURITY_LEVELS.find((l) => l.level === currentLevel)!;

  return (
    <div className="metric-card">
      <h3 className="font-medium text-foreground mb-6">Nível de Maturidade</h3>

      {/* Gauge */}
      <div className="relative flex justify-center mb-6">
        <div className="relative w-40 h-20 overflow-hidden">
          {/* Background arc */}
          <div
            className="absolute inset-0 rounded-t-full border-8 border-b-0 border-muted"
            style={{ borderWidth: "12px" }}
          />
          {/* Progress arc */}
          <div
            className="absolute inset-0 rounded-t-full border-8 border-b-0 border-primary"
            style={{
              borderWidth: "12px",
              clipPath: `polygon(0 100%, 0 0, ${(score / 100) * 100}% 0, ${
                (score / 100) * 100
              }% 100%)`,
            }}
          />
          {/* Center */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <span className="text-3xl font-display font-bold text-foreground">
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      {/* Current level */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          Nível {currentLevel}: {current.name}
        </span>
        <p className="text-sm text-muted-foreground mt-2">{current.description}</p>
      </div>

      {/* Level indicators */}
      <div className="flex items-center justify-between gap-1">
        {MATURITY_LEVELS.map((level) => (
          <div
            key={level.level}
            className={cn(
              "flex-1 h-2 rounded-full transition-colors",
              level.level <= currentLevel ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-muted-foreground">Inicial</span>
        <span className="text-xs text-muted-foreground">Sustentado</span>
      </div>
    </div>
  );
}
