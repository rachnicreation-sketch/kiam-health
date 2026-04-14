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
import PatientDetail from "./pages/PatientDetail";
import HumanResources from "./pages/HumanResources";
import GuardPlanning from "./pages/GuardPlanning";
import Consultations from "./pages/Consultations";
import Pharmacy from "./pages/Pharmacy";
import Laboratory from "./pages/Laboratory";
import Hospitalization from "./pages/Hospitalization";
import Appointments from "./pages/Appointments";
import Billing from "./pages/Billing";
import Accounting from "./pages/Accounting";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import ClinicLanding from "./pages/ClinicLanding";
import PatientPortal from "./pages/PatientPortal";
import { ModulePlaceholder } from "./pages/ModulePlaceholder";
import NotFound from "./pages/NotFound";
import { Calendar, BedDouble, FlaskConical, Building2, Settings, BarChart3, LineChart } from "lucide-react";

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
            
            {/* Public Clinic & Patient Routes */}
            <Route path="/:clinicId" element={<ClinicLanding />} />
            <Route path="/patient/:clinicId/login" element={<PatientPortal />} />

            <Route element={<AppLayout />}>
              <Route path="/saas/dashboard" element={<SaaSAdminDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/planning" element={<GuardPlanning />} />
              <Route path="/consultations" element={<Consultations />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/hospitalization" element={<Hospitalization />} />
              <Route path="/laboratory" element={<Laboratory />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/hr" element={<HumanResources />} />
              <Route path="/facilities" element={<ModulePlaceholder title="Établissements" description="Gestion multi-établissements" icon={Building2} />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
