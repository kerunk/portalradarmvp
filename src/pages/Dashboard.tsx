import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { recalculateActionStatuses } from "@/lib/storage";

export default function Dashboard() {
  const { user, isAdminMVP } = useAuth();
  const { isReadOnly, mirrorCompanyId, mirrorCompanyName } = useReadOnly();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    recalculateActionStatuses();
  }, []);

  const handleAlertDismissed = () => setRefreshKey(k => k + 1);

  // In mirror mode, show client dashboard for the mirrored company
  const showClientView = !isAdminMVP || isReadOnly;

  const subtitle = showClientView
    ? `Visão operacional — ${mirrorCompanyName || user?.companyName || "Empresa"}`
    : "Visão consolidada da carteira de implementação";

  return (
    <AppLayout title="Dashboard" subtitle={subtitle}>
      {showClientView ? (
        <ClientDashboard
          companyId={mirrorCompanyId || user?.companyId || ""}
          companyName={mirrorCompanyName || user?.companyName || "Empresa"}
          refreshKey={refreshKey}
          onAlertDismissed={handleAlertDismissed}
        />
      ) : (
        <AdminDashboard refreshKey={refreshKey} onAlertDismissed={handleAlertDismissed} />
      )}
    </AppLayout>
  );
}
