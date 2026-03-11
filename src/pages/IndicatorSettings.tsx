import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, Save, RotateCcw, Gauge, Users, Activity, Zap, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const INDICATOR_CONFIG_KEY = "mvp_indicator_config";

interface IndicatorConfig {
  weights: {
    coverage: number;
    execution: number;
    participation: number;
    cycleProgress: number;
    attendance: number;
  };
  maturityRanges: {
    inicial: [number, number];
    estruturando: [number, number];
    evoluindo: [number, number];
    consolidando: [number, number];
    culturaForte: [number, number];
  };
  alertThresholds: {
    lowCoverage: number;
    criticalDelayedActions: number;
    minDecisionConversion: number;
  };
}

const DEFAULT_CONFIG: IndicatorConfig = {
  weights: {
    coverage: 25,
    execution: 25,
    participation: 20,
    cycleProgress: 20,
    attendance: 10,
  },
  maturityRanges: {
    inicial: [0, 25],
    estruturando: [26, 50],
    evoluindo: [51, 75],
    consolidando: [76, 90],
    culturaForte: [91, 100],
  },
  alertThresholds: {
    lowCoverage: 30,
    criticalDelayedActions: 4,
    minDecisionConversion: 50,
  },
};

function loadConfig(): IndicatorConfig {
  try {
    const stored = localStorage.getItem(INDICATOR_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: IndicatorConfig) {
  localStorage.setItem(INDICATOR_CONFIG_KEY, JSON.stringify(config));
}

export default function IndicatorSettings() {
  const [config, setConfig] = useState<IndicatorConfig>(loadConfig);

  const totalWeight = Object.values(config.weights).reduce((a, b) => a + b, 0);
  const isValid = totalWeight === 100;

  const updateWeight = (key: keyof IndicatorConfig["weights"], value: number) => {
    setConfig(prev => ({
      ...prev,
      weights: { ...prev.weights, [key]: value },
    }));
  };

  const updateThreshold = (key: keyof IndicatorConfig["alertThresholds"], value: number) => {
    setConfig(prev => ({
      ...prev,
      alertThresholds: { ...prev.alertThresholds, [key]: value },
    }));
  };

  const handleSave = () => {
    if (!isValid) {
      toast({ title: "Os pesos devem somar 100%", variant: "destructive" });
      return;
    }
    saveConfig(config);
    toast({ title: "Configurações de indicadores salvas com sucesso" });
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG });
    saveConfig(DEFAULT_CONFIG);
    toast({ title: "Configurações restauradas ao padrão" });
  };

  const weightItems = [
    { key: "coverage" as const, label: "Cobertura de Treinamentos", icon: Users },
    { key: "execution" as const, label: "Execução de Práticas", icon: Activity },
    { key: "participation" as const, label: "Participação nas Turmas", icon: Users },
    { key: "cycleProgress" as const, label: "Evolução dos Ciclos", icon: Gauge },
    { key: "attendance" as const, label: "Presença nas Atividades", icon: Activity },
  ];

  return (
    <AppLayout title="Configuração dos Indicadores" subtitle="Ajuste pesos, faixas de maturidade e limites de alerta">
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {/* Weights */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <SlidersHorizontal size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Pesos do Índice de Cultura MVP</h3>
              <p className="text-xs text-muted-foreground">Os pesos devem somar 100%</p>
            </div>
            <div className="ml-auto">
              <span className={`text-sm font-bold ${isValid ? "text-emerald-400" : "text-destructive"}`}>
                Total: {totalWeight}%
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {weightItems.map(({ key, label, icon: Icon }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-muted-foreground" />
                    <Label className="text-sm">{label}</Label>
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right">{config.weights[key]}%</span>
                </div>
                <Slider
                  value={[config.weights[key]]}
                  onValueChange={([v]) => updateWeight(key, v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Maturity Ranges */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gauge size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Faixas de Maturidade Cultural</h3>
              <p className="text-xs text-muted-foreground">Defina os intervalos de pontuação para cada nível</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: "inicial" as const, label: "Inicial", color: "bg-muted" },
              { key: "estruturando" as const, label: "Estruturando", color: "bg-amber-500/20" },
              { key: "evoluindo" as const, label: "Evoluindo", color: "bg-primary/20" },
              { key: "consolidando" as const, label: "Consolidando", color: "bg-emerald-500/20" },
              { key: "culturaForte" as const, label: "Cultura Forte", color: "bg-emerald-500/30" },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm font-medium w-32">{label}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={config.maturityRanges[key][0]}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        maturityRanges: {
                          ...prev.maturityRanges,
                          [key]: [parseInt(e.target.value) || 0, prev.maturityRanges[key][1]],
                        },
                      }))
                    }
                    className="w-20 h-8 text-center text-sm"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    value={config.maturityRanges[key][1]}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        maturityRanges: {
                          ...prev.maturityRanges,
                          [key]: [prev.maturityRanges[key][0], parseInt(e.target.value) || 0],
                        },
                      }))
                    }
                    className="w-20 h-8 text-center text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Alert Thresholds */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Limites de Alerta</h3>
              <p className="text-xs text-muted-foreground">Configure quando o sistema gera alertas automáticos</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Cobertura abaixo de (%)</Label>
              <Input
                type="number"
                value={config.alertThresholds.lowCoverage}
                onChange={(e) => updateThreshold("lowCoverage", parseInt(e.target.value) || 0)}
                className="w-24 h-8 text-center text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Ações atrasadas críticas (qtd)</Label>
              <Input
                type="number"
                value={config.alertThresholds.criticalDelayedActions}
                onChange={(e) => updateThreshold("criticalDelayedActions", parseInt(e.target.value) || 0)}
                className="w-24 h-8 text-center text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Conversão decisão→ação mínima (%)</Label>
              <Input
                type="number"
                value={config.alertThresholds.minDecisionConversion}
                onChange={(e) => updateThreshold("minDecisionConversion", parseInt(e.target.value) || 0)}
                className="w-24 h-8 text-center text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw size={14} className="mr-2" /> Restaurar Padrão
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <Save size={14} className="mr-2" /> Salvar Configurações
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
