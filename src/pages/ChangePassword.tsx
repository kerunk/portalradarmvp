import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock, CheckCircle2, LogOut } from "lucide-react";
import logoMvp from "@/assets/logo-mvp.jpeg";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, changePassword, logout, isAuthenticated } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    navigate("/login");
    return null;
  }

  const handleCancelAndLogout = () => {
    logout();
    navigate("/login");
  };

  const passwordRequirements = [
    { label: "Mínimo 8 caracteres", met: newPassword.length >= 8 },
    { label: "Pelo menos uma letra", met: /[a-zA-Z]/.test(newPassword) },
    { label: "Pelo menos um número", met: /[0-9]/.test(newPassword) },
  ];

  const allRequirementsMet = passwordRequirements.every(r => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allRequirementsMet) {
      toast({
        title: "Senha fraca",
        description: "A nova senha não atende aos requisitos mínimos de segurança.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Senhas não conferem",
        description: "A confirmação da senha deve ser igual à nova senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const success = await changePassword(currentPassword, newPassword);
    
    if (success) {
      toast({
        title: "Senha alterada!",
        description: "Sua nova senha foi configurada com sucesso.",
      });
      
      // Redirect to onboarding if not completed, otherwise dashboard
      if (user.onboardingStatus !== 'completed') {
        navigate("/onboarding");
      } else {
        navigate("/");
      }
    } else {
      toast({
        title: "Erro ao alterar senha",
        description: "Verifique sua senha atual e tente novamente.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={logoMvp} 
              alt="MVP Portal" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Alteração de Senha
            </h1>
            <p className="text-muted-foreground mt-1">
              Por segurança, altere sua senha temporária
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <Card className="p-6 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha atual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground">Requisitos da senha:</p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 
                        size={14} 
                        className={req.met ? "text-success" : "text-muted-foreground/40"} 
                      />
                      <span className={`text-xs ${req.met ? "text-foreground" : "text-muted-foreground"}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${passwordsMatch ? "text-success" : "text-destructive"}`}>
                    {passwordsMatch ? "✓ Senhas conferem" : "✗ As senhas não conferem"}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !allRequirementsMet || !passwordsMatch}
            >
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </Card>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={handleCancelAndLogout}
        >
          <LogOut size={16} className="mr-2" />
          Cancelar e voltar para login
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Esta alteração é obrigatória no primeiro acesso para garantir a segurança da sua conta.
        </p>
      </div>
    </div>
  );
}
