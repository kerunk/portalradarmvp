import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  Upload,
  Building2,
  Sparkles,
  Download,
  UserPlus,
  Pencil,
  Trash2,
  Database,
} from "lucide-react";
import {
  type NucleoMember,
  type PopulationMember,
  setNucleo,
  setPopulation,
  generatePopulationTemplate,
  parsePopulationCSV,
  isEmailUsedInCompany,
} from "@/lib/companyStorage";
import logoMvp from "@/assets/logo-mvp.jpeg";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, completeOnboarding, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Núcleo state
  const [nucleoMembers, setNucleoMembers] = useState<NucleoMember[]>([]);
  const [editingNucleoId, setEditingNucleoId] = useState<string | null>(null);
  const [nucleoForm, setNucleoForm] = useState({ name: "", email: "", sector: "", role: "" });

  // Population state
  const [populationMembers, setPopulationMembers] = useState<PopulationMember[]>([]);
  const [editingPopId, setEditingPopId] = useState<string | null>(null);
  const [popForm, setPopForm] = useState({ name: "", email: "", sector: "", role: "" });

  const totalSteps = 4;

  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  if (user.onboardingStatus === "completed") {
    navigate("/");
    return null;
  }

  const companyId = user.companyId || "";

  // ========== NÚCLEO HANDLERS ==========

  const resetNucleoForm = () => {
    setNucleoForm({ name: "", email: "", sector: "", role: "" });
    setEditingNucleoId(null);
  };

  const handleAddNucleo = () => {
    if (!nucleoForm.name.trim() || !nucleoForm.sector.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome e setor.", variant: "destructive" });
      return;
    }
    if (nucleoForm.email && isEmailUsedInCompany(companyId, nucleoForm.email)) {
      toast({ title: "Email duplicado", description: "Este email já está cadastrado.", variant: "destructive" });
      return;
    }

    if (editingNucleoId) {
      setNucleoMembers(prev => prev.map(m => m.id === editingNucleoId ? { ...m, ...nucleoForm } : m));
      toast({ title: "Atualizado!", description: `${nucleoForm.name} foi atualizado.` });
    } else {
      setNucleoMembers(prev => [...prev, { ...nucleoForm, id: `nuc-${Date.now()}` }]);
      toast({ title: "Adicionado!", description: `${nucleoForm.name} foi incluído no núcleo.` });
    }
    resetNucleoForm();
  };

  const handleEditNucleo = (member: NucleoMember) => {
    setNucleoForm({ name: member.name, email: member.email, sector: member.sector, role: member.role });
    setEditingNucleoId(member.id);
  };

  const handleRemoveNucleo = (id: string) => {
    setNucleoMembers(prev => prev.filter(m => m.id !== id));
  };

  // ========== POPULATION HANDLERS ==========

  const resetPopForm = () => {
    setPopForm({ name: "", email: "", sector: "", role: "" });
    setEditingPopId(null);
  };

  const handleAddPop = () => {
    if (!popForm.name.trim() || !popForm.sector.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha nome e setor.", variant: "destructive" });
      return;
    }
    if (popForm.email && isEmailUsedInCompany(companyId, popForm.email, editingPopId || undefined)) {
      toast({ title: "Email duplicado", description: "Este email já está cadastrado.", variant: "destructive" });
      return;
    }

    if (editingPopId) {
      setPopulationMembers(prev => prev.map(m => m.id === editingPopId
        ? { ...m, ...popForm }
        : m
      ));
      toast({ title: "Atualizado!", description: `${popForm.name} foi atualizado.` });
    } else {
      setPopulationMembers(prev => [...prev, { ...popForm, facilitator: false, id: `pop-${Date.now()}`, active: true }]);
      toast({ title: "Adicionado!", description: `${popForm.name} foi incluído na base.` });
    }
    resetPopForm();
  };

  const handleEditPop = (member: PopulationMember) => {
    setPopForm({ name: member.name, email: member.email, sector: member.sector, role: member.role });
    setEditingPopId(member.id);
  };

  const handleRemovePop = (id: string) => {
    setPopulationMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleDownloadTemplate = () => {
    const csv = generatePopulationTemplate();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_base_populacional.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const { members, errors } = parsePopulationCSV(content);

      if (errors.length > 0) {
        toast({ title: "Erros na importação", description: errors.slice(0, 3).join("; "), variant: "destructive" });
      }
      if (members.length > 0) {
        const newMembers: PopulationMember[] = members.map((m, i) => ({
          ...m,
          id: `pop-import-${Date.now()}-${i}`,
          active: true,
        }));
        setPopulationMembers(prev => [...prev, ...newMembers]);
        toast({ title: "Importação concluída", description: `${newMembers.length} colaboradores importados.` });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Merge núcleo into population (ensure they exist)
  const mergeNucleoIntoPopulation = (): PopulationMember[] => {
    const merged = [...populationMembers];
    nucleoMembers.forEach(nuc => {
      const exists = merged.some(p =>
        p.email && nuc.email && p.email.toLowerCase() === nuc.email.toLowerCase()
      ) || merged.some(p => p.name.toLowerCase() === nuc.name.toLowerCase() && p.sector === nuc.sector);

      if (!exists) {
        merged.push({
          id: `pop-from-nuc-${nuc.id}`,
          name: nuc.name,
          email: nuc.email,
          sector: nuc.sector,
          role: nuc.role,
          facilitator: false,
          active: true,
        });
      }
    });
    return merged;
  };

  const handleComplete = async () => {
    setIsLoading(true);

    // Save núcleo
    setNucleo(companyId, nucleoMembers);

    // Merge and save population
    const finalPopulation = mergeNucleoIntoPopulation();
    setPopulation(companyId, finalPopulation);

    await completeOnboarding();

    toast({
      title: "Configuração concluída!",
      description: "Bem-vindo ao Portal MVP. Sua jornada começa agora.",
    });

    navigate("/");
    setIsLoading(false);
  };

  const facilitatorCount = populationMembers.filter(m => m.facilitator).length;

  // ========== RENDER STEPS ==========

  const renderStep1 = () => (
    <div className="text-center space-y-8">
      <div className="flex items-center justify-center gap-4">
        <img src={logoMvp} alt="MVP" className="h-16 w-auto" />
        <div className="h-12 w-px bg-border" />
        <div className="text-left">
          <p className="text-sm text-muted-foreground">Portal</p>
          <h2 className="text-xl font-bold text-foreground">{user.companyName || "Sua Empresa"}</h2>
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Bem-vindo ao MVP!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Estamos muito felizes em ter sua empresa nesta jornada de transformação comportamental.
          Vamos configurar seu portal em poucos passos.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
        {[
          { icon: Building2, label: "Boas-vindas", active: true },
          { icon: Users, label: "Núcleo", active: false },
          { icon: Database, label: "População", active: false },
          { icon: Sparkles, label: "Início", active: false },
        ].map((item, i) => (
          <div key={i} className={`p-3 rounded-lg text-center ${item.active ? "bg-primary/10" : "bg-muted"}`}>
            <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.active ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      <Button onClick={() => setStep(2)} size="lg" className="min-w-48">
        Iniciar Configuração
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Users className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-2xl font-display font-bold text-foreground">Núcleo de Sustentação</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre as pessoas que vão administrar e operar o portal MVP na sua empresa.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label>Nome *</Label>
            <Input placeholder="Nome completo" value={nucleoForm.name} onChange={e => setNucleoForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Setor *</Label>
            <Input placeholder="Ex: Operações" value={nucleoForm.sector} onChange={e => setNucleoForm(f => ({ ...f, sector: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Cargo/Função</Label>
            <Input placeholder="Ex: Coordenador" value={nucleoForm.role} onChange={e => setNucleoForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Email</Label>
            <Input type="email" placeholder="email@empresa.com" value={nucleoForm.email} onChange={e => setNucleoForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={handleAddNucleo}>
          <UserPlus size={16} className="mr-2" />
          {editingNucleoId ? "Salvar Alteração" : "Adicionar ao Núcleo"}
        </Button>
        {editingNucleoId && (
          <Button type="button" variant="ghost" className="w-full" onClick={resetNucleoForm}>Cancelar Edição</Button>
        )}
      </Card>

      {nucleoMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Integrantes do Núcleo ({nucleoMembers.length})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {nucleoMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.sector}{member.role && ` • ${member.role}`}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditNucleo(member)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveNucleo(member.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Essas pessoas serão responsáveis por ações, alertas, planejamento e montagem de turmas.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          <ArrowLeft size={18} className="mr-2" /> Voltar
        </Button>
        <Button onClick={() => setStep(3)} className="flex-1">
          Continuar <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <Database className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-2xl font-display font-bold text-foreground">Base Populacional</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre todos os colaboradores da empresa, incluindo os do núcleo. Marque quem é facilitador.
        </p>
      </div>

      {/* Upload / Template */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadTemplate}>
          <Download size={14} className="mr-1" /> Baixar Modelo CSV
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} className="mr-1" /> Importar Planilha
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
      </div>

      {/* Manual entry */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label>Nome *</Label>
            <Input placeholder="Nome completo" value={popForm.name} onChange={e => setPopForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Setor *</Label>
            <Input placeholder="Ex: Produção" value={popForm.sector} onChange={e => setPopForm(f => ({ ...f, sector: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Cargo/Função</Label>
            <Input placeholder="Ex: Operador" value={popForm.role} onChange={e => setPopForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Email</Label>
            <Input type="email" placeholder="email@empresa.com" value={popForm.email} onChange={e => setPopForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <Switch checked={popForm.facilitator} onCheckedChange={v => setPopForm(f => ({ ...f, facilitator: v }))} />
            <Label className="cursor-pointer">Facilitador habilitado</Label>
          </div>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={handleAddPop}>
          <UserPlus size={16} className="mr-2" />
          {editingPopId ? "Salvar Alteração" : "Adicionar Colaborador"}
        </Button>
        {editingPopId && (
          <Button type="button" variant="ghost" className="w-full" onClick={resetPopForm}>Cancelar Edição</Button>
        )}
      </Card>

      {/* Population list */}
      {populationMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Colaboradores cadastrados ({populationMembers.length}) · Facilitadores: {facilitatorCount}
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {populationMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">
                    {member.name}
                    {member.facilitator && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Facilitador</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.sector}{member.role && ` • ${member.role}`}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditPop(member)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemovePop(member.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Os integrantes do núcleo serão adicionados automaticamente à base se não estiverem incluídos.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
          <ArrowLeft size={18} className="mr-2" /> Voltar
        </Button>
        <Button onClick={() => setStep(4)} className="flex-1">
          Continuar <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );

  const finalPopulation = mergeNucleoIntoPopulation();
  const finalFacilitators = finalPopulation.filter(m => m.facilitator).length;

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Tudo Pronto!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sua configuração inicial está completa. Confira o resumo e entre no portal.
        </p>
      </div>

      <Card className="p-5 text-left space-y-4">
        <h3 className="font-semibold text-foreground">Resumo da Configuração</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Empresa</span>
            <span className="font-medium">{user.companyName || "Configurada"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Administrador</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Integrantes do Núcleo</span>
            <span className="font-medium">{nucleoMembers.length}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Base Populacional</span>
            <span className="font-medium">{finalPopulation.length} colaboradores</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Facilitadores</span>
            <span className="font-medium">{finalFacilitators}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
          <ArrowLeft size={18} className="mr-2" /> Voltar
        </Button>
        <Button onClick={handleComplete} className="flex-1" disabled={isLoading}>
          {isLoading ? "Finalizando..." : "Entrar no Portal MVP"}
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index + 1 <= step ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="p-8 shadow-elevated">
          {renderStep()}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Etapa {step} de {totalSteps}
        </p>
      </div>
    </div>
  );
}
