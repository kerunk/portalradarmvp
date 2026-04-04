import { supabase } from "@/integrations/supabase/client";
import type { OnboardingStatus } from "@/types/supabase";

export const ONBOARDING_STATUS = {
  NOT_STARTED: "nao_iniciado",
  IN_PROGRESS: "em_andamento",
  COMPLETED: "concluido",
} as const satisfies Record<string, OnboardingStatus>;

export interface CompanyOnboardingRow {
  id: string;
  onboarding_status: OnboardingStatus;
}

export async function fetchCompanyOnboarding(companyId: string): Promise<CompanyOnboardingRow | null> {
  if (!companyId) return null;

  const result = await (supabase.from("companies") as any)
    .select("id, onboarding_status")
    .eq("id", companyId)
    .single();

  if (result.error) {
    throw result.error;
  }

  return result.data as CompanyOnboardingRow;
}

export async function updateCompanyOnboarding(companyId: string, onboarding_status: OnboardingStatus) {
  return await (supabase.from("companies") as any)
    .update({ onboarding_status })
    .eq("id", companyId)
    .select("id, onboarding_status")
    .single();
}

export function isOnboardingCompleted(onboarding_status?: string | null): boolean {
  return onboarding_status === ONBOARDING_STATUS.COMPLETED;
}