import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ─── Core Pages (always loaded) ───────────────────────────────────────────────
import Login from "./core/pages/Login";
import Register from "./core/pages/Register";
import LandingPage from "./core/pages/LandingPage";
import NotFound from "./core/pages/NotFound";
import { ModulePlaceholder } from "./core/pages/ModulePlaceholder";
import ClinicLanding from "./modules/health/pages/ClinicLanding";
import PatientPortal from "./modules/health/pages/PatientPortal";

// ─── KIAM Health Module ────────────────────────────────────────────────────────
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
import Messaging from "./modules/health/pages/Messaging";

// ─── Hotel Module ──────────────────────────────────────────────────────────────
import HotelDashboard from "./modules/hotel/pages/HotelDashboard";
import Rooms from "./modules/hotel/pages/Rooms";
import Bookings from "./modules/hotel/pages/Bookings";

// ─── ERP Module ───────────────────────────────────────────────────────────────
import PointOfSale from "./modules/erp/pages/PointOfSale";
import InventoryManager from "./modules/erp/pages/InventoryManager";
import ErpTransactions from "./modules/erp/pages/ErpTransactions";
import ErpDashboard from "./modules/erp/pages/ErpDashboard";
import ErpCustomers from "./modules/erp/pages/Customers";
import ErpSuppliers from "./modules/erp/pages/Suppliers";
import ErpExpenses from "./modules/erp/pages/Expenses";
import ErpReports from "./modules/erp/pages/Reports";
import ErpRegisterClosing from "./modules/erp/pages/RegisterClosing";

// ─── Other Modules ────────────────────────────────────────────────────────────
import PharmacyDashboard from "./modules/pharmacy/pages/PharmacyDashboard";
import EnterpriseDashboard from "./modules/enterprise/pages/EnterpriseDashboard";

// ─── SaaS Admin Module ────────────────────────────────────────────────────────
import SaaSAdminDashboard from "./core/pages/SaaSAdminDashboard";
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

// ─── KIAM School Module — Lazy Loaded ─────────────────────────────────────────
const SchoolDashboard = React.lazy(() => import("./modules/school/pages/SchoolDashboard"));
const Students       = React.lazy(() => import("./modules/school/pages/Students"));
const Classes        = React.lazy(() => import("./modules/school/pages/Classes"));
const Grades         = React.lazy(() => import("./modules/school/pages/Grades"));
const Attendance     = React.lazy(() => import("./modules/school/pages/Attendance"));
const Payments       = React.lazy(() => import("./modules/school/pages/Payments"));
const Schedule       = React.lazy(() => import("./modules/school/pages/Schedule"));
const Elearning      = React.lazy(() => import("./modules/school/pages/Elearning"));
const Bulletins      = React.lazy(() => import("./modules/school/pages/Bulletins"));
const Teachers       = React.lazy(() => import("./modules/school/pages/Teachers"));
const SchoolReports = React.lazy(() => import("./modules/school/pages/Reports"));
const SchoolSettings = React.lazy(() => import("./modules/school/pages/Settings"));
const SchoolBilling  = React.lazy(() => import("./modules/school/pages/Billing"));
const SchoolAccounting = React.lazy(() => import("./modules/school/pages/Accounting"));

