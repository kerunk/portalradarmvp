import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Building2, TrendingUp, AlertTriangle,
  ChevronRight, Plus, ShieldCheck, ShieldAlert,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCompanyDialog } from "@/components/companies/CreateCompanyDialog";
import { getCompanies, type CompanyState } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import {
  getEnrichedCompanies,
  RISK_LABELS, RISK_COLORS,
  STAGE_LABELS, STAGE_COLORS,
  getLastActivityLabel,
  type EnrichedCompany, type RiskLevel, type ImplementationStage,
} from "@/lib/portfolioUtils";

const riskIcons = { healthy: ShieldCheck, warning: AlertTriangle, risk: ShieldAlert };

type SortKey = "name" | "maturity" | "risk" | "lastActivity";

export default function Companies() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!createDialogOpen) setRefreshKey(k => k + 1);
  }, [createDialogOpen]);

  const enriched = useMemo(() => getEnrichedCompanies(), [refreshKey]);

  // Unique owners
  const owners = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach(ec => {
      if (ec.company.ownerName) set.add(ec.company.ownerName);
    });
    return Array.from(set).sort();
  }, [enriched]);

  // Filter
  const filtered = useMemo(() => {
    return enriched.filter(ec => {
      const matchSearch = ec.company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRisk = filterRisk === "all" || ec.riskLevel === filterRisk;
      const matchStage = filterStage === "all" || ec.stage === filterStage;
      const matchOwner = filterOwner === "all" || (ec.company.ownerName || "Admin Master") === filterOwner;
      return matchSearch && matchRisk && matchStage && matchOwner;
    });
  }, [enriched, searchTerm, filterRisk, filterStage, filterOwner]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name": cmp = a.company.name.localeCompare(b.company.name); break;
        case "maturity": cmp = a.riskData.maturityScore - b.riskData.maturityScore; break;
        case "risk": {
          const order: Record<RiskLevel, number> = { risk: 0, warning: 1, healthy: 2 };
          cmp = order[a.riskLevel] - order[b.riskLevel];
          break;
        }
        case "lastActivity": cmp = (a.lastActivityDays ?? 999) - (b.lastActivityDays ?? 999); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(true); }
  };

  // Stats
  const totalCompanies = enriched.length;
  const riskCt = enriched.filter(e => e.riskLevel === "risk").length;
  const healthyCt = enriched.filter(e => e.riskLevel === "healthy").length;
  const avgMat = enriched.length > 0
    ? Math.round(enriched.reduce((s, e) => s + e.riskData.maturityScore, 0) / enriched.length) : 0;

  return (
    <AppLayout title="Visão MVP" subtitle="Acompanhamento de todas as empresas">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCompanies}</p>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{healthyCt}</p>
                <p className="text-sm text-muted-foreground">Saudáveis</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ShieldAlert size={20} className="text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{riskCt}</p>
                <p className="text-sm text-muted-foreground">Em Risco</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgMat}%</p>
                <p className="text-sm text-muted-foreground">Maturidade Média</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="healthy">Saudável</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="risk">Risco</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estágio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos estágios</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="implementacao">Implementação</SelectItem>
                <SelectItem value="consolidacao">Consolidação</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            {owners.length > 0 && (
              <Select value={filterOwner} onValueChange={setFilterOwner}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus size={16} /> Nova Empresa
          </Button>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Empresa <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Estágio</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("risk")}>
                    Status <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("maturity")}>
                    Maturidade <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>Ciclo Atual</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1" onClick={() => toggleSort("lastActivity")}>
                    Última Atividade <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((ec) => {
                const RiskIcon = riskIcons[ec.riskLevel];
                return (
                  <TableRow key={ec.company.id} className="cursor-pointer" onClick={() => navigate(`/empresas/${ec.company.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{ec.company.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{ec.company.name}</p>
                          <p className="text-xs text-muted-foreground">{ec.company.sector} · {ec.company.employees} colab.</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{ec.company.ownerName || "Admin Master"}</span>
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
                      <Badge variant="outline" className="text-xs">{ec.currentCycle}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs",
                        ec.lastActivityDays !== null && ec.lastActivityDays > 7 ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {getLastActivityLabel(ec.lastActivityDays)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/empresas/${ec.company.id}`); }}
                      >
                        Ver portal <ChevronRight size={14} className="ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma empresa encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <CreateCompanyDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>
    </AppLayout>
  );
}
