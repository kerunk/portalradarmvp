/**
 * db.ts — Camada única de acesso ao Supabase.
 * Substitui localStorage em companyStorage.ts, storage.ts e globalSuccessFactors.ts.
 * Todas as funções são async e usam o cliente Supabase tipado.
 */

import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

// TIPOS LOCAIS

export interface PopulationMember {
  id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
  unit: string;
  shift: string;
  admissionDate: string;
  facilitator: boolean;
  nucleo: boolean;
  leadership: boolean;
  active: boolean;
}

export interface OrgItem {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

export interface OrgStructure {
  units: OrgItem[];
  sectors: OrgItem[];
  shifts: OrgItem[];
  positions: OrgItem[];
}

export interface NucleoMember {
  id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
}

export interface TurmaParticipant {
  id: string;
  name: string;
  sector: string;
  role: string;
}

export interface Turma {
  id: string;
  companyId: string;
  name: string;
  cycleId: string;
  facilitator: string;
  startDate: string | null;
  endDate: string | null;
  trainingDate: string | null;
  status: "planned" | "in_progress" | "completed" | "delayed";
  notes: string;
  participants: TurmaParticipant[];
  attendance?: Record<string, "present" | "absent">;
}

export interface CycleAction {
  id: string;
  companyId: string;
  cycleId: string;
  factorId: string;
  actionId: string;
  title: string;
  enabled: boolean;
  disabledReason: string;
  responsible: string;
  dueDate: string | null;
  status: "pending" | "in_progress" | "completed" | "delayed";
  observation: string;
  sourceDecisionId?: string | null;
}

export interface CycleState {
  companyId: string;
  cycleId: string;
  closureStatus: "not_started" | "in_progress" | "ready_to_close" | "closed";
  startDate?: string;
  plannedEndDate?: string;
  closedAt?: string;
  closureNotes: string;
  lockedForEditing: boolean;
}

export interface DBRecord {
  id: string;
  companyId: string;
  date: string;
  cycleId?: string | null;
  factorId?: string | null;
  type: string;
  status: string;
  title: string;
  description: string;
  owner: string;
  tags: string[];
  createsActions: boolean;
  linkedActionIds: string[];
  createdAt: string;
  updatedAt: string;
}

// POPULATION

function rowToMember(row: any): PopulationMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    sector: row.sector ?? "",
    role: row.role ?? "",
    unit: row.unit ?? "",
    shift: row.shift ?? "",
    admissionDate: row.admission_date ?? "",
    facilitator: !!row.facilitator,
    nucleo: !!row.nucleo,
    leadership: !!row.leadership,
    active: row.active !== false,
  };
}

export async function fetchPopulation(companyId: string): Promise<PopulationMember[]> {
  const { data, error } = await sb.from("population_members").select("*").eq("company_id", companyId).order("name");
  if (error) {
    console.error("[db] fetchPopulation", error);
    return [];
  }
  return (data ?? []).map(rowToMember);
}

export async function insertMember(
  companyId: string,
  m: Omit<PopulationMember, "id">,
): Promise<PopulationMember | null> {
  const { data, error } = await sb
    .from("population_members")
    .insert({
      company_id: companyId,
      name: m.name,
      email: m.email,
      sector: m.sector,
      role: m.role,
      unit: m.unit,
      shift: m.shift,
      admission_date: m.admissionDate,
      facilitator: m.facilitator,
      nucleo: m.nucleo,
      leadership: m.leadership,
      active: m.active,
    })
    .select()
    .single();
  if (error) {
    console.error("[db] insertMember", error);
    return null;
  }
  return rowToMember(data);
}

export async function updateMember(id: string, updates: Partial<PopulationMember>): Promise<boolean> {
  const patch: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.sector !== undefined) patch.sector = updates.sector;
  if (updates.role !== undefined) patch.role = updates.role;
  if (updates.unit !== undefined) patch.unit = updates.unit;
  if (updates.shift !== undefined) patch.shift = updates.shift;
  if (updates.admissionDate !== undefined) patch.admission_date = updates.admissionDate;
  if (updates.facilitator !== undefined) patch.facilitator = updates.facilitator;
  if (updates.nucleo !== undefined) patch.nucleo = updates.nucleo;
  if (updates.leadership !== undefined) patch.leadership = updates.leadership;
  if (updates.active !== undefined) patch.active = updates.active;

  const { error } = await sb.from("population_members").update(patch).eq("id", id);
  if (error) {
    console.error("[db] updateMember", error);
    return false;
  }
  return true;
}

