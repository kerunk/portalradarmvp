// Report Data Aggregation Layer
// Collects real data from all modules for report generation

import { getPopulation, getPopulationStats, getNucleoMembers, getFacilitators, type PopulationMember } from './companyStorage';
import { getState, type TurmaState } from './storage';
import { obterIndicadoresGlobais, obterIndicadoresTodosCiclos, obterGovernancaDeCiclo, type CycleIndicators } from './governance';
import { CYCLE_IDS } from './constants';
import { mvpCycles } from '@/data/mvpCycles';

// ============ TYPES ============

export interface ReportFilters {
  cycleId?: string;
  sector?: string;
  facilitator?: string;
  turmaId?: string;
}

export interface ExecutiveReportData {
  companyName: string;
  generatedAt: string;
  period: string;
  // Population
  populationTotal: number;
  activePop: number;
  leaders: number;
  facilitators: number;
  nucleoCount: number;
  sectors: number;
  units: number;
  // Training
  turmasTotal: number;
  turmasRealizadas: number;
  pessoasTreinadas: number;
  totalPresences: number;
  coveragePercent: number;
  // Execution
  totalActions: number;
  completedActions: number;
  inProgressActions: number;
  delayedActions: number;
  pendingActions: number;
  completionPercent: number;
  decisionConversionRate: number;
  // Cycles
  totalCycles: number;
  closedCycles: number;
  cyclesInProgress: number;
  cyclesReadyToClose: number;
  currentPhase: string;
  // Maturity
  maturityScore: number;
  maturityLevel: string;
  // Population by sector
  populationBySector: { sector: string; count: number; trained: number }[];
  // Cycle details
  cycleDetails: CycleIndicators[];
  // Insights
  insights: ReportInsight[];
}

export interface TurmaReportData {
  turmas: TurmaReportItem[];
  totalParticipants: number;
  totalPresences: number;
  totalAbsences: number;
  totalReschedules: number;
}

export interface TurmaReportItem {
  id: string;
  name: string;
  cycleId: string;
  facilitator: string;
  trainingDate: string | null;
  status: string;
  participantCount: number;
  presentCount: number;
  absentCount: number;
  rescheduleCount: number;
  participants: { name: string; sector: string; role: string; shift: string; attendance: string }[];
}

export interface NucleoReportData {
  members: NucleoReportMember[];
  totalMembers: number;
  membersWithActions: number;
  totalActionsAssigned: number;
  completedActions: number;
}

export interface NucleoReportMember {
  name: string;
  sector: string;
  role: string;
  actionsAssigned: number;
  actionsCompleted: number;
  actionsDelayed: number;
}

export interface CoverageReportData {
  totalPopulation: number;
  trainedCount: number;
  notTrainedCount: number;
  coveragePercent: number;
  byCycle: { cycleId: string; trained: number; percent: number }[];
  bySector: { sector: string; total: number; trained: number; percent: number }[];
  trainedList: { name: string; sector: string; role: string; cycles: string[] }[];
  notTrainedList: { name: string; sector: string; role: string }[];
}

export interface CycleReportData {
  cycleId: string;
  title: string;
  phaseName: string;
  status: string;
  totalActions: number;
  completedActions: number;
  delayedActions: number;
  completionPercent: number;
  turmasTotal: number;
  turmasCompleted: number;
  actions: { title: string; factorName: string; status: string; responsible: string; dueDate: string | null; observation: string }[];
  decisions: { title: string; date: string; status: string }[];
}

export interface ReportInsight {
  type: 'positive' | 'warning' | 'reinforcement';
  message: string;
}

// ============ DATA COLLECTION ============

function getTrainedIds(companyId: string): { trainedIds: Set<string>; trainedByCycle: Record<string, Set<string>> } {
  const state = getState();
  const trainedIds = new Set<string>();
  const trainedByCycle: Record<string, Set<string>> = {};

  state.turmas.forEach(t => {
    if (!trainedByCycle[t.cycleId]) trainedByCycle[t.cycleId] = new Set();
    if (t.attendance) {
      Object.entries(t.attendance).forEach(([id, status]) => {
        if (status === 'present') {
          trainedIds.add(id);
          trainedByCycle[t.cycleId].add(id);
        }
      });
    }
  });

  return { trainedIds, trainedByCycle };
}

