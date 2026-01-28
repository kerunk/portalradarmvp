import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isAdminMVP } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User must change password first
  if (user.mustChangePassword && location.pathname !== "/alterar-senha") {
    return <Navigate to="/alterar-senha" replace />;
  }

  // User needs onboarding (only for clients with incomplete onboarding)
  if (
    user.onboardingStatus !== 'completed' && 
    user.role === "cliente" && 
    location.pathname !== "/onboarding" &&
    location.pathname !== "/alterar-senha"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  // Route requires admin but user is not admin
  if (requireAdmin && !isAdminMVP) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
