import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LogIn, Shield, AlertTriangle } from "lucide-react";
import logoMvp from "@/assets/logo-mvp.jpeg";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe email e senha para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (lockoutSeconds > 0) return;

    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
      navigate("/");
    } else if (result.locked) {
      setLockoutSeconds(result.remainingSeconds || 300);
      toast({
        title: "Conta temporariamente bloqueada",
        description: `Muitas tentativas inválidas. Aguarde ${Math.ceil((result.remainingSeconds || 300) / 60)} minuto(s).`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Credenciais inválidas",
        description: "Verifique seu email e senha e tente novamente.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const formatLockout = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
              className="h-24 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Portal MVP
            </h1>
            <p className="text-muted-foreground mt-1">
              Programa de Mudança Comportamental
            </p>
          </div>
        </div>

        {/* Lockout Warning */}
        {lockoutSeconds > 0 && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Conta bloqueada temporariamente</p>
                <p className="text-xs text-muted-foreground">
                  Muitas tentativas inválidas. Tente novamente em {formatLockout(lockoutSeconds)}.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Login Card */}
        <Card className="p-6 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isLoading || lockoutSeconds > 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading || lockoutSeconds > 0}
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
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || lockoutSeconds > 0}
            >
              {isLoading ? (
                "Entrando..."
              ) : lockoutSeconds > 0 ? (
                `Bloqueado (${formatLockout(lockoutSeconds)})`
              ) : (
                <>
                  <LogIn size={18} className="mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Acesso restrito. Se você é administrador de uma empresa cliente, 
              utilize as credenciais fornecidas pelo MVP.
            </p>
          </div>
        </Card>

        {/* Demo Access Info */}
        <Card className="p-4 bg-muted/50 border-dashed">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Acesso de Demonstração</p>
              <div className="space-y-1 text-muted-foreground text-xs">
                <p><strong>Admin MVP Master:</strong> admin@radarmvp.com / admin123</p>
                <p><strong>Cliente:</strong> admin@alpha.com / cliente123</p>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © 2024 MVP Portal. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
