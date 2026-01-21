// ============================================================
// MVP Portal - Core Governance Layer
// Business rules for cycle management, progression, and validation
// ============================================================

import { 
  getState, 
  setState,
  type CycleState, 
  type CycleFactorAction,
  type RecordState,
  type TurmaState,
} from './storage';
import { CYCLE_IDS, NEXT_CYCLE, CYCLE_ORDER, type CycleId } from './constants';
import { mvpCycles } from '@/data/mvpCycles';

// ============================================================
// TYPES - Governance Data Structures
// ============================================================

export interface CycleGovernance {
  cycleId: CycleId;
  status: 'pending' | 'in_progress' | 'ready_to_close' | 'closed';
  startDate: string | null;
  plannedEndDate: string | null;
  closedAt: string | null;
  closureNotes: string;
  closureCriteria: CycleClosureCriteria;
  isLocked: boolean;
}

export interface CycleClosureCriteria {
  actionCompletionPercent: number;
  minActionCompletionRequired: number;
  completedTurmas: number;
  minTurmasRequired: number;
  hasDecisionOrValidation: boolean;
  requiresDecisionOrValidation: boolean;
  allCriteriaMet: boolean;
}

export interface CycleEvaluationResult {
  cycleId: string;
  canClose: boolean;
  criteria: CycleClosureCriteria;
  warnings: string[];
  blockers: string[];
}

export interface DecisionActionLink {
  decisionId: string;
  actionId: string;
  cycleId: string;
  factorId: string;
  createdAt: string;
}

// ============================================================
// CYCLE GOVERNANCE - Core Functions
// ============================================================

/**
 * Evaluates if a cycle can be closed based on minimum criteria
 * Critérios mínimos:
 * - ≥ 80% das ações do ciclo concluídas
 * - Pelo menos 1 turma finalizada vinculada ao ciclo
 * - Pelo menos 1 registro de decisão ou validação associado
 */
export function avaliarEncerramentoDeCiclo(cycleId: string): CycleEvaluationResult {
  const state = getState();
  const cycleState = state.cycles[cycleId];
  const warnings: string[] = [];
  const blockers: string[] = [];

  // Calculate action completion
  let totalActions = 0;
  let completedActions = 0;
  let delayedActions = 0;

  if (cycleState) {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled) {
          totalActions++;
          if (action.status === 'completed') completedActions++;
          if (action.status === 'delayed') delayedActions++;
        }
      });
    });
  }

  const actionCompletionPercent = totalActions > 0 
    ? Math.round((completedActions / totalActions) * 100) 
    : 0;

  // Calculate turmas completion
  const cycleTurmas = state.turmas.filter(t => t.cycleId === cycleId);
  const completedTurmas = cycleTurmas.filter(t => t.status === 'completed').length;

  // Check for decision or validation records
  const cycleRecords = state.records.filter(r => r.cycleId === cycleId);
  const hasDecisionOrValidation = cycleRecords.some(r => 
    r.type === 'decision' || r.type === 'validation' || r.type === 'meeting'
  );

  // Build criteria object
  const criteria: CycleClosureCriteria = {
    actionCompletionPercent,
    minActionCompletionRequired: 80,
    completedTurmas,
    minTurmasRequired: 1,
    hasDecisionOrValidation,
    requiresDecisionOrValidation: true,
    allCriteriaMet: false,
  };

  // Evaluate criteria
  if (actionCompletionPercent < 80) {
    blockers.push(`Apenas ${actionCompletionPercent}% das ações concluídas (mínimo: 80%)`);
  }

  if (completedTurmas < 1) {
    blockers.push(`Nenhuma turma concluída (mínimo: 1)`);
  }

  if (!hasDecisionOrValidation) {
    warnings.push(`Sem registro de decisão ou validação associado ao ciclo`);
  }

  if (delayedActions > 0) {
    warnings.push(`${delayedActions} ação(ões) ainda atrasada(s)`);
  }

  criteria.allCriteriaMet = blockers.length === 0;

  return {
    cycleId,
    canClose: criteria.allCriteriaMet,
    criteria,
    warnings,
    blockers,
  };
}

/**
 * Gets the governance state for a specific cycle
 */
