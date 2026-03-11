// MVP Portal Storage Layer
// Unified localStorage persistence with versioning
// Prepared for future API migration
// Company-scoped: operational data is isolated per company

import { CYCLE_IDS, type CycleId } from './constants';

const GLOBAL_STORAGE_KEY = 'mvp_portal_data';
const STORAGE_KEY = 'mvp_portal_data'; // Legacy fallback
const SCHEMA_VERSION = 5; // v5: company-scoped data isolation

// Active company for scoped storage
let _activeCompanyId: string | null = null;

export function setActiveCompany(companyId: string | null): void {
  _activeCompanyId = companyId;
}

export function getActiveCompany(): string | null {
  return _activeCompanyId;
}

function getStorageKey(): string {
  if (_activeCompanyId) {
    return `mvp_portal_company_${_activeCompanyId}`;
  }
  return GLOBAL_STORAGE_KEY;
}

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

// ============================================================
// TYPES - Core Data Structures
// ============================================================

export interface CycleFactorAction {
  id: string;
  title?: string; // Human-readable title for custom actions
  enabled: boolean;
  disabledReason: string;
  responsible: string;
  dueDate: string | null;
  status: "pending" | "in_progress" | "completed" | "delayed";
  observation: string;
  sourceDecisionId?: string; // Bidirectional link to decision that created this action
  createdAt?: string;
  updatedAt?: string;
}

export interface CycleFactorState {
  id: string;
  actions: CycleFactorAction[];
}

export interface CycleState {
  factors: CycleFactorState[];
  closureStatus: "not_started" | "in_progress" | "ready_to_close" | "closed";
  startDate?: string;        // When cycle was started
  plannedEndDate?: string;   // Expected completion date
  closedAt?: string;         // When cycle was formally closed
  closureNotes?: string;     // Notes from closure
  lockedForEditing?: boolean; // Prevents changes after closure
}

export interface TurmaParticipant {
  id: string;
  name: string;
  sector: string;
  role: string;
}

export interface TurmaState {
  id: string;
  name: string;
  cycleId: string;
  facilitator: string;
  participants: TurmaParticipant[];
  startDate: string | null;
  endDate: string | null;
  status: "planned" | "in_progress" | "completed" | "delayed";
  notes?: string;
  trainingDate?: string | null;
  attendance?: Record<string, "present" | "absent" | "reschedule">;
}

export interface RecordState {
  id: string;
  companyId: string;
  date: string;
  cycleId: string | null;
  factorId?: string; // Link to success factor
  type: "meeting" | "decision" | "observation" | "risk" | "communication" | "validation";
  status: "open" | "in_progress" | "closed";
  title: string;
  description: string;
  owner: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // For decisions that create actions
  createsActions?: boolean;
  linkedActionIds?: string[];
}

export interface PlanActionState {
  id: string;
  title: string;
  description: string;
  phase: string;
  responsible: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed" | "delayed";
  observations: string;
}

export interface EmployeeState {
  id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
  active: boolean;
}

export interface FacilitatorState {
  id: string;
  name: string;
  email: string;
}

export interface CompanyState {
  id: string;
  name: string;
  sector: string;
  employees: number;
  adminName: string;
  adminEmail: string;
  tempPassword: string;
  createdAt: string;
  logo?: string;
  onboardingStatus: OnboardingStatus;
}

// Smart Alert Interface
export interface SmartAlert {
  id: string;
  type: "delayed_action" | "low_participation" | "cycle_ready" | "decision_pending" | "turma_delayed";
  title: string;
  description: string;
  severity: "info" | "warning" | "danger";
  cycleId?: string;
  actionId?: string;
  turmaId?: string;
  recordId?: string;
  createdAt: string;
  dismissed: boolean;
  navigateTo: string;
}

export interface PortalState {
  schemaVersion: number;
  cycles: Record<string, CycleState>;
  turmas: TurmaState[];
  records: RecordState[];
  planActions: PlanActionState[];
  employees: EmployeeState[];
  facilitators: FacilitatorState[];
  companies: CompanyState[];
  dismissedAlerts: string[];
}

