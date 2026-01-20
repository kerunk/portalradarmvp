import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const adherenceData = [
  { month: "Set", value: 45 },
  { month: "Out", value: 52 },
  { month: "Nov", value: 61 },
  { month: "Dez", value: 68 },
  { month: "Jan", value: 78 },
];

const leadershipData = [
  { month: "Set", participacao: 60, engajamento: 55 },
  { month: "Out", participacao: 68, engajamento: 62 },
  { month: "Nov", participacao: 72, engajamento: 68 },
  { month: "Dez", participacao: 78, engajamento: 74 },
  { month: "Jan", participacao: 82, engajamento: 79 },
];

const actionsData = [
  { name: "Concluídas", value: 24, color: "hsl(158, 64%, 40%)" },
  { name: "Em andamento", value: 5, color: "hsl(192, 70%, 35%)" },
  { name: "Atrasadas", value: 2, color: "hsl(0, 72%, 51%)" },
  { name: "Pendentes", value: 1, color: "hsl(38, 92%, 50%)" },
];

const perceptionData = [
  { area: "Comunicação", score: 7.8 },
  { area: "Liderança", score: 7.2 },
  { area: "Engajamento", score: 6.9 },
  { area: "Reconhecimento", score: 6.5 },
  { area: "Desenvolvimento", score: 7.1 },
];

interface IndicatorCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  description?: string;
}

function IndicatorCard({ title, value, change, changeLabel, description }: IndicatorCardProps) {
  const TrendIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus;
  
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="flex items-end justify-between mt-2">
        <p className="text-3xl font-display font-bold text-foreground">{value}</p>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <TrendIcon size={16} />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
      {changeLabel && (
        <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
      )}
    </Card>
  );
}

export default function Indicators() {
  return (
    <AppLayout
      title="Indicadores"
      subtitle="Acompanhe as métricas do programa"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Period Filter */}
        <div className="flex justify-end">
          <Select defaultValue="last-6">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-3">Últimos 3 meses</SelectItem>
              <SelectItem value="last-6">Últimos 6 meses</SelectItem>
              <SelectItem value="last-12">Últimos 12 meses</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <IndicatorCard
            title="Adesão ao Programa"
            value="78%"
            change={5}
            changeLabel="vs. mês anterior"
          />
          <IndicatorCard
            title="Participação Liderança"
            value="82%"
            change={8}
            changeLabel="vs. mês anterior"
          />
          <IndicatorCard
            title="Cobertura de Treinamentos"
            value="89%"
            change={12}
            changeLabel="vs. mês anterior"
          />
          <IndicatorCard
            title="Índice de Percepção"
            value="7.2"
            change={-2}
            description="de 10 pontos"
            changeLabel="vs. mês anterior"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adherence Evolution */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Evolução da Adesão ao Programa
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adherenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Actions Progress */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Execução das Ações
            </h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actionsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {actionsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leadership Participation */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Participação e Engajamento da Liderança
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadershipData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="participacao"
                    name="Participação"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="engajamento"
                    name="Engajamento"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Perception by Area */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Percepção por Área
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perceptionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="area" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
