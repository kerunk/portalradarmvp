/**
 * Supabase Data Service — Single source of truth for all operational data.
 * Replaces localStorage-based storage.ts and companyStorage.ts.
 */

import { supabase as typedSupabase } from "@/integrations/supabase/client";

// Use an untyped reference for new tables not yet in the generated types
const supabase = typedSupabase as any;

// ============================================================
// TYPES
// ============================================================

export interface PopulationMemberDB {
  id: string;
  company_id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
  unit: string;
  shift: string;
  admission_date: string;
  facilitator: boolean;
  nucleo: boolean;
  leadership: boolean;
  active: boolean;
}

export interface TurmaDB {
  id: string;
  company_id: string;
  name: string;
  cycle_id: string;
  facilitator: string;
  start_date: string | null;
  end_date: string | null;
  training_date: string | null;
  status: "planned" | "in_progress" | "completed" | "delayed";
  notes: string;
  // Joined data (not in DB directly)
  participants?: TurmaParticipantDB[];
  attendance?: Record<string, "present" | "absent" | "reschedule">;
}

export interface TurmaParticipantDB {
  id: string;
  turma_id: string;
  member_id: string | null;
  name: string;
  sector: string;
  role: string;
}

export interface CycleStateDB {
  id: string;
  company_id: string;
  cycle_id: string;
  closure_status: "not_started" | "in_progress" | "ready_to_close" | "closed";
  start_date: string | null;
  planned_end_date: string | null;
  closed_at: string | null;
  closure_notes: string;
  locked_for_editing: boolean;
}

export interface CycleActionDB {
  id: string;
  company_id: string;
  cycle_id: string;
  factor_id: string;
  action_id: string;
  title: string;
  enabled: boolean;
  disabled_reason: string;
  responsible: string;
  due_date: string | null;
  status: "pending" | "in_progress" | "completed" | "delayed";
  observation: string;
  source_decision_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordDB {
  id: string;
  company_id: string;
  date: string;
  cycle_id: string | null;
  factor_id: string | null;
  type: "meeting" | "decision" | "observation" | "risk" | "communication" | "validation";
  status: "open" | "in_progress" | "closed";
  title: string;
  description: string;
  owner: string;
  tags: string[];
  creates_actions: boolean;
  linked_action_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface OrgStructureItemDB {
  id: string;
  company_id: string;
  type: "unit" | "sector" | "shift" | "position";
  name: string;
  archived: boolean;
  sort_order: number;
}

// ============================================================
// POPULATION MEMBERS
// ============================================================

export async function fetchPopulation(companyId: string): Promise<PopulationMemberDB[]> {
  if (!companyId) return [];
  console.log("[DataSource] population loading for company:", companyId);
  const { data, error } = await supabase
    .from("population_members")
    .select("*")
    .eq("company_id", companyId)
    .order("name");

  if (error) {
    console.error("Error fetching population:", error);
    return [];
  }
  console.log("[DataSource] population loaded from Supabase:", data?.length || 0);
  return (data || []) as PopulationMemberDB[];
}

export async function upsertPopulationMember(member: Omit<PopulationMemberDB, "id"> & { id?: string }): Promise<PopulationMemberDB | null> {
  const { data, error } = await supabase
    .from("population_members")
    .upsert(member as any, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting population member:", error);
    return null;
  }
  return data as PopulationMemberDB;
}

export async function insertPopulationMember(member: Omit<PopulationMemberDB, "id">): Promise<PopulationMemberDB | null> {
  const { data, error } = await supabase
    .from("population_members")
    .insert(member as any)
    .select()
    .single();

  if (error) {
    console.error("Error inserting population member:", error);
    return null;
  }
  return data as PopulationMemberDB;
}

export async function updatePopulationMemberDB(id: string, updates: Partial<PopulationMemberDB>): Promise<boolean> {
  const { error } = await supabase
    .from("population_members")
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq("id", id);

  if (error) {
    console.error("Error updating population member:", error);
    return false;
  }
  return true;
}

export async function deletePopulationMemberDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("population_members")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting population member:", error);
    return false;
  }
  return true;
}

