// MVP Portal Storage Layer
// Unified localStorage persistence with versioning

const STORAGE_KEY = 'mvp_portal_data';
const SCHEMA_VERSION = 1;

// Types for stored data
export interface CycleFactorAction {
  id: string;
  enabled: boolean;
  disabledReason: string;
  responsible: string;
  dueDate: string | null;
  status: "pending" | "in_progress" | "completed" | "delayed";
  observation: string;
}

export interface CycleFactorState {
  id: string;
  actions: CycleFactorAction[];
}

export interface CycleState {
  factors: CycleFactorState[];
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
}

export interface RecordState {
  id: string;
  companyId: string;
  date: string;
  cycleId: string | null;
  type: "meeting" | "decision" | "observation" | "risk" | "communication";
  status: "open" | "in_progress" | "closed";
  title: string;
  description: string;
  owner: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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
}

// Default initial state
const getDefaultState = (): PortalState => ({
  schemaVersion: SCHEMA_VERSION,
  cycles: {},
  turmas: [],
  records: [],
  planActions: [],
  employees: getDefaultEmployees(),
  facilitators: getDefaultFacilitators(),
  companies: getDefaultCompanies(),
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
    },
  ];
}

// Get full state
export function getState(): PortalState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultState = getDefaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    
    const parsed = JSON.parse(stored) as PortalState;
    
    // Handle schema migration if needed
    if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
      const migrated = migrateState(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading state from localStorage:', error);
    return getDefaultState();
  }
}

// Update state (partial update)
export function setState(partialUpdate: Partial<PortalState>): void {
  try {
    const current = getState();
    const updated = { ...current, ...partialUpdate };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
}

// Migrate state from older versions
function migrateState(oldState: Partial<PortalState>): PortalState {
  const defaultState = getDefaultState();
  return {
    ...defaultState,
    ...oldState,
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

// Companies helpers
export function getCompanies(): CompanyState[] {
  return getState().companies;
}

export function setCompanies(companies: CompanyState[]): void {
  setState({ companies });
}

export function addCompany(company: CompanyState): void {
  const companies = getCompanies();
  setCompanies([...companies, company]);
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

// Reset storage (for debugging)
export function resetStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
