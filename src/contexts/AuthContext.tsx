import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getCompanies, updateCompanyOnboardingStatus, getCompanyById, setActiveCompany, type CompanyState, type OnboardingStatus } from "@/lib/storage";

// ============================================================
// MVP Portal Authentication Context
// Full governance with Admin MVP (Master) and Portal Cliente
// Supports password change, onboarding flow, and company isolation
// ============================================================

export type UserRole = "admin_mvp" | "cliente";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  mustChangePassword?: boolean;
  onboardingStatus?: OnboardingStatus;
  password?: string;
}

export interface LoginResult {
  success: boolean;
  locked?: boolean;
  remainingSeconds?: number;
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

const STORAGE_KEY = "mvp_portal_auth";
const USERS_KEY = "mvp_portal_users";
const LOGIN_ATTEMPTS_KEY = "mvp_login_attempts";

// Login lockout config
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface LoginAttemptRecord {
  count: number;
  lockedUntil: number | null;
}

function getLoginAttempts(email: string): LoginAttemptRecord {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (stored) {
      const records = JSON.parse(stored);
      return records[email.toLowerCase()] || { count: 0, lockedUntil: null };
    }
  } catch {}
  return { count: 0, lockedUntil: null };
}

function setLoginAttempts(email: string, record: LoginAttemptRecord) {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const records = stored ? JSON.parse(stored) : {};
    records[email.toLowerCase()] = record;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
  } catch {}
}

function clearLoginAttempts(email: string) {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (stored) {
      const records = JSON.parse(stored);
      delete records[email.toLowerCase()];
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
    }
  } catch {}
}

// Fixed Admin MVP user
const ADMIN_USER: User & { password: string } = {
  id: "admin-1",
  name: "Administrador MVP Master",
  email: "admin@radarmvp.com",
  role: "admin_mvp",
  password: "admin123",
  mustChangePassword: false,
  onboardingStatus: 'completed',
};

// Get all users (demo + created from companies)
function getAllUsers(): Record<string, User & { password: string }> {
  const users: Record<string, User & { password: string }> = {
    "admin@radarmvp.com": ADMIN_USER,
  };
  
  // Load custom users from storage
  try {
    const storedUsers = localStorage.getItem(USERS_KEY);
    if (storedUsers) {
      const parsed = JSON.parse(storedUsers);
      Object.assign(users, parsed);
    }
  } catch (e) {
    console.error("Error loading users:", e);
  }
  
  // Also create users from companies
  const companies = getCompanies();
  companies.forEach((company) => {
    if (!users[company.adminEmail.toLowerCase()]) {
      users[company.adminEmail.toLowerCase()] = {
        id: `user-${company.id}`,
        name: company.adminName,
        email: company.adminEmail,
        role: "cliente",
        companyId: company.id,
        companyName: company.name,
        companyLogo: company.logo,
        password: company.tempPassword,
        mustChangePassword: company.onboardingStatus === 'not_started',
        onboardingStatus: company.onboardingStatus,
      };
    }
  });
  
  // Demo client user (matching default company-1 admin email)
  if (!users["admin@alpha.com"]) {
    users["admin@alpha.com"] = {
      id: "cliente-1",
      name: "Carlos Silva",
      email: "admin@alpha.com",
      role: "cliente",
      companyId: "company-1",
      companyName: "Empresa Alpha",
      password: "cliente123",
      mustChangePassword: false,
      onboardingStatus: "completed",
    };
  }
  
  return users;
}

