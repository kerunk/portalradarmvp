import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plano" element={<ImplementationPlan />} />
            <Route path="/ciclos" element={<MVPCycles />} />
            <Route path="/turmas" element={<Turmas />} />
            <Route path="/fatores" element={<SuccessFactors />} />
            <Route path="/praticas" element={<BestPracticesGlobal />} />
            <Route path="/registros" element={<Records />} />
            <Route path="/indicadores" element={<Indicators />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/maturidade" element={<Maturity />} />
            <Route path="/empresas" element={<Companies />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
