import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ImplementationPlan from "./pages/ImplementationPlan";
import Activities from "./pages/Activities";
import Indicators from "./pages/Indicators";
import Surveys from "./pages/Surveys";
import Reports from "./pages/Reports";
import Maturity from "./pages/Maturity";
import Companies from "./pages/Companies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plano" element={<ImplementationPlan />} />
          <Route path="/atividades" element={<Activities />} />
          <Route path="/indicadores" element={<Indicators />} />
          <Route path="/pesquisas" element={<Surveys />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/maturidade" element={<Maturity />} />
          <Route path="/empresas" element={<Companies />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
