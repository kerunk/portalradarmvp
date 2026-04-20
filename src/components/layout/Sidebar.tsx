import { Link, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
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
  ShieldCheck,
  Database,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useReadOnly } from "@/contexts/ReadOnlyContext";
import { Badge } from "@/components/ui/badge";
import logoMvp from "@/assets/logo-mvp.jpeg";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Admin Master menu — simplified
const adminSections: NavSection[] = [
  {
    label: "CONTROLE DA PLATAFORMA",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Empresas", href: "/empresas", icon: Building2 },
    ],
  },
  {
    label: "ADMINISTRAÇÃO",
    items: [
      { name: "Fatores de Sucesso", href: "/fatores-globais", icon: Layers },
      { name: "Prateleira de Práticas", href: "/praticas", icon: BookOpen },
      { name: "Relatórios", href: "/relatorios", icon: FileText },
      { name: "Configurações", href: "/configuracoes", icon: Settings },
      { name: "Ajuda da Plataforma", href: "/admin-ajuda", icon: HelpCircle },
    ],
  },
];

// Client portal menu
const clientNavigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Estrutura da Empresa", href: "/estrutura", icon: Layers },
  { name: "Base Populacional", href: "/base-populacional", icon: Database },
  { name: "Governança do Núcleo", href: "/nucleo", icon: ShieldCheck },
  { name: "Ciclos MVP", href: "/ciclos", icon: Rocket },
  { name: "Turmas", href: "/turmas", icon: Users },
  { name: "Ações e Alertas", href: "/indicadores", icon: Target },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
  { name: "Manual MVP", href: "/ajuda", icon: BookOpen },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdminMVP, logout } = useAuth();
  const { isReadOnly, mirrorCompanyName } = useReadOnly();
  
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  const showClientNav = !isAdminMVP || isReadOnly;

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
          {isReadOnly ? (
            <Badge 
              variant="outline" 
              className="w-full justify-center py-1 bg-amber-500/10 text-amber-400 border-amber-500/30"
            >
              <Building2 size={12} className="mr-1" />
              {mirrorCompanyName || "Empresa"}
            </Badge>
          ) : (
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
                <><ShieldCheck size={12} className="mr-1" /> Administrador Master</>
              ) : (
                <><Building2 size={12} className="mr-1" /> {user?.companyName || "Portal Cliente"}</>
              )}
            </Badge>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {showClientNav ? (
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
        ) : (
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
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "Usuário"}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email || ""}</p>
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