export function obterGovernancaDeCiclo(cycleId: string): CycleGovernance {
  const state = getState();
  const cycleState = state.cycles[cycleId];
  const evaluation = avaliarEncerramentoDeCiclo(cycleId);

  // Determine status based on state and criteria
  let status: CycleGovernance['status'] = 'pending';
  
  if (cycleState?.closureStatus === 'closed') {
    status = 'closed';
  } else if (evaluation.canClose) {
    status = 'ready_to_close';
  } else if (cycleState && cycleState.factors.some(f => 
    f.actions.some(a => a.enabled && (a.status === 'in_progress' || a.status === 'completed'))
  )) {
    status = 'in_progress';
  }

  // Check if previous cycle is closed (for progression)
  const cycleIndex = CYCLE_ORDER[cycleId as CycleId];
  const previousCycleId = Object.entries(CYCLE_ORDER).find(([_, idx]) => idx === cycleIndex - 1)?.[0];
  
  let isLocked = false;
  if (previousCycleId && cycleIndex > 0) {
    const previousCycleState = state.cycles[previousCycleId];
    isLocked = previousCycleState?.closureStatus !== 'closed';
  }

  return {
    cycleId: cycleId as CycleId,
    status,
    startDate: cycleState?.startDate || null,
    plannedEndDate: cycleState?.plannedEndDate || null,
    closedAt: cycleState?.closedAt || null,
    closureNotes: cycleState?.closureNotes || '',
    closureCriteria: evaluation.criteria,
    isLocked: isLocked && cycleIndex > 0, // M1 is never locked
  };
}

/**
 * Formally closes a cycle and unlocks the next one
 */
export function encerrarCiclo(cycleId: string, notes: string): { 
  success: boolean; 
  error?: string;
  nextCycleId?: string;
} {
  const evaluation = avaliarEncerramentoDeCiclo(cycleId);
  
  if (!evaluation.canClose) {
    return { 
      success: false, 
      error: `Critérios não atingidos: ${evaluation.blockers.join(', ')}` 
    };
  }

  const state = getState();
  const cycleState = state.cycles[cycleId];
  
  if (!cycleState) {
    return { success: false, error: 'Ciclo não encontrado' };
  }

  // Update cycle state
  const now = new Date().toISOString();
  const updatedCycleState: CycleState = {
    ...cycleState,
    closureStatus: 'closed',
    closedAt: now,
    closureNotes: notes,
  };

  setState({
    cycles: { ...state.cycles, [cycleId]: updatedCycleState },
  });

  // Get next cycle
  const nextCycleId = NEXT_CYCLE[cycleId as CycleId];
  
  // If there's a next cycle, ensure it has an initial state
  if (nextCycleId) {
    const nextCycleState = state.cycles[nextCycleId];
    if (!nextCycleState) {
      // Initialize next cycle state (will be done by MVPCycles page)
    }
  }

  return { 
    success: true, 
    nextCycleId: nextCycleId || undefined 
  };
}

/**
 * Checks if a cycle can be started (previous must be closed)
 */
export function podePiciarCiclo(cycleId: string): boolean {
  const governance = obterGovernancaDeCiclo(cycleId);
  return !governance.isLocked;
}

// ============================================================
// DECISION → ACTION LINKING
// ============================================================

/**
 * Creates actions from a decision record
 */
