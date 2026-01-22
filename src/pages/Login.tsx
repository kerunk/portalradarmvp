import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import logoMvp from "@/assets/logo-mvp.jpeg";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect
  if (isAuthenticated) {
    navigate("/");
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

    setIsLoading(true);
    
    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
      navigate("/");
    } else {
      toast({
        title: "Credenciais inválidas",
        description: "Verifique seu email e senha e tente novamente.",
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
                  disabled={isLoading}
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
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                "Entrando..."
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
                <p><strong>Admin MVP:</strong> admin@mvp.com / admin123</p>
                <p><strong>Cliente:</strong> cliente@alpha.com / cliente123</p>
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
