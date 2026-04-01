import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle2, KeyRound } from "lucide-react";

export function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
      toast({ title: "Senha fraca", description: "A nova senha não atende aos requisitos mínimos.", variant: "destructive" });
      return;
    }
    if (!passwordsMatch) {
      toast({ title: "Senhas não conferem", description: "A confirmação deve ser igual à nova senha.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const success = await changePassword(currentPassword, newPassword);

    if (success) {
      toast({ title: "Senha alterada!", description: "Sua nova senha foi configurada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsOpen(false);
    } else {
      toast({ title: "Erro ao alterar senha", description: "Verifique sua senha atual e tente novamente.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lock size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Segurança</h3>
            <p className="text-sm text-muted-foreground">Gerencie sua senha de acesso</p>
          </div>
        </div>
        {!isOpen && (
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            <KeyRound size={16} className="mr-2" />
            Alterar Senha
          </Button>
        )}
      </div>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 border-t border-border pt-4">
          <div className="space-y-2">
            <Label htmlFor="settings-current-password">Senha Atual</Label>
            <div className="relative">
              <Input
                id="settings-current-password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="settings-new-password"
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

          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground">Requisitos da senha:</p>
            <div className="space-y-1">
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={req.met ? "text-success" : "text-muted-foreground/40"} />
                  <span className={`text-xs ${req.met ? "text-foreground" : "text-muted-foreground"}`}>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="settings-confirm-password"
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

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !allRequirementsMet || !passwordsMatch}>
              {isLoading ? "Alterando..." : "Salvar Nova Senha"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setIsOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Use uma senha forte para proteger sua conta. Você pode alterá-la a qualquer momento.
        </p>
      )}
    </Card>
  );
}