function calculateMaturity(popStats: ReturnType<typeof getPopulationStats>, globalInd: ReturnType<typeof obterIndicadoresGlobais>, coveragePercent: number): { score: number; level: string } {
  const popScore = popStats.total > 0 ? 15 : 0;
  const nucleoScore = popStats.nucleoCount > 0 ? 10 : 0;
  const facScore = popStats.facilitators > 0 ? 5 : 0;
  const cycleScore = Math.min(30, (globalInd.closedCycles / globalInd.totalCycles) * 30);
  const actionScore = Math.min(25, (globalInd.overallCompletionPercent / 100) * 25);
  const coverageScore = Math.min(15, (coveragePercent / 100) * 15);
  const score = Math.round(popScore + nucleoScore + facScore + cycleScore + actionScore + coverageScore);

  let level = 'Inicial';
  if (score >= 80) level = 'Sustentado';
  else if (score >= 60) level = 'Consolidado';
  else if (score >= 40) level = 'Em desenvolvimento';
  else if (score >= 20) level = 'Estruturando';

  return { score, level };
}

function generateInsights(data: {
  coveragePercent: number;
  completionPercent: number;
  delayedActions: number;
  closedCycles: number;
  turmasRealizadas: number;
  nucleoCount: number;
  facilitators: number;
  totalActions: number;
}): ReportInsight[] {
  const insights: ReportInsight[] = [];

  if (data.coveragePercent >= 60) {
    insights.push({ type: 'positive', message: 'Boa evolução na cobertura do programa. A participação dos colaboradores está aumentando consistentemente.' });
  } else if (data.coveragePercent < 30 && data.coveragePercent > 0) {
    insights.push({ type: 'warning', message: 'A cobertura do programa está abaixo de 30%. Considere intensificar os treinamentos para aumentar o alcance.' });
  }

  if (data.completionPercent >= 70) {
    insights.push({ type: 'positive', message: `Excelente taxa de execução: ${data.completionPercent}% das ações concluídas. O programa está avançando com consistência.` });
  }

  if (data.delayedActions > 3) {
    insights.push({ type: 'warning', message: `Existem ${data.delayedActions} ações atrasadas. Isso pode comprometer o engajamento e a credibilidade do programa.` });
  }

  if (data.closedCycles > 0) {
    insights.push({ type: 'positive', message: `${data.closedCycles} ciclo(s) já encerrado(s) com sucesso. A progressão metodológica está em andamento.` });
  }

  if (data.turmasRealizadas === 0 && data.totalActions > 0) {
    insights.push({ type: 'warning', message: 'Nenhuma turma de treinamento foi realizada ainda. Os treinamentos são fundamentais para a consolidação do programa.' });
  }

  if (data.nucleoCount === 0) {
    insights.push({ type: 'warning', message: 'O Núcleo de Sustentação ainda não foi constituído. Defina os integrantes para garantir a governança do programa.' });
  }

  if (data.facilitators === 0) {
    insights.push({ type: 'warning', message: 'Nenhum facilitador habilitado. Identifique e habilite facilitadores na base populacional.' });
  }

  insights.push({ type: 'reinforcement', message: 'A repetição de práticas é essencial para consolidar novos hábitos de segurança. Mantenha a disciplina nos rituais e treinamentos.' });

  return insights;
}

// ============ REPORT GENERATORS ============

