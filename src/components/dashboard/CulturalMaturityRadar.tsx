import { useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { obterIndicadoresTodosCiclos, obterIndicadoresGlobais } from "@/lib/governance";
import { getPopulationStats } from "@/lib/companyStorage";

interface CulturalMaturityRadarProps {
  companyId: string;
  refreshKey?: number;
}

export function CulturalMaturityRadar({ companyId, refreshKey }: CulturalMaturityRadarProps) {
  const data = useMemo(() => {
    const cycleIndicators = obterIndicadoresTodosCiclos();
    const globalInd = obterIndicadoresGlobais();
    const popStats = getPopulationStats(companyId);

    // Monitorar: M1, M2, M3 average completion
    const mCycles = cycleIndicators.filter(c => c.cycleId.startsWith("M"));
    const monitorar = mCycles.length > 0 ? Math.round(mCycles.reduce((s, c) => s + c.completionPercent, 0) / mCycles.length) : 0;

    // Validar: V1, V2, V3
    const vCycles = cycleIndicators.filter(c => c.cycleId.startsWith("V"));
    const validar = vCycles.length > 0 ? Math.round(vCycles.reduce((s, c) => s + c.completionPercent, 0) / vCycles.length) : 0;

    // Perpetuar: P1, P2, P3
    const pCycles = cycleIndicators.filter(c => c.cycleId.startsWith("P"));
    const perpetuar = pCycles.length > 0 ? Math.round(pCycles.reduce((s, c) => s + c.completionPercent, 0) / pCycles.length) : 0;

    // Governança: based on nucleo, facilitators
    const governanca = Math.min(100, (popStats.nucleoCount > 0 ? 40 : 0) + (popStats.facilitators > 0 ? 30 : 0) + (globalInd.totalRecords > 0 ? 30 : 0));

    // Engajamento: based on turma participation
    const engajamento = globalInd.totalParticipants > 0
      ? Math.min(100, Math.round((globalInd.completedTurmas / Math.max(globalInd.totalTurmas, 1)) * 100))
      : 0;

    // Execução: overall action completion
    const execucao = globalInd.overallCompletionPercent;

    return [
      { dimension: "Monitorar", value: monitorar, fullMark: 100 },
      { dimension: "Validar", value: validar, fullMark: 100 },
      { dimension: "Perpetuar", value: perpetuar, fullMark: 100 },
      { dimension: "Governança", value: governanca, fullMark: 100 },
      { dimension: "Engajamento", value: engajamento, fullMark: 100 },
      { dimension: "Execução", value: execucao, fullMark: 100 },
    ];
  }, [companyId, refreshKey]);

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <Shield size={18} className="text-primary" /> Radar de Maturidade Cultural
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Dimensões estratégicas do programa</p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <Radar
              name="Maturidade"
              dataKey="value"
              stroke="hsl(192 70% 35%)"
              fill="hsl(192 70% 35%)"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {data.map((d) => (
          <div key={d.dimension} className="text-center">
            <p className="text-xs font-semibold text-foreground">{d.value}%</p>
            <p className="text-[10px] text-muted-foreground">{d.dimension}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
