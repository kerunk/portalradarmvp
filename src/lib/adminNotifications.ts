// Admin Strategic Notifications
// Generates risk, opportunity, and milestone notifications for the admin portfolio view

import { getCompanies, getState, setActiveCompany, type CompanyState } from './storage';
import { CYCLE_IDS } from './constants';
import { mvpCycles } from '@/data/mvpCycles';
import { getActiveOperationalEvents, type OperationalEvent } from './operationalEvents';

export type AdminNotificationPriority = 'critical' | 'warning' | 'insight';
export type AdminNotificationType = 'risk' | 'opportunity' | 'milestone';

export interface AdminNotification {
  id: string;
  priority: AdminNotificationPriority;
  type: AdminNotificationType;
  title: string;
  message: string;
  companyId?: string;
  companyName?: string;
  navigateTo?: string;
  time: string;
}

const DISMISSED_KEY = 'mvp_admin_notifications_dismissed';

export function getDismissedAdmin(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch { return []; }
}

export function dismissAdminNotification(id: string) {
  const dismissed = getDismissedAdmin();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

export function dismissAllAdminNotifications(ids: string[]) {
  const dismissed = getDismissedAdmin();
  const newDismissed = [...new Set([...dismissed, ...ids])];
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(newDismissed));
}

export interface CompanyRiskData {
  company: CompanyState;
  delayedActions: number;
  totalActions: number;
  completedActions: number;
  activeTurmas: number;
  totalTurmas: number;
  totalEmployees: number;
  trainedCount: number;
  closedCycles: number;
  cyclesInProgress: number;
  maturityScore: number;
  lastActivityDays: number | null;
}

export function getCompanyRiskData(company: CompanyState): CompanyRiskData {
  setActiveCompany(company.id);
  const state = getState();

  let totalActions = 0;
  let completedActions = 0;
  let delayedActions = 0;
  let closedCycles = 0;
  let cyclesInProgress = 0;
  let latestActivity: Date | null = null;

  Object.entries(state.cycles).forEach(([_, cycleState]) => {
    if (cycleState.closureStatus === 'closed') closedCycles++;
    else if (cycleState.factors.some(f => f.actions.some(a => a.enabled))) cyclesInProgress++;

    cycleState.factors.forEach(factor => {
      factor.actions.forEach(action => {
        if (action.enabled) {
          totalActions++;
          if (action.status === 'completed') completedActions++;
          if (action.status === 'delayed') delayedActions++;
          if (action.dueDate && action.status !== 'completed') {
            const due = new Date(action.dueDate);
            due.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (due < today) delayedActions = Math.max(delayedActions, delayedActions); // already counted
          }
        }
        if (action.updatedAt) {
          const d = new Date(action.updatedAt);
          if (!latestActivity || d > latestActivity) latestActivity = d;
        }
      });
    });
  });

  const totalTurmas = state.turmas.length;
  const activeTurmas = state.turmas.filter(t => t.status === 'in_progress' || t.status === 'planned').length;

  // Coverage
  const totalEmployees = state.employees.length;
  const trainedIds = new Set<string>();
  state.turmas.forEach(t => {
    if (t.attendance) {
      Object.entries(t.attendance).forEach(([id, status]) => {
        if (status === 'present') trainedIds.add(id);
      });
    }
  });

  const maturityScore = Math.min(100, Math.round(
    (totalEmployees > 0 ? 15 : 0) +
    (closedCycles * 10) +
    (totalActions > 0 ? (completedActions / totalActions) * 40 : 0) +
    (totalTurmas > 0 ? Math.min(20, totalTurmas * 5) : 0)
  ));

  let lastActivityDays: number | null = null;
  if (latestActivity) {
    lastActivityDays = Math.ceil((Date.now() - (latestActivity as Date).getTime()) / (1000 * 60 * 60 * 24));
  }

  setActiveCompany(null);

  return {
    company,
    delayedActions,
    totalActions,
    completedActions,
    activeTurmas,
    totalTurmas,
    totalEmployees,
    trainedCount: trainedIds.size,
    closedCycles,
    cyclesInProgress,
    maturityScore,
    lastActivityDays,
  };
}