export function generateExecutiveReport(companyId: string, companyName: string): ExecutiveReportData {
  const popStats = getPopulationStats(companyId);
  const population = getPopulation(companyId);
  const globalInd = obterIndicadoresGlobais();
  const cycleDetails = obterIndicadoresTodosCiclos();
  const state = getState();
  const { trainedIds, trainedByCycle } = getTrainedIds(companyId);

  const activePop = population.filter(m => m.active);
  const coveragePercent = activePop.length > 0 ? Math.round((trainedIds.size / activePop.length) * 100) : 0;
  const maturity = calculateMaturity(popStats, globalInd, coveragePercent);

  // Turma stats
  const turmasRealizadas = state.turmas.filter(t => t.status === 'completed').length;
  const totalPresences = state.turmas.reduce((sum, t) => {
    if (!t.attendance) return sum;
    return sum + Object.values(t.attendance).filter(s => s === 'present').length;
  }, 0);

  // Current phase
  let currentPhase = 'Monitorar';
  const lastActive = cycleDetails.filter(c => c.status !== 'pending').pop();
  if (lastActive) {
    currentPhase = lastActive.phaseName;
  }

  // Population by sector
  const sectorMap: Record<string, { count: number; trained: number }> = {};
  activePop.forEach(m => {
    const sector = m.sector || 'Sem setor';
    if (!sectorMap[sector]) sectorMap[sector] = { count: 0, trained: 0 };
    sectorMap[sector].count++;
    if (trainedIds.has(m.id)) sectorMap[sector].trained++;
  });
  const populationBySector = Object.entries(sectorMap).map(([sector, data]) => ({ sector, ...data }));

  const insights = generateInsights({
    coveragePercent,
    completionPercent: globalInd.overallCompletionPercent,
    delayedActions: globalInd.delayedActions,
    closedCycles: globalInd.closedCycles,
    turmasRealizadas,
    nucleoCount: popStats.nucleoCount,
    facilitators: popStats.facilitators,
    totalActions: globalInd.totalActions,
  });

  return {
    companyName,
    generatedAt: new Date().toISOString(),
    period: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    populationTotal: population.length,
    activePop: activePop.length,
    leaders: popStats.leaders,
    facilitators: popStats.facilitators,
    nucleoCount: popStats.nucleoCount,
    sectors: popStats.sectors,
    units: popStats.units,
    turmasTotal: state.turmas.length,
    turmasRealizadas,
    pessoasTreinadas: trainedIds.size,
    totalPresences,
    coveragePercent,
    totalActions: globalInd.totalActions,
    completedActions: globalInd.completedActions,
    inProgressActions: globalInd.inProgressActions,
    delayedActions: globalInd.delayedActions,
    pendingActions: globalInd.pendingActions,
    completionPercent: globalInd.overallCompletionPercent,
    decisionConversionRate: globalInd.decisionConversionRate,
    totalCycles: globalInd.totalCycles,
    closedCycles: globalInd.closedCycles,
    cyclesInProgress: globalInd.cyclesInProgress,
    cyclesReadyToClose: globalInd.cyclesReadyToClose,
    currentPhase,
    maturityScore: maturity.score,
    maturityLevel: maturity.level,
    populationBySector,
    cycleDetails,
    insights,
  };
}

export function generateTurmaReport(companyId: string, filters?: ReportFilters): TurmaReportData {
  const state = getState();
  const population = getPopulation(companyId);
  let turmas = state.turmas;

  if (filters?.cycleId) turmas = turmas.filter(t => t.cycleId === filters.cycleId);
  if (filters?.facilitator) turmas = turmas.filter(t => t.facilitator === filters.facilitator);
  if (filters?.turmaId) turmas = turmas.filter(t => t.id === filters.turmaId);

  let totalPresences = 0, totalAbsences = 0, totalReschedules = 0;

  const items: TurmaReportItem[] = turmas.map(t => {
    let present = 0, absent = 0, reschedule = 0;
    const participants = t.participants.map(p => {
      const pop = population.find(m => m.id === p.id);
      const att = t.attendance?.[p.id] || 'N/A';
      if (att === 'present') { present++; totalPresences++; }
      if (att === 'absent') { absent++; totalAbsences++; }
      if (att === 'reschedule') { reschedule++; totalReschedules++; }
      return {
        name: p.name,
        sector: pop?.sector || p.sector,
        role: pop?.role || p.role,
        shift: pop?.shift || '',
        attendance: att === 'present' ? 'Presente' : att === 'absent' ? 'Faltou' : att === 'reschedule' ? 'Remarcar' : 'N/A',
      };
    });

    return {
      id: t.id,
      name: t.name,
      cycleId: t.cycleId,
      facilitator: t.facilitator,
      trainingDate: t.trainingDate || t.startDate,
      status: t.status,
      participantCount: t.participants.length,
      presentCount: present,
      absentCount: absent,
      rescheduleCount: reschedule,
      participants,
    };
  });

  return {
    turmas: items,
    totalParticipants: items.reduce((s, t) => s + t.participantCount, 0),
    totalPresences,
    totalAbsences,
    totalReschedules,
  };
}

export function generateNucleoReport(companyId: string): NucleoReportData {
  const nucleoMembers = getNucleoMembers(companyId);
  const state = getState();

  const members: NucleoReportMember[] = nucleoMembers.map(m => {
    let assigned = 0, completed = 0, delayed = 0;
    Object.values(state.cycles).forEach(cycleState => {
      cycleState.factors.forEach(factor => {
        factor.actions.forEach(action => {
          if (action.enabled && action.responsible === m.name) {
            assigned++;
            if (action.status === 'completed') completed++;
            if (action.status === 'delayed') delayed++;
          }
        });
      });
    });
    return { name: m.name, sector: m.sector, role: m.role, actionsAssigned: assigned, actionsCompleted: completed, actionsDelayed: delayed };
  });

  return {
    members,
    totalMembers: members.length,
    membersWithActions: members.filter(m => m.actionsAssigned > 0).length,
    totalActionsAssigned: members.reduce((s, m) => s + m.actionsAssigned, 0),
    completedActions: members.reduce((s, m) => s + m.actionsCompleted, 0),
  };
}

