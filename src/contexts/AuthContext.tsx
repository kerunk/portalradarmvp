import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OnboardingStatus } from "@/types/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { ONBOARDING_STATUS, fetchCompanyOnboarding, updateCompanyOnboarding } from "@/lib/companyOnboarding";

// ============================================================
// Portal MVP v2 — Supabase Auth Context
// ============================================================

export type UserRole = "admin_mvp" | "admin_empresa" | "nucleo" | "lideranca";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  mustChangePassword?: boolean;
  onboarding_status?: OnboardingStatus;
}

export interface LoginResult {
  success: boolean;
  locked?: boolean;
  inactive?: boolean;
  remainingSeconds?: number;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdminMVP: boolean;
  isCliente: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  startOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<{ id: string; onboarding_status: OnboardingStatus }>;
  updateCompanyLogo: (logoUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// Helper: build User from Supabase session + profile + role
// ============================================================

async function buildUserFromSession(supabaseUser: SupabaseUser): Promise<User | null> {
  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, company_id")
      .eq("id", supabaseUser.id)
      .single();

    // Fetch role
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", supabaseUser.id)
      .single();

    const role: UserRole = ((userRole as any)?.role as UserRole) ?? "lideranca";

    // Fetch company if profile has company_id
    let companyName: string | undefined;
    let companyLogo: string | undefined;
    let onboarding_status: OnboardingStatus = ONBOARDING_STATUS.NOT_STARTED;
    const companyId: string | undefined = (profile as any)?.company_id ?? undefined;
    if (companyId) {
      const { data: company } = await supabase
        .from("companies")
        .select("name, logo_url, onboarding_status")
        .eq("id", companyId)
        .single();
      if (company) {
        companyName = (company as any).name ?? undefined;
        companyLogo = (company as any).logo_url ?? undefined;
        onboarding_status = ((company as any).onboarding_status as OnboardingStatus | undefined) ?? ONBOARDING_STATUS.NOT_STARTED;
      }
    }

    return {
      id: supabaseUser.id,
      name: (profile as any)?.full_name ?? supabaseUser.email?.split("@")[0] ?? "Usuário",
      email: supabaseUser.email || "",
      role,
      companyId,
      companyName,
      companyLogo,
      mustChangePassword: false,
      onboarding_status,
    };
  } catch (err) {
    console.error("Error building user from session:", err);
    return null;
  }
}

// ============================================================
// Auth Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(async () => {
            const appUser = await buildUserFromSession(session.user);
            setUser(appUser);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // 2. Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await buildUserFromSession(session.user);
        setUser(appUser);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Credenciais inválidas" };
      }
      if (error.message.includes("Email not confirmed")) {
        return { success: false, error: "Email não confirmado" };
      }
      return { success: false, error: error.message };
    }

    if (data.user) {
      const appUser = await buildUserFromSession(data.user);
      if (appUser) {
        setUser(appUser);
        return { success: true };
      }
    }

    return { success: false, error: "Erro ao carregar perfil do usuário" };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const switchRole = (_role: UserRole) => {
    // Disabled in production — users must log in with their own credentials
  };

  const changePassword = async (_currentPassword: string, newPassword: string): Promise<boolean> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error("Change password error:", error.message);
      return false;
    }
    if (user) {
      setUser({ ...user, mustChangePassword: false });
    }
    return true;
  };

  const startOnboarding = async (): Promise<void> => {
    if (user?.companyId) {
      const result = await updateCompanyOnboarding(user.companyId, ONBOARDING_STATUS.IN_PROGRESS);
      if (result.error) {
        throw result.error;
      }
      setUser({ ...user, onboarding_status: ONBOARDING_STATUS.IN_PROGRESS });
    }
  };

  const completeOnboarding = async (): Promise<{ id: string; onboarding_status: OnboardingStatus }> => {
    if (!user?.companyId) {
      throw new Error("Usuário sem empresa vinculada");
    }

    console.log("[Onboarding] companyId:", user.companyId);
    console.log("[Onboarding] salvando onboarding_status=concluido");

    const result = await updateCompanyOnboarding(user.companyId, ONBOARDING_STATUS.COMPLETED);

    console.log("[Onboarding] update result:", result);

    if (result.error) {
      console.error("[Onboarding] erro do Supabase:", result.error);
      throw result.error;
    }

    const company = await fetchCompanyOnboarding(user.companyId);

    console.log("[Portal] onboarding_status recebido do banco:", company?.onboarding_status ?? "not_found");

    if (!company || company.onboarding_status !== ONBOARDING_STATUS.COMPLETED) {
      throw new Error("onboarding_status não retornou como concluido após o update");
    }

    setUser({ ...user, onboarding_status: company.onboarding_status });

    return company;
  };

  const updateCompanyLogo = (logoUrl: string) => {
    if (user) {
      setUser({ ...user, companyLogo: logoUrl });
    }
  };

  const isAdminMVP = user?.role === "admin_mvp";

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdminMVP,
    isCliente: user?.role === "admin_empresa" || user?.role === "nucleo" || user?.role === "lideranca",
    isLoading,
    login,
    logout,
    switchRole,
    changePassword,
    startOnboarding,
    completeOnboarding,
    updateCompanyLogo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
