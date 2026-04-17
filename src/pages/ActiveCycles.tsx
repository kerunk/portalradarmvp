import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Building2, ChevronRight, Rocket, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompanies } from "@/lib/companyService";

const sb = supabase as any;

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
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ActiveCycleEntry[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = Date.now();

      const [companies, { data: cycleStates }, { data: cycleActions }] = await Promise.all([
        fetchCompanies(),
        sb.from("cycle_states")
          .select("company_id, cycle_id, closure_status, start_date")
          .neq("closure_status", "closed"),
        sb.from("cycle_actions")
          .select("company_id, cycle_id, status, enabled"),
      ]);

      const companyMap = Object.fromEntries(
        (companies || []).map((c: any) => [c.id, c.name])
      );

      // Agrupa ações por company+cycle
      const actionMap: Record<string, { total: number; completed: number }> = {};
      for (const a of cycleActions || []) {
        if (!a.enabled) continue;
        const key = `${a.company_id}__${a.cycle_id}`;
        if (!actionMap[key]) actionMap[key] = { total: 0, completed: 0 };
        actionMap[key].total++;
        if (a.status === "completed") actionMap[key].completed++;
      }

      const result: ActiveCycleEntry[] = [];
      for (const cs of cycleStates || []) {
        const key = `${cs.company_id}__${cs.cycle_id}`;
        const acts = actionMap[key];
        if (!acts || acts.total === 0) continue; // sem atividade

        const daysActive = cs.start_date
          ? Math.max(0, Math.floor((now - new Date(cs.start_date).getTime()) / 86400000))
          : 0;

        result.push({
          companyId: cs.company_id,
          companyName: companyMap[cs.company_id] || "Empresa",
          cycleId: cs.cycle_id,
          daysActive,
          totalActions: acts.total,
          completedActions: acts.completed,
          completionPercent: Math.round((acts.completed / acts.total) * 100),
        });
      }

      setEntries(result.sort((a, b) => b.daysActive - a.daysActive));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <AppLayout title="Ciclos em Andamento" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Ciclos em Andamento" subtitle={`${entries.length} ciclos ativos na carteira`}>
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
                <TableHead className="text-right">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum ciclo ativo encontrado.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((entry, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/empresas/${entry.companyId}?tab=ciclos&cycle=${entry.cycleId}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-primary" />
                      <span className="font-medium">{entry.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{entry.cycleId}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className={cn(entry.daysActive > 40 ? "text-destructive" : "text-muted-foreground")} />
                      <span className={cn("text-sm", entry.daysActive > 40 ? "text-destructive font-medium" : "")}>
                        {entry.daysActive} dias
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[60px] h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${entry.completionPercent}%` }} />
                      </div>
                      <span className="text-xs font-medium">{entry.completionPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.completedActions}/{entry.totalActions}
                  </TableCell>
                  <TableCell>
                    {entry.daysActive > 40
                      ? <Badge className="bg-destructive/10 text-destructive text-xs">Atrasado</Badge>
                      : entry.completionPercent >= 80
                      ? <Badge className="bg-emerald-500/10 text-emerald-700 text-xs">Pronto p/ fechar</Badge>
                      : <Badge className="bg-blue-500/10 text-blue-700 text-xs"><Rocket size={10} className="mr-1" />Em andamento</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm"><ChevronRight size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
