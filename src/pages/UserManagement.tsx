// UserManagement page removed — intermediate roles eliminated.
// Only admin_master and admin_empresa exist now.

import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function UserManagement() {
  return (
    <AppLayout title="Gestão de Usuários" subtitle="Funcionalidade simplificada">
      <Card className="p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <ShieldCheck size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground">
          Gestão simplificada
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          O sistema opera com dois perfis: Administrador Master e Administrador da Empresa.
          Os usuários das empresas são criados automaticamente ao cadastrar uma nova empresa.
        </p>
      </Card>
    </AppLayout>
  );
}
