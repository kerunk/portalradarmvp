import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { User, Building2 } from "lucide-react";
import { CompanyContacts } from "@/components/companies/CompanyContacts";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default function Settings() {
  const { user, isAdminMVP } = useAuth();
  const { isReadOnly, mirrorCompanyId } = useReadOnly();
  const companyId = isReadOnly ? mirrorCompanyId : user?.companyId;

  return (
    <AppLayout
      title="Configurações"
      subtitle="Gerencie suas preferências e dados da conta"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Profile Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Dados do Usuário</h3>
              <p className="text-sm text-muted-foreground">Informações da sua conta</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="text-sm font-medium">{user?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Perfil</p>
              <p className="text-sm font-medium">{isAdminMVP ? "Administrador MVP" : "Cliente"}</p>
            </div>
          </div>
        </Card>

        {/* Company Info (for clients) */}
        {!isAdminMVP && user?.companyName && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Dados da Empresa</h3>
                <p className="text-sm text-muted-foreground">Informações da empresa vinculada</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Empresa</p>
                <p className="text-sm font-medium">{user.companyName}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Implementation Contacts */}
        {companyId && (
          <CompanyContacts companyId={companyId} readOnly={isReadOnly} />
        )}

        {/* Security - Change Password */}
        <ChangePasswordForm />
      </div>
    </AppLayout>
  );
}