import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { fetchCompanyById } from "@/lib/companyService";

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
  onboardingStatus?: string;
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
  completeOnboarding: () => Promise<void>;
  updateCompanyLogo: (logoUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// Helper: build User from Supabase session + profile + role
// ============================================================

async function buildUserFromSession(supabaseUser: SupabaseUser): Promise<User | null> {
  try {
    const statusMap: Record<string, string> = {
      not_started: "nao_iniciado",
      nao_iniciado: "nao_iniciado",
      in_progress: "em_andamento",
      em_andamento: "em_andamento",
      completed: "completed",
      concluido: "completed",
    };

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
    let companyOnboardingStatus: string | undefined;
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
        companyOnboardingStatus = (company as any).onboarding_status ?? undefined;
      }
    }

    // Determine onboarding status from Supabase company
    let onboardingStatus: string = statusMap[companyOnboardingStatus || ""] || "nao_iniciado";
    if (companyId) {
      const companyData = await fetchCompanyById(companyId);
      if (companyData) {
        onboardingStatus = statusMap[companyData.onboardingStatus] || "nao_iniciado";
        if (!companyName) companyName = companyData.name;
        if (!companyLogo) companyLogo = companyData.logo;
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
      onboardingStatus,
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
      const { updateCompanyOnboardingInSupabase } = await import("@/lib/companyService");
      const success = await updateCompanyOnboardingInSupabase(user.companyId, "in_progress");
      if (!success) {
        throw new Error("Falha ao persistir início do onboarding");
      }
      setUser({ ...user, onboardingStatus: "em_andamento" });
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    if (user?.companyId) {
      console.log("[Onboarding] salvando status concluido", user.companyId);

      const updateResult = await (supabase.from("companies") as any)
        .update({
          onboarding_status: "concluido",
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user.companyId)
        .select("id, onboarding_status")
        .single();

      if (updateResult.error) {
        console.error("[Onboarding] failed to persist completed status", updateResult.error);
        throw updateResult.error;
      }

      console.log("[Auth] onboarding_status persisted", updateResult.data?.onboarding_status);

      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const refreshedUser = await buildUserFromSession(authData.user);
        if (refreshedUser) {
          setUser(refreshedUser);
          return;
        }
      }

      setUser({ ...user, onboardingStatus: "completed" });
    }
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
