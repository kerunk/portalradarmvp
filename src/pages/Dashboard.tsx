import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { recalculateActionStatuses } from "@/lib/storage";

export default function Dashboard() {
  const { user, isAdminMVP } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    recalculateActionStatuses();
  }, []);

  const handleAlertDismissed = () => setRefreshKey(k => k + 1);

  const subtitle = isAdminMVP
    ? "Visão consolidada da carteira de implementação"
    : `Visão operacional — ${user?.companyName || "Empresa"}`;

  return (
    <AppLayout title="Dashboard" subtitle={subtitle}>
      {isAdminMVP ? (
        <AdminDashboard refreshKey={refreshKey} onAlertDismissed={handleAlertDismissed} />
      ) : (
        <ClientDashboard
          companyId={user?.companyId || ""}
          companyName={user?.companyName || "Empresa"}
          refreshKey={refreshKey}
          onAlertDismissed={handleAlertDismissed}
        />
      )}
    </AppLayout>
  );
}