export async function deleteMember(id: string): Promise<boolean> {
  const { error } = await sb.from("population_members").delete().eq("id", id);
  if (error) {
    console.error("[db] deleteMember", error);
    return false;
  }
  return true;
}

export async function bulkInsertMembers(companyId: string, members: Omit<PopulationMember, "id">[]): Promise<number> {
  if (!members.length) return 0;
  const rows = members.map((m) => ({
    company_id: companyId,
    name: m.name,
    email: m.email,
    sector: m.sector,
    role: m.role,
    unit: m.unit,
    shift: m.shift,
    admission_date: m.admissionDate,
    facilitator: m.facilitator,
    nucleo: m.nucleo,
    leadership: m.leadership,
    active: m.active,
  }));
  const { data, error } = await sb.from("population_members").insert(rows).select("id");
  if (error) {
    console.error("[db] bulkInsertMembers", error);
    return 0;
  }
  return data?.length ?? 0;
}

export async function fetchPopulationStats(companyId: string) {
  const pop = await fetchPopulation(companyId);
  const active = pop.filter((m) => m.active);
  const sectors = new Set(active.map((m) => m.sector).filter(Boolean));
  const units = new Set(active.map((m) => m.unit).filter(Boolean));
  return {
    total: active.length,
    facilitators: active.filter((m) => m.facilitator).length,
    nucleoCount: active.filter((m) => m.nucleo).length,
    leaders: active.filter((m) => m.leadership).length,
    sectors: sectors.size,
    units: units.size,
  };
}

export async function isEmailUsed(companyId: string, email: string, excludeId?: string): Promise<boolean> {
  if (!email) return false;
  const { data } = await sb.from("population_members").select("id").eq("company_id", companyId).eq("email", email);
  if (!data) return false;
  return data.some((r: any) => r.id !== excludeId);
}

// ORG STRUCTURE

function rowsToOrgStructure(rows: any[]): OrgStructure {
  const map = (type: string) =>
    rows
      .filter((r) => r.type === type)
      .map((r) => ({ id: r.id, name: r.name, archived: r.archived, order: r.sort_order }))
      .sort((a, b) => a.order - b.order);
  return {
    units: map("unit"),
    sectors: map("sector"),
    shifts: map("shift"),
    positions: map("position"),
  };
}

export async function fetchOrgStructure(companyId: string): Promise<OrgStructure> {
  const { data, error } = await sb.from("org_structure").select("*").eq("company_id", companyId).order("sort_order");
  if (error) {
    console.error("[db] fetchOrgStructure", error);
    return { units: [], sectors: [], shifts: [], positions: [] };
  }
  return rowsToOrgStructure(data ?? []);
}

type OrgCategory = "units" | "sectors" | "shifts" | "positions";
const categoryToType: Record<OrgCategory, string> = {
  units: "unit",
  sectors: "sector",
  shifts: "shift",
  positions: "position",
};

export async function upsertOrgItem(
  companyId: string,
  category: OrgCategory,
  item: Omit<OrgItem, "id"> & { id?: string },
): Promise<OrgItem | null> {
  const row: any = {
    company_id: companyId,
    type: categoryToType[category],
    name: item.name,
    archived: item.archived ?? false,
    sort_order: item.order ?? 0,
  };
  if (item.id) row.id = item.id;

  const { data, error } = await sb.from("org_structure").upsert(row, { onConflict: "id" }).select().single();
  if (error) {
    console.error("[db] upsertOrgItem", error);
    return null;
  }
  return { id: data.id, name: data.name, archived: data.archived, order: data.sort_order };
}

export async function deleteOrgItem(id: string): Promise<boolean> {
  const { error } = await sb.from("org_structure").delete().eq("id", id);
  if (error) {
    console.error("[db] deleteOrgItem", error);
    return false;
  }
  return true;
}