export function criarAcoesDeDecisao(
  decisionId: string,
  actions: Array<{
    cycleId: string;
    factorId: string;
    title: string;
    responsible: string;
    dueDate: string;
  }>
): { success: boolean; createdActionIds: string[] } {
  const state = getState();
  const createdActionIds: string[] = [];

  // For each action to create
  actions.forEach(actionData => {
    const cycleState = state.cycles[actionData.cycleId];
    if (!cycleState) return;

    const factorState = cycleState.factors.find(f => f.id === actionData.factorId);
    if (!factorState) return;

    // Create new action with decision link
    const newActionId = `decision-action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newAction: CycleFactorAction = {
      id: newActionId,
      enabled: true,
      disabledReason: '',
      responsible: actionData.responsible,
      dueDate: actionData.dueDate,
      status: 'pending',
      observation: `Criada a partir da decisão: ${decisionId}`,
      sourceDecisionId: decisionId,
    };

    factorState.actions.push(newAction);
    createdActionIds.push(newActionId);
  });

  // Update state
  setState({ cycles: state.cycles });

  // Update the decision record with linked action IDs
  const record = state.records.find(r => r.id === decisionId);
  if (record) {
    record.linkedActionIds = [...(record.linkedActionIds || []), ...createdActionIds];
    record.createsActions = true;
    setState({ records: state.records });
  }

  return { success: true, createdActionIds };
}

/**
 * Gets all actions linked to a decision
 */
export function obterAcoesDeDecisao(decisionId: string): Array<{
  cycleId: string;
  factorId: string;
  action: CycleFactorAction;
}> {
  const state = getState();
  const linkedActions: Array<{
    cycleId: string;
    factorId: string;
    action: CycleFactorAction;
  }> = [];

  Object.entries(state.cycles).forEach(([cycleId, cycleState]) => {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.sourceDecisionId === decisionId) {
          linkedActions.push({ cycleId, factorId: factor.id, action });
        }
      });
    });
  });

  return linkedActions;
}

/**
 * Gets the decision that created an action
 */
export function obterDecisaoDeAcao(actionId: string): RecordState | null {
  const state = getState();
  
  // Find action's source decision ID
  let sourceDecisionId: string | null = null;
  
  Object.values(state.cycles).forEach(cycleState => {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.id === actionId && action.sourceDecisionId) {
          sourceDecisionId = action.sourceDecisionId;
        }
      });
    });
  });

  if (!sourceDecisionId) return null;
  
  return state.records.find(r => r.id === sourceDecisionId) || null;
}

// ============================================================
// INDICATORS - Aggregation Functions
// ============================================================

export interface GlobalIndicators {
  totalCycles: number;
  closedCycles: number;
  cyclesInProgress: number;
  cyclesReadyToClose: number;
  totalActions: number;
  completedActions: number;
  delayedActions: number;
  pendingActions: number;
  inProgressActions: number;
  overallCompletionPercent: number;
  totalTurmas: number;
  completedTurmas: number;
  totalParticipants: number;
  totalRecords: number;
  decisionsWithActions: number;
  averageCycleDurationDays: number | null;
  actionBacklog: number;
  decisionConversionRate: number;
}

export interface CycleIndicators {
  cycleId: string;
  phaseName: string;
  status: CycleGovernance['status'];
  totalActions: number;
  completedActions: number;
  delayedActions: number;
  completionPercent: number;
  turmasTotal: number;
  turmasCompleted: number;
  recordsCount: number;
  decisionsCount: number;
  daysActive: number | null;
  isLocked: boolean;
}

/**
 * Gets global indicators across all cycles
 */
export function obterIndicadoresGlobais(): GlobalIndicators {
  const state = getState();
  
  let totalActions = 0;
  let completedActions = 0;
  let delayedActions = 0;
  let pendingActions = 0;
  let inProgressActions = 0;
  let closedCycles = 0;
  let cyclesInProgress = 0;
  let cyclesReadyToClose = 0;
  let totalCycleDays = 0;
  let cyclesWithDuration = 0;

  CYCLE_IDS.forEach(cycleId => {
    const governance = obterGovernancaDeCiclo(cycleId);
    const cycleState = state.cycles[cycleId];

    // Count cycle statuses
    if (governance.status === 'closed') {
      closedCycles++;
      // Calculate duration if we have dates
      if (cycleState?.startDate && cycleState?.closedAt) {
        const start = new Date(cycleState.startDate);
        const end = new Date(cycleState.closedAt);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalCycleDays += days;
        cyclesWithDuration++;
      }
    } else if (governance.status === 'ready_to_close') {
      cyclesReadyToClose++;
    } else if (governance.status === 'in_progress') {
      cyclesInProgress++;
    }

    // Count actions
    if (cycleState) {
      cycleState.factors.forEach(factor => {
        factor.actions.forEach(action => {
          if (action.enabled) {
            totalActions++;
            switch (action.status) {
              case 'completed': completedActions++; break;
              case 'delayed': delayedActions++; break;
              case 'in_progress': inProgressActions++; break;
              case 'pending': pendingActions++; break;
            }
          }
        });
      });
    }
  });

  // Turmas stats
  const totalTurmas = state.turmas.length;
  const completedTurmas = state.turmas.filter(t => t.status === 'completed').length;
  const totalParticipants = state.turmas.reduce((sum, t) => sum + t.participants.length, 0);

  // Records stats
  const totalRecords = state.records.length;
  const decisions = state.records.filter(r => r.type === 'decision');
  const decisionsWithActions = decisions.filter(r => r.createsActions && (r.linkedActionIds?.length || 0) > 0).length;
  const decisionConversionRate = decisions.length > 0 
    ? Math.round((decisionsWithActions / decisions.length) * 100) 
    : 0;

  return {
    totalCycles: CYCLE_IDS.length,
    closedCycles,
    cyclesInProgress,
    cyclesReadyToClose,
    totalActions,
    completedActions,
    delayedActions,
    pendingActions,
    inProgressActions,
    overallCompletionPercent: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
    totalTurmas,
    completedTurmas,
    totalParticipants,
    totalRecords,
    decisionsWithActions,
    averageCycleDurationDays: cyclesWithDuration > 0 ? Math.round(totalCycleDays / cyclesWithDuration) : null,
    actionBacklog: pendingActions + inProgressActions + delayedActions,
    decisionConversionRate,
  };
}

/**
 * Gets indicators for a specific cycle
 */
export function obterIndicadoresPorCiclo(cycleId: string): CycleIndicators {
  const state = getState();
  const cycleState = state.cycles[cycleId];
  const governance = obterGovernancaDeCiclo(cycleId);
  const cycleDef = mvpCycles.find(c => c.id === cycleId);

  let totalActions = 0;
  let completedActions = 0;
  let delayedActions = 0;

  if (cycleState) {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled) {
          totalActions++;
          if (action.status === 'completed') completedActions++;
          if (action.status === 'delayed') delayedActions++;
        }
      });
    });
  }

  const cycleTurmas = state.turmas.filter(t => t.cycleId === cycleId);
  const cycleRecords = state.records.filter(r => r.cycleId === cycleId);

  // Calculate days active
  let daysActive: number | null = null;
  if (cycleState?.startDate) {
    const start = new Date(cycleState.startDate);
    const end = cycleState.closedAt ? new Date(cycleState.closedAt) : new Date();
    daysActive = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    cycleId,
    phaseName: cycleDef?.phaseName || 'MVP',
    status: governance.status,
    totalActions,
    completedActions,
    delayedActions,
    completionPercent: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
    turmasTotal: cycleTurmas.length,
    turmasCompleted: cycleTurmas.filter(t => t.status === 'completed').length,
    recordsCount: cycleRecords.length,
    decisionsCount: cycleRecords.filter(r => r.type === 'decision').length,
    daysActive,
    isLocked: governance.isLocked,
  };
}

/**
 * Gets indicators for all cycles
 */
export function obterIndicadoresTodosCiclos(): CycleIndicators[] {
  return CYCLE_IDS.map(cycleId => obterIndicadoresPorCiclo(cycleId));
}

// ============================================================
// SMART ALERTS - Enhanced Alert Generation
// ============================================================

export interface EnhancedSmartAlert {
  id: string;
  type: 'delayed_action' | 'cycle_ready' | 'cycle_blocked' | 'turma_delayed' | 'record_without_action' | 'low_participation';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  cycleId?: string;
  actionId?: string;
  turmaId?: string;
  recordId?: string;
  navigateTo: string;
  createdAt: string;
  autoResolves: boolean; // Whether this alert disappears when condition is resolved
}

/**
 * Generates all smart alerts based on current state
 */
export function gerarAlertasInteligentes(): EnhancedSmartAlert[] {
  const state = getState();
  const alerts: EnhancedSmartAlert[] = [];
  const now = new Date().toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Delayed Actions
  Object.entries(state.cycles).forEach(([cycleId, cycleState]) => {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled && action.dueDate && action.status !== 'completed') {
          const dueDate = new Date(action.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueDate < today) {
            const cycleDef = mvpCycles.find(c => c.id === cycleId);
            const factorDef = cycleDef?.successFactors.find(f => f.id === factor.id);
            const actionDef = factorDef?.actions.find(a => a.id === action.id);
            
            alerts.push({
              id: `delayed-${cycleId}-${action.id}`,
              type: 'delayed_action',
              severity: 'danger',
              title: `Ação atrasada: ${actionDef?.title || action.id}`,
              description: `Ciclo ${cycleId} - ${factorDef?.name || factor.id}`,
              cycleId,
              actionId: action.id,
              navigateTo: `/ciclos?cycle=${cycleId}`,
              createdAt: now,
              autoResolves: true,
            });
          }
        }
      });
    });
  });

  // 2. Cycles ready to close
  CYCLE_IDS.forEach(cycleId => {
    const governance = obterGovernancaDeCiclo(cycleId);
    if (governance.status === 'ready_to_close') {
      const cycleDef = mvpCycles.find(c => c.id === cycleId);
      alerts.push({
        id: `ready-${cycleId}`,
        type: 'cycle_ready',
        severity: 'info',
        title: `Ciclo ${cycleId} pronto para encerrar`,
        description: `${cycleDef?.title || ''} - Todos os critérios atingidos`,
        cycleId,
        navigateTo: `/ciclos?cycle=${cycleId}`,
        createdAt: now,
        autoResolves: true,
      });
    }
  });

  // 3. Cycles blocked by lack of decision
  CYCLE_IDS.forEach(cycleId => {
    const cycleState = state.cycles[cycleId];
    if (!cycleState || cycleState.closureStatus === 'closed') return;
    
    const cycleRecords = state.records.filter(r => r.cycleId === cycleId);
    const hasAnyProgress = cycleState.factors.some(f => 
      f.actions.some(a => a.enabled && (a.status === 'in_progress' || a.status === 'completed'))
    );
    
    if (hasAnyProgress && !cycleRecords.some(r => r.type === 'decision' || r.type === 'meeting')) {
      alerts.push({
        id: `blocked-${cycleId}`,
        type: 'cycle_blocked',
        severity: 'warning',
        title: `Ciclo ${cycleId} sem decisão registrada`,
        description: 'Registre uma decisão ou reunião para documentar o progresso',
        cycleId,
        navigateTo: `/registros?cycle=${cycleId}`,
        createdAt: now,
        autoResolves: true,
      });
    }
  });

  // 4. Delayed turmas
  state.turmas.forEach(turma => {
    if (turma.status === 'completed') return;
    if (!turma.endDate) return;
    
    const endDate = new Date(turma.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    if (endDate < today) {
      alerts.push({
        id: `turma-delayed-${turma.id}`,
        type: 'turma_delayed',
        severity: 'warning',
        title: `Turma "${turma.name}" atrasada`,
        description: `Ciclo ${turma.cycleId} - Prazo: ${new Date(turma.endDate).toLocaleDateString('pt-BR')}`,
        cycleId: turma.cycleId,
        turmaId: turma.id,
        navigateTo: `/turmas?cycle=${turma.cycleId}`,
        createdAt: now,
        autoResolves: true,
      });
    }
  });

  // 5. Critical records without action
  state.records.forEach(record => {
    if (record.type === 'risk' && record.status === 'open') {
      const hasLinkedActions = record.linkedActionIds && record.linkedActionIds.length > 0;
      if (!hasLinkedActions) {
        alerts.push({
          id: `risk-no-action-${record.id}`,
          type: 'record_without_action',
          severity: 'warning',
          title: `Risco sem ação: ${record.title}`,
          description: 'Considere criar ações para mitigar este risco',
          recordId: record.id,
          cycleId: record.cycleId || undefined,
          navigateTo: `/registros?type=risk`,
          createdAt: now,
          autoResolves: true,
        });
      }
    }
  });

  // Sort by severity
  const severityOrder = { danger: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ============================================================
// TURMAS GOVERNANCE
// ============================================================

/**
 * Validates if a turma meets completion requirements
 */
export function validarTurmaParaEncerramento(turmaId: string): {
  canComplete: boolean;
  warnings: string[];
} {
  const state = getState();
  const turma = state.turmas.find(t => t.id === turmaId);
  const warnings: string[] = [];

  if (!turma) {
    return { canComplete: false, warnings: ['Turma não encontrada'] };
  }

  if (turma.participants.length === 0) {
    warnings.push('Turma sem participantes registrados');
  }

  if (!turma.startDate) {
    warnings.push('Data de início não definida');
  }

  if (!turma.endDate) {
    warnings.push('Data de término não definida');
  }

  return {
    canComplete: true, // Can still complete with warnings
    warnings,
  };
}

/**
 * Gets turma impact on cycle closure
 */
export function obterImpactoTurmaNoCiclo(cycleId: string): {
  totalTurmas: number;
  completedTurmas: number;
  impactOnClosure: boolean;
} {
  const state = getState();
  const cycleTurmas = state.turmas.filter(t => t.cycleId === cycleId);
  const completedTurmas = cycleTurmas.filter(t => t.status === 'completed').length;

  return {
    totalTurmas: cycleTurmas.length,
    completedTurmas,
    impactOnClosure: completedTurmas >= 1, // Meets minimum criteria
  };
}

// ============================================================
// DATA EXPORT - Preparation for API Migration
// ============================================================

export interface ExportableState {
  version: string;
  exportedAt: string;
  cycles: Record<string, CycleState>;
  turmas: TurmaState[];
  records: RecordState[];
  governance: {
    cycleStatuses: Record<string, CycleGovernance['status']>;
    globalIndicators: GlobalIndicators;
  };
}

/**
 * Exports current state in a format ready for API migration
 */
export function exportarEstadoParaAPI(): ExportableState {
  const state = getState();
  const globalIndicators = obterIndicadoresGlobais();
  
  const cycleStatuses: Record<string, CycleGovernance['status']> = {};
  CYCLE_IDS.forEach(cycleId => {
    const governance = obterGovernancaDeCiclo(cycleId);
    cycleStatuses[cycleId] = governance.status;
  });

  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    cycles: state.cycles,
    turmas: state.turmas,
    records: state.records,
    governance: {
      cycleStatuses,
      globalIndicators,
    },
  };
}