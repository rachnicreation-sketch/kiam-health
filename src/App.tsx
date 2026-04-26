import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Core Pages
import Login from "./core/pages/Login";
import Register from "./core/pages/Register";
import LandingPage from "./core/pages/LandingPage";
import SaaSAdminDashboard from "./core/pages/SaaSAdminDashboard";
import NotFound from "./core/pages/NotFound";
import { ModulePlaceholder } from "./core/pages/ModulePlaceholder";

// KIAM Health Module Pages
import Dashboard from "./modules/health/pages/Dashboard";
import Patients from "./modules/health/pages/Patients";
import PatientDetail from "./modules/health/pages/PatientDetail";
import HumanResources from "./modules/health/pages/HumanResources";
import GuardPlanning from "./modules/health/pages/GuardPlanning";
import Consultations from "./modules/health/pages/Consultations";
import Pharmacy from "./modules/health/pages/Pharmacy";
import Laboratory from "./modules/health/pages/Laboratory";
import Hospitalization from "./modules/health/pages/Hospitalization";
import Appointments from "./modules/health/pages/Appointments";
import Billing from "./modules/health/pages/Billing";
import Accounting from "./modules/health/pages/Accounting";
import Reports from "./modules/health/pages/Reports";
import Catalogs from "./modules/health/pages/Catalogs";
import SettingsPage from "./modules/health/pages/Settings";
import Facilities from "./modules/health/pages/Facilities";
import ClinicLanding from "./modules/health/pages/ClinicLanding";
import PatientPortal from "./modules/health/pages/PatientPortal";
import Messaging from "./modules/health/pages/Messaging";

// NEW MODULES DASHBOARDS
import HotelDashboard from "./modules/hotel/pages/HotelDashboard";
import Rooms from "./modules/hotel/pages/Rooms";
import Bookings from "./modules/hotel/pages/Bookings";
// KIAM SCHOOL MODULE PAGES
import SchoolDashboard from "./modules/school/pages/SchoolDashboard";
import Students from "./modules/school/pages/Students";
import Classes from "./modules/school/pages/Classes";
import Grades from "./modules/school/pages/Grades";
import Attendance from "./modules/school/pages/Attendance";
import Payments from "./modules/school/pages/Payments";
import Schedule from "./modules/school/pages/Schedule";
import Elearning from "./modules/school/pages/Elearning";
import PointOfSale from "./modules/erp/pages/PointOfSale";
import InventoryManager from "./modules/erp/pages/InventoryManager";
import ErpTransactions from "./modules/erp/pages/ErpTransactions";
import ErpDashboard from "./modules/erp/pages/ErpDashboard";
import PharmacyDashboard from "./modules/pharmacy/pages/PharmacyDashboard";
import EnterpriseDashboard from "./modules/enterprise/pages/EnterpriseDashboard";

