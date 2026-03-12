import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { getEnrichedCompanies } from "@/lib/portfolioUtils";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip,
} from "recharts";

const USERS_MGMT_KEY = "mvp_managed_users_v2";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(200, 80%, 50%)",
  "hsl(var(--muted-foreground))",
];

interface LoadDistributionProps {
  refreshKey?: number;
}

export function LoadDistribution({ refreshKey }: LoadDistributionProps) {
  const data = useMemo(() => {
    let users: any[] = [];
    try {
      users = JSON.parse(localStorage.getItem(USERS_MGMT_KEY) || "[]");
    } catch {}

    const enriched = getEnrichedCompanies();
    const distribution: { name: string; value: number }[] = [];

    const gerentUsers = users.filter((u: any) => u.role === "gerente_conta" && u.active !== false);
    let assigned = 0;

    gerentUsers.forEach((u: any) => {
      const count = enriched.filter(
        ec => ec.company.ownerEmail?.toLowerCase() === u.email.toLowerCase()
      ).length;
      if (count > 0) {
        distribution.push({ name: u.name, value: count });
        assigned += count;
      }
    });

    const unassigned = enriched.length - assigned;
    if (unassigned > 0) {
      distribution.push({ name: "Sem gerente", value: unassigned });
    }

    return distribution;
  }, [refreshKey]);

  return (
    <Card className="p-5">
      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
        <PieChartIcon size={18} className="text-primary" />
        Distribuição de Carga da Carteira
      </h3>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma empresa cadastrada</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-1/2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-1/2 space-y-2">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground flex-1 truncate">{item.name}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