export async function bulkInsertPopulation(members: Omit<PopulationMemberDB, "id">[]): Promise<number> {
  if (members.length === 0) return 0;
  const { data, error } = await supabase
    .from("population_members")
    .insert(members as any[])
    .select("id");

  if (error) {
    console.error("Error bulk inserting population:", error);
    return 0;
  }
  return data?.length || 0;
}

export async function fetchPopulationStats(companyId: string) {
  const pop = await fetchPopulation(companyId);
  const active = pop.filter(m => m.active);
  const facilitators = active.filter(m => m.facilitator);
  const nucleo = active.filter(m => m.nucleo);
  const leaders = active.filter(m => m.leadership);
  const sectors = new Set(active.map(m => m.sector).filter(Boolean));
  const units = new Set(active.map(m => m.unit).filter(Boolean));
  return {
    total: active.length,
    facilitators: facilitators.length,
    nucleoCount: nucleo.length,
    leaders: leaders.length,
    sectors: sectors.size,
    units: units.size,
    inactive: pop.length - active.length,
  };
}

// ============================================================
// TURMAS
// ============================================================

export async function fetchTurmas(companyId: string): Promise<TurmaDB[]> {
  if (!companyId) {
    console.warn("[DataSource] fetchTurmas called without companyId — returning []");
    return [];
  }
  console.log("[DataSource] turmas loading for company:", companyId);
  const { data, error } = await supabase
    .from("turmas")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at");

  if (error) {
    console.error("Error fetching turmas:", error);
    return [];
  }
  console.log("[DataSource] turmas loaded:", data?.length || 0);

  // Load participants and attendance for each turma
  const turmas = (data || []) as TurmaDB[];
  for (const turma of turmas) {
    const { data: participants } = await supabase
      .from("turma_participants")
      .select("*")
      .eq("turma_id", turma.id);
    turma.participants = (participants || []) as TurmaParticipantDB[];

    const { data: attendance } = await supabase
      .from("turma_attendance")
      .select("*")
      .eq("turma_id", turma.id);
    
    turma.attendance = {};
    (attendance || []).forEach((a: any) => {
      turma.attendance![a.participant_id] = a.status;
    });
  }

  return turmas;
}

export async function insertTurma(turma: {
  company_id: string;
  name: string;
  cycle_id: string;
  facilitator: string;
  start_date?: string | null;
  end_date?: string | null;
  training_date?: string | null;
  status?: string;
  notes?: string;
}): Promise<TurmaDB | null> {
  const { data, error } = await supabase
    .from("turmas")
    .insert(turma as any)
    .select()
    .single();

  if (error) {
    console.error("Error inserting turma:", error);
    return null;
  }
  return { ...(data as TurmaDB), participants: [], attendance: {} };
}

export async function updateTurmaDB(id: string, updates: Partial<TurmaDB>): Promise<boolean> {
  const { participants, attendance, ...dbUpdates } = updates as any;
  const { error } = await supabase
    .from("turmas")
    .update({ ...dbUpdates, updated_at: new Date().toISOString() } as any)
    .eq("id", id);

  if (error) {
    console.error("Error updating turma:", error);
    return false;
  }
  return true;
}

export async function deleteTurmaDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("turmas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting turma:", error);
    return false;
  }
  return true;
}

export async function setTurmaParticipants(turmaId: string, participants: { name: string; sector: string; role: string; member_id?: string }[]): Promise<boolean> {
  // Delete existing
  await supabase.from("turma_participants").delete().eq("turma_id", turmaId);
  
  if (participants.length === 0) return true;

  const rows = participants.map(p => ({
    turma_id: turmaId,
    name: p.name,
    sector: p.sector || "",
    role: p.role || "",
    member_id: p.member_id || null,
  }));

  const { error } = await supabase.from("turma_participants").insert(rows as any[]);
  if (error) {
    console.error("Error setting turma participants:", error);
    return false;
  }
  return true;
}