// Default initial state - empty for company-scoped, with defaults for global
const getDefaultState = (forCompany: boolean = false): PortalState => ({
  schemaVersion: SCHEMA_VERSION,
  cycles: {},
  turmas: [],
  records: [],
  planActions: [],
  employees: forCompany ? [] : getDefaultEmployees(),
  facilitators: forCompany ? [] : getDefaultFacilitators(),
  companies: forCompany ? [] : getDefaultCompanies(),
  dismissedAlerts: [],
});

// Default employees
function getDefaultEmployees(): EmployeeState[] {
  return [
    { id: "emp-1", name: "Pedro Almeida", email: "pedro@empresa.com", sector: "Operações", role: "Técnico", active: true },
    { id: "emp-2", name: "Juliana Lima", email: "juliana@empresa.com", sector: "Operações", role: "Supervisor", active: true },
    { id: "emp-3", name: "Roberto Souza", email: "roberto@empresa.com", sector: "Manutenção", role: "Técnico", active: true },
    { id: "emp-4", name: "Carla Mendes", email: "carla@empresa.com", sector: "Manutenção", role: "Coordenador", active: true },
    { id: "emp-5", name: "Lucas Ferreira", email: "lucas@empresa.com", sector: "Administrativo", role: "Analista", active: true },
    { id: "emp-6", name: "Mariana Costa", email: "mariana@empresa.com", sector: "Segurança", role: "Técnico", active: true },
    { id: "emp-7", name: "André Santos", email: "andre@empresa.com", sector: "Produção", role: "Operador", active: true },
    { id: "emp-8", name: "Patricia Rocha", email: "patricia@empresa.com", sector: "Produção", role: "Líder", active: true },
    { id: "emp-9", name: "Fernando Dias", email: "fernando@empresa.com", sector: "Qualidade", role: "Analista", active: true },
    { id: "emp-10", name: "Claudia Martins", email: "claudia@empresa.com", sector: "RH", role: "Coordenador", active: true },
  ];
}

// Default facilitators
function getDefaultFacilitators(): FacilitatorState[] {
  return [
    { id: "fac-1", name: "Maria Silva", email: "maria.silva@mvp.com" },
    { id: "fac-2", name: "João Santos", email: "joao.santos@mvp.com" },
    { id: "fac-3", name: "Ana Oliveira", email: "ana.oliveira@mvp.com" },
    { id: "fac-4", name: "Carlos Pereira", email: "carlos.pereira@mvp.com" },
    { id: "fac-5", name: "Fernanda Costa", email: "fernanda.costa@mvp.com" },
  ];
}

// Default companies
function getDefaultCompanies(): CompanyState[] {
  return [
    {
      id: "company-1",
      name: "Empresa Alpha",
      sector: "Indústria",
      employees: 320,
      adminName: "Carlos Silva",
      adminEmail: "admin@alpha.com",
      tempPassword: "Alpha2024!",
      createdAt: "2024-01-15",
      onboardingStatus: "completed", // Demo company already onboarded
    },
    {
      id: "company-2",
      name: "Tech Solutions",
      sector: "Tecnologia",
      employees: 150,
      adminName: "Ana Martins",
      adminEmail: "admin@techsolutions.com",
      tempPassword: "Tech2024!",
      createdAt: "2024-02-20",
      onboardingStatus: "not_started",
    },
  ];
}

// Update company onboarding status
export function updateCompanyOnboardingStatus(companyId: string, status: OnboardingStatus): void {
  const companies = getCompanies();
  const updated = companies.map(c => 
    c.id === companyId ? { ...c, onboardingStatus: status } : c
  );
  setCompanies(updated);
}

// Get company by ID
export function getCompanyById(companyId: string): CompanyState | null {
  const companies = getCompanies();
  return companies.find(c => c.id === companyId) || null;
}

// Get full state (company-scoped when active company is set)
export function getState(): PortalState {
  const key = getStorageKey();
  const isCompanyScoped = !!_activeCompanyId;
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      const defaultState = getDefaultState(isCompanyScoped);
      localStorage.setItem(key, JSON.stringify(defaultState));
      return defaultState;
    }
    
    const parsed = JSON.parse(stored) as PortalState;
    
    // Handle schema migration if needed
    if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
      const migrated = migrateState(parsed);
      localStorage.setItem(key, JSON.stringify(migrated));
      return migrated;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading state from localStorage:', error);
    return getDefaultState(isCompanyScoped);
  }
}

