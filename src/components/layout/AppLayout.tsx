import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { GlobalHeader } from "./GlobalHeader";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { setActiveCompany } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { isReadOnly, mirrorCompanyName, exitMirror } = useReadOnly();
  const navigate = useNavigate();

  const handleExitMirror = () => {
    exitMirror();
    setActiveCompany(null);
    navigate("/empresas");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        {/* Read-only banner when admin is viewing a company */}
        {isReadOnly && (
          <div className="sticky top-0 z-40 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExitMirror}
                className="gap-1.5 text-foreground/70 hover:text-foreground"
              >
                <ArrowLeft size={16} />
                Voltar ao painel administrador
              </Button>
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-foreground">
                  Empresa: {mirrorCompanyName}
                </span>
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">
                  Visualização administrativa · Somente leitura
                </Badge>
              </div>
            </div>
          </div>
        )}
        <GlobalHeader title={title} subtitle={subtitle} />
        <main className={isReadOnly ? "p-6 pointer-events-none select-none" : "p-6"}>
          {children}
        </main>
      </div>
    </div>
  );
}
