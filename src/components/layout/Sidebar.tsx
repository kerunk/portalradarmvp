import { Link, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck,
  BarChart3,
  FileText,
  TrendingUp,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  Rocket,
  Target,
  BookOpen,
  FolderOpen,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logoMvp from "@/assets/logo-mvp.jpeg";

// Navigation for Admin MVP (Master)
const adminNavigation = [
  { name: "Dashboard Geral", href: "/", icon: LayoutDashboard },
  { name: "Empresas", href: "/empresas", icon: Building2 },
  { name: "Projetos", href: "/plano", icon: FolderOpen },
  { name: "Ciclos MVP", href: "/ciclos", icon: Rocket },
  { name: "Turmas", href: "/turmas", icon: Users },
  { name: "Fatores de Sucesso", href: "/fatores", icon: Target },
  { name: "Prateleira Global", href: "/praticas", icon: BookOpen },
  { name: "Registros", href: "/registros", icon: FileCheck },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3 },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Maturidade", href: "/maturidade", icon: TrendingUp },
];

// Navigation for Client Portal
const clientNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Planejamento", href: "/plano", icon: ClipboardList },
  { name: "Ciclos MVP", href: "/ciclos", icon: Rocket },
  { name: "Turmas", href: "/turmas", icon: Users },
  { name: "Ações & Alertas", href: "/indicadores", icon: Target },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdminMVP, switchRole, logout } = useAuth();
  
  // Use internal state if not controlled
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  const navigation = isAdminMVP ? adminNavigation : clientNavigation;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img 
              src={logoMvp} 
              alt="MVP" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-sidebar-foreground font-display font-semibold text-lg">
              Portal
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <img 
              src={logoMvp} 
              alt="MVP" 
              className="h-8 w-8 object-contain"
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Role indicator */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <Badge 
            variant="outline" 
            className={cn(
              "w-full justify-center py-1",
              isAdminMVP 
                ? "bg-purple-500/10 text-purple-400 border-purple-500/30" 
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            )}
          >
            {isAdminMVP ? (
              <>
                <ShieldCheck size={12} className="mr-1" />
                Admin MVP
              </>
            ) : (
              <>
                <Building2 size={12} className="mr-1" />
                {user?.companyName || "Portal Cliente"}
              </>
            )}
          </Badge>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "sidebar-nav-item",
                isActive && "active"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {/* Role switcher (for demo) */}
        {!collapsed && (
          <Select 
            value={user?.role || "admin_mvp"} 
            onValueChange={(value) => switchRole(value as "admin_mvp" | "cliente")}
          >
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin_mvp">👑 Admin MVP</SelectItem>
              <SelectItem value="cliente">🏢 Portal Cliente</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Link
          to="/configuracoes"
          className="sidebar-nav-item"
          title={collapsed ? "Configurações" : undefined}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </Link>
        
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user?.email || "user@mvp.com"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