// Update state (partial update)
export function setState(partialUpdate: Partial<PortalState>): void {
  const key = getStorageKey();
  try {
    const current = getState();
    const updated = { ...current, ...partialUpdate };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
}

// Get global state (always from global key, for companies list)
export function getGlobalState(): PortalState {
  try {
    const stored = localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (!stored) {
      const defaultState = getDefaultState(false);
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    const parsed = JSON.parse(stored) as PortalState;
    if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
      const migrated = migrateState(parsed);
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed;
  } catch (error) {
    return getDefaultState(false);
  }
}

// Set global state
function setGlobalState(partialUpdate: Partial<PortalState>): void {
  try {
    const current = getGlobalState();
    const updated = { ...current, ...partialUpdate };
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving global state:', error);
  }
}

// Migrate state from older versions
function migrateState(oldState: Partial<PortalState>): PortalState {
  const defaultState = getDefaultState();
  
  // Migrate cycles to include closureStatus
  const migratedCycles: Record<string, CycleState> = {};
  if (oldState.cycles) {
    Object.entries(oldState.cycles).forEach(([cycleId, cycleState]) => {
      migratedCycles[cycleId] = {
        ...cycleState,
        closureStatus: (cycleState as any).closureStatus || "not_started",
      };
    });
  }
  
  // Migrate companies to include onboardingStatus (v4)
  const migratedCompanies: CompanyState[] = (oldState.companies || defaultState.companies).map(company => ({
    ...company,
    onboardingStatus: (company as any).onboardingStatus || "not_started",
  }));
  
  return {
    ...defaultState,
    ...oldState,
    cycles: migratedCycles,
    companies: migratedCompanies,
    dismissedAlerts: oldState.dismissedAlerts || [],
    schemaVersion: SCHEMA_VERSION,
  };
}

// Cycle-specific helpers
export function getCycleState(cycleId: string): CycleState | null {
  const state = getState();
  return state.cycles[cycleId] || null;
}

export function setCycleState(cycleId: string, cycleState: CycleState): void {
  const state = getState();
  setState({
    cycles: { ...state.cycles, [cycleId]: cycleState },
  });
}

// Calculate delayed status for actions based on due date
export function isActionDelayed(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

// Auto-calculate and update action statuses
export function recalculateActionStatuses(): void {
  const state = getState();
  let hasChanges = false;
  
  Object.entries(state.cycles).forEach(([cycleId, cycleState]) => {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled && action.status !== 'completed') {
          const shouldBeDelayed = isActionDelayed(action.dueDate, action.status);
          if (shouldBeDelayed && action.status !== 'delayed') {
            action.status = 'delayed';
            hasChanges = true;
          }
        }
      });
    });
  });
  
  if (hasChanges) {
    setState({ cycles: state.cycles });
  }
}

// Get all actions from all cycles (for indicators)
export function getAllCycleActions(): Array<{
  cycleId: string;
  factorId: string;
  action: CycleFactorAction;
  isDelayed: boolean;
}> {
  const state = getState();
  const actions: Array<{
    cycleId: string;
    factorId: string;
    action: CycleFactorAction;
    isDelayed: boolean;
  }> = [];
  
  Object.entries(state.cycles).forEach(([cycleId, cycleState]) => {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled) {
          actions.push({
            cycleId,
            factorId: factor.id,
            action,
            isDelayed: isActionDelayed(action.dueDate, action.status),
          });
        }
      });
    });
  });
  
  return actions;
}

// Get all delayed actions across all cycles
export function getDelayedActions(): { cycleId: string; factorId: string; action: CycleFactorAction }[] {
  const state = getState();
  const delayed: { cycleId: string; factorId: string; action: CycleFactorAction }[] = [];
  
  Object.entries(state.cycles).forEach(([cycleId, cycleState]) => {
    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled && isActionDelayed(action.dueDate, action.status)) {
          delayed.push({ cycleId, factorId: factor.id, action });
        }
      });
    });
  });
  
  return delayed;
}

