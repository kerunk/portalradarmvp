import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  getPopulation,
  getPopulationStats,
} from "@/lib/companyStorage";
import { getAllCycleActions } from "@/lib/storage";

export default function NucleoGovernance() {
  const { user } = useAuth();
  const companyId = user?.companyId || "";

  const [refreshKey] = useState(0);

  const population = useMemo(() => getPopulation(companyId), [companyId, refreshKey]);
  const nucleoMembers = useMemo(() => population.filter(m => m.nucleo && m.active), [population]);
  const stats = useMemo(() => getPopulationStats(companyId), [companyId, refreshKey]);

  // Get all actions to count assignments per nucleus member
  const allActions = useMemo(() => getAllCycleActions(), [refreshKey]);

  const membersWithStats = useMemo(() => {
    return nucleoMembers.map(member => {
      const assignedActions = allActions.filter(
        a => a.action.responsible?.toLowerCase() === member.name.toLowerCase()
      );
      const completedActions = assignedActions.filter(a => a.action.status === "completed");
      return {
        ...member,
        totalActions: assignedActions.length,
        completedActions: completedActions.length,
        participation: assignedActions.length > 0
          ? Math.round((completedActions.length / assignedActions.length) * 100)
          : 0,
      };
    });
  }, [nucleoMembers, allActions]);

  const avgEngagement = membersWithStats.length > 0
    ? Math.round(membersWithStats.reduce((sum, m) => sum + m.participation, 0) / membersWithStats.length)
    : 0;

  const totalNucleoActions = membersWithStats.reduce((sum, m) => sum + m.totalActions, 0);
  const totalNucleoCompleted = membersWithStats.reduce((sum, m) => sum + m.completedActions, 0);

  return (
    <AppLayout title="Governança do Núcleo" subtitle={`Acompanhamento do núcleo de sustentação — ${user?.companyName || "Empresa"}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground">Integrantes</p>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{nucleoMembers.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground">Ações Atribuídas</p>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{totalNucleoActions}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground">Ações Realizadas</p>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{totalNucleoCompleted}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground">Engajamento Médio</p>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{avgEngagement}%</p>
          </Card>
        </div>

        {/* Members Table */}
        <Card>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Membros do Núcleo de Sustentação</h3>
            <p className="text-xs text-muted-foreground">
              Pessoas da base populacional marcadas como integrantes do núcleo
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-center">Ações Atribuídas</TableHead>
                <TableHead className="text-center">Ações Realizadas</TableHead>
                <TableHead className="text-center">Participação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersWithStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum integrante do núcleo cadastrado. Marque colaboradores como "Núcleo" na Base Populacional.
                  </TableCell>
                </TableRow>
              )}
              {membersWithStats.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary" />
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell>{member.role || "—"}</TableCell>
                  <TableCell>{member.sector || "—"}</TableCell>
                  <TableCell className="text-center">{member.totalActions}</TableCell>
                  <TableCell className="text-center">{member.completedActions}</TableCell>
                  <TableCell className="text-center">
                    {member.totalActions > 0 ? (
                      <Badge
                        variant="outline"
                        className={
                          member.participation >= 75
                            ? "bg-green-500/10 text-green-600 border-green-500/30"
                            : member.participation >= 50
                            ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }
                      >
                        {member.participation}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
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
