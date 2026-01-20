import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  id: string;
  title: string;
  description: string;
  phase: string;
  responsible: string;
  deadline: string;
  status: "completed" | "in-progress" | "delayed" | "pending";
}

const mockActions: Action[] = [
  {
    id: "1",
    title: "Diagnóstico inicial da cultura",
    description: "Realizar pesquisa de clima e entrevistas com lideranças",
    phase: "Fase 1: Diagnóstico",
    responsible: "Ana Martins",
    deadline: "2025-01-15",
    status: "completed",
  },
  {
    id: "2",
    title: "Workshop de sensibilização",
    description: "Apresentar o programa MVP para todas as lideranças",
    phase: "Fase 2: Sensibilização",
    responsible: "Carlos Silva",
    deadline: "2025-01-20",
    status: "completed",
  },
  {
    id: "3",
    title: "Treinamento de liderança comportamental",
    description: "Capacitar líderes em técnicas de feedback e comunicação",
    phase: "Fase 3: Implementação",
    responsible: "Pedro Costa",
    deadline: "2025-01-25",
    status: "delayed",
  },
  {
    id: "4",
    title: "Implementação do ritual diário",
    description: "Estabelecer reuniões diárias de 15 minutos com equipes",
    phase: "Fase 3: Implementação",
    responsible: "Juliana Alves",
    deadline: "2025-02-01",
    status: "in-progress",
  },
  {
    id: "5",
    title: "Campanha de comunicação interna",
    description: "Lançar materiais visuais e comunicados sobre o programa",
    phase: "Fase 3: Implementação",
    responsible: "Ana Martins",
    deadline: "2025-02-10",
    status: "pending",
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Concluída",
    color: "text-success",
    bg: "bg-success/10",
  },
  "in-progress": {
    icon: Clock,
    label: "Em andamento",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  delayed: {
    icon: AlertCircle,
    label: "Atrasada",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  pending: {
    icon: Clock,
    label: "Pendente",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

export default function ImplementationPlan() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredActions = mockActions.filter((action) => {
    const matchesSearch =
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || action.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout
      title="Plano de Implementação"
      subtitle="Gerencie as ações do programa"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Buscar ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="in-progress">Em andamento</SelectItem>
                <SelectItem value="delayed">Atrasadas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="btn-primary-gradient">
            <Plus size={16} className="mr-2" />
            Nova Ação
          </Button>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          {filteredActions.map((action) => {
            const status = statusConfig[action.status];
            const Icon = status.icon;

            return (
              <div
                key={action.id}
                className="card-elevated p-4 hover:shadow-elevated transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      status.bg
                    )}
                  >
                    <Icon size={20} className={status.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {action.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {action.description}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0",
                          status.bg,
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                          {action.phase}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <User size={14} />
                        {action.responsible}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(action.deadline).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredActions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma ação encontrada</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
