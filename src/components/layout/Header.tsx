import { Bell, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-display font-semibold text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-9 w-64 h-9 bg-muted/50 border-border/50 focus:bg-background"
          />
        </div>

        {/* Help */}
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle size={20} />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </Button>

        {/* Company Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">A</span>
          </div>
          <span className="text-sm font-medium text-secondary-foreground">
            Empresa Alpha
          </span>
        </div>
      </div>
    </header>
  );
}
