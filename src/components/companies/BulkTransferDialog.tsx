import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowRightLeft, Building2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCompanies, setCompanies, type CompanyState } from "@/lib/storage";
import { addOperationalEvent } from "@/lib/operationalEvents";
import { auditUserAction } from "@/lib/auditLog";
import {
  type AdminRole,
  ADMIN_ROLE_LABELS,
  getAdminRoleAssignments,
} from "@/lib/permissions";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  adminRole: AdminRole;
  active: boolean;
}

interface BulkTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceUser: ManagedUser | null;
  allUsers: ManagedUser[];
  currentUserEmail: string;
  currentUserName: string;
  onTransferComplete: () => void;
}

export function BulkTransferDialog({
  open, onOpenChange, sourceUser, allUsers, currentUserEmail, currentUserName, onTransferComplete,
}: BulkTransferDialogProps) {
  const { toast } = useToast();
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [targetEmail, setTargetEmail] = useState("");
  const [transferred, setTransferred] = useState<string[]>([]);

  const managerCompanies = useMemo(() => {
    if (!sourceUser) return [];
    return getCompanies().filter(
      c => c.ownerEmail?.toLowerCase() === sourceUser.email.toLowerCase() && !c.deleted
    );
  }, [sourceUser, transferred]);

  const remainingCompanies = managerCompanies.filter(c => !transferred.includes(c.id));

  const availableTargets = useMemo(() => {
    if (!sourceUser) return [];
    return allUsers.filter(u =>
      u.id !== sourceUser.id &&
      u.active &&
      (u.adminRole === "gerente_conta" || u.adminRole === "admin_mvp" || u.adminRole === "admin_master")
    );
  }, [sourceUser, allUsers]);

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCompanyIds.size === remainingCompanies.length) {
      setSelectedCompanyIds(new Set());
    } else {
      setSelectedCompanyIds(new Set(remainingCompanies.map(c => c.id)));
    }
  };

  const handleTransfer = () => {
    if (!sourceUser || selectedCompanyIds.size === 0) return;

    const allCompanies = getCompanies();
    const targetUser = availableTargets.find(u => u.email === targetEmail);
    const targetName = targetEmail === "__no_manager__"
      ? "Carteira administrativa"
      : targetUser?.name || targetEmail;
    const targetEmailFinal = targetEmail === "__no_manager__" ? undefined : targetEmail;

    const updated = allCompanies.map(c => {
      if (selectedCompanyIds.has(c.id)) {
        return {
          ...c,
          ownerEmail: targetEmailFinal,
          ownerName: targetEmail === "__no_manager__" ? undefined : targetName,
        };
      }
      return c;
    });
    setCompanies(updated);

    addOperationalEvent({
      type: "portfolio_transferred",
      title: "Carteira transferida",
      message: `${selectedCompanyIds.size} empresa(s) de ${sourceUser.name} transferida(s) para ${targetName}.`,
      managerName: targetName,
      managerEmail: targetEmailFinal,
    });
    auditUserAction(
      currentUserEmail, currentUserName,
      "portfolio_transferred", sourceUser.email, sourceUser.name,
      `${selectedCompanyIds.size} empresa(s) transferidas para ${targetName}`
    );

    setTransferred(prev => [...prev, ...Array.from(selectedCompanyIds)]);
    setSelectedCompanyIds(new Set());
    setTargetEmail("");

    toast({
      title: "Transferência realizada",
      description: `${selectedCompanyIds.size} empresa(s) transferida(s) para ${targetName}.`,
    });

    window.dispatchEvent(new CustomEvent("mvp_company_changed"));
  };

  const handleClose = () => {
    setSelectedCompanyIds(new Set());
    setTargetEmail("");
    setTransferred([]);
    onOpenChange(false);
    if (transferred.length > 0) onTransferComplete();
  };

  const allTransferred = remainingCompanies.length === 0 && managerCompanies.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transferência de Carteira
          </DialogTitle>
          <DialogDescription>
            {sourceUser && `Transfira as empresas de ${sourceUser.name} para outros gerentes antes de excluir.`}
          </DialogDescription>
        </DialogHeader>

        {allTransferred ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
            <p className="text-lg font-medium text-foreground">Todas as empresas foram transferidas</p>
            <p className="text-sm text-muted-foreground">Agora você pode excluir o usuário com segurança.</p>
            <Button onClick={handleClose}>Concluir</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {transferred.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {transferred.length} empresa(s) já transferida(s) · {remainingCompanies.length} restante(s)
              </Badge>
            )}

            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedCompanyIds.size === remainingCompanies.length && remainingCompanies.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remainingCompanies.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCompanyIds.has(c.id)}
                          onCheckedChange={() => toggleCompany(c.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-primary" />
                          <span className="text-sm font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.sector}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {c.active !== false ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label>Transferir selecionadas para:</Label>
              <Select value={targetEmail} onValueChange={setTargetEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__no_manager__">
                    Sem gerente (Carteira administrativa)
                  </SelectItem>
                  {availableTargets.map(m => (
                    <SelectItem key={m.email} value={m.email}>
                      {m.name} ({ADMIN_ROLE_LABELS[m.adminRole]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {selectedCompanyIds.size} empresa(s) selecionada(s)
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button
                  onClick={handleTransfer}
                  disabled={selectedCompanyIds.size === 0 || !targetEmail}
                >
                  Transferir Selecionadas
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
