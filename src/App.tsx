import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReadOnlyProvider } from "@/contexts/ReadOnlyContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
import Indicators from "./pages/Indicators";
import Reports from "./pages/Reports";
import Companies from "./pages/Companies";
import MVPCycles from "./pages/MVPCycles";
import Turmas from "./pages/Turmas";
import SuccessFactors from "./pages/SuccessFactors";
import BestPracticesGlobal from "./pages/BestPracticesGlobal";
import SuccessFactorsGlobal from "./pages/SuccessFactorsGlobal";
import Settings from "./pages/Settings";
import BasePopulacional from "./pages/BasePopulacional";
import OrgStructure from "./pages/OrgStructure";
import NucleoGovernance from "./pages/NucleoGovernance";
import HelpCenter from "./pages/HelpCenter";
import AdminHelp from "./pages/AdminHelp";
import CompanyMirror from "./pages/CompanyMirror";
import DelayedActions from "./pages/DelayedActions";
import ActiveCycles from "./pages/ActiveCycles";
import AdminTurmas from "./pages/AdminTurmas";
import NotificationCenter from "./pages/NotificationCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ReadOnlyProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/alterar-senha" element={<ChangePassword />} />
            
            {/* Protected Routes — Client */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/ciclos" element={<ProtectedRoute><MVPCycles /></ProtectedRoute>} />
            <Route path="/turmas" element={<ProtectedRoute><Turmas /></ProtectedRoute>} />
            <Route path="/fatores" element={<ProtectedRoute><SuccessFactors /></ProtectedRoute>} />
            <Route path="/registros" element={<ProtectedRoute><Records /></ProtectedRoute>} />
            <Route path="/indicadores" element={<ProtectedRoute><Indicators /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/estrutura" element={<ProtectedRoute><OrgStructure /></ProtectedRoute>} />
            <Route path="/base-populacional" element={<ProtectedRoute><BasePopulacional /></ProtectedRoute>} />
            <Route path="/nucleo" element={<ProtectedRoute><NucleoGovernance /></ProtectedRoute>} />
            <Route path="/ajuda" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* Admin Only Routes */}
            <Route path="/empresas" element={<ProtectedRoute requireAdmin><Companies /></ProtectedRoute>} />
            <Route path="/empresas/:companyId" element={<ProtectedRoute requireAdmin><CompanyMirror /></ProtectedRoute>} />
            <Route path="/praticas" element={<ProtectedRoute requireAdmin><BestPracticesGlobal /></ProtectedRoute>} />
            <Route path="/fatores-globais" element={<ProtectedRoute requireAdmin><SuccessFactorsGlobal /></ProtectedRoute>} />
            <Route path="/admin-ajuda" element={<ProtectedRoute requireAdmin><AdminHelp /></ProtectedRoute>} />
            <Route path="/acoes-atrasadas" element={<ProtectedRoute requireAdmin><DelayedActions /></ProtectedRoute>} />
            <Route path="/ciclos-ativos" element={<ProtectedRoute requireAdmin><ActiveCycles /></ProtectedRoute>} />
            <Route path="/admin-turmas" element={<ProtectedRoute requireAdmin><AdminTurmas /></ProtectedRoute>} />
            <Route path="/notificacoes" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ReadOnlyProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
