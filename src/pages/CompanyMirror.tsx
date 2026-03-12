import { useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getCompanies, setActiveCompany } from "@/lib/storage";
import { useReadOnly } from "@/contexts/ReadOnlyContext";

/**
 * CompanyMirror is a thin entry-point component.
 * It activates mirror/read-only mode for the target company,
 * sets the active company context, then redirects the admin
 * to the real client route (e.g. "/" for dashboard, "/ciclos", "/turmas", etc.).
 *
 * The rest of the app (Sidebar, AppLayout, Dashboard, etc.) checks
 * `isReadOnly` from ReadOnlyContext and renders the client portal
 * experience with a read-only banner.
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
};

export default function CompanyMirror() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { enterMirror } = useReadOnly();

  const companies = useMemo(() => getCompanies(), []);
  const company = companies.find(c => c.id === companyId);

  useEffect(() => {
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
  }, [company?.id]);

  // This component renders nothing – it just redirects
  return null;
}