/** Garante que um valor existe na estrutura org; cria se não existir. */
export async function ensureOrgValue(companyId: string, category: OrgCategory, value: string): Promise<void> {
  if (!value.trim()) return;
  const structure = await fetchOrgStructure(companyId);
  const list = structure[category];
  const exists = list.some((i) => i.name.toLowerCase() === value.trim().toLowerCase());
  if (!exists) {
    await upsertOrgItem(companyId, category, {
      name: value.trim(),
      archived: false,
      order: list.length,
    });
  }
}

//  TURMAS

function rowToTurma(row: any): Turma {
  let participants: TurmaParticipant[] = [];
  let attendance: Record<string, "present" | "absent"> | undefined;
  try {
    participants = JSON.parse(row.participants_json ?? "[]");
  } catch {}
  try {
    attendance = JSON.parse(row.attendance_json ?? "null") ?? undefined;
  } catch {}
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    cycleId: row.cycle_id,
    facilitator: row.facilitator ?? "",
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    trainingDate: row.training_date ?? null,
    status: row.status ?? "planned",
    notes: row.notes ?? "",
    participants,
    attendance,
  };
}

export async function fetchTurmas(companyId: string): Promise<Turma[]> {
  const { data, error } = await sb.from("turmas").select("*").eq("company_id", companyId).order("created_at");
  if (error) {
    console.error("[db] fetchTurmas", error);
    return [];
  }
  return (data ?? []).map(rowToTurma);
}

export async function upsertTurma(
  companyId: string,
  turma: Partial<Turma> & { cycleId: string; name: string; facilitator: string },
): Promise<Turma | null> {
  const row: any = {
    company_id: companyId,
    name: turma.name,
    cycle_id: turma.cycleId,
    facilitator: turma.facilitator,
    start_date: turma.startDate ?? null,
    end_date: turma.endDate ?? null,
    training_date: turma.trainingDate ?? null,
    status: turma.status ?? "planned",
    notes: turma.notes ?? "",
    participants_json: JSON.stringify(turma.participants ?? []),
    attendance_json: turma.attendance ? JSON.stringify(turma.attendance) : null,
    updated_at: new Date().toISOString(),
  };
  if (turma.id) row.id = turma.id;

  const { data, error } = await sb.from("turmas").upsert(row, { onConflict: "id" }).select().single();
  if (error) {
    console.error("[db] upsertTurma", error);
    return null;
  }
  return rowToTurma(data);
}

export async function deleteTurmaDB(id: string): Promise<boolean> {
  const { error } = await sb.from("turmas").delete().eq("id", id);
  if (error) {
    console.error("[db] deleteTurmaDB", error);
    return false;
  }
  return true;
}

//  CYCLE STATES

function rowToCycleState(row: any): CycleState {
  return {
    companyId: row.company_id,
    cycleId: row.cycle_id,
    closureStatus: row.closure_status ?? "not_started",
    startDate: row.start_date ?? undefined,
    plannedEndDate: row.planned_end_date ?? undefined,
    closedAt: row.closed_at ?? undefined,
    closureNotes: row.closure_notes ?? "",
    lockedForEditing: !!row.locked_for_editing,
  };
}

export async function fetchCycleStates(companyId: string): Promise<Record<string, CycleState>> {
  const { data, error } = await sb.from("cycle_states").select("*").eq("company_id", companyId);
  if (error) {
    console.error("[db] fetchCycleStates", error);
    return {};
  }
  const result: Record<string, CycleState> = {};
  for (const row of data ?? []) {
    result[row.cycle_id] = rowToCycleState(row);
  }
  return result;
}

