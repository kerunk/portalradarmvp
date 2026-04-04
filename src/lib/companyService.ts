/**
 * Company Service — Supabase as source of truth for companies.
 * Includes user creation for company admins via signUp.
 */

import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import type { CompanyState } from "./storage";

const SUPABASE_URL = "https://bmzrismxolxwgahzfeer.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dbNonN1GclUy2p6yq045eQ_9EMPE3eP";

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

// ============================================================
// Create admin_empresa user in Supabase Auth + profile + role
// Uses a separate client to avoid signing out the current admin
// ============================================================

export async function createCompanyAdmin(
  email: string,
  password: string,
  fullName: string,
  companyId: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  // Create a separate Supabase client that does NOT persist sessions
  // This prevents the admin_mvp from being signed out
  const isolatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // 1. Create the user in Supabase Auth
  const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (signUpError) {
    console.error("Error creating auth user:", signUpError);
    return { success: false, error: signUpError.message };
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    return { success: false, error: "Usuário criado mas ID não retornado." };
  }

  // 2. Create profile linked to the company
  // Using the main authenticated client (admin session) for DB operations
  const { error: profileError } = await (supabase.from("profiles") as any)
    .upsert({
      id: userId,
      full_name: fullName,
      company_id: companyId,
    }, { onConflict: "id" });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    // User was created but profile failed - log but continue
  }

  // 3. Create user_role = admin_empresa
  const { error: roleError } = await (supabase.from("user_roles") as any)
    .insert({
      user_id: userId,
      role: "admin_empresa",
    });

  if (roleError) {
    console.error("Error creating user role:", roleError);
    // User was created but role failed - log but continue
  }

  return { success: true, userId };
}

// ============================================================
// Delete company from Supabase
// ============================================================

export async function deleteCompanyFromSupabase(
  companyId: string
): Promise<boolean> {
  // First unlink profiles from this company
  await supabase
    .from("profiles")
    .update({ company_id: null } as any)
    .eq("company_id", companyId);

  // Delete user_roles for users linked to this company
  const { data: linkedProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", companyId);

  if (linkedProfiles && linkedProfiles.length > 0) {
    const userIds = linkedProfiles.map((p: any) => p.id);
    await supabase
      .from("user_roles")
      .delete()
      .in("user_id", userIds);
  }

  // Delete the company — use .select() to get affected rows back
  const { data, error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)
    .select("id");

  if (error) {
    console.error("Error deleting company:", error);
    return false;
  }

  // If no rows were returned, the delete didn't actually happen (likely RLS)
  if (!data || data.length === 0) {
    console.error("Delete returned no rows — company was NOT deleted. Check RLS policies.");
    return false;
  }

  return true;
}

// ============================================================
// Update & status operations
// ============================================================

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
  const dbUpdates: any = { ...updates };
  if (updates.onboarding_status) {
    dbUpdates.onboarding_status = mapOnboardingToDB(updates.onboarding_status);
  }

  const { error } = await (supabase
    .from("companies") as any)
    .update(dbUpdates)
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
