import { Link, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import {
  LayoutDashboard,
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
  Database,
  Layers,
  UserCog,
  BookMarked,
  SlidersHorizontal,
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

// Admin navigation organized in 4 blocks
interface NavSection {
  label: string;
  items: { name: string; href: string; icon: React.ElementType }[];
}

const adminSections: NavSection[] = [
  {
    label: "CONTROLE DA PLATAFORMA",
    items: [
      { name: "Dashboard Geral", href: "/", icon: LayoutDashboard },
      { name: "Empresas", href: "/empresas", icon: Building2 },
      { name: "Usuários", href: "/usuarios", icon: UserCog },
      { name: "Projetos", href: "/plano", icon: FolderOpen },
    ],
  },
  {
    label: "OPERAÇÃO DO PROGRAMA",
    items: [
      { name: "Ciclos MVP", href: "/ciclos", icon: Rocket },
      { name: "Turmas", href: "/turmas", icon: Users },
      { name: "Fatores de Sucesso", href: "/fatores", icon: Target },
      { name: "Registros", href: "/registros", icon: FileCheck },
    ],
  },
  {
    label: "INTELIGÊNCIA",
    items: [
      { name: "Indicadores", href: "/indicadores", icon: BarChart3 },
      { name: "Relatórios", href: "/relatorios", icon: FileText },
      { name: "Maturidade", href: "/maturidade", icon: TrendingUp },
    ],
  },
  {
    label: "ADMINISTRAÇÃO DO SISTEMA",
    items: [
      { name: "Prateleira Global", href: "/praticas", icon: BookOpen },
      { name: "Manual Global MVP", href: "/manual-editor", icon: BookMarked },
      { name: "Config. Indicadores", href: "/config-indicadores", icon: SlidersHorizontal },
      { name: "Ajuda da Plataforma", href: "/admin-ajuda", icon: HelpCircle },
      { name: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];

// Navigation for Client Portal
const clientNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Estrutura Organizacional", href: "/estrutura", icon: Layers },
  { name: "Base Populacional", href: "/base-populacional", icon: Database },
  { name: "Governança do Núcleo", href: "/nucleo", icon: ShieldCheck },
  { name: "Ciclos MVP", href: "/ciclos", icon: Rocket },
  { name: "Turmas", href: "/turmas", icon: Users },
  { name: "Ações & Alertas", href: "/indicadores", icon: Target },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Manual MVP", href: "/ajuda", icon: BookOpen },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdminMVP, switchRole, logout } = useAuth();
  
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

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
            <img src={logoMvp} alt="MVP" className="h-8 w-auto object-contain" />
            <span className="text-sidebar-foreground font-display font-semibold text-lg">Portal</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <img src={logoMvp} alt="MVP" className="h-8 w-8 object-contain" />
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
              <><ShieldCheck size={12} className="mr-1" /> Admin MVP</>
            ) : (
              <><Building2 size={12} className="mr-1" /> {user?.companyName || "Portal Cliente"}</>
            )}
          </Badge>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdminMVP ? (
          // Admin: sectioned navigation
          adminSections.map((section) => (
            <div key={section.label} className="mb-4">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
                  {section.label}
                </p>
              )}
              {collapsed && <div className="border-t border-sidebar-border/30 my-2" />}
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn("sidebar-nav-item", isActive && "active")}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))
        ) : (
          // Client: flat navigation
          clientNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn("sidebar-nav-item", isActive && "active")}
                title={collapsed ? item.name : undefined}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {!collapsed && isAdminMVP && (
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
        
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email || "user@mvp.com"}</p>
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
