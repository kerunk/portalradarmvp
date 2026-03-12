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
import Onboarding from "./pages/Onboarding";

// Protected pages
import Dashboard from "./pages/Dashboard";
import ImplementationPlan from "./pages/ImplementationPlan";
import Records from "./pages/Records";
import Indicators from "./pages/Indicators";
import Reports from "./pages/Reports";
import Maturity from "./pages/Maturity";
import Companies from "./pages/Companies";
import MVPCycles from "./pages/MVPCycles";
import Turmas from "./pages/Turmas";
import SuccessFactors from "./pages/SuccessFactors";
import BestPracticesGlobal from "./pages/BestPracticesGlobal";
import Settings from "./pages/Settings";
import BasePopulacional from "./pages/BasePopulacional";
import OrgStructure from "./pages/OrgStructure";
import NucleoGovernance from "./pages/NucleoGovernance";
import HelpCenter from "./pages/HelpCenter";
import UserManagement from "./pages/UserManagement";
import ManualEditor from "./pages/ManualEditor";
import IndicatorSettings from "./pages/IndicatorSettings";
import AdminHelp from "./pages/AdminHelp";

import CompanyMirror from "./pages/CompanyMirror";
import ManagerPortfolio from "./pages/ManagerPortfolio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/onboarding" element={<Onboarding />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/plano" element={<ProtectedRoute><ImplementationPlan /></ProtectedRoute>} />
            <Route path="/ciclos" element={<ProtectedRoute><MVPCycles /></ProtectedRoute>} />
            <Route path="/turmas" element={<ProtectedRoute><Turmas /></ProtectedRoute>} />
            <Route path="/fatores" element={<ProtectedRoute><SuccessFactors /></ProtectedRoute>} />
            <Route path="/registros" element={<ProtectedRoute><Records /></ProtectedRoute>} />
            <Route path="/indicadores" element={<ProtectedRoute><Indicators /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/maturidade" element={<ProtectedRoute><Maturity /></ProtectedRoute>} />
            <Route path="/estrutura" element={<ProtectedRoute><OrgStructure /></ProtectedRoute>} />
            <Route path="/base-populacional" element={<ProtectedRoute><BasePopulacional /></ProtectedRoute>} />
            <Route path="/nucleo" element={<ProtectedRoute><NucleoGovernance /></ProtectedRoute>} />
            <Route path="/ajuda" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
            
            <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* Admin Only Routes */}
            <Route path="/empresas" element={<ProtectedRoute requireAdmin><Companies /></ProtectedRoute>} />
            <Route path="/empresas/:companyId" element={<ProtectedRoute requireAdmin><CompanyMirror /></ProtectedRoute>} />
            <Route path="/praticas" element={<ProtectedRoute requireAdmin><BestPracticesGlobal /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute requireAdmin><UserManagement /></ProtectedRoute>} />
            <Route path="/manual-editor" element={<ProtectedRoute requireAdmin><ManualEditor /></ProtectedRoute>} />
            <Route path="/config-indicadores" element={<ProtectedRoute requireAdmin><IndicatorSettings /></ProtectedRoute>} />
            <Route path="/admin-ajuda" element={<ProtectedRoute requireAdmin><AdminHelp /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </ReadOnlyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
