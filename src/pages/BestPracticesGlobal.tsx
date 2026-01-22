import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Lightbulb,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { bestPractices, type BestPractice } from "@/data/bestPractices";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  communication: "bg-amber-500/10 text-amber-600",
  leadership: "bg-blue-500/10 text-blue-600",
  practice: "bg-purple-500/10 text-purple-600",
  structure: "bg-emerald-500/10 text-emerald-600",
  indicators: "bg-rose-500/10 text-rose-600",
};

const categoryLabels: Record<string, string> = {
  communication: "Comunicação",
  leadership: "Liderança",
  practice: "Prática",
  structure: "Estrutura",
  indicators: "Indicadores",
};

const cycleOptions = ["M1", "M2", "M3", "V1", "V2", "V3", "P1", "P2", "P3"];

export default function BestPracticesGlobal() {
  const { isAdminMVP } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cycleFilter, setCycleFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<BestPractice | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cycleId: "M1",
    category: "communication",
    whenToUse: "",
    checklist: "",
    suggestedActionTitle: "",
    suggestedDaysToComplete: 14,
  });

  const filteredPractices = bestPractices.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCycle = cycleFilter === "all" || p.cycleId === cycleFilter;
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCycle && matchesCategory;
  });

  const handleOpenCreate = () => {
    setEditingPractice(null);
    setFormData({
      title: "",
      description: "",
      cycleId: "M1",
      category: "communication",
      whenToUse: "",
      checklist: "",
      suggestedActionTitle: "",
      suggestedDaysToComplete: 14,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (practice: BestPractice) => {
    setEditingPractice(practice);
    setFormData({
      title: practice.title,
      description: practice.description,
      cycleId: practice.cycleId,
      category: practice.category,
      whenToUse: practice.whenToUse,
      checklist: practice.checklist.join("\n"),
      suggestedActionTitle: practice.suggestedActionTitle || "",
      suggestedDaysToComplete: practice.suggestedDaysToComplete || 14,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    // In a real app, this would save to backend/storage
    toast({
      title: editingPractice ? "Prática atualizada" : "Prática criada",
      description: `"${formData.title}" foi ${editingPractice ? "atualizada" : "adicionada"} com sucesso.`,
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (practice: BestPractice) => {
    if (confirm(`Deseja excluir a prática "${practice.title}"?`)) {
      toast({
        title: "Prática excluída",
        description: `"${practice.title}" foi removida.`,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout
      title="Prateleira Global de Melhores Práticas"
      subtitle="Gerencie as práticas recomendadas disponíveis para todos os ciclos e empresas."
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header with filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar práticas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-32">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Ciclos</SelectItem>
                {cycleOptions.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdminMVP && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus size={16} />
              Nova Prática
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = bestPractices.filter(p => p.category === key).length;
            return (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", categoryColors[key])}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Practices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPractices.map(practice => (
            <Card key={practice.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              {/* Image */}
              {practice.imageUrl && (
                <div className="h-32 w-full overflow-hidden bg-secondary">
                  <img
                    src={practice.imageUrl}
                    alt={practice.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {practice.cycleId}
                    </Badge>
                    <Badge className={cn("text-xs", categoryColors[practice.category])}>
                      {categoryLabels[practice.category]}
                    </Badge>
                  </div>
                  {isAdminMVP && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenEdit(practice)}
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(practice)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {practice.title}
                </h4>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {practice.description}
                </p>

                {/* When to use */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded mb-3">
                  <Lightbulb size={14} className="text-warning flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{practice.whenToUse}</span>
                </div>

                {/* Checklist preview */}
                <div className="space-y-1">
                  {practice.checklist.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 size={12} className="text-success flex-shrink-0" />
                      <span className="line-clamp-1">{item}</span>
                    </div>
                  ))}
                  {practice.checklist.length > 2 && (
                    <p className="text-xs text-muted-foreground pl-5">
                      +{practice.checklist.length - 2} itens
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPractices.length === 0 && (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma prática encontrada
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou buscar por outro termo.
            </p>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPractice ? "Editar Prática" : "Nova Prática"}
              </DialogTitle>
              <DialogDescription>
                {editingPractice 
                  ? "Atualize os dados da prática recomendada."
                  : "Adicione uma nova prática à prateleira global."
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Ciclo</label>
                  <Select
                    value={formData.cycleId}
                    onValueChange={v => setFormData({ ...formData, cycleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cycleOptions.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Categoria</label>
                  <Select
                    value={formData.category}
                    onValueChange={v => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Título</label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Campanha de divulgação interna"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a prática em 2-3 linhas..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Quando usar</label>
                <Input
                  value={formData.whenToUse}
                  onChange={e => setFormData({ ...formData, whenToUse: e.target.value })}
                  placeholder="Ex: No início do ciclo, para gerar engajamento"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Checklist (um item por linha)</label>
                <Textarea
                  value={formData.checklist}
                  onChange={e => setFormData({ ...formData, checklist: e.target.value })}
                  placeholder="Item 1&#10;Item 2&#10;Item 3"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Título sugerido para ação</label>
                  <Input
                    value={formData.suggestedActionTitle}
                    onChange={e => setFormData({ ...formData, suggestedActionTitle: e.target.value })}
                    placeholder="Ex: Executar campanha de divulgação"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Prazo sugerido (dias)</label>
                  <Input
                    type="number"
                    value={formData.suggestedDaysToComplete}
                    onChange={e => setFormData({ ...formData, suggestedDaysToComplete: parseInt(e.target.value) || 14 })}
                    min={1}
                    max={90}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingPractice ? "Salvar Alterações" : "Criar Prática"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
