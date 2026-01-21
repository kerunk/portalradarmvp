import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, User, Mail, Lock, FileDown, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addCompany, type CompanyState } from "@/lib/storage";
import { generateAccessPDF } from "@/lib/pdfGenerator";

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedCompanyData {
  companyName: string;
  sector: string;
  employees: string;
  adminName: string;
  adminEmail: string;
  tempPassword: string;
}

const sectors = [
  "Indústria", "Tecnologia", "Varejo", "Construção", "Serviços",
  "Saúde", "Educação", "Agronegócio", "Logística", "Outro",
];

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function CreateCompanyDialog({ open, onOpenChange }: CreateCompanyDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [employees, setEmployees] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  
  const [createdData, setCreatedData] = useState<CreatedCompanyData | null>(null);
  const [savedCompany, setSavedCompany] = useState<CompanyState | null>(null);

  const resetForm = () => {
    setStep("form");
    setCompanyName("");
    setSector("");
    setEmployees("");
    setAdminName("");
    setAdminEmail("");
    setCreatedData(null);
    setSavedCompany(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome da empresa, nome e email do administrador.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const tempPassword = generateTempPassword();
    const company: CompanyState = {
      id: `company-${Date.now()}`,
      name: companyName.trim(),
      sector: sector || "Não informado",
      employees: parseInt(employees) || 0,
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      tempPassword,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    addCompany(company);
    setSavedCompany(company);
    
    setCreatedData({
      companyName: company.name,
      sector: company.sector,
      employees: employees || "Não informado",
      adminName: company.adminName,
      adminEmail: company.adminEmail,
      tempPassword,
    });
    
    setStep("confirmation");
    setIsSubmitting(false);
    
    toast({
      title: "Empresa criada com sucesso!",
      description: `${companyName} foi adicionada ao sistema.`,
    });
  };

  const handleGeneratePDF = () => {
    if (savedCompany) {
      generateAccessPDF(savedCompany);
      toast({ title: "PDF gerado!", description: "O arquivo foi baixado." });
    }
  };

  const handleCreateAnother = () => {
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Criar Nova Empresa
              </DialogTitle>
              <DialogDescription>
                Cadastre uma nova empresa no programa MVP e crie o acesso do administrador.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {/* Company Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Dados da Empresa</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    placeholder="Ex: Empresa Alpha Ltda"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor</Label>
                    <Select value={sector} onValueChange={setSector}>
                      <SelectTrigger id="sector">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employees">Nº de Colaboradores</Label>
                    <Input
                      id="employees"
                      type="number"
                      placeholder="Ex: 150"
                      value={employees}
                      onChange={(e) => setEmployees(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
              </div>

              {/* Admin User Section */}
              <div className="space-y-4 pt-2 border-t border-border">
                <h4 className="text-sm font-medium text-foreground pt-2">
                  Administrador da Empresa
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="adminName">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminName"
                      placeholder="Ex: João Silva"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="Ex: admin@empresa.com.br"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Uma senha temporária será gerada automaticamente para o primeiro acesso.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar Empresa"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                Empresa Criada com Sucesso!
              </DialogTitle>
              <DialogDescription>
                Confira os dados de acesso abaixo e gere o PDF para enviar ao cliente.
              </DialogDescription>
            </DialogHeader>

            {createdData && (
              <div className="space-y-6 pt-4">
                {/* Company Summary */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {createdData.companyName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {createdData.sector} • {createdData.employees} colaboradores
                      </p>
                    </div>
                  </div>
                </div>

                {/* Access Credentials */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">
                    Credenciais de Acesso
                  </h4>
                  
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Administrador</p>
                        <p className="text-sm font-medium">{createdData.adminName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email de acesso</p>
                        <p className="text-sm font-medium">{createdData.adminEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Senha temporária</p>
                        <p className="text-sm font-mono font-medium bg-muted px-2 py-1 rounded">
                          {createdData.tempPassword}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF Generation */}
                <Button
                  onClick={handleGeneratePDF}
                  variant="outline"
                  className="w-full"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF de Acesso do Cliente
                </Button>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="outline" onClick={handleCreateAnother}>
                    Criar Outra Empresa
                  </Button>
                  <Button onClick={handleClose}>
                    Concluir
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
