import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCheck, Plus, Trash2, Pencil, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getImplementationContacts,
  addImplementationContact,
  removeImplementationContact,
  updateImplementationContact,
  getNucleoMembers,
  type ImplementationContact,
} from "@/lib/companyStorage";
import { toast } from "@/hooks/use-toast";

interface CompanyContactsProps {
  companyId: string;
  readOnly?: boolean;
}

export function CompanyContacts({ companyId, readOnly = false }: CompanyContactsProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nucleoDialogOpen, setNucleoDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ImplementationContact | null>(null);
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "" });

  const contacts = useMemo(() => getImplementationContacts(companyId), [companyId, refreshKey]);
  const nucleoMembers = useMemo(() => getNucleoMembers(companyId), [companyId, refreshKey]);

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Nome e email são obrigatórios", variant: "destructive" });
      return;
    }

    if (editingContact) {
      updateImplementationContact(companyId, editingContact.id, {
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      });
      toast({ title: "Responsável atualizado" });
    } else {
      addImplementationContact(companyId, {
        id: `contact-${Date.now()}`,
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        fromNucleo: false,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Responsável adicionado" });
    }

    setForm({ name: "", role: "", email: "", phone: "" });
    setEditingContact(null);
    setDialogOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleAddFromNucleo = (memberId: string) => {
    const member = nucleoMembers.find(m => m.id === memberId);
    if (!member) return;

    // Check duplicate
    if (contacts.some(c => c.email === member.email)) {
      toast({ title: "Este membro já é um responsável", variant: "destructive" });
      return;
    }

    addImplementationContact(companyId, {
      id: `contact-${Date.now()}`,
      name: member.name,
      role: member.role,
      email: member.email,
      fromNucleo: true,
      createdAt: new Date().toISOString(),
    });
    toast({ title: `${member.name} adicionado como responsável` });
    setNucleoDialogOpen(false);
    setRefreshKey(k => k + 1);
  };

  const handleEdit = (contact: ImplementationContact) => {
    setEditingContact(contact);
    setForm({ name: contact.name, role: contact.role, email: contact.email, phone: contact.phone || "" });
    setDialogOpen(true);
  };

  const handleRemove = (id: string) => {
    removeImplementationContact(companyId, id);
    toast({ title: "Responsável removido" });
    setRefreshKey(k => k + 1);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <UserCheck size={18} className="text-primary" />
          Responsáveis pela Implementação
        </h3>
        {!readOnly && (
          <div className="flex gap-2">
            {nucleoMembers.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setNucleoDialogOpen(true)}>
                <Users size={14} className="mr-1" /> Do Núcleo
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditingContact(null); setForm({ name: "", role: "", email: "", phone: "" }); setDialogOpen(true); }}>
              <Plus size={14} className="mr-1" /> Adicionar
            </Button>
          </div>
        )}
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum responsável cadastrado. Adicione o responsável pela implementação da metodologia.
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">{contact.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{contact.name}</p>
                  {contact.fromNucleo && (
                    <Badge variant="outline" className="text-[10px]">Núcleo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{contact.role} · {contact.email}</p>
                {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(contact)}>
                    <Pencil size={14} className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemove(contact.id)}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar Responsável" : "Adicionar Responsável"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Coordenador de Segurança" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" />
            </div>
            <div>
              <Label>Telefone (opcional)</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingContact ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Núcleo Selection Dialog */}
      <Dialog open={nucleoDialogOpen} onOpenChange={setNucleoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar do Núcleo de Sustentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {nucleoMembers.map(member => {
              const alreadyAdded = contacts.some(c => c.email === member.email);
              return (
                <button
                  key={member.id}
                  onClick={() => !alreadyAdded && handleAddFromNucleo(member.id)}
                  disabled={alreadyAdded}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                    alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{member.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role} · {member.email}</p>
                  </div>
                  {alreadyAdded && <Badge variant="outline" className="text-[10px]">Já adicionado</Badge>}
                </button>
              );
            })}
            {nucleoMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro do núcleo cadastrado.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