export async function upsertCycleState(state: CycleState): Promise<boolean> {
  const { error } = await sb.from("cycle_states").upsert(
    {
      company_id: state.companyId,
      cycle_id: state.cycleId,
      closure_status: state.closureStatus,
      start_date: state.startDate ?? null,
      planned_end_date: state.plannedEndDate ?? null,
      closed_at: state.closedAt ?? null,
      closure_notes: state.closureNotes,
      locked_for_editing: state.lockedForEditing,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id,cycle_id" },
  );
  if (error) {
    console.error("[db] upsertCycleState", error);
    return false;
  }
  return true;
}

//  CYCLE ACTIONS

function rowToCycleAction(row: any): CycleAction {
  return {
    id: row.id,
    companyId: row.company_id,
    cycleId: row.cycle_id,
    factorId: row.factor_id,
    actionId: row.action_id,
    title: row.title ?? "",
    enabled: row.enabled !== false,
    disabledReason: row.disabled_reason ?? "",
    responsible: row.responsible ?? "",
    dueDate: row.due_date ?? null,
    status: row.status ?? "pending",
    observation: row.observation ?? "",
    sourceDecisionId: row.source_decision_id ?? null,
  };
}

export async function fetchCycleActions(companyId: string, cycleId?: string): Promise<CycleAction[]> {
  let query = sb.from("cycle_actions").select("*").eq("company_id", companyId);
  if (cycleId) query = query.eq("cycle_id", cycleId);
  const { data, error } = await query;
  if (error) {
    console.error("[db] fetchCycleActions", error);
    return [];
  }
  return (data ?? []).map(rowToCycleAction);
}

export async function upsertCycleAction(
  action: Omit<CycleAction, "id"> & { id?: string },
): Promise<CycleAction | null> {
  const row: any = {
    company_id: action.companyId,
    cycle_id: action.cycleId,
    factor_id: action.factorId,
    action_id: action.actionId,
    title: action.title,
    enabled: action.enabled,
    disabled_reason: action.disabledReason,
    responsible: action.responsible,
    due_date: action.dueDate,
    status: action.status,
    observation: action.observation,
    source_decision_id: action.sourceDecisionId ?? null,
    updated_at: new Date().toISOString(),
  };
  if (action.id) row.id = action.id;

  const { data, error } = await sb
    .from("cycle_actions")
    .upsert(row, { onConflict: "company_id,cycle_id,factor_id,action_id" })
    .select()
    .single();
  if (error) {
    console.error("[db] upsertCycleAction", error);
    return null;
  }
  return rowToCycleAction(data);
}

export async function deleteCycleAction(id: string): Promise<boolean> {
  const { error } = await sb.from("cycle_actions").delete().eq("id", id);
  if (error) {
    console.error("[db] deleteCycleAction", error);
    return false;
  }
  return true;
}

//  RECORDS

function rowToRecord(row: any): DBRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    date: row.date,
    cycleId: row.cycle_id ?? null,
    factorId: row.factor_id ?? null,
    type: row.type,
    status: row.status,
    title: row.title,
    description: row.description ?? "",
    owner: row.owner ?? "",
    tags: row.tags ?? [],
    createsActions: !!row.creates_actions,
    linkedActionIds: row.linked_action_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchRecords(companyId: string): Promise<DBRecord[]> {
  const { data, error } = await sb
    .from("records")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[db] fetchRecords", error);
    return [];
  }
  return (data ?? []).map(rowToRecord);
}

export async function insertRecord(
  companyId: string,
  r: Omit<DBRecord, "id" | "createdAt" | "updatedAt">,
): Promise<DBRecord | null> {
  const { data, error } = await sb
    .from("records")
    .insert({
      company_id: companyId,
      date: r.date,
      cycle_id: r.cycleId ?? null,
      factor_id: r.factorId ?? null,
      type: r.type,
      status: r.status,
      title: r.title,
      description: r.description,
      owner: r.owner,
      tags: r.tags,
      creates_actions: r.createsActions,
      linked_action_ids: r.linkedActionIds,
    })
    .select()
    .single();
  if (error) {
    console.error("[db] insertRecord", error);
    return null;
  }
  return rowToRecord(data);
}

export async function updateRecord(id: string, updates: Partial<DBRecord>): Promise<boolean> {
  const patch: any = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) patch.status = updates.status;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.owner !== undefined) patch.owner = updates.owner;
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.createsActions !== undefined) patch.creates_actions = updates.createsActions;
  if (updates.linkedActionIds !== undefined) patch.linked_action_ids = updates.linkedActionIds;

  const { error } = await sb.from("records").update(patch).eq("id", id);
  if (error) {
    console.error("[db] updateRecord", error);
    return false;
  }
  return true;
}
