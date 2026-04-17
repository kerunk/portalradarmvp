import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type CompanyState } from "@/lib/storage";
import { auditCompanyAction } from "@/lib/auditLog";
import { useAuth } from "@/contexts/AuthContext";
import { updateCompanyInSupabase } from "@/lib/companyService";

interface EditCompanyDialogProps {
  company: CompanyState | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const sectors = [
  "Indústria", "Tecnologia", "Varejo", "Construção", "Serviços",
  "Saúde", "Educação", "Agronegócio", "Logística", "Outro",
];

const states = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export function EditCompanyDialog({ company, open, onOpenChange, onSaved }: EditCompanyDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [employees, setEmployees] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (company) {
      setName(company.name);
      setSector(company.sector || "");
      setEmployees(String(company.employees || ""));
      setCity((company as any).city || "");
      setUf((company as any).uf || "");
      setContactEmail((company as any).contactEmail || company.adminEmail || "");
      setObservations((company as any).observations || "");
    }
  }, [company]);

  const handleSave = async () => {
    if (!company || !name.trim()) {
      toast({ title: "Nome da empresa é obrigatório", variant: "destructive" });
      return;
    }

    const before = { ...company };

    const saved = await updateCompanyInSupabase(company.id, {
      name: name.trim(),
      sector: sector || company.sector,
      employee_count: parseInt(employees) || company.employees,
      admin_email: contactEmail.trim() || company.adminEmail,
    });

    if (!saved) {
      toast({
        title: "Erro ao atualizar empresa",
        description: "Não foi possível persistir as alterações.",
        variant: "destructive",
      });
      return;
    }

    console.log("[EditCompanyDialog] Company updated in Supabase", {
      companyId: company.id,
      name: name.trim(),
      sector: sector || company.sector,
      employeeCount: parseInt(employees) || company.employees,
      adminEmail: contactEmail.trim() || company.adminEmail,
    });

    auditCompanyAction(
      user?.email || "", user?.name || "Admin",
      "company_updated", company.id, name.trim(),
      `Dados cadastrais atualizados`,
      { name: before.name, sector: before.sector },
      { name: name.trim(), sector }
    );

    toast({ title: "Empresa atualizada", description: `${name.trim()} foi atualizada com sucesso.` });
    window.dispatchEvent(new CustomEvent("mvp_company_changed"));
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Empresa
          </DialogTitle>
          <DialogDescription>
            Atualize os dados cadastrais e operacionais da empresa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nome da Empresa *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segmento / Indústria</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nº de Colaboradores</Label>
              <Input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} min={1} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: São Paulo" />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email de Contato</Label>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Observações Internas</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Notas internas sobre a empresa..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
