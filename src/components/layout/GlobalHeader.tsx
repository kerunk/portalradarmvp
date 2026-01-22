import { Bell, HelpCircle, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoMvp from "@/assets/logo-mvp.jpeg";

interface GlobalHeaderProps {
  title: string;
  subtitle?: string;
}

export function GlobalHeader({ title, subtitle }: GlobalHeaderProps) {
  const { user, logout, isAdminMVP } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left: MVP Logo + Portal */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <img 
            src={logoMvp} 
            alt="MVP" 
            className="h-8 w-auto object-contain"
          />
          <span className="text-sm font-medium text-muted-foreground">Portal</span>
        </div>
        
        <div className="h-8 w-px bg-border" />
        
        <div>
          <h1 className="text-lg font-display font-semibold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Actions + Company */}
      <div className="flex items-center gap-3">
        {/* Help */}
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle size={20} />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </Button>

        {/* Company Logo (for clients) */}
        {!isAdminMVP && user?.companyName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
            {user.companyLogo ? (
              <img 
                src={user.companyLogo} 
                alt={user.companyName}
                className="h-6 w-6 rounded object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {user.companyName.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-secondary-foreground">
              {user.companyName}
            </span>
          </div>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={16} className="text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.email}
                </span>
                <span className="text-xs text-primary font-normal mt-1">
                  {isAdminMVP ? "Admin MVP" : "Cliente"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut size={16} className="mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
