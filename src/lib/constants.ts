// Centralized constants for MVP Portal

// Cycle IDs
export const CYCLE_IDS = ["M1", "M2", "M3", "V1", "V2", "V3", "P1", "P2", "P3"] as const;
export type CycleId = typeof CYCLE_IDS[number];

// Cycle order for progression
export const CYCLE_ORDER: Record<CycleId, number> = {
  M1: 0, M2: 1, M3: 2,
  V1: 3, V2: 4, V3: 5,
  P1: 6, P2: 7, P3: 8,
};

export const NEXT_CYCLE: Record<CycleId, CycleId | null> = {
  M1: "M2", M2: "M3", M3: "V1",
  V1: "V2", V2: "V3", V3: "P1",
  P1: "P2", P2: "P3", P3: null,
};

// Action Status
export const ACTION_STATUS = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: "Clock" },
  in_progress: { label: "Em andamento", color: "bg-warning/10 text-warning", icon: "Target" },
  completed: { label: "Concluído", color: "bg-success/10 text-success", icon: "CheckCircle2" },
  delayed: { label: "Atrasado", color: "bg-destructive/10 text-destructive", icon: "AlertCircle" },
} as const;
export type ActionStatus = keyof typeof ACTION_STATUS;

// Turma Status
export const TURMA_STATUS = {
  planned: { label: "Planejada", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em andamento", color: "bg-warning/10 text-warning" },
  completed: { label: "Concluída", color: "bg-success/10 text-success" },
  delayed: { label: "Atrasada", color: "bg-destructive/10 text-destructive" },
} as const;
export type TurmaStatus = keyof typeof TURMA_STATUS;

// Record Types
export const RECORD_TYPES = {
  meeting: { label: "Reunião", color: "bg-blue-500/10 text-blue-600", icon: "MessageSquare" },
  decision: { label: "Decisão", color: "bg-purple-500/10 text-purple-600", icon: "CheckCircle2" },
  observation: { label: "Observação", color: "bg-amber-500/10 text-amber-600", icon: "FileText" },
  risk: { label: "Risco", color: "bg-destructive/10 text-destructive", icon: "AlertTriangle" },
  communication: { label: "Comunicação", color: "bg-emerald-500/10 text-emerald-600", icon: "Megaphone" },
} as const;
export type RecordType = keyof typeof RECORD_TYPES;

// Record Status
export const RECORD_STATUS = {
  open: { label: "Aberto", color: "bg-warning/10 text-warning" },
  in_progress: { label: "Em andamento", color: "bg-blue-500/10 text-blue-600" },
  closed: { label: "Fechado", color: "bg-success/10 text-success" },
} as const;
export type RecordStatus = keyof typeof RECORD_STATUS;

// Phase colors
export const PHASE_COLORS = {
  M: {
    name: "Monitorar",
    active: "bg-blue-600 text-white border-blue-600",
    inactive: "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20",
    badge: "bg-blue-500/10 text-blue-600",
  },
  V: {
    name: "Validar",
    active: "bg-amber-600 text-white border-amber-600",
    inactive: "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600",
  },
  P: {
    name: "Perpetuar",
    active: "bg-emerald-600 text-white border-emerald-600",
    inactive: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-600",
  },
} as const;
export type Phase = keyof typeof PHASE_COLORS;

// Cycle closure status
export const CYCLE_CLOSURE_STATUS = {
  not_started: { label: "Não iniciado", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "Em progresso", color: "bg-warning/10 text-warning" },
  ready_to_close: { label: "Pronto para encerrar", color: "bg-blue-500/10 text-blue-600" },
  closed: { label: "Encerrado", color: "bg-success/10 text-success" },
} as const;
export type CycleClosureStatus = keyof typeof CYCLE_CLOSURE_STATUS;

// Alert types for intelligent alerts
export const ALERT_TYPES = {
  delayed_action: { label: "Ação Atrasada", priority: 1, color: "destructive" },
  low_participation: { label: "Baixa Participação", priority: 2, color: "warning" },
  cycle_ready: { label: "Ciclo Pronto", priority: 3, color: "info" },
  decision_pending: { label: "Decisão Pendente", priority: 4, color: "warning" },
  turma_delayed: { label: "Turma Atrasada", priority: 5, color: "destructive" },
} as const;
export type AlertType = keyof typeof ALERT_TYPES;

// Minimum criteria for cycle closure
export const CYCLE_CLOSURE_CRITERIA = {
  minActionCompletionPercent: 80,
  minTurmasCompleted: 1,
  requireNoDelayedActions: false,
} as const;