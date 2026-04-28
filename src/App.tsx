import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/store/StoreContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Projects from "./pages/Projects.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import TPRM from "./pages/TPRM.tsx";
import AssessmentDetail from "./pages/AssessmentDetail.tsx";
import Reports from "./pages/Reports.tsx";
import SupplierPortal from "./pages/SupplierPortal.tsx";
import Questionnaire from "./pages/Questionnaire.tsx";
import { RiskAnalysis, SecurityRequirements, SecureCodeReview, SecurityTesting, Compliance } from "./pages/Modules.tsx";
import Invites from "./pages/Invites.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            {/* Consultant + Client */}
            <Route path="/dashboard" element={<ProtectedRoute allow={["consultant", "client"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute allow={["consultant", "client"]}><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id" element={<ProtectedRoute allow={["consultant", "client"]}><ProjectDetail /></ProtectedRoute>} />
            <Route path="/tprm" element={<ProtectedRoute allow={["consultant", "client"]}><TPRM /></ProtectedRoute>} />
            <Route path="/tprm/assessments/:id" element={<ProtectedRoute allow={["consultant", "client"]}><AssessmentDetail /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allow={["consultant", "client"]}><Reports /></ProtectedRoute>} />
            <Route path="/invites" element={<ProtectedRoute allow={["consultant"]}><Invites /></ProtectedRoute>} />

            {/* Module placeholders — consultant only */}
            <Route path="/modules/risk-analysis" element={<ProtectedRoute allow={["consultant"]}><RiskAnalysis /></ProtectedRoute>} />
            <Route path="/modules/security-requirements" element={<ProtectedRoute allow={["consultant"]}><SecurityRequirements /></ProtectedRoute>} />
            <Route path="/modules/secure-code-review" element={<ProtectedRoute allow={["consultant"]}><SecureCodeReview /></ProtectedRoute>} />
            <Route path="/modules/security-testing" element={<ProtectedRoute allow={["consultant"]}><SecurityTesting /></ProtectedRoute>} />
            <Route path="/modules/compliance" element={<ProtectedRoute allow={["consultant"]}><Compliance /></ProtectedRoute>} />

            {/* Supplier only */}
            <Route path="/supplier/portal" element={<ProtectedRoute allow={["supplier"]}><SupplierPortal /></ProtectedRoute>} />
            <Route path="/supplier/questionnaire/:id" element={<ProtectedRoute allow={["supplier", "consultant"]}><Questionnaire /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </StoreProvider>
  </QueryClientProvider>
);

export default App;
