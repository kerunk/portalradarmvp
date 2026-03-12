import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft, Building2, ChevronRight, TrendingUp,
  ShieldCheck, AlertTriangle, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getEnrichedCompanies,
  RISK_LABELS, RISK_COLORS,
  STAGE_LABELS, STAGE_COLORS,
  getLastActivityLabel,
  type EnrichedCompany,
} from "@/lib/portfolioUtils";

const USERS_MGMT_KEY = "mvp_managed_users_v2";

function getUserById(userId: string) {
  try {
    const stored = localStorage.getItem(USERS_MGMT_KEY);
    if (stored) {
      const users = JSON.parse(stored);
      return users.find((u: any) => u.id === userId);
    }
  } catch {}
  return null;
}

const riskIcons = {
  healthy: ShieldCheck,
  warning: AlertTriangle,
  risk: ShieldAlert,
};

export default function ManagerPortfolio() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const manager = useMemo(() => getUserById(userId || ""), [userId]);

  const enrichedCompanies = useMemo(() => getEnrichedCompanies(), []);

  const managerCompanies = useMemo(() => {
    if (!manager) return [];
    return enrichedCompanies.filter(
      ec => ec.company.ownerEmail?.toLowerCase() === manager.email.toLowerCase()
    );
  }, [enrichedCompanies, manager]);

  if (!manager) {
    return (
      <AppLayout title="Carteira não encontrada" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Gerente não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/usuarios")}>
            <ArrowLeft size={14} className="mr-2" /> Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Stats
  const healthyCt = managerCompanies.filter(c => c.riskLevel === "healthy").length;
  const warningCt = managerCompanies.filter(c => c.riskLevel === "warning").length;
  const riskCt = managerCompanies.filter(c => c.riskLevel === "risk").length;
  const avgMaturity = managerCompanies.length > 0
    ? Math.round(managerCompanies.reduce((s, c) => s + c.riskData.maturityScore, 0) / managerCompanies.length)
    : 0;

  return (
    <AppLayout
      title={`Carteira — ${manager.name}`}
      subtitle={`${managerCompanies.length} empresa${managerCompanies.length !== 1 ? "s" : ""} sob responsabilidade`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/usuarios")}>
          <ArrowLeft size={14} className="mr-2" /> Voltar para Gestão de Usuários
        </Button>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{managerCompanies.length}</p>
              <p className="text-xs text-muted-foreground">Empresas</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{healthyCt}</p>
              <p className="text-xs text-muted-foreground">Saudáveis</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{warningCt + riskCt}</p>
              <p className="text-xs text-muted-foreground">Atenção / Risco</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgMaturity}%</p>
              <p className="text-xs text-muted-foreground">Maturidade Média</p>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Maturidade</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerCompanies.map((ec) => {
                const RiskIcon = riskIcons[ec.riskLevel];
                return (
                  <TableRow key={ec.company.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{ec.company.name}</p>
                          <p className="text-xs text-muted-foreground">{ec.company.sector}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", STAGE_COLORS[ec.stage])}>
                        {STAGE_LABELS[ec.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs gap-1", RISK_COLORS[ec.riskLevel])}>
                        <RiskIcon size={10} />
                        {RISK_LABELS[ec.riskLevel]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[60px] h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${ec.riskData.maturityScore}%` }} />
                        </div>
                        <span className="text-xs font-medium">{ec.riskData.maturityScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs", ec.lastActivityDays !== null && ec.lastActivityDays > 7 ? "text-amber-500" : "text-muted-foreground")}>
                        {getLastActivityLabel(ec.lastActivityDays)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/empresas/${ec.company.id}`)}
                      >
                        Abrir portal <ChevronRight size={14} className="ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {managerCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa atribuída a este gerente
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
