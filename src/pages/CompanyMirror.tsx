import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { setActiveCompany } from "@/lib/storage";
import { fetchCompanyById } from "@/lib/companyService";
import { useReadOnly } from "@/contexts/ReadOnlyContext";

/**
 * CompanyMirror — loads company from Supabase, activates mirror/read-only mode,
 * then redirects admin to the client portal route.
 */

const tabToRoute: Record<string, string> = {
  dashboard: "/",
  ciclos: "/ciclos",
  turmas: "/turmas",
  fatores: "/fatores",
  registros: "/registros",
  indicadores: "/indicadores",
  relatorios: "/relatorios",
  estrutura: "/estrutura",
  "base-populacional": "/base-populacional",
  nucleo: "/nucleo",
  configuracoes: "/configuracoes",
};

export default function CompanyMirror() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enterMirror } = useReadOnly();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      navigate("/empresas", { replace: true });
      return;
    }

    async function loadAndRedirect() {
      const company = await fetchCompanyById(companyId!);

      if (company) {
        // Activate mirror mode
        enterMirror(company.id, company.name);
        setActiveCompany(company.id);

        // Determine target route from ?tab= param
        const tab = searchParams.get("tab") || "dashboard";
        const route = tabToRoute[tab] || "/";

        // Replace current URL so the admin sees the real client route
        navigate(route, { replace: true });
      } else {
        // Company not found – go back to companies list
        navigate("/empresas", { replace: true });
      }
      setLoading(false);
    }

    loadAndRedirect();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando portal da empresa...</p>
      </div>
    );
  }

  return null;
}
