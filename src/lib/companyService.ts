/**
 * Company Service — Supabase as source of truth for companies.
 * Operational data (cycles, turmas, etc.) still in localStorage (TEMPORARY).
 */

import { supabase } from "@/integrations/supabase/client";
import type { CompanyState } from "./storage";

// ============================================================
// Supabase → CompanyState adapter
// ============================================================

function toCompanyState(row: any): CompanyState {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector || "Não informado",
    employees: row.employee_count || 0,
    adminName: row.admin_name || "",
    adminEmail: row.admin_email || "",
    tempPassword: "", // Not stored in DB for security
    createdAt: row.created_at?.split("T")[0] || "",
    logo: row.logo_url || undefined,
    onboardingStatus: mapOnboardingFromDB(row.onboarding_status),
    ownerEmail: row.owner_email || undefined,
    ownerName: row.owner_name || undefined,
    active: row.active !== false,
    deleted: false,
  };
}

function mapOnboardingFromDB(
  dbStatus: string | null
): "not_started" | "in_progress" | "completed" {
  switch (dbStatus) {
    case "em_andamento":
      return "in_progress";
    case "concluido":
      return "completed";
    default:
      return "not_started";
  }
}

function mapOnboardingToDB(
  appStatus: string
): "nao_iniciado" | "em_andamento" | "concluido" {
  switch (appStatus) {
    case "in_progress":
      return "em_andamento";
    case "completed":
      return "concluido";
    default:
      return "nao_iniciado";
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ============================================================
// CRUD Operations
// ============================================================

export async function fetchCompanies(): Promise<CompanyState[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }

  return (data || []).map(toCompanyState);
}

export async function fetchCompanyById(
  companyId: string
): Promise<CompanyState | null> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error || !data) {
    console.error("Error fetching company:", error);
    return null;
  }

  return toCompanyState(data);
}

export async function createCompanyInSupabase(company: CompanyState): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const slug = toSlug(company.name) + "-" + Date.now();

  const insertData: any = {
    name: company.name,
    slug,
    sector: company.sector || null,
    employee_count: company.employees || null,
    admin_name: company.adminName || null,
    admin_email: company.adminEmail || null,
    logo_url: company.logo || null,
    onboarding_status: mapOnboardingToDB(company.onboardingStatus || "not_started"),
    owner_email: company.ownerEmail || null,
    owner_name: company.ownerName || null,
    active: true,
  };

  const { data, error } = await supabase
    .from("companies")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("Error creating company in Supabase:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: (data as any)?.id };
}

export async function updateCompanyInSupabase(
  companyId: string,
  updates: Partial<{
    name: string;
    sector: string;
    employee_count: number;
    admin_name: string;
    admin_email: string;
    logo_url: string;
    onboarding_status: string;
    active: boolean;
    owner_email: string;
    owner_name: string;
  }>
): Promise<boolean> {
  // Map onboarding_status if present
  const dbUpdates: any = { ...updates };
  if (updates.onboarding_status) {
    dbUpdates.onboarding_status = mapOnboardingToDB(updates.onboarding_status);
  }

  const { error } = await supabase
    .from("companies")
    .update(dbUpdates as any)
    .eq("id", companyId);

  if (error) {
    console.error("Error updating company:", error);
    return false;
  }

  return true;
}

export async function deactivateCompanyInSupabase(
  companyId: string
): Promise<boolean> {
  return updateCompanyInSupabase(companyId, { active: false });
}

export async function reactivateCompanyInSupabase(
  companyId: string
): Promise<boolean> {
  return updateCompanyInSupabase(companyId, { active: true });
}

export async function updateCompanyOnboardingInSupabase(
  companyId: string,
  status: "not_started" | "in_progress" | "completed"
): Promise<boolean> {
  return updateCompanyInSupabase(companyId, { onboarding_status: status });
}
