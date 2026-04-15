import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Catalogs from "./pages/Catalogs";
import SettingsPage from "./pages/Settings";
import Facilities from "./pages/Facilities";
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
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Public Clinic & Patient Routes */}
            <Route path="/:clinicId" element={<ClinicLanding />} />
            <Route path="/patient/:clinicId/login" element={<PatientPortal />} />

            <Route element={<AppLayout />}>
              <Route path="/saas/dashboard" element={<ProtectedRoute module="saas"><SaaSAdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute module="patients"><Patients /></ProtectedRoute>} />
              <Route path="/patients/:id" element={<ProtectedRoute module="patients"><PatientDetail /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute module="planning"><GuardPlanning /></ProtectedRoute>} />
              <Route path="/consultations" element={<ProtectedRoute module="consultations"><Consultations /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute module="appointments"><Appointments /></ProtectedRoute>} />
              <Route path="/hospitalization" element={<ProtectedRoute module="hospitalization"><Hospitalization /></ProtectedRoute>} />
              <Route path="/laboratory" element={<ProtectedRoute module="laboratory"><Laboratory /></ProtectedRoute>} />
              <Route path="/pharmacy" element={<ProtectedRoute module="pharmacy"><Pharmacy /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute module="billing"><Billing /></ProtectedRoute>} />
              <Route path="/accounting" element={<ProtectedRoute module="accounting"><Accounting /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
              <Route path="/hr" element={<ProtectedRoute module="hr"><HumanResources /></ProtectedRoute>} />
              <Route path="/catalogs" element={<ProtectedRoute module="catalogs"><Catalogs /></ProtectedRoute>} />
              <Route path="/facilities" element={<ProtectedRoute module="facilities"><Facilities /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
