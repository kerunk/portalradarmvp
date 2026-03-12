import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { getCompanies, setActiveCompany } from "@/lib/storage";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Eye, LayoutDashboard, Rocket, Users, Target,
  FileCheck, BarChart3, FileText, Layers, Database, ShieldCheck,
} from "lucide-react";

// Lazy imports for client pages content
import MVPCycles from "./MVPCycles";
import Turmas from "./Turmas";
import SuccessFactors from "./SuccessFactors";
import Records from "./Records";
import Indicators from "./Indicators";
import Reports from "./Reports";
import OrgStructure from "./OrgStructure";
import BasePopulacional from "./BasePopulacional";
import NucleoGovernance from "./NucleoGovernance";

const mirrorTabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "ciclos", label: "Ciclos MVP", icon: Rocket },
  { id: "turmas", label: "Turmas", icon: Users },
  { id: "fatores", label: "Fatores de Sucesso", icon: Target },
  { id: "registros", label: "Registros", icon: FileCheck },
  { id: "indicadores", label: "Indicadores", icon: BarChart3 },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "estrutura", label: "Estrutura Org.", icon: Layers },
  { id: "base-populacional", label: "Base Populacional", icon: Database },
  { id: "nucleo", label: "Governança", icon: ShieldCheck },
];

export default function CompanyMirror() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enterMirror, exitMirror } = useReadOnly();

  const initialTab = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);

  const companies = useMemo(() => getCompanies(), []);
  const company = companies.find(c => c.id === companyId);

  useEffect(() => {
    if (company) {
      enterMirror(company.id, company.name);
      setActiveCompany(company.id);
    }
    return () => {
      exitMirror();
      setActiveCompany(null);
    };
  }, [company?.id]);

  // Sync tab from URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && mirrorTabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (!company) {
    return (
      <AppLayout title="Empresa não encontrada" subtitle="">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">A empresa solicitada não foi encontrada.</p>
          <Button onClick={() => navigate("/empresas")}>Voltar para Empresas</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Read-only banner */}
      <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              exitMirror();
              setActiveCompany(null);
              navigate("/empresas");
            }}
            className="gap-1.5 text-foreground/70 hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-foreground">
              Empresa: {company.name}
            </span>
            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">
              Visualização administrativa · Somente leitura
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-border bg-card/50 px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-auto p-0 gap-0 overflow-x-auto">
            {mirrorTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-xs gap-1.5"
                >
                  <Icon size={14} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Tab content - all rendered in read-only context */}
      <div className="p-6 pointer-events-auto">
        <div className={activeTab !== "dashboard" ? "hidden" : ""}>
          <ClientDashboard
            companyId={company.id}
            companyName={company.name}
            refreshKey={0}
            onAlertDismissed={() => {}}
          />
        </div>
        {activeTab === "ciclos" && <MirrorContent><MVPCycles /></MirrorContent>}
        {activeTab === "turmas" && <MirrorContent><Turmas /></MirrorContent>}
        {activeTab === "fatores" && <MirrorContent><SuccessFactors /></MirrorContent>}
        {activeTab === "registros" && <MirrorContent><Records /></MirrorContent>}
        {activeTab === "indicadores" && <MirrorContent><Indicators /></MirrorContent>}
        {activeTab === "relatorios" && <MirrorContent><Reports /></MirrorContent>}
        {activeTab === "estrutura" && <MirrorContent><OrgStructure /></MirrorContent>}
        {activeTab === "base-populacional" && <MirrorContent><BasePopulacional /></MirrorContent>}
        {activeTab === "nucleo" && <MirrorContent><NucleoGovernance /></MirrorContent>}
      </div>
    </div>
  );
}

/** Wrapper that strips the AppLayout shell from nested pages and blocks interactions */
function MirrorContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="mirror-content-wrapper relative">
      {/* Overlay to block all interactions */}
      <div className="absolute inset-0 z-30 cursor-not-allowed" title="Modo somente leitura" />
      <div className="pointer-events-none select-none opacity-95">
        {children}
      </div>
    </div>
  );
}
