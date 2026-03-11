import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ProgramEvolutionChartProps {
  coveragePercent: number;
  completionPercent: number;
  maturityScore: number;
}

export function ProgramEvolutionChart({ coveragePercent, completionPercent, maturityScore }: ProgramEvolutionChartProps) {
  // Simulated monthly evolution data based on current values
  const data = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    const currentMonth = new Date().getMonth();
    const activeMonths = Math.min(currentMonth + 1, 6);

    return months.slice(0, activeMonths).map((month, i) => {
      const factor = (i + 1) / activeMonths;
      return {
        month,
        cobertura: Math.round(coveragePercent * factor),
        praticas: Math.round(completionPercent * factor * 0.9),
        maturidade: Math.round(maturityScore * factor),
      };
    });
  }, [coveragePercent, completionPercent, maturityScore]);

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <TrendingUp size={18} className="text-primary" /> Evolução do Programa MVP
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Progresso da cultura ao longo do tempo</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  cobertura: "Cobertura",
                  praticas: "Práticas executadas",
                  maturidade: "Maturidade cultural",
                };
                return [`${value}%`, labels[name] || name];
              }}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  cobertura: "Cobertura",
                  praticas: "Práticas",
                  maturidade: "Maturidade",
                };
                return labels[value] || value;
              }}
              wrapperStyle={{ fontSize: "11px" }}
            />
            <Line type="monotone" dataKey="cobertura" stroke="hsl(192 70% 35%)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="praticas" stroke="hsl(158 64% 40%)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="maturidade" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
