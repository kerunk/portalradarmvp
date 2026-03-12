import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Building2, ChevronRight, Clock } from "lucide-react";
import { getCompanies, setActiveCompany, getState } from "@/lib/storage";
import { CYCLE_IDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DelayedAction {
  companyId: string;
  companyName: string;
  cycleId: string;
  factorName: string;
  actionTitle: string;
  responsible: string;
  dueDate: string | null;
  daysDelayed: number;
}

export default function DelayedActions() {
  const navigate = useNavigate();

  const delayedActions = useMemo(() => {
    const companies = getCompanies();
    const actions: DelayedAction[] = [];
    const now = Date.now();

    companies.forEach(company => {
      setActiveCompany(company.id);
      const state = getState();

      CYCLE_IDS.forEach(cycleId => {
        const cs = state.cycles[cycleId];
        if (!cs) return;
        cs.factors.forEach(factor => {
          factor.actions.forEach(action => {
            if (action.enabled && action.status === "delayed") {
              const daysDelayed = action.dueDate
                ? Math.max(0, Math.floor((now - new Date(action.dueDate).getTime()) / 86400000))
                : 0;
              actions.push({
                companyId: company.id,
                companyName: company.name,
                cycleId,
                factorName: factor.id,
                actionTitle: action.title,
                responsible: action.responsible || "Sem responsável",
                dueDate: action.dueDate,
                daysDelayed,
              });
            }
          });
        });
      });

      setActiveCompany(null);
    });

    return actions.sort((a, b) => b.daysDelayed - a.daysDelayed);
  }, []);

  return (
    <AppLayout title="Ações Atrasadas" subtitle={`${delayedActions.length} ações atrasadas na carteira`}>
      <div className="space-y-6 animate-fade-in">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Dias de Atraso</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delayedActions.map((action, i) => (
                <TableRow key={i} className="cursor-pointer" onClick={() => navigate(`/empresas/${action.companyId}?tab=registros`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-primary" />
                      <span className="font-medium text-foreground">{action.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{action.cycleId}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">{action.actionTitle}</p>
                      <p className="text-xs text-muted-foreground">{action.factorName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{action.responsible}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {action.dueDate ? new Date(action.dueDate).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", action.daysDelayed > 14 ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-500")}>
                      <Clock size={10} className="mr-1" />
                      {action.daysDelayed} dias
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/empresas/${action.companyId}?tab=registros`); }}>
                      Ver <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {delayedActions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma ação atrasada na carteira 🎉
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
