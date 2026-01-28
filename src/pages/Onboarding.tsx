import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Users, 
  Upload,
  Building2,
  Sparkles
} from "lucide-react";
import { setEmployees, getEmployees, type EmployeeState } from "@/lib/storage";
import logoMvp from "@/assets/logo-mvp.jpeg";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, completeOnboarding, startOnboarding, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState(1);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form for adding team member
  const [newMember, setNewMember] = useState<TeamMember>({
    id: "",
    name: "",
    email: "",
    sector: "",
    role: "",
  });

  // Redirect if not authenticated or not cliente
  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  // If onboarding already completed, redirect to home
  if (user.onboardingStatus === 'completed') {
    navigate("/");
    return null;
  }

  const totalSteps = 3;

  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.sector.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e setor do colaborador.",
        variant: "destructive",
      });
      return;
    }

    setTeamMembers([
      ...teamMembers,
      { ...newMember, id: `emp-${Date.now()}` }
    ]);
    
    setNewMember({
      id: "",
      name: "",
      email: "",
      sector: "",
      role: "",
    });
    
    toast({
      title: "Colaborador adicionado!",
      description: `${newMember.name} foi incluído no núcleo.`,
    });
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real implementation, parse CSV/Excel
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Em breve você poderá importar planilhas. Por enquanto, adicione manualmente.",
    });
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Save team members to storage
    if (teamMembers.length > 0) {
      const existingEmployees = getEmployees();
      const newEmployees: EmployeeState[] = teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email || "",
        sector: m.sector,
        role: m.role || "Colaborador",
        active: true,
      }));
      setEmployees([...existingEmployees, ...newEmployees]);
    }
    
    // Mark onboarding as complete
    await completeOnboarding();
    
    toast({
      title: "Configuração concluída!",
      description: "Bem-vindo ao Portal MVP. Sua jornada começa agora.",
    });
    
    navigate("/");
    setIsLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center space-y-8">
            {/* Welcome */}
            <div className="flex items-center justify-center gap-4">
              <img 
                src={logoMvp} 
                alt="MVP" 
                className="h-16 w-auto"
              />
              <div className="h-12 w-px bg-border" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Portal</p>
                <h2 className="text-xl font-bold text-foreground">
                  {user.companyName || "Sua Empresa"}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-display font-bold text-foreground">
                Bem-vindo ao MVP!
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Estamos muito felizes em ter sua empresa nesta jornada de transformação 
                comportamental. Vamos configurar seu portal em poucos passos.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <Building2 className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Cadastro</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Núcleo</p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Início</p>
              </div>
            </div>

            <Button onClick={() => setStep(2)} size="lg" className="min-w-48">
              Iniciar Configuração
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Users className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-2xl font-display font-bold text-foreground">
                Cadastro do Núcleo
              </h2>
              <p className="text-muted-foreground">
                Adicione os colaboradores que participarão do programa MVP.
              </p>
            </div>

            {/* Upload Option */}
            <Card className="p-4 border-dashed">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para importar planilha (Excel/CSV)
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </Card>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou adicione manualmente
                </span>
              </div>
            </div>

            {/* Manual Entry Form */}
            <Card className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sector">Setor *</Label>
                  <Input
                    id="sector"
                    placeholder="Ex: Operações"
                    value={newMember.sector}
                    onChange={(e) => setNewMember({ ...newMember, sector: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role">Cargo</Label>
                  <Input
                    id="role"
                    placeholder="Ex: Técnico"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@empresa.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleAddMember}
              >
                + Adicionar Colaborador
              </Button>
            </Card>

            {/* Added Members List */}
            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Colaboradores adicionados ({teamMembers.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.sector} {member.role && `• ${member.role}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Você pode adicionar mais colaboradores depois, nas configurações do portal.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft size={18} className="mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continuar
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Tudo Pronto!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sua configuração inicial está completa. Você está pronto para 
                iniciar a jornada MVP na sua empresa.
              </p>
            </div>

            {/* Summary */}
            <Card className="p-6 text-left space-y-4">
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
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Colaboradores cadastrados</span>
                  <span className="font-medium">{teamMembers.length}</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft size={18} className="mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleComplete} 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Finalizando..." : "Entrar no Portal MVP"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index + 1 <= step 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted"
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