export function generateCoverageReport(companyId: string): CoverageReportData {
  const population = getPopulation(companyId).filter(m => m.active);
  const state = getState();
  const { trainedIds, trainedByCycle } = getTrainedIds(companyId);

  const byCycle = CYCLE_IDS.map(cycleId => {
    const trained = trainedByCycle[cycleId]?.size || 0;
    return { cycleId, trained, percent: population.length > 0 ? Math.round((trained / population.length) * 100) : 0 };
  }).filter(c => c.trained > 0);

  const sectorMap: Record<string, { total: number; trained: number }> = {};
  population.forEach(m => {
    const sector = m.sector || 'Sem setor';
    if (!sectorMap[sector]) sectorMap[sector] = { total: 0, trained: 0 };
    sectorMap[sector].total++;
    if (trainedIds.has(m.id)) sectorMap[sector].trained++;
  });
  const bySector = Object.entries(sectorMap).map(([sector, d]) => ({
    sector, total: d.total, trained: d.trained, percent: d.total > 0 ? Math.round((d.trained / d.total) * 100) : 0,
  }));

  // Build trained/not trained lists
  const trainedList = population.filter(m => trainedIds.has(m.id)).map(m => {
    const cycles: string[] = [];
    Object.entries(trainedByCycle).forEach(([cycleId, ids]) => { if (ids.has(m.id)) cycles.push(cycleId); });
    return { name: m.name, sector: m.sector, role: m.role, cycles };
  });
  const notTrainedList = population.filter(m => !trainedIds.has(m.id)).map(m => ({ name: m.name, sector: m.sector, role: m.role }));

  return {
    totalPopulation: population.length,
    trainedCount: trainedIds.size,
    notTrainedCount: population.length - trainedIds.size,
    coveragePercent: population.length > 0 ? Math.round((trainedIds.size / population.length) * 100) : 0,
    byCycle,
    bySector,
    trainedList,
    notTrainedList,
  };
}

export function generateCycleReport(cycleId: string): CycleReportData {
  const state = getState();
  const cycleState = state.cycles[cycleId];
  const cycleDef = mvpCycles.find(c => c.id === cycleId);
  const governance = obterGovernancaDeCiclo(cycleId);

  const actions: CycleReportData['actions'] = [];
  if (cycleState) {
    cycleState.factors.forEach(factor => {
      const factorDef = cycleDef?.successFactors.find(f => f.id === factor.id);
      factor.actions.forEach(action => {
        if (action.enabled) {
          const actionDef = factorDef?.actions.find(a => a.id === action.id);
          actions.push({
            title: actionDef?.title || action.id,
            factorName: factorDef?.name || factor.id,
            status: action.status,
            responsible: action.responsible || 'N/A',
            dueDate: action.dueDate,
            observation: action.observation || '',
          });
        }
      });
    });
  }

  const cycleRecords = state.records.filter(r => r.cycleId === cycleId && r.type === 'decision');
  const decisions = cycleRecords.map(r => ({ title: r.title, date: r.date, status: r.status }));

  const completedActions = actions.filter(a => a.status === 'completed').length;
  const delayedActions = actions.filter(a => a.status === 'delayed').length;

  return {
    cycleId,
    title: cycleDef?.title || cycleId,
    phaseName: cycleDef?.phaseName || 'MVP',
    status: governance.status,
    totalActions: actions.length,
    completedActions,
    delayedActions,
    completionPercent: actions.length > 0 ? Math.round((completedActions / actions.length) * 100) : 0,
    turmasTotal: state.turmas.filter(t => t.cycleId === cycleId).length,
    turmasCompleted: state.turmas.filter(t => t.cycleId === cycleId && t.status === 'completed').length,
    actions,
    decisions,
  };
}

// ============ AVAILABLE FILTERS ============

export function getAvailableFilters(companyId: string) {
  const state = getState();
  const population = getPopulation(companyId);

  const sectors = [...new Set(population.filter(m => m.active && m.sector).map(m => m.sector))].sort();
  const facilitators = [...new Set(state.turmas.map(t => t.facilitator).filter(Boolean))].sort();
  const cycles = CYCLE_IDS.map(id => {
    const def = mvpCycles.find(c => c.id === id);
    return { id, label: `${id} - ${def?.phaseName || ''}` };
  });
  const turmas = state.turmas.map(t => ({ id: t.id, label: t.name }));

  return { sectors, facilitators, cycles, turmas };
}
