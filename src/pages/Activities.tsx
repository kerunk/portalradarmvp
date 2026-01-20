import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Upload,
  Image as ImageIcon,
  FileText,
  Calendar,
  User,
  Eye,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Evidence {
  id: string;
  title: string;
  description: string;
  type: "image" | "document" | "report";
  action: string;
  uploadedBy: string;
  uploadedAt: string;
  thumbnail?: string;
}

const mockEvidences: Evidence[] = [
  {
    id: "1",
    title: "Fotos do Workshop de Liderança",
    description: "Registro fotográfico do evento realizado em 15/01",
    type: "image",
    action: "Workshop de sensibilização",
    uploadedBy: "Ana Martins",
    uploadedAt: "2025-01-16",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop",
  },
  {
    id: "2",
    title: "Ata da reunião de kick-off",
    description: "Documento com registro das decisões da reunião inicial",
    type: "document",
    action: "Diagnóstico inicial",
    uploadedBy: "Carlos Silva",
    uploadedAt: "2025-01-10",
  },
  {
    id: "3",
    title: "Relatório de diagnóstico cultural",
    description: "Análise completa da cultura organizacional atual",
    type: "report",
    action: "Diagnóstico inicial",
    uploadedBy: "Pedro Costa",
    uploadedAt: "2025-01-12",
  },
  {
    id: "4",
    title: "Fotos do treinamento de equipe",
    description: "Registro do treinamento com equipe de produção",
    type: "image",
    action: "Treinamento de liderança",
    uploadedBy: "Juliana Alves",
    uploadedAt: "2025-01-18",
    thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&h=200&fit=crop",
  },
];

const typeConfig = {
  image: {
    icon: ImageIcon,
    label: "Imagem",
    color: "bg-success/10 text-success",
  },
  document: {
    icon: FileText,
    label: "Documento",
    color: "bg-primary/10 text-primary",
  },
  report: {
    icon: FileText,
    label: "Relatório",
    color: "bg-warning/10 text-warning",
  },
};

export default function Activities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredEvidences = mockEvidences.filter((evidence) => {
    const matchesSearch =
      evidence.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evidence.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || evidence.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <AppLayout
      title="Atividades e Evidências"
      subtitle="Registre e acompanhe as evidências do programa"
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
              placeholder="Buscar evidências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="btn-primary-gradient">
            <Upload size={16} className="mr-2" />
            Enviar Evidência
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="image">Imagens</TabsTrigger>
            <TabsTrigger value="document">Documentos</TabsTrigger>
            <TabsTrigger value="report">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvidences.map((evidence) => {
                const type = typeConfig[evidence.type];
                const Icon = type.icon;

                return (
                  <div
                    key={evidence.id}
                    className="card-elevated overflow-hidden group"
                  >
                    {/* Thumbnail */}
                    {evidence.thumbnail ? (
                      <div className="relative h-40 bg-muted">
                        <img
                          src={evidence.thumbnail}
                          alt={evidence.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="secondary" className="h-9 w-9">
                            <Eye size={16} />
                          </Button>
                          <Button size="icon" variant="secondary" className="h-9 w-9">
                            <Download size={16} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-muted flex items-center justify-center">
                        <Icon size={48} className="text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground line-clamp-1">
                          {evidence.title}
                        </h3>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                            type.color
                          )}
                        >
                          {type.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {evidence.description}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <User size={12} />
                          {evidence.uploadedBy}
                        </span>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(evidence.uploadedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Upload Card */}
              <div className="card-elevated border-2 border-dashed border-border h-full min-h-[280px] flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                  <Plus size={24} />
                </div>
                <p className="font-medium">Adicionar Evidência</p>
                <p className="text-sm mt-1">Clique ou arraste arquivos</p>
              </div>
            </div>

            {filteredEvidences.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma evidência encontrada</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
