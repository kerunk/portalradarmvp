import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  CalendarDays,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Plano de Implementação", href: "/plano", icon: ClipboardList },
  { name: "Meses (M1–M12)", href: "/meses", icon: CalendarDays },
  { name: "Fatores de Sucesso", href: "/fatores", icon: Target },
  { name: "Registros", href: "/registros", icon: FileCheck },
  { name: "Indicadores", href: "/indicadores", icon: BarChart3 },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Maturidade", href: "/maturidade", icon: TrendingUp },
  { name: "Empresas", href: "/empresas", icon: Building2 },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-display font-bold text-sm">
                MVP
              </span>
            </div>
            <span className="text-sidebar-foreground font-display font-semibold text-lg">
              Portal
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <span className="text-sidebar-primary-foreground font-display font-bold text-sm">
              M
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

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
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
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
                Admin MVP
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                admin@mvp.com
              </p>
            </div>
          )}
          {!collapsed && (
            <button className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
