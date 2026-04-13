import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SaaSAdminDashboard from "./pages/SaaSAdminDashboard";
import Patients from "./pages/Patients";
import Consultations from "./pages/Consultations";
import Pharmacy from "./pages/Pharmacy";
import Billing from "./pages/Billing";
import { ModulePlaceholder } from "./pages/ModulePlaceholder";
import NotFound from "./pages/NotFound";
import { Calendar, BedDouble, FlaskConical, UserCog, Building2, Settings } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/saas/dashboard" element={<SaaSAdminDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/consultations" element={<Consultations />} />
              <Route path="/appointments" element={<ModulePlaceholder title="Rendez-vous" description="Gestion et planification des rendez-vous" icon={Calendar} />} />
              <Route path="/hospitalization" element={<ModulePlaceholder title="Hospitalisation" description="Gestion des admissions, lits et séjours" icon={BedDouble} />} />
              <Route path="/laboratory" element={<ModulePlaceholder title="Laboratoire" description="Gestion des analyses et résultats" icon={FlaskConical} />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/hr" element={<ModulePlaceholder title="Ressources humaines" description="Gestion du personnel et plannings" icon={UserCog} />} />
              <Route path="/facilities" element={<ModulePlaceholder title="Établissements" description="Gestion multi-établissements" icon={Building2} />} />
              <Route path="/settings" element={<ModulePlaceholder title="Paramètres" description="Configuration de la plateforme" icon={Settings} />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
