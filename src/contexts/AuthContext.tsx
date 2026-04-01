import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getCompanies, updateCompanyOnboardingStatus, setActiveCompany, getCompanyById, type OnboardingStatus } from "@/lib/storage";
import { emitOnboardingStarted, emitOnboardingCompleted } from "@/lib/operationalEvents";
import { addAuditEntry } from "@/lib/auditLog";

// ============================================================
// MVP Portal Authentication Context
// Full governance with Admin MVP (Master) and Portal Cliente
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
}

export interface LoginResult {
  success: boolean;
  locked?: boolean;
  inactive?: boolean;
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

// Auth session: only stores minimal user info (NO passwords, NO heavy data)
const SESSION_KEY = "mvp_auth_session";
// User credentials: lightweight map of email -> {password, mustChangePassword}
const CREDENTIALS_KEY = "mvp_credentials";
const LOGIN_ATTEMPTS_KEY = "mvp_login_attempts";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

interface LoginAttemptRecord {
  count: number;
  lockedUntil: number | null;
}

interface UserCredential {
  password: string;
  mustChangePassword: boolean;
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

// ============================================================
// Credentials Store - lightweight, separate from heavy app data
// ============================================================

function getCredentials(): Record<string, UserCredential> {
  try {
    const stored = localStorage.getItem(CREDENTIALS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveCredentials(creds: Record<string, UserCredential>): boolean {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    return true;
  } catch (e) {
    // If quota exceeded, clean heavy data and retry
    console.warn("Credentials save failed, cleaning heavy data...", e);
    cleanHeavyStorageData();
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
      return true;
    } catch {
      console.error("CRITICAL: Cannot save credentials even after cleanup");
      return false;
    }
  }
}

function setCredential(email: string, cred: UserCredential): boolean {
  const creds = getCredentials();
  creds[email.toLowerCase()] = cred;
  return saveCredentials(creds);
}

function getCredential(email: string): UserCredential | null {
  const creds = getCredentials();
  return creds[email.toLowerCase()] || null;
}

// ============================================================
// Default credentials (hardcoded fallbacks)
// ============================================================

const DEFAULT_CREDENTIALS: Record<string, { password: string; mustChangePassword: boolean }> = {
  "admin@radarmvp.com": { password: "admin123", mustChangePassword: true },
  "admin@alpha.com": { password: "cliente123", mustChangePassword: true },
};

// Get effective credential: saved overrides defaults
function getEffectiveCredential(email: string): UserCredential | null {
  const saved = getCredential(email);
  if (saved) return saved;
  
  const defaultCred = DEFAULT_CREDENTIALS[email.toLowerCase()];
  if (defaultCred) return defaultCred;
  
  return null;
}

// ============================================================
// User profile resolution (no passwords stored here)
// ============================================================

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  onboardingStatus?: OnboardingStatus;
}

function resolveUserProfile(email: string): UserProfile | null {
  const lower = email.toLowerCase();
  
  // Admin master
  if (lower === "admin@radarmvp.com") {
    return {
      id: "admin-1",
      name: "Administrador MVP Master",
      email: "admin@radarmvp.com",
      role: "admin_mvp",
      onboardingStatus: "completed",
    };
  }

  // Check managed admin users
  try {
    const storedUsers = localStorage.getItem("mvp_managed_users_v2");
    if (storedUsers) {
      const managed = JSON.parse(storedUsers) as Array<{
        id: string; name: string; email: string; active: boolean;
      }>;
      const found = managed.find(u => u.email.toLowerCase() === lower && u.active !== false);
      if (found) {
        return {
          id: found.id,
          name: found.name,
          email: found.email,
          role: "admin_mvp",
          onboardingStatus: "completed",
        };
      }
    }
  } catch {}

  // Demo client
  if (lower === "admin@alpha.com") {
    return {
      id: "cliente-1",
      name: "Carlos Silva",
      email: "admin@alpha.com",
      role: "cliente",
      companyId: "company-1",
      companyName: "Empresa Alpha",
      onboardingStatus: "completed",
    };
  }

  // Company admin users
  try {
    const companies = getCompanies();
    const company = companies.find(c => c.adminEmail.toLowerCase() === lower);
    if (company) {
      // Block inactive companies
      if (company.active === false) {
        return null; // Will be handled in login with specific message
      }
      return {
        id: `user-${company.id}`,
        name: company.adminName,
        email: company.adminEmail,
        role: "cliente",
        companyId: company.id,
        companyName: company.name,
        companyLogo: company.logo,
        onboardingStatus: company.onboardingStatus,
      };
    }
  } catch {}

  return null;
}

// ============================================================
// Heavy data cleanup (frees space for critical auth data)
// ============================================================

function cleanHeavyStorageData() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('mvp_portal_company_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  
  // Also remove legacy heavy keys
  const legacyHeavyKeys = ['mvp_portal_data', 'mvp_portal_auth', 'mvp_portal_users'];
  legacyHeavyKeys.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
}

// ============================================================
// Session persistence (minimal data only)
// ============================================================

function saveSession(user: User): boolean {
  try {
    // Only store minimal session data — NO passwords
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.companyName,
      mustChangePassword: user.mustChangePassword,
      onboardingStatus: user.onboardingStatus,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (e) {
    console.warn("Session save failed, cleaning heavy data...", e);
    cleanHeavyStorageData();
    try {
      const session = {
        id: user.id, name: user.name, email: user.email, role: user.role,
        companyId: user.companyId, companyName: user.companyName,
        mustChangePassword: user.mustChangePassword, onboardingStatus: user.onboardingStatus,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    } catch {
      console.error("CRITICAL: Cannot save session");
      return false;
    }
  }
}

function loadSession(): User | null {
  try {
    // Try new key first, then legacy fallback
    const stored = localStorage.getItem(SESSION_KEY) || localStorage.getItem("mvp_portal_auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Strip password if it was stored by old code
      const { password: _, ...userData } = parsed;
      return userData as User;
    }
  } catch {}
  return null;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("mvp_portal_auth"); // clean legacy
}

// ============================================================
// Auth Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser(session);
      setActiveCompany(session.role === 'cliente' ? session.companyId || null : null);
    }
    setIsLoading(false);
  }, []);

