import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Building2, ChevronRight, Rocket, Clock } from "lucide-react";
import { getActiveCompaniesFiltered, setActiveCompany, getState } from "@/lib/storage";
import { CYCLE_IDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ActiveCycleEntry {
  companyId: string;
  companyName: string;
  cycleId: string;
  daysActive: number;
  completionPercent: number;
  totalActions: number;
  completedActions: number;
}

export default function ActiveCycles() {
  const navigate = useNavigate();

  const activeCycles = useMemo(() => {
    const companies = getCompanies();
    const entries: ActiveCycleEntry[] = [];
    const now = Date.now();

    companies.forEach(company => {
      setActiveCompany(company.id);
      const state = getState();

      CYCLE_IDS.forEach(cycleId => {
        const cs = state.cycles[cycleId];
        if (!cs || cs.closureStatus === "closed") return;

        const hasActivity = cs.factors.some(f => f.actions.some(a => a.enabled));
        if (!hasActivity) return;

        let totalActions = 0;
        let completedActions = 0;
        let earliestDate = now;

        cs.factors.forEach(f => {
          f.actions.forEach(a => {
            if (a.enabled) {
              totalActions++;
              if (a.status === "completed") completedActions++;
              if (a.dueDate) {
                const d = new Date(a.dueDate).getTime();
                if (d < earliestDate) earliestDate = d;
              }
            }
          });
        });

        const daysActive = Math.floor((now - earliestDate) / 86400000);
        const completionPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

        entries.push({
          companyId: company.id,
          companyName: company.name,
          cycleId,
          daysActive: Math.max(0, daysActive),
          completionPercent,
          totalActions,
          completedActions,
        });
      });

      setActiveCompany(null);
    });

    return entries.sort((a, b) => b.daysActive - a.daysActive);
  }, []);

  return (
    <AppLayout title="Ciclos em Andamento" subtitle={`${activeCycles.length} ciclos ativos na carteira`}>
      <div className="space-y-6 animate-fade-in">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Dias Ativos</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Ações</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeCycles.map((entry, i) => (
                <TableRow key={i} className="cursor-pointer" onClick={() => navigate(`/empresas/${entry.companyId}?tab=ciclos`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-primary" />
                      <span className="font-medium text-foreground">{entry.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{entry.cycleId}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className={cn(entry.daysActive > 40 ? "text-destructive" : "text-muted-foreground")} />
                      <span className={cn("text-sm", entry.daysActive > 40 ? "text-destructive font-medium" : "text-foreground")}>
                        {entry.daysActive} dias
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[60px] h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${entry.completionPercent}%` }} />
                      </div>
                      <span className="text-xs font-medium">{entry.completionPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.completedActions}/{entry.totalActions}
                  </TableCell>
                  <TableCell>
                    {entry.daysActive > 40 ? (
                      <Badge className="bg-destructive/15 text-destructive text-xs">Atrasado</Badge>
                    ) : (
                      <Badge className="bg-primary/15 text-primary text-xs">Em andamento</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/empresas/${entry.companyId}?tab=ciclos`); }}>
                      Ver <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {activeCycles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum ciclo em andamento na carteira
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