function saveUser(user: User & { password: string }): void {
  try {
    const storedUsers = localStorage.getItem(USERS_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    users[user.email.toLowerCase()] = user;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Error saving user:", e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Set active company for scoped storage
        setActiveCompany(parsed.role === 'cliente' ? parsed.companyId || null : null);
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
    }
    setIsLoading(false);
  }, []);

  // Save user to storage when it changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // localStorage full — clear stale keys and retry
      console.warn("localStorage quota exceeded, clearing stale data...", e);
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('mvp_portal_company_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        if (user) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        }
      } catch (retryError) {
        console.error("Failed to save auth state even after cleanup:", retryError);
      }
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; locked?: boolean; remainingSeconds?: number }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check lockout
    const attempts = getLoginAttempts(email);
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      return { success: false, locked: true, remainingSeconds };
    }

    // If lockout expired, reset
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      clearLoginAttempts(email);
    }
    
    const users = getAllUsers();
    const foundUser = users[email.toLowerCase()];
    
    if (foundUser && foundUser.password === password) {
      clearLoginAttempts(email);
      const { password: _, ...userData } = foundUser;
      setActiveCompany(userData.role === 'cliente' ? userData.companyId || null : null);
      setUser(userData);
      return { success: true };
    }

    // Record failed attempt
    const current = getLoginAttempts(email);
    const newCount = current.count + 1;
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      setLoginAttempts(email, { count: newCount, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
      return { success: false, locked: true, remainingSeconds: LOCKOUT_DURATION_MS / 1000 };
    }
    setLoginAttempts(email, { count: newCount, lockedUntil: null });
    return { success: false };
  };

  const logout = () => {
    setUser(null);
    setActiveCompany(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchRole = (role: UserRole) => {
  if (role === "admin_mvp") {
      setActiveCompany(null);
      setUser({
        id: "admin-1",
        name: "Administrador MVP Master",
        email: "admin@radarmvp.com",
        role: "admin_mvp",
      });
    } else {
      setActiveCompany("company-1");
      setUser({
        id: "cliente-1",
        name: "Carlos Silva",
        email: "admin@alpha.com",
        role: "cliente",
        companyId: "company-1",
        companyName: "Empresa Alpha",
      });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const users = getAllUsers();
    const foundUser = users[user.email.toLowerCase()];
    
    if (foundUser && foundUser.password === currentPassword) {
      // Determine new onboarding status after password change
      let newOnboardingStatus = foundUser.onboardingStatus;
      if (foundUser.onboardingStatus === 'not_started') {
        newOnboardingStatus = 'in_progress';
        // Update company onboarding status in storage
        if (foundUser.companyId) {
          updateCompanyOnboardingStatus(foundUser.companyId, 'in_progress');
        }
      }
      
      const updatedUser = {
        ...foundUser,
        password: newPassword,
        mustChangePassword: false,
        onboardingStatus: newOnboardingStatus,
      };
      saveUser(updatedUser);
      
      setUser({
        ...user,
        mustChangePassword: false,
        onboardingStatus: newOnboardingStatus,
      });
      
      return true;
    }
    return false;
  };

  const startOnboarding = async (): Promise<void> => {
    if (!user || !user.companyId) return;
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update company status to in_progress if not already
    if (user.onboardingStatus === 'not_started') {
      updateCompanyOnboardingStatus(user.companyId, 'in_progress');
      
      const users = getAllUsers();
      const foundUser = users[user.email.toLowerCase()];
      if (foundUser) {
        const updatedUser = { ...foundUser, onboardingStatus: 'in_progress' as OnboardingStatus };
        saveUser(updatedUser);
      }
      
      setUser({
        ...user,
        onboardingStatus: 'in_progress',
      });
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    if (!user) return;
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const users = getAllUsers();
    const foundUser = users[user.email.toLowerCase()];
    
    if (foundUser) {
      const updatedUser = {
        ...foundUser,
        onboardingStatus: 'completed' as OnboardingStatus,
      };
      saveUser(updatedUser);
      
      // Update company onboarding status in storage
      if (user.companyId) {
        updateCompanyOnboardingStatus(user.companyId, 'completed');
      }
      
      setUser({
        ...user,
        onboardingStatus: 'completed',
      });
    }
  };

  const updateCompanyLogo = (logoUrl: string) => {
    if (!user) return;
    
    setUser({
      ...user,
      companyLogo: logoUrl,
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdminMVP: user?.role === "admin_mvp",
    isCliente: user?.role === "cliente",
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