  // Persist session on user change
  useEffect(() => {
    if (user) {
      saveSession(user);
    } else {
      clearSession();
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check lockout
    const attempts = getLoginAttempts(email);
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      return { success: false, locked: true, remainingSeconds };
    }
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      clearLoginAttempts(email);
    }
    
    // Resolve credential
    const credential = getEffectiveCredential(email);
    if (!credential) {
      // Also check company temp passwords
      try {
        const companies = getCompanies();
        const company = companies.find(c => c.adminEmail.toLowerCase() === email.toLowerCase());
        if (company) {
          // Block inactive companies
          if (company.active === false) {
            return { success: false, inactive: true };
          }
          if (company.tempPassword === password) {
            // Check if there's a saved credential that overrides the temp password
            const saved = getCredential(email);
            if (saved) {
              // User already changed password — temp password no longer valid
              if (saved.password !== password) {
                const current = getLoginAttempts(email);
                const newCount = current.count + 1;
                if (newCount >= MAX_LOGIN_ATTEMPTS) {
                  setLoginAttempts(email, { count: newCount, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
                  return { success: false, locked: true, remainingSeconds: LOCKOUT_DURATION_MS / 1000 };
                }
                setLoginAttempts(email, { count: newCount, lockedUntil: null });
                return { success: false };
              }
            }
            
            clearLoginAttempts(email);
            const profile = resolveUserProfile(email);
            if (profile) {
              const mustChange = company.onboardingStatus === 'not_started';
              setActiveCompany(profile.companyId || null);
              setUser({ ...profile, mustChangePassword: mustChange });
              return { success: true };
            }
          }
        }
      } catch {}
      
      const current = getLoginAttempts(email);
      const newCount = current.count + 1;
      if (newCount >= MAX_LOGIN_ATTEMPTS) {
        setLoginAttempts(email, { count: newCount, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
        return { success: false, locked: true, remainingSeconds: LOCKOUT_DURATION_MS / 1000 };
      }
      setLoginAttempts(email, { count: newCount, lockedUntil: null });
      return { success: false };
    }
    
    if (credential.password === password) {
      // Check if it's an inactive company
      try {
        const companies = getCompanies();
        const company = companies.find(c => c.adminEmail.toLowerCase() === email.toLowerCase());
        if (company && company.active === false) {
          return { success: false, inactive: true };
        }
      } catch {}
      
      clearLoginAttempts(email);
      const profile = resolveUserProfile(email);
      if (!profile) return { success: false };
      
      setActiveCompany(profile.role === 'cliente' ? profile.companyId || null : null);
      setUser({ ...profile, mustChangePassword: credential.mustChangePassword });
      addAuditEntry({
        actorEmail: email, actorName: profile.name,
        action: "login_success", entityType: "user",
        entityId: email, entityLabel: profile.name,
      });
      return { success: true };
    }

    // Failed attempt
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
    clearSession();
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
    
    const email = user.email.toLowerCase();
    const credential = getEffectiveCredential(email);
    
    if (!credential || credential.password !== currentPassword) {
      return false;
    }
    
    // Save the new credential — this MUST succeed
    const saved = setCredential(email, {
      password: newPassword,
      mustChangePassword: false,
    });
    
    if (!saved) {
      console.error("CRITICAL: Failed to save new password!");
      return false;
    }
    
    // Verify the save actually worked
    const verification = getCredential(email);
    if (!verification || verification.password !== newPassword) {
      console.error("CRITICAL: Password verification failed after save!");
      return false;
    }
    
    // Update onboarding status if needed
    let newOnboardingStatus = user.onboardingStatus;
    if (user.onboardingStatus === 'not_started' && user.companyId) {
      newOnboardingStatus = 'in_progress';
      updateCompanyOnboardingStatus(user.companyId, 'in_progress');
    }
    
    setUser({
      ...user,
      mustChangePassword: false,
      onboardingStatus: newOnboardingStatus,
    });
    
    addAuditEntry({
      actorEmail: email, actorName: user.name,
      action: "password_changed", entityType: "user",
      entityId: email, entityLabel: user.name,
    });
    
    return true;
  };

  const startOnboarding = async (): Promise<void> => {
    if (!user || !user.companyId) return;
    await new Promise(resolve => setTimeout(resolve, 100));
    if (user.onboardingStatus === 'not_started') {
      updateCompanyOnboardingStatus(user.companyId, 'in_progress');
      setUser({ ...user, onboardingStatus: 'in_progress' });
      const company = getCompanyById(user.companyId);
      if (company) emitOnboardingStarted(company.name, company.id);
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    if (!user) return;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (user.companyId) {
      updateCompanyOnboardingStatus(user.companyId, 'completed');
      const company = getCompanyById(user.companyId);
      if (company) emitOnboardingCompleted(company.name, company.id);
    }
    
    setUser({ ...user, onboardingStatus: 'completed' });
  };

  const updateCompanyLogo = (logoUrl: string) => {
    if (!user) return;
    setUser({ ...user, companyLogo: logoUrl });
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