export async function setTurmaAttendance(turmaId: string, attendance: Record<string, "present" | "absent" | "reschedule">): Promise<boolean> {
  // Delete existing
  await supabase.from("turma_attendance").delete().eq("turma_id", turmaId);
  
  const entries = Object.entries(attendance);
  if (entries.length === 0) return true;

  const rows = entries.map(([participantId, status]) => ({
    turma_id: turmaId,
    participant_id: participantId,
    status,
  }));

  const { error } = await supabase.from("turma_attendance").insert(rows as any[]);
  if (error) {
    console.error("Error setting attendance:", error);
    return false;
  }
  return true;
}

// ============================================================
// CYCLE STATES
// ============================================================

export async function fetchCycleStates(companyId: string): Promise<CycleStateDB[]> {
  if (!companyId) return [];
  console.log("[DataSource] cycles loading for company:", companyId);
  const { data, error } = await supabase
    .from("cycle_states")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.error("Error fetching cycle states:", error);
    return [];
  }
  console.log("[DataSource] cycles loaded from Supabase:", data?.length || 0);
  return (data || []) as CycleStateDB[];
}

export async function upsertCycleState(state: Omit<CycleStateDB, "id"> & { id?: string }): Promise<boolean> {
  const { error } = await supabase
    .from("cycle_states")
    .upsert(state as any, { onConflict: "company_id,cycle_id" });

  if (error) {
    console.error("Error upserting cycle state:", error);
    return false;
  }
  return true;
}

// ============================================================
// CYCLE ACTIONS
// ============================================================

export async function fetchCycleActions(companyId: string): Promise<CycleActionDB[]> {
  if (!companyId) return [];
  const { data, error } = await supabase
    .from("cycle_actions")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.error("Error fetching cycle actions:", error);
    return [];
  }
  return (data || []) as CycleActionDB[];
}

export async function fetchCycleActionsForCycle(companyId: string, cycleId: string): Promise<CycleActionDB[]> {
  if (!companyId || !cycleId) return [];
  const { data, error } = await supabase
    .from("cycle_actions")
    .select("*")
    .eq("company_id", companyId)
    .eq("cycle_id", cycleId);

  if (error) {
    console.error("Error fetching cycle actions:", error);
    return [];
  }
  return (data || []) as CycleActionDB[];
}

export async function upsertCycleAction(action: Omit<CycleActionDB, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<CycleActionDB | null> {
  const { data, error } = await supabase
    .from("cycle_actions")
    .upsert({ ...action, updated_at: new Date().toISOString() } as any, { onConflict: "company_id,cycle_id,factor_id,action_id" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting cycle action:", error);
    return null;
  }
  return data as CycleActionDB;
}

export async function bulkUpsertCycleActions(actions: Array<Omit<CycleActionDB, "id" | "created_at" | "updated_at">>): Promise<boolean> {
  if (actions.length === 0) return true;
  const rows = actions.map(a => ({ ...a, updated_at: new Date().toISOString() }));
  const { error } = await supabase
    .from("cycle_actions")
    .upsert(rows as any[], { onConflict: "company_id,cycle_id,factor_id,action_id" });

  if (error) {
    console.error("Error bulk upserting cycle actions:", error);
    return false;
  }
  return true;
}

export async function deleteCycleActionDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("cycle_actions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cycle action:", error);
    return false;
  }
  return true;
}

// ============================================================
// RECORDS
// ============================================================

export async function fetchRecords(companyId: string): Promise<RecordDB[]> {
  if (!companyId) return [];
  const { data, error } = await supabase
    .from("records")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching records:", error);
    return [];
  }
  return (data || []) as RecordDB[];
}

export async function insertRecord(record: Omit<RecordDB, "id" | "created_at" | "updated_at">): Promise<RecordDB | null> {
  const { data, error } = await supabase
    .from("records")
    .insert(record as any)
    .select()
    .single();

  if (error) {
    console.error("Error inserting record:", error);
    return null;
  }
  return data as RecordDB;
}

export async function updateRecordDB(id: string, updates: Partial<RecordDB>): Promise<boolean> {
  const { error } = await supabase
    .from("records")
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq("id", id);

  if (error) {
    console.error("Error updating record:", error);
    return false;
  }
  return true;
}

export async function deleteRecordDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("records")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting record:", error);
    return false;
  }
  return true;
}

// ============================================================
// SUCCESS FACTOR OVERRIDES (Global)
// ============================================================

