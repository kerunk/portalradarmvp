import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveCompanyId } from "@/hooks/useActiveCompanyId";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { ShieldCheck, Users, Target, TrendingUp } from "lucide-react";
import { fetchPopulation, fetchCycleActions, type PopulationMember, type CycleAction } from "@/lib/db";

export default function NucleoGovernance() {
  const { user } = useAuth();
  const companyId = useActiveCompanyId();

  const [loading, setLoading] = useState(true);
  const [population, setPopulation] = useState<PopulationMember[]>([]);
  const [allActions, setAllActions] = useState<CycleAction[]>([]);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      fetchPopulation(companyId),
      fetchCycleActions(companyId),
    ]).then(([pop, actions]) => {
      setPopulation(pop);
      setAllActions(actions);
      setLoading(false);
    });
  }, [companyId]);

  const nucleoMembers = useMemo(
    () => population.filter(m => m.nucleo && m.active),
    [population]
  );

  const stats = useMemo(() => {
    const active = population.filter(m => m.active);
    return {
      total: nucleoMembers.length,
      facilitators: active.filter(m => m.facilitator).length,
      leaders: active.filter(m => m.leadership).length,
    };
  }, [population, nucleoMembers]);

  const membersWithStats = useMemo(() => {
    return nucleoMembers.map(member => {
      const assigned = allActions.filter(
        a => a.responsible?.toLowerCase() === member.name.toLowerCase()
      );
      const completed = assigned.filter(a => a.status === "completed");
      return {
        ...member,
        totalActions: assigned.length,
        completedActions: completed.length,
        participation: assigned.length > 0
          ? Math.round((completed.length / assigned.length) * 100)
          : 0,
      };
    });
  }, [nucleoMembers, allActions]);

  const avgEngagement = membersWithStats.length > 0
    ? Math.round(membersWithStats.reduce((s, m) => s + m.participation, 0) / membersWithStats.length)
    : 0;

  const totalAssigned  = membersWithStats.reduce((s, m) => s + m.totalActions, 0);
  const totalCompleted = membersWithStats.reduce((s, m) => s + m.completedActions, 0);

  if (loading) {
    return (
      <AppLayout title="Governança do Núcleo" subtitle="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Governança do Núcleo"
      subtitle={`Núcleo de sustentação — ${user?.companyName || "Empresa"}`}
    >
      <div className="space-y-6 animate-fade-in">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, label: "Integrantes do Núcleo",  value: stats.total },
            { icon: Target,      label: "Ações Atribuídas",       value: totalAssigned },
            { icon: TrendingUp,  label: "Ações Realizadas",       value: totalCompleted },
            { icon: Users,       label: "Engajamento Médio",      value: `${avgEngagement}%` },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-2">
                <s.icon size={16} className="text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Tabela de membros */}
        <Card>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Membros do Núcleo de Sustentação</h3>
            <p className="text-xs text-muted-foreground">
              Colaboradores marcados como "Núcleo" na Base Populacional
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-center">Facilitador</TableHead>
                <TableHead className="text-center">Liderança</TableHead>
                <TableHead className="text-center">Ações Atribuídas</TableHead>
                <TableHead className="text-center">Ações Realizadas</TableHead>
                <TableHead className="text-center">Participação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersWithStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum integrante do núcleo cadastrado.<br />
                    <span className="text-xs">Marque colaboradores como "Núcleo" na Base Populacional.</span>
                  </TableCell>
                </TableRow>
              ) : (
                membersWithStats.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.role || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.sector || "—"}</TableCell>
                    <TableCell className="text-center">
                      {m.facilitator
                        ? <Badge variant="secondary" className="text-xs">Sim</Badge>
                        : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {m.leadership
                        ? <Badge variant="secondary" className="text-xs">Sim</Badge>
                        : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-center font-medium">{m.totalActions}</TableCell>
                    <TableCell className="text-center font-medium">{m.completedActions}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          m.participation >= 80
                            ? "bg-emerald-500/10 text-emerald-700"
                            : m.participation >= 50
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {m.participation}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Info sobre facilitadores e líderes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3">Facilitadores Habilitados</h4>
            {population.filter(m => m.facilitator && m.active).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum facilitador cadastrado.</p>
            ) : (
              <div className="space-y-1">
                {population.filter(m => m.facilitator && m.active).map(m => (
                  <div key={m.id} className="flex justify-between text-sm">
                    <span>{m.name}</span>
                    <span className="text-muted-foreground">{m.sector || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3">Lideranças</h4>
            {population.filter(m => m.leadership && m.active).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma liderança cadastrada.</p>
            ) : (
              <div className="space-y-1">
                {population.filter(m => m.leadership && m.active).map(m => (
                  <div key={m.id} className="flex justify-between text-sm">
                    <span>{m.name}</span>
                    <span className="text-muted-foreground">{m.role || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