// Generate smart alerts based on current state
export function generateSmartAlerts(): SmartAlert[] {
  const state = getState();
  const alerts: SmartAlert[] = [];
  const now = new Date().toISOString();
  
  // 1. Check for delayed actions
  const delayedActions = getDelayedActions();
  delayedActions.forEach((delayed, index) => {
    if (index < 5) { // Limit to 5 delayed action alerts
      alerts.push({
        id: `alert-delayed-${delayed.cycleId}-${delayed.action.id}`,
        type: "delayed_action",
        title: `Ação atrasada no ${delayed.cycleId}`,
        description: `"${delayed.action.id}" está pendente além do prazo`,
        severity: "danger",
        cycleId: delayed.cycleId,
        actionId: delayed.action.id,
        createdAt: now,
        dismissed: state.dismissedAlerts.includes(`alert-delayed-${delayed.cycleId}-${delayed.action.id}`),
        navigateTo: `/ciclos?cycle=${delayed.cycleId}`,
      });
    }
  });
  
  // 2. Check for delayed turmas
  const delayedTurmas = state.turmas.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.endDate) return false;
    const end = new Date(t.endDate);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return end < today;
  });
  
  delayedTurmas.slice(0, 3).forEach(turma => {
    alerts.push({
      id: `alert-turma-delayed-${turma.id}`,
      type: "turma_delayed",
      title: `Turma "${turma.name}" atrasada`,
      description: `A turma do ciclo ${turma.cycleId} passou do prazo de término`,
      severity: "warning",
      cycleId: turma.cycleId,
      turmaId: turma.id,
      createdAt: now,
      dismissed: state.dismissedAlerts.includes(`alert-turma-delayed-${turma.id}`),
      navigateTo: `/turmas?cycle=${turma.cycleId}`,
    });
  });
  
  // 3. Check for cycles ready to close
  CYCLE_IDS.forEach(cycleId => {
    const cycleState = state.cycles[cycleId];
    if (!cycleState || cycleState.closureStatus === 'closed') return;
    
    const cycleActions = getAllCycleActions().filter(a => a.cycleId === cycleId);
    const completedActions = cycleActions.filter(a => a.action.status === 'completed').length;
    const totalActions = cycleActions.length;
    const completionPercent = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
    
    const cycleTurmas = state.turmas.filter(t => t.cycleId === cycleId);
    const completedTurmas = cycleTurmas.filter(t => t.status === 'completed').length;
    
    if (completionPercent >= 80 && completedTurmas >= 1 && cycleState.closureStatus !== 'ready_to_close') {
      alerts.push({
        id: `alert-cycle-ready-${cycleId}`,
        type: "cycle_ready",
        title: `Ciclo ${cycleId} pronto para encerrar`,
        description: `${Math.round(completionPercent)}% das ações concluídas, ${completedTurmas} turma(s) finalizadas`,
        severity: "info",
        cycleId,
        createdAt: now,
        dismissed: state.dismissedAlerts.includes(`alert-cycle-ready-${cycleId}`),
        navigateTo: `/ciclos?cycle=${cycleId}`,
      });
    }
  });
  
  // 4. Check for pending decisions
  const pendingDecisions = state.records.filter(r => 
    r.type === 'decision' && r.status === 'open'
  );
  
  pendingDecisions.slice(0, 3).forEach(decision => {
    alerts.push({
      id: `alert-decision-${decision.id}`,
      type: "decision_pending",
      title: "Decisão pendente",
      description: `"${decision.title}" aguarda resolução`,
      severity: "warning",
      recordId: decision.id,
      cycleId: decision.cycleId || undefined,
      createdAt: now,
      dismissed: state.dismissedAlerts.includes(`alert-decision-${decision.id}`),
      navigateTo: `/registros?type=decision`,
    });
  });
  
  // Filter out dismissed alerts
  return alerts.filter(a => !a.dismissed).sort((a, b) => {
    const priorityOrder = { danger: 0, warning: 1, info: 2 };
    return priorityOrder[a.severity] - priorityOrder[b.severity];
  });
}