export async function fetchSuccessFactorOverrides(): Promise<Array<{ cycle_id: string; factor_id: string; actions: any[] }>> {
  const { data, error } = await supabase
    .from("success_factor_overrides")
    .select("*");

  if (error) {
    console.error("Error fetching success factor overrides:", error);
    return [];
  }
  return (data || []).map((d: any) => ({
    cycle_id: d.cycle_id,
    factor_id: d.factor_id,
    actions: d.actions || [],
  }));
}

export async function upsertSuccessFactorOverride(cycleId: string, factorId: string, actions: any[]): Promise<boolean> {
  const { error } = await supabase
    .from("success_factor_overrides")
    .upsert({
      cycle_id: cycleId,
      factor_id: factorId,
      actions,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "cycle_id,factor_id" });

  if (error) {
    console.error("Error upserting success factor override:", error);
    return false;
  }
  return true;
}

// ============================================================
// ORG STRUCTURE
// ============================================================

export async function fetchOrgStructure(companyId: string) {
  if (!companyId) return { units: [], sectors: [], shifts: [], positions: [] };
  const { data, error } = await supabase
    .from("org_structure")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order");

  if (error) {
    console.error("Error fetching org structure:", error);
    return { units: [], sectors: [], shifts: [], positions: [] };
  }

  const items = (data || []) as OrgStructureItemDB[];
  return {
    units: items.filter(i => i.type === "unit").map(i => ({ id: i.id, name: i.name, archived: i.archived, order: i.sort_order })),
    sectors: items.filter(i => i.type === "sector").map(i => ({ id: i.id, name: i.name, archived: i.archived, order: i.sort_order })),
    shifts: items.filter(i => i.type === "shift").map(i => ({ id: i.id, name: i.name, archived: i.archived, order: i.sort_order })),
    positions: items.filter(i => i.type === "position").map(i => ({ id: i.id, name: i.name, archived: i.archived, order: i.sort_order })),
  };
}

export async function upsertOrgStructureItem(item: Omit<OrgStructureItemDB, "id"> & { id?: string }): Promise<boolean> {
  const { error } = await supabase
    .from("org_structure")
    .upsert(item as any);

  if (error) {
    console.error("Error upserting org structure item:", error);
    return false;
  }
  return true;
}

export async function deleteOrgStructureItemDB(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("org_structure")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting org structure item:", error);
    return false;
  }
  return true;
}

// ============================================================
// AGGREGATE CALCULATIONS (from Supabase data)
// ============================================================

/**
 * Calculate training stats from turmas for a company.
 * Returns unique trained people count and turma stats.
 */
export async function calculateTrainingStats(companyId: string) {
  const turmas = await fetchTurmas(companyId);
  const turmasRealizadas = turmas.filter(t => t.status === "completed").length;
  const trainedIds = new Set<string>();
  let totalPresences = 0;

  turmas.forEach(t => {
    if (t.attendance) {
      Object.entries(t.attendance).forEach(([id, status]) => {
        if (status === "present") {
          trainedIds.add(id);
          totalPresences++;
        }
      });
    }
  });

  return {
    turmasTotal: turmas.length,
    turmasRealizadas,
    pessoasTreinadas: trainedIds.size,
    totalPresences,
  };
}

/**
 * Calculate cycle progress using weighted formula:
 * 70% training + 30% actions
 */
export function calculateCycleProgress(
  activePopulation: number,
  trainedCount: number,
  totalActions: number,
  completedActions: number,
  offWithJustification: number = 0
): number {
  // Training component: 70% weight
  const trainingProgress = activePopulation > 0
    ? (trainedCount / activePopulation) * 100
    : 0;

  // Actions component: 30% weight
  // Completed + OFF with justification count as done
  const actionsDone = completedActions + offWithJustification;
  const actionsProgress = totalActions > 0
    ? (actionsDone / totalActions) * 100
    : 0;

  const weightedProgress = (trainingProgress * 0.7) + (actionsProgress * 0.3);
  
  console.log("[Metric] cycle progress recalculated:", {
    trainingProgress: Math.round(trainingProgress),
    actionsProgress: Math.round(actionsProgress),
    weightedProgress: Math.round(weightedProgress),
  });

  return Math.min(100, Math.round(weightedProgress));
}