export function generateAdminNotifications(filterEmail?: string, filterRole?: string): AdminNotification[] {
  let companies = getCompanies().filter(c => c.active !== false && !c.deleted);
  const dismissed = getDismissedAdmin();
  const notifications: AdminNotification[] = [];

  // Filter companies for gerente_conta
  if (filterRole === "gerente_conta" && filterEmail) {
    companies = companies.filter(c => c.ownerEmail?.toLowerCase() === filterEmail.toLowerCase());
  }

  const companyDataList = companies.map(c => getCompanyRiskData(c));
  const companyIds = new Set(companies.map(c => c.id));

  for (const data of companyDataList) {
    const { company } = data;

    // ── RISK: Delayed actions ──
    if (data.delayedActions > 0) {
      const id = `risk-delayed-${company.id}-${data.delayedActions}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: data.delayedActions >= 3 ? 'critical' : 'warning',
          type: 'risk',
          title: 'Ações atrasadas',
          message: `${company.name} possui ${data.delayedActions} ${data.delayedActions === 1 ? 'ação atrasada' : 'ações atrasadas'}.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/ciclos`,
          time: 'Agora',
        });
      }
    }

    // ── RISK: No active turmas ──
    if (data.activeTurmas === 0 && company.onboardingStatus === 'completed' && data.cyclesInProgress > 0) {
      const id = `risk-no-turmas-${company.id}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: 'warning',
          type: 'risk',
          title: 'Sem turmas ativas',
          message: `${company.name} possui ciclos em andamento mas nenhuma turma ativa.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/turmas`,
          time: 'Atenção',
        });
      }
    }

    // ── RISK: Low coverage (<10%) ──
    const coverage = data.totalEmployees > 0 ? Math.round((data.trainedCount / data.totalEmployees) * 100) : 0;
    if (coverage < 10 && data.totalEmployees > 0 && company.onboardingStatus === 'completed') {
      const id = `risk-low-coverage-${company.id}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: coverage === 0 ? 'critical' : 'warning',
          type: 'risk',
          title: 'Cobertura de treinamento crítica',
          message: `Cobertura de treinamento da ${company.name} está em ${coverage}%.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/turmas`,
          time: 'Atenção',
        });
      }
    }

    // ── RISK: Low engagement (few actions executed) ──
    if (data.totalActions > 0 && data.completedActions === 0 && data.cyclesInProgress > 0) {
      const id = `risk-low-engagement-${company.id}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: 'warning',
          type: 'risk',
          title: 'Baixo engajamento',
          message: `${company.name} possui ${data.totalActions} ações habilitadas mas nenhuma concluída.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/ciclos`,
          time: 'Atenção',
        });
      }
    }

    // ── OPPORTUNITY: Very low maturity ──
    if (data.maturityScore < 20 && company.onboardingStatus === 'completed') {
      const id = `opp-low-maturity-${company.id}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: 'insight',
          type: 'opportunity',
          title: 'Maturidade muito baixa',
          message: `${company.name} está com índice de maturidade em ${data.maturityScore}%. Considere uma intervenção.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/empresas`,
          time: 'Insight',
        });
      }
    }

    // ── MILESTONE: Company started program ──
    if (company.onboardingStatus === 'in_progress') {
      const id = `milestone-started-${company.id}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: 'insight',
          type: 'milestone',
          title: 'Nova empresa iniciando programa',
          message: `${company.name} está em processo de onboarding.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/empresas`,
          time: 'Marco',
        });
      }
    }

    // ── MILESTONE: Company completed a cycle ──
    if (data.closedCycles > 0) {
      const id = `milestone-cycles-${company.id}-${data.closedCycles}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: 'insight',
          type: 'milestone',
          title: 'Ciclo concluído',
          message: `${company.name} concluiu ${data.closedCycles} ${data.closedCycles === 1 ? 'ciclo' : 'ciclos'} MVP.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/ciclos`,
          time: 'Marco',
        });
      }
    }

    // ── MILESTONE: Company reached new maturity level ──
    if (data.maturityScore >= 76) {
      const id = `milestone-maturity-high-${company.id}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: 'insight',
          type: 'milestone',
          title: 'Maturidade consolidada',
          message: `${company.name} alcançou nível "Consolidando" com ${data.maturityScore}% de maturidade.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/empresas`,
          time: 'Marco',
        });
      }
    } else if (data.maturityScore >= 51) {
      const id = `milestone-maturity-mid-${company.id}`;
      if (!dismissed.includes(id)) {
        notifications.push({
          id,
          priority: 'insight',
          type: 'milestone',
          title: 'Evolução de maturidade',
          message: `${company.name} alcançou nível "Evoluindo" com ${data.maturityScore}% de maturidade.`,
          companyId: company.id,
          companyName: company.name,
          navigateTo: `/empresas`,
          time: 'Marco',
        });
      }
    }
  }

  // ── OPERATIONAL EVENTS (company_created, manager_changed, etc.) ──
  const opEvents = getActiveOperationalEvents();
  opEvents.forEach(evt => {
    // Filter: gerente_conta only sees events for their own companies
    if (filterRole === "gerente_conta" && evt.companyId && !companyIds.has(evt.companyId)) {
      return;
    }
    const id = `op-${evt.id}`;
    if (!dismissed.includes(id)) {
      notifications.push({
        id,
        priority: 'insight',
        type: 'milestone',
        title: evt.title,
        message: evt.message,
        companyId: evt.companyId,
        companyName: evt.companyName,
        navigateTo: evt.companyId ? `/empresas/${evt.companyId}` : `/empresas`,
        time: new Date(evt.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      });
    }
  });

  // Sort: critical → warning → insight
  const priorityOrder = { critical: 0, warning: 1, insight: 2 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return notifications;
}
