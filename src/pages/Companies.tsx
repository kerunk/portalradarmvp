import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Users,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCompanyDialog } from "@/components/companies/CreateCompanyDialog";
import { getCompanies, type CompanyState } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";

export default function Companies() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyState[]>([]);

  // Load companies from storage (and reload when dialog closes)
  useEffect(() => {
    setCompanies(getCompanies());
  }, [createDialogOpen]);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (filterStatus === "risk") return matchesSearch && company.onboardingStatus === "not_started";
    if (filterStatus === "on-track") return matchesSearch && company.onboardingStatus === "completed";
    return matchesSearch;
  });

  // Aggregate stats
  const totalCompanies = companies.length;
  const completedOnboarding = companies.filter(c => c.onboardingStatus === "completed").length;
  const pendingOnboarding = companies.filter(c => c.onboardingStatus !== "completed").length;

  return (
    <AppLayout
      title="Visão MVP"
      subtitle="Acompanhamento de todas as empresas"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {totalCompanies}
                </p>
                <p className="text-sm text-muted-foreground">Empresas Cadastradas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {completedOnboarding}
                </p>
                <p className="text-sm text-muted-foreground">Onboarding Concluído</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-foreground">
                  {pendingOnboarding}
                </p>
                <p className="text-sm text-muted-foreground">Onboarding Pendente</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="risk">Pendentes</SelectItem>
                <SelectItem value="on-track">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus size={16} />
            Criar Nova Empresa
          </Button>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="p-5 hover:shadow-elevated transition-all cursor-pointer group"
              onClick={() => navigate(`/empresas/${company.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-contain border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="text-lg font-bold text-secondary-foreground">
                        {company.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">{company.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{company.sector}</span>
                      <span>•</span>
                      <span>{company.employees} colaboradores</span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    company.onboardingStatus === "completed"
                      ? "bg-success/10 text-success border-success/30"
                      : company.onboardingStatus === "in_progress"
                      ? "bg-warning/10 text-warning border-warning/30"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {company.onboardingStatus === "completed"
                    ? "Ativo"
                    : company.onboardingStatus === "in_progress"
                    ? "Em Progresso"
                    : "Pendente"}
                </Badge>
              </div>

              {/* Info */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Responsável</p>
                  <span className="text-sm font-medium">{company.ownerName || "Admin Master"}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Admin Empresa</p>
                  <span className="text-sm font-medium">{company.adminName}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <span className="text-sm font-medium truncate block">{company.adminEmail}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Criada em: {company.createdAt}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/empresas/${company.id}`);
                  }}
                >
                  Ver portal
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Company Dialog */}
        <CreateCompanyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
