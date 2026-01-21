import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, User, ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Record {
  id: string;
  action: string;
  month: string;
  status: "planned" | "in-progress" | "completed";
  observations: string;
  externalRef?: string;
  responsiblePair: string;
  updatedAt: string;
}

const mockRecords: Record[] = [
  {
    id: "1",
    action: "Workshop de sensibilização com liderança",
    month: "M1",
    status: "completed",
    observations: "Realizado com 45 participantes. Excelente engajamento.",
    externalRef: "Fotos no drive corporativo pasta M1",
    responsiblePair: "Ana Martins / Carlos Silva",
    updatedAt: "2025-01-16",
  },
  {
    id: "2",
    action: "Diagnóstico inicial de cultura",
    month: "M1",
    status: "completed",
    observations: "Relatório entregue à diretoria.",
    responsiblePair: "Pedro Costa / Juliana Alves",
    updatedAt: "2025-01-10",
  },
  {
    id: "3",
    action: "Definição do Núcleo de Sustentação",
    month: "M2",
    status: "in-progress",
    observations: "Aguardando aprovação de 2 membros pela diretoria.",
    responsiblePair: "Maria Santos / João Oliveira",
    updatedAt: "2025-01-18",
  },
  {
    id: "4",
    action: "Campanha de comunicação interna",
    month: "M2",
    status: "planned",
    observations: "",
    externalRef: "Materiais com agência de comunicação",
    responsiblePair: "Fernanda Lima / Ricardo Souza",
    updatedAt: "2025-01-20",
  },
];

const statusConfig = {
  planned: {
    label: "Planejado",
    color: "bg-muted text-muted-foreground",
  },
  "in-progress": {
    label: "Em andamento",
    color: "bg-warning/10 text-warning",
  },
  completed: {
    label: "Concluído",
    color: "bg-success/10 text-success",
  },
};

export default function Records() {
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  const filteredRecords = mockRecords.filter((record) => {
    const matchesSearch =
      record.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.observations.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = monthFilter === "all" || record.month === monthFilter;
    return matchesSearch && matchesMonth;
  });

  return (
    <AppLayout
      title="Registros"
      subtitle="Acompanhe o status e observações das ações do programa"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Buscar registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={`M${i + 1}`}>
                  M{i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const status = statusConfig[record.status];

            return (
              <div
                key={record.id}
                className="card-elevated p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Main Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {record.month}
                        </span>
                        <h3 className="font-medium text-foreground">
                          {record.action}
                        </h3>
                      </div>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                          status.color
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Observations */}
                    {record.observations && (
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Observações: </span>
                          {record.observations}
                        </p>
                      </div>
                    )}

                    {/* External Reference */}
                    {record.externalRef && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ExternalLink size={14} />
                        <span className="font-medium">Referência externa:</span>
                        <span>{record.externalRef}</span>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 text-sm text-muted-foreground lg:text-right lg:min-w-[180px]">
                    <span className="inline-flex items-center gap-1">
                      <User size={14} />
                      {record.responsiblePair}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(record.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
