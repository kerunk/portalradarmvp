// Global Success Factors Persistence & Replication Layer
// Stores Admin Master overrides to the default mvpCycles success factors
// and cascades structural changes to company-scoped storage

import { mvpCycles, type MVPSuccessFactor, type MVPSuggestedAction } from '@/data/mvpCycles';
import { getCompanies, setActiveCompany, getState, setState } from './storage';

const STORAGE_KEY = 'mvp_global_success_factors';

// What we persist: per-cycle overrides of success factors
export interface GlobalFactorOverride {
  id: string; // factor id (communication, structure, etc.)
  actions: MVPSuggestedAction[];
}

export interface GlobalCycleOverrides {
  [cycleId: string]: GlobalFactorOverride[];
}

// ─── Read ────────────────────────────────────────────────────

function loadOverrides(): GlobalCycleOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(data: GlobalCycleOverrides): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to persist global success factors:', err);
    return false;
  }
}

/**
 * Returns the effective success factors for a given cycle,
 * merging defaults from mvpCycles with any Admin Master overrides.
 */
export function getEffectiveSuccessFactors(cycleId: string): MVPSuccessFactor[] {
  const cycle = mvpCycles.find(c => c.id === cycleId);
  if (!cycle) return [];

  const overrides = loadOverrides();
  const cycleOverrides = overrides[cycleId];

  if (!cycleOverrides || cycleOverrides.length === 0) {
    return cycle.successFactors;
  }

  // Merge: use overridden actions if available, otherwise default
  return cycle.successFactors.map(factor => {
    const override = cycleOverrides.find(o => o.id === factor.id);
    if (override) {
      return { ...factor, actions: override.actions };
    }
    return factor;
  });
}

// ─── Write ───────────────────────────────────────────────────

/**
 * Save an updated action within a factor for a cycle.
 * Returns true if persistence succeeded.
 */
export function saveGlobalAction(
  cycleId: string,
  factorId: string,
  actionId: string | null, // null = create new
  data: { title: string; description?: string; bestPractice: string; imageUrl?: string }
): { success: boolean; newActionId?: string } {
  const factors = getEffectiveSuccessFactors(cycleId);
  const factor = factors.find(f => f.id === factorId);
  if (!factor) return { success: false };

  let newActionId: string | undefined;
  let updatedActions: MVPSuggestedAction[];

  if (actionId) {
    // Update existing
    updatedActions = factor.actions.map(a =>
      a.id === actionId ? { ...a, title: data.title, description: data.description, bestPractice: data.bestPractice, imageUrl: data.imageUrl } : a
    );
  } else {
    // Create new
    newActionId = `${factorId}-custom-${Date.now()}`;
    updatedActions = [
      ...factor.actions,
      { id: newActionId, title: data.title, description: data.description, bestPractice: data.bestPractice },
    ];
  }

  const overrides = loadOverrides();
  const cycleOverrides = overrides[cycleId] || factors.map(f => ({ id: f.id, actions: f.actions }));

  const updatedCycleOverrides = cycleOverrides.map(o =>
    o.id === factorId ? { ...o, actions: updatedActions } : o
  );

  // If factorId wasn't in overrides yet, add it
  if (!updatedCycleOverrides.find(o => o.id === factorId)) {
    updatedCycleOverrides.push({ id: factorId, actions: updatedActions });
  }

  overrides[cycleId] = updatedCycleOverrides;
  const saved = saveOverrides(overrides);
  
  return { success: saved, newActionId };
}

/**
 * Delete an action from the global structure.
 * Returns true if persistence succeeded.
 */
export function deleteGlobalAction(cycleId: string, factorId: string, actionId: string): boolean {
  const factors = getEffectiveSuccessFactors(cycleId);
  const factor = factors.find(f => f.id === factorId);
  if (!factor) return false;

  const updatedActions = factor.actions.filter(a => a.id !== actionId);
  const overrides = loadOverrides();
  const cycleOverrides = overrides[cycleId] || factors.map(f => ({ id: f.id, actions: f.actions }));

  overrides[cycleId] = cycleOverrides.map(o =>
    o.id === factorId ? { ...o, actions: updatedActions } : o
  );

  return saveOverrides(overrides);
}

// ─── Replication ─────────────────────────────────────────────

/**
 * Cascades global structural changes to all company-scoped storage.
 * Non-destructive: preserves client operational data (status, responsible, dates, etc.)
 * Only updates structural fields (title) and adds new actions.
 */
export function replicateToCompanies(cycleId: string): { updated: number; failed: number } {
  const companies = getCompanies();
  const activeCompanies = companies.filter(c => c.active !== false && c.deleted !== true);
  const globalFactors = getEffectiveSuccessFactors(cycleId);

  let updated = 0;
  let failed = 0;

  // Save current active company to restore later
  const previousActive = (() => {
    try {
      // We need to peek at the current _activeCompanyId 
      // but it's module-private, so we work around it
      return null;
    } catch {
      return null;
    }
  })();

  for (const company of activeCompanies) {
    try {
      // Switch context to this company
      setActiveCompany(company.id);
      const companyState = getState();
      const cycleState = companyState.cycles[cycleId];

      if (!cycleState) {
        // Company hasn't started this cycle yet — skip, they'll get the latest on init
        continue;
      }

      // Non-destructive merge
      const updatedFactors = cycleState.factors.map(factorState => {
        const globalFactor = globalFactors.find(gf => gf.id === factorState.id);
        if (!globalFactor) return factorState;

        // Update existing action titles (preserve operational fields)
        const updatedActions = factorState.actions.map(action => {
          const globalAction = globalFactor.actions.find(ga => ga.id === action.id);
          if (globalAction && action.title !== globalAction.title) {
            return { ...action, title: globalAction.title };
          }
          return action;
        });

        // Add new actions that don't exist yet in the company
        const existingIds = new Set(updatedActions.map(a => a.id));
        const newActions = globalFactor.actions
          .filter(ga => !existingIds.has(ga.id))
          .map(ga => ({
            id: ga.id,
            title: ga.title,
            enabled: true,
            disabledReason: '',
            responsible: '',
            dueDate: null,
            status: 'pending' as const,
            observation: '',
            createdAt: new Date().toISOString(),
          }));

        return {
          ...factorState,
          actions: [...updatedActions, ...newActions],
        };
      });

      setState({
        cycles: {
          ...companyState.cycles,
          [cycleId]: { ...cycleState, factors: updatedFactors },
        },
      });

      updated++;
    } catch (err) {
      console.error(`Failed to replicate to company ${company.id}:`, err);
      failed++;
    }
  }

  // Reset to global context
  setActiveCompany(null);

  return { updated, failed };
}