// Dismiss an alert
export function dismissAlert(alertId: string): void {
  const state = getState();
  setState({ dismissedAlerts: [...state.dismissedAlerts, alertId] });
}

// Turmas helpers
export function getTurmas(): TurmaState[] {
  return getState().turmas;
}

export function setTurmas(turmas: TurmaState[]): void {
  setState({ turmas });
}

export function addTurma(turma: TurmaState): void {
  const turmas = getTurmas();
  setTurmas([...turmas, turma]);
}

export function updateTurma(turmaId: string, updates: Partial<TurmaState>): void {
  const turmas = getTurmas();
  const updated = turmas.map(t => t.id === turmaId ? { ...t, ...updates } : t);
  setTurmas(updated);
}

export function deleteTurma(turmaId: string): void {
  const turmas = getTurmas();
  setTurmas(turmas.filter(t => t.id !== turmaId));
}

// Records helpers
export function getRecords(): RecordState[] {
  return getState().records;
}

export function setRecords(records: RecordState[]): void {
  setState({ records });
}

export function addRecord(record: RecordState): void {
  const records = getRecords();
  setRecords([...records, record]);
}

export function updateRecord(recordId: string, updates: Partial<RecordState>): void {
  const records = getRecords();
  const updated = records.map(r => r.id === recordId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
  setRecords(updated);
}

export function deleteRecord(recordId: string): void {
  const records = getRecords();
  setRecords(records.filter(r => r.id !== recordId));
}

// Plan Actions helpers
export function getPlanActions(): PlanActionState[] {
  return getState().planActions;
}

export function setPlanActions(actions: PlanActionState[]): void {
  setState({ planActions: actions });
}

// Employees helpers
export function getEmployees(): EmployeeState[] {
  return getState().employees;
}

export function setEmployees(employees: EmployeeState[]): void {
  setState({ employees });
}

// Facilitators helpers
export function getFacilitators(): FacilitatorState[] {
  return getState().facilitators;
}

export function setFacilitators(facilitators: FacilitatorState[]): void {
  setState({ facilitators });
}

export function addFacilitator(facilitator: FacilitatorState): void {
  const facilitators = getFacilitators();
  setFacilitators([...facilitators, facilitator]);
}

// Companies helpers - ALWAYS use global state
export function getCompanies(): CompanyState[] {
  return getGlobalState().companies;
}

export function setCompanies(companies: CompanyState[]): void {
  setGlobalState({ companies });
}

export function addCompany(company: CompanyState): void {
  const companies = getCompanies();
  setCompanies([...companies, company]);
}

// Cycle closure helpers
export function getCycleClosureInfo(cycleId: string): {
  canClose: boolean;
  completionPercent: number;
  completedTurmas: number;
  totalTurmas: number;
  delayedActions: number;
  status: CycleState["closureStatus"];
} {
  const state = getState();
  const cycleState = state.cycles[cycleId];
  
  const cycleActions = getAllCycleActions().filter(a => a.cycleId === cycleId);
  const completedActions = cycleActions.filter(a => a.action.status === 'completed').length;
  const totalActions = cycleActions.length;
  const delayedActions = cycleActions.filter(a => a.isDelayed).length;
  const completionPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  
  const cycleTurmas = state.turmas.filter(t => t.cycleId === cycleId);
  const completedTurmas = cycleTurmas.filter(t => t.status === 'completed').length;
  
  const canClose = completionPercent >= 80 && completedTurmas >= 1;
  
  return {
    canClose,
    completionPercent,
    completedTurmas,
    totalTurmas: cycleTurmas.length,
    delayedActions,
    status: cycleState?.closureStatus || "not_started",
  };
}

export function closeCycle(cycleId: string, notes: string): void {
  const state = getState();
  const cycleState = state.cycles[cycleId];
  
  if (cycleState) {
    setCycleState(cycleId, {
      ...cycleState,
      closureStatus: "closed",
      closedAt: new Date().toISOString(),
      closureNotes: notes,
    });
  }
}

// Reset storage (for debugging)
export function resetStorage(): void {
  localStorage.removeItem(GLOBAL_STORAGE_KEY);
}