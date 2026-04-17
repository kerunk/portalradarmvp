// ─── DelayedActions.tsx ─────────────────────────────────────────────────────
// Lê ações atrasadas direto do Supabase (tabela cycle_actions status='delayed')
// em vez de iterar pelo localStorage de cada empresa.

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Building2, ChevronRight, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompanies } from "@/lib/companyService";

const sb = supabase as any;

interface DelayedActionRow {
  companyId: string;
  companyName: string;
  cycleId: string;
  factorId: string;
  actionTitle: string;
  responsible: string;
  dueDate: string | null;
  daysDelayed: number;
}

export default function DelayedActions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DelayedActionRow[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = Date.now();

      // Busca todas as ações com status delayed ou com due_date vencida
      const [companies, { data: actions }] = await Promise.all([
        fetchCompanies(),
        sb
          .from("cycle_actions")
          .select("company_id, cycle_id, factor_id, title, responsible, due_date, status")
          .in("status", ["delayed", "pending", "in_progress"])
          .not("due_date", "is", null),
      ]);

      const companyMap = Object.fromEntries((companies || []).map((c: any) => [c.id, c.name]));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const delayed: DelayedActionRow[] = (actions || [])
        .filter((a: any) => {
          const due = new Date(a.due_date);
          due.setHours(0, 0, 0, 0);
          return due < today && a.status !== "completed";
        })
        .map((a: any) => {
          const due = new Date(a.due_date).getTime();
          const daysDelayed = Math.max(0, Math.floor((now - due) / 86400000));
          return {
            companyId: a.company_id,
            companyName: companyMap[a.company_id] || "Empresa",
            cycleId: a.cycle_id,
            factorId: a.factor_id,
            actionTitle: a.title || "Ação sem título",
            responsible: a.responsible || "Sem responsável",
            dueDate: a.due_date,
            daysDelayed,
          };
        })
        .sort((a: DelayedActionRow, b: DelayedActionRow) => b.daysDelayed - a.daysDelayed);

      setRows(delayed);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <AppLayout title="Ações Atrasadas" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Ações Atrasadas" subtitle={`${rows.length} ações atrasadas na carteira`}>
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
                <TableHead className="text-right">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhuma ação atrasada encontrada.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/empresas/${row.companyId}?tab=ciclos&cycle=${row.cycleId}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-primary" />
                      <span className="font-medium">{row.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {row.cycleId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{row.actionTitle}</p>
                    <p className="text-xs text-muted-foreground">{row.factorId}</p>
                  </TableCell>
                  <TableCell className="text-sm">{row.responsible}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-xs",
                        row.daysDelayed > 14 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700",
                      )}
                    >
                      <Clock size={10} className="mr-1" />
                      {row.daysDelayed} dias
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <ChevronRight size={14} />
                    </Button>
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