// ─── Fallback spinner for Suspense ────────────────────────────────────────────
const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public Routes ──────────────────────────────────── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/:clinicId" element={<ClinicLanding />} />
              <Route path="/patient/:clinicId/login" element={<PatientPortal />} />

              {/* ── Authenticated Layout ──────────────────────────── */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

                {/* Health */}
                <Route path="/dashboard"       element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/patients"        element={<ProtectedRoute module="patients"><Patients /></ProtectedRoute>} />
                <Route path="/patients/:id"    element={<ProtectedRoute module="patients"><PatientDetail /></ProtectedRoute>} />
                <Route path="/planning"        element={<ProtectedRoute module="planning"><GuardPlanning /></ProtectedRoute>} />
                <Route path="/consultations"   element={<ProtectedRoute module="consultations"><Consultations /></ProtectedRoute>} />
                <Route path="/appointments"    element={<ProtectedRoute module="appointments"><Appointments /></ProtectedRoute>} />
                <Route path="/hospitalization" element={<ProtectedRoute module="hospitalization"><Hospitalization /></ProtectedRoute>} />
                <Route path="/laboratory"      element={<ProtectedRoute module="laboratory"><Laboratory /></ProtectedRoute>} />
                <Route path="/pharmacy"        element={<ProtectedRoute module="pharmacy"><Pharmacy /></ProtectedRoute>} />
                <Route path="/billing"         element={<ProtectedRoute module="billing"><Billing /></ProtectedRoute>} />
                <Route path="/accounting"      element={<ProtectedRoute module="accounting"><Accounting /></ProtectedRoute>} />
                <Route path="/reports"         element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
                <Route path="/hr"              element={<ProtectedRoute module="hr"><HumanResources /></ProtectedRoute>} />
                <Route path="/messages"        element={<Messaging />} />
                <Route path="/catalogs"        element={<ProtectedRoute module="catalogs"><Catalogs /></ProtectedRoute>} />
                <Route path="/facilities"      element={<ProtectedRoute module="facilities"><Facilities /></ProtectedRoute>} />
                <Route path="/settings"        element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />

                {/* SaaS Admin */}
                <Route path="/saas/dashboard"    element={<ProtectedRoute module="saas"><SaaSAdminDashboard /></ProtectedRoute>} />
                <Route path="/saas/tenants"      element={<ProtectedRoute module="saas"><SaaSTenants /></ProtectedRoute>} />
                <Route path="/saas/tenants/:id"  element={<ProtectedRoute module="saas"><SaaSTenantProfile /></ProtectedRoute>} />
                <Route path="/saas/billing"      element={<ProtectedRoute module="saas"><SaaSBilling /></ProtectedRoute>} />
                <Route path="/saas/modules"      element={<ProtectedRoute module="saas"><SaaSModules /></ProtectedRoute>} />
                <Route path="/saas/marketing"    element={<ProtectedRoute module="saas"><SaaSMarketing /></ProtectedRoute>} />
                <Route path="/saas/support"      element={<ProtectedRoute module="saas"><SaaSSupport /></ProtectedRoute>} />
                <Route path="/saas/security"     element={<ProtectedRoute module="saas"><SaaSSecurity /></ProtectedRoute>} />
                <Route path="/saas/health"       element={<ProtectedRoute module="saas"><SaaSHealth /></ProtectedRoute>} />
                <Route path="/saas/ai"           element={<ProtectedRoute module="saas"><SaaSAI /></ProtectedRoute>} />
                <Route path="/saas/users"        element={<ProtectedRoute module="saas"><SaaSUsers /></ProtectedRoute>} />
                <Route path="/saas/settings"     element={<ProtectedRoute module="saas"><SaaSSettings /></ProtectedRoute>} />

                {/* Hotel */}
                <Route path="/hotel"             element={<ProtectedRoute module="hotel"><HotelDashboard /></ProtectedRoute>} />
                <Route path="/hotel/dashboard"   element={<ProtectedRoute module="hotel"><HotelDashboard /></ProtectedRoute>} />
                <Route path="/hotel/rooms"       element={<ProtectedRoute module="hotel"><Rooms /></ProtectedRoute>} />
                <Route path="/hotel/bookings"    element={<ProtectedRoute module="hotel"><Bookings /></ProtectedRoute>} />
                <Route path="/hotel/*"           element={<ProtectedRoute module="hotel"><ModulePlaceholder /></ProtectedRoute>} />

                {/* School (lazy) */}
                <Route path="/school"                element={<ProtectedRoute module="school"><SchoolDashboard /></ProtectedRoute>} />
                <Route path="/school/dashboard"      element={<ProtectedRoute module="school"><SchoolDashboard /></ProtectedRoute>} />
                <Route path="/school/students"       element={<ProtectedRoute module="school"><Students /></ProtectedRoute>} />
                <Route path="/school/classes"        element={<ProtectedRoute module="school"><Classes /></ProtectedRoute>} />
                <Route path="/school/grades"         element={<ProtectedRoute module="school"><Grades /></ProtectedRoute>} />
                <Route path="/school/attendance"     element={<ProtectedRoute module="school"><Attendance /></ProtectedRoute>} />
                <Route path="/school/payments"       element={<ProtectedRoute module="school"><Payments /></ProtectedRoute>} />
                <Route path="/school/schedule"       element={<ProtectedRoute module="school"><Schedule /></ProtectedRoute>} />
                <Route path="/school/learning"       element={<ProtectedRoute module="school"><Elearning /></ProtectedRoute>} />
                <Route path="/school/bulletins"      element={<ProtectedRoute module="school"><Bulletins /></ProtectedRoute>} />
                <Route path="/school/teachers"       element={<ProtectedRoute module="school"><Teachers /></ProtectedRoute>} />
                <Route path="/school/reports"        element={<ProtectedRoute module="school"><SchoolReports /></ProtectedRoute>} />
                <Route path="/school/settings"       element={<ProtectedRoute module="school"><SchoolSettings /></ProtectedRoute>} />
                <Route path="/school/billing"        element={<ProtectedRoute module="school"><SchoolBilling /></ProtectedRoute>} />
                <Route path="/school/accounting"     element={<ProtectedRoute module="school"><SchoolAccounting /></ProtectedRoute>} />
                <Route path="/school/*"              element={<ProtectedRoute module="school"><ModulePlaceholder /></ProtectedRoute>} />

                {/* ERP */}
                <Route path="/erp"               element={<ProtectedRoute module="erp"><ErpDashboard /></ProtectedRoute>} />
                <Route path="/erp/dashboard"     element={<ProtectedRoute module="erp"><ErpDashboard /></ProtectedRoute>} />
                <Route path="/erp/pos"           element={<ProtectedRoute module="erp"><PointOfSale /></ProtectedRoute>} />
                <Route path="/erp/inventory"     element={<ProtectedRoute module="erp"><InventoryManager /></ProtectedRoute>} />
                <Route path="/erp/transactions"  element={<ProtectedRoute module="erp"><ErpTransactions /></ProtectedRoute>} />
                <Route path="/erp/customers"         element={<ProtectedRoute module="erp"><ErpCustomers /></ProtectedRoute>} />
                <Route path="/erp/suppliers"         element={<ProtectedRoute module="erp"><ErpSuppliers /></ProtectedRoute>} />
                <Route path="/erp/expenses"          element={<ProtectedRoute module="erp"><ErpExpenses /></ProtectedRoute>} />
                <Route path="/erp/reports"           element={<ProtectedRoute module="erp"><ErpReports /></ProtectedRoute>} />
                <Route path="/erp/closing"           element={<ProtectedRoute module="erp"><ErpRegisterClosing /></ProtectedRoute>} />
                <Route path="/erp/settings"      element={<ProtectedRoute module="erp"><ModulePlaceholder title="Paramètres ERP" /></ProtectedRoute>} />
                <Route path="/erp/*"             element={<ProtectedRoute module="erp"><ModulePlaceholder /></ProtectedRoute>} />

                {/* Pharmacy */}
                <Route path="/pharmacy/dashboard" element={<ProtectedRoute module="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
                <Route path="/pharmacy/*"         element={<ProtectedRoute module="pharmacy"><ModulePlaceholder /></ProtectedRoute>} />

                {/* Enterprise */}
                <Route path="/enterprise/dashboard" element={<ProtectedRoute module="enterprise"><EnterpriseDashboard /></ProtectedRoute>} />
                <Route path="/enterprise/*"         element={<ProtectedRoute module="enterprise"><ModulePlaceholder /></ProtectedRoute>} />

              </Route>{/* End ProtectedRoute/AppLayout */}

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