// NEW SAAS ADMIN MODULES
import SaaSTenants from "./core/pages/saas/SaaSTenants";
import SaaSBilling from "./core/pages/saas/SaaSBilling";
import SaaSModules from "./core/pages/saas/SaaSModules";
import SaaSMarketing from "./core/pages/saas/SaaSMarketing";
import SaaSUsers from "./core/pages/saas/SaaSUsers";
import SaaSSettings from "./core/pages/saas/SaaSSettings";
import SaaSTenantProfile from "./core/pages/saas/SaaSTenantProfile";
import SaaSSupport from "./core/pages/saas/SaaSSupport";
import SaaSSecurity from "./core/pages/saas/SaaSSecurity";
import SaaSHealth from "./core/pages/saas/SaaSHealth";
import SaaSAI from "./core/pages/saas/SaaSAI";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public Clinic & Patient Routes */}
            <Route path="/:clinicId" element={<ClinicLanding />} />
            <Route path="/patient/:clinicId/login" element={<PatientPortal />} />

            <Route element={<AppLayout />}>
              <Route path="/saas/dashboard" element={<ProtectedRoute module="saas"><SaaSAdminDashboard /></ProtectedRoute>} />
              <Route path="/saas/tenants" element={<ProtectedRoute module="saas"><SaaSTenants /></ProtectedRoute>} />
              <Route path="/saas/tenants/:id" element={<ProtectedRoute module="saas"><SaaSTenantProfile /></ProtectedRoute>} />
              <Route path="/saas/billing" element={<ProtectedRoute module="saas"><SaaSBilling /></ProtectedRoute>} />
              <Route path="/saas/modules" element={<ProtectedRoute module="saas"><SaaSModules /></ProtectedRoute>} />
              <Route path="/saas/marketing" element={<ProtectedRoute module="saas"><SaaSMarketing /></ProtectedRoute>} />
              <Route path="/saas/support" element={<ProtectedRoute module="saas"><SaaSSupport /></ProtectedRoute>} />
              <Route path="/saas/security" element={<ProtectedRoute module="saas"><SaaSSecurity /></ProtectedRoute>} />
              <Route path="/saas/health" element={<ProtectedRoute module="saas"><SaaSHealth /></ProtectedRoute>} />
              <Route path="/saas/ai" element={<ProtectedRoute module="saas"><SaaSAI /></ProtectedRoute>} />
              <Route path="/saas/users" element={<ProtectedRoute module="saas"><SaaSUsers /></ProtectedRoute>} />
              <Route path="/saas/settings" element={<ProtectedRoute module="saas"><SaaSSettings /></ProtectedRoute>} />
              
              {/* KIAM HEALTH ROUTES */}
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
              <Route path="/messages" element={<Messaging />} />
              <Route path="/catalogs" element={<ProtectedRoute module="catalogs"><Catalogs /></ProtectedRoute>} />
              <Route path="/facilities" element={<ProtectedRoute module="facilities"><Facilities /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />

              {/* KIAM HOTEL ROUTES */}
              <Route path="/hotel" element={<ProtectedRoute module="hotel"><HotelDashboard /></ProtectedRoute>} />
              <Route path="/hotel/dashboard" element={<ProtectedRoute module="hotel"><HotelDashboard /></ProtectedRoute>} />
              <Route path="/hotel/rooms" element={<ProtectedRoute module="hotel"><Rooms /></ProtectedRoute>} />
              <Route path="/hotel/bookings" element={<ProtectedRoute module="hotel"><Bookings /></ProtectedRoute>} />
              <Route path="/hotel/*" element={<ProtectedRoute module="hotel"><ModulePlaceholder /></ProtectedRoute>} />

              {/* KIAM SCHOOL ROUTES */}
              <Route path="/school" element={<ProtectedRoute module="school"><SchoolDashboard /></ProtectedRoute>} />
              <Route path="/school/dashboard" element={<ProtectedRoute module="school"><SchoolDashboard /></ProtectedRoute>} />
              <Route path="/school/students" element={<ProtectedRoute module="school"><Students /></ProtectedRoute>} />
              <Route path="/school/classes" element={<ProtectedRoute module="school"><Classes /></ProtectedRoute>} />
              <Route path="/school/grades" element={<ProtectedRoute module="school"><Grades /></ProtectedRoute>} />
              <Route path="/school/attendance" element={<ProtectedRoute module="school"><Attendance /></ProtectedRoute>} />
              <Route path="/school/payments" element={<ProtectedRoute module="school"><Payments /></ProtectedRoute>} />
              <Route path="/school/schedule" element={<ProtectedRoute module="school"><Schedule /></ProtectedRoute>} />
              <Route path="/school/learning" element={<ProtectedRoute module="school"><Elearning /></ProtectedRoute>} />

              {/* KIAM ERP / SHOP ROUTES */}
              <Route path="/erp" element={<ProtectedRoute module="erp"><ErpDashboard /></ProtectedRoute>} />
              <Route path="/erp/pos" element={<ProtectedRoute module="erp"><PointOfSale /></ProtectedRoute>} />
              <Route path="/erp/inventory" element={<ProtectedRoute module="erp"><InventoryManager /></ProtectedRoute>} />
              <Route path="/erp/transactions" element={<ProtectedRoute module="erp"><ErpTransactions /></ProtectedRoute>} />
              <Route path="/erp/dashboard" element={<ProtectedRoute module="erp"><ErpDashboard /></ProtectedRoute>} />
              <Route path="/erp/settings" element={<ProtectedRoute module="erp"><ModulePlaceholder title="Paramètres ERP" /></ProtectedRoute>} />
              <Route path="/erp/*" element={<ProtectedRoute module="erp"><ModulePlaceholder /></ProtectedRoute>} />
              
              {/* KIAM PHARMACY ROUTES */}
              <Route path="/pharmacy/dashboard" element={<ProtectedRoute module="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
              <Route path="/pharmacy/*" element={<ProtectedRoute module="pharmacy"><ModulePlaceholder /></ProtectedRoute>} />

              {/* KIAM ENTERPRISE ROUTES */}
              <Route path="/enterprise/dashboard" element={<ProtectedRoute module="enterprise"><EnterpriseDashboard /></ProtectedRoute>} />
              <Route path="/enterprise/*" element={<ProtectedRoute module="enterprise"><ModulePlaceholder /></ProtectedRoute>} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
