import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ============================================================
// MVP Portal Authentication Context
// Simulates two access levels: Admin MVP (Master) and Portal Cliente
// Prepared for future real authentication integration
// ============================================================

export type UserRole = "admin_mvp" | "cliente";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string; // Only for 'cliente' role
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdminMVP: boolean;
  isCliente: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo/testing purposes
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "mvp_portal_auth";

// Demo users for testing
const DEMO_USERS: Record<string, User & { password: string }> = {
  "admin@mvp.com": {
    id: "admin-1",
    name: "Administrador MVP",
    email: "admin@mvp.com",
    role: "admin_mvp",
    password: "admin123",
  },
  "cliente@alpha.com": {
    id: "cliente-1",
    name: "Carlos Silva",
    email: "cliente@alpha.com",
    role: "cliente",
    companyId: "company-1",
    companyName: "Empresa Alpha",
    password: "cliente123",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } else {
        // Default to Admin MVP for demo
        setUser({
          id: "admin-1",
          name: "Administrador MVP",
          email: "admin@mvp.com",
          role: "admin_mvp",
        });
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
    }
  }, []);

  // Save user to storage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser && demoUser.password === password) {
      const { password: _, ...userData } = demoUser;
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // For demo: quickly switch between roles
  const switchRole = (role: UserRole) => {
    if (role === "admin_mvp") {
      setUser({
        id: "admin-1",
        name: "Administrador MVP",
        email: "admin@mvp.com",
        role: "admin_mvp",
      });
    } else {
      setUser({
        id: "cliente-1",
        name: "Carlos Silva",
        email: "cliente@alpha.com",
        role: "cliente",
        companyId: "company-1",
        companyName: "Empresa Alpha",
      });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdminMVP: user?.role === "admin_mvp",
    isCliente: user?.role === "cliente",
    login,
    logout,
    switchRole,
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