/**
 * Get complete company operational data from Supabase for dashboard/indicators
 */
export async function fetchCompanyOperationalData(companyId: string) {
  console.log("[Metric] dashboard recalculated for company:", companyId);

  if (!companyId) {
    console.warn("[DataSource] fetchCompanyOperationalData called without companyId");
    return {
      population: [], turmas: [], cycleStates: [], cycleActions: [], records: [],
      activePop: [], facilitators: [], nucleoMembers: [], leaders: [],
      trainedIds: new Set<string>(),
    } as any;
  }

  const [population, turmas, cycleStates, cycleActions, records] = await Promise.all([
    fetchPopulation(companyId),
    fetchTurmas(companyId),
    fetchCycleStates(companyId),
    fetchCycleActions(companyId),
    fetchRecords(companyId),
  ]);

  const activePop = population.filter(m => m.active);
  const facilitators = activePop.filter(m => m.facilitator);
  const nucleoMembers = activePop.filter(m => m.nucleo);
  const leaders = activePop.filter(m => m.leadership);

  // Training stats
  const trainedIds = new Set<string>();
  turmas.forEach(t => {
    if (t.attendance) {
      Object.entries(t.attendance).forEach(([id, status]) => {
        if (status === "present") trainedIds.add(id);
      });
    }
  });

  // Action stats
  const enabledActions = cycleActions.filter(a => a.enabled);
  const completedActions = enabledActions.filter(a => a.status === "completed");
  const delayedActions = enabledActions.filter(a => {
    if (a.status === "completed") return false;
    if (!a.due_date) return false;
    const due = new Date(a.due_date);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  });
  const inProgressActions = enabledActions.filter(a => a.status === "in_progress");
  const pendingActions = enabledActions.filter(a => a.status === "pending");

  // Cycle stats
  const closedCycles = cycleStates.filter(c => c.closure_status === "closed").length;
  const cyclesInProgress = cycleStates.filter(c => 
    c.closure_status !== "closed" && c.closure_status !== "not_started"
  ).length;

  // Turma stats
  const completedTurmas = turmas.filter(t => t.status === "completed");

  // Coverage
  const coveragePercent = activePop.length > 0
    ? Math.round((trainedIds.size / activePop.length) * 100)
    : 0;

  // Maturity score
  const popScore = activePop.length > 0 ? 15 : 0;
  const nucleoScore = nucleoMembers.length > 0 ? 10 : 0;
  const facScore = facilitators.length > 0 ? 5 : 0;
  const cycleScore = Math.min(30, (closedCycles / 9) * 30);
  const actionScore = Math.min(25, enabledActions.length > 0
    ? (completedActions.length / enabledActions.length) * 25
    : 0);
  const coverageScore = Math.min(15, (coveragePercent / 100) * 15);
  const maturityScore = Math.round(popScore + nucleoScore + facScore + cycleScore + actionScore + coverageScore);

  return {
    population: activePop,
    populationTotal: activePop.length,
    facilitatorsCount: facilitators.length,
    nucleoCount: nucleoMembers.length,
    leadersCount: leaders.length,
    sectorsCount: new Set(activePop.map(m => m.sector).filter(Boolean)).size,
    unitsCount: new Set(activePop.map(m => m.unit).filter(Boolean)).size,
    inactiveCount: population.length - activePop.length,

    turmas,
    turmasTotal: turmas.length,
    turmasRealizadas: completedTurmas.length,
    pessoasTreinadas: trainedIds.size,

    cycleStates,
    cycleActions,
    enabledActions: enabledActions.length,
    completedActions: completedActions.length,
    delayedActions: delayedActions.length,
    inProgressActions: inProgressActions.length,
    pendingActions: pendingActions.length,
    overallCompletionPercent: enabledActions.length > 0
      ? Math.round((completedActions.length / enabledActions.length) * 100)
      : 0,

    closedCycles,
    cyclesInProgress,
    totalCycles: 9,

    records,

    coveragePercent,
    maturityScore,
    trainedIds,
  };
}
