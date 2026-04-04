/**
 * Employee & Nucleus Service — Supabase persistence for onboarding data
 */

import { supabase } from "@/integrations/supabase/client";
import type { NucleoMember, PopulationMember } from "./companyStorage";

// ============================================================
// Nucleus Members
// ============================================================

export async function saveNucleusToSupabase(
  companyId: string,
  members: NucleoMember[]
): Promise<boolean> {
  // Delete existing nucleus members for company
  await (supabase.from("nucleus_members") as any)
    .delete()
    .eq("company_id", companyId);

  if (members.length === 0) return true;

  const rows = members.map(m => ({
    company_id: companyId,
    name: m.name,
    email: m.email || null,
    sector: m.sector,
    role: m.role || null,
  }));

  const { error } = await (supabase.from("nucleus_members") as any).insert(rows);
  if (error) {
    console.error("Error saving nucleus:", error);
    return false;
  }
  return true;
}

export async function fetchNucleusFromSupabase(
  companyId: string
): Promise<NucleoMember[]> {
  const { data, error } = await (supabase.from("nucleus_members") as any)
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.error("Error fetching nucleus:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email || "",
    sector: row.sector || "",
    role: row.role || "",
  }));
}

// ============================================================
// Employees (Population)
// ============================================================

export async function saveEmployeesToSupabase(
  companyId: string,
  members: PopulationMember[]
): Promise<boolean> {
  // Delete existing employees for company
  await (supabase.from("employees") as any)
    .delete()
    .eq("company_id", companyId);

  if (members.length === 0) return true;

  const rows = members.map(m => ({
    company_id: companyId,
    name: m.name,
    email: m.email || null,
    role: m.role || null,
    department: m.sector || null,
    unit: m.unit || null,
    shift: m.shift || null,
    admission_date: m.admissionDate || null,
    leader: m.leadership || false,
    facilitator: m.facilitator || false,
    nucleo: m.nucleo || false,
    active: m.active !== false,
  }));

  // Insert in batches of 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await (supabase.from("employees") as any).insert(batch);
    if (error) {
      console.error("Error saving employees batch:", error);
      return false;
    }
  }
  return true;
}

export async function fetchEmployeesFromSupabase(
  companyId: string
): Promise<PopulationMember[]> {
  const { data, error } = await (supabase.from("employees") as any)
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email || "",
    sector: row.department || "",
    role: row.role || "",
    unit: row.unit || "",
    shift: row.shift || "",
    admissionDate: row.admission_date || "",
    facilitator: row.facilitator || false,
    nucleo: row.nucleo || false,
    leadership: row.leader || false,
    active: row.active !== false,
  }));
}

// ============================================================
// Onboarding Progress
// ============================================================

export interface OnboardingProgress {
  currentStep: number;
  welcomeCompleted: boolean;
  nucleusCompleted: boolean;
  populationCompleted: boolean;
  confirmationCompleted: boolean;
}

export async function saveOnboardingProgress(
  companyId: string,
  progress: OnboardingProgress
): Promise<boolean> {
  const row = {
    company_id: companyId,
    current_step: progress.currentStep,
    welcome_completed: progress.welcomeCompleted,
    nucleus_completed: progress.nucleusCompleted,
    population_completed: progress.populationCompleted,
    confirmation_completed: progress.confirmationCompleted,
    updated_at: new Date().toISOString(),
  };

  const { error } = await (supabase.from("company_onboarding_progress") as any)
    .upsert(row, { onConflict: "company_id" });

  if (error) {
    console.error("Error saving onboarding progress:", error);
    return false;
  }
  return true;
}

export async function fetchOnboardingProgress(
  companyId: string
): Promise<OnboardingProgress | null> {
  const { data, error } = await (supabase.from("company_onboarding_progress") as any)
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error || !data) return null;

  return {
    currentStep: data.current_step || 1,
    welcomeCompleted: data.welcome_completed || false,
    nucleusCompleted: data.nucleus_completed || false,
    populationCompleted: data.population_completed || false,
    confirmationCompleted: data.confirmation_completed || false,
  };
}

// ============================================================
// CSV Template Generation
// ============================================================

export function generateEmployeeCSVTemplate(): string {
  const bom = "\uFEFF";
  const header = "nome;email;cargo;departamento;lider;nivel_hierarquico";
  const examples = [
    "João Silva;joao@empresa.com;Analista;Financeiro;Sim;Tático",
    "Maria Costa;maria@empresa.com;Coordenadora;RH;Não;Estratégico",
    "Carlos Oliveira;carlos@empresa.com;Operador;Produção;Não;Operacional",
  ];
  return bom + [header, ...examples].join("\n");
}

export function parseEmployeeCSV(content: string): {
  members: Array<{
    name: string;
    email: string;
    role: string;
    sector: string;
    leadership: boolean;
    hierarchyLevel: string;
  }>;
  errors: string[];
} {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return { members: [], errors: ["Arquivo vazio ou sem dados"] };

  const firstLine = lines[0].replace(/^\uFEFF/, "");
  const delimiter = firstLine.includes(";") ? ";" : ",";
  const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());

  const colMap: Record<string, number> = {};
  const headerMap: Record<string, string> = {
    nome: "name",
    "nome completo": "name",
    email: "email",
    "e-mail": "email",
    cargo: "role",
    "cargo / função": "role",
    "cargo/função": "role",
    departamento: "sector",
    setor: "sector",
    lider: "leader",
    líder: "leader",
    lideranca: "leader",
    liderança: "leader",
    nivel_hierarquico: "level",
    "nível hierárquico": "level",
    nivel: "level",
  };

  headers.forEach((h, i) => {
    const mapped = headerMap[h];
    if (mapped) colMap[mapped] = i;
  });

  const members: Array<{
    name: string;
    email: string;
    role: string;
    sector: string;
    leadership: boolean;
    hierarchyLevel: string;
  }> = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim());
    if (!cols.some(c => c)) continue;

    const name = cols[colMap.name ?? 0]?.trim() || "";
    if (!name) {
      errors.push(`Linha ${i + 1}: nome é obrigatório`);
      continue;
    }

    const leaderValue = (cols[colMap.leader ?? 4]?.trim() || "").toLowerCase();

    members.push({
      name,
      email: cols[colMap.email ?? 1]?.trim() || "",
      role: cols[colMap.role ?? 2]?.trim() || "",
      sector: cols[colMap.sector ?? 3]?.trim() || "",
      leadership: leaderValue === "sim" || leaderValue === "true" || leaderValue === "1",
      hierarchyLevel: cols[colMap.level ?? 5]?.trim() || "",
    });
  }

  return { members, errors };
}
