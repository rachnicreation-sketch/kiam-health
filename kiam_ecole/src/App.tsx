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
import AuditLogs from "./pages/AuditLogs";

// ─── KIAM Health Module ────────────────────────────────────────────────────────

// ─── Hotel Module ──────────────────────────────────────────────────────────────

// ─── ERP Module (Native React) ─────────────────────────────────────────────
// ─── ERP Procurement Module ────────────────────────────────────────────────

// ─── Other Modules ────────────────────────────────────────────────────────────


// ─── SaaS Admin Module ────────────────────────────────────────────────────────
import SuspendedAccount from "./core/pages/SuspendedAccount";
import AppSwitcher from "./core/pages/AppSwitcher";

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
const SchoolHumanResources = React.lazy(() => import("./modules/school/pages/SchoolHumanResources"));

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
              <Route path="/suspended" element={<SuspendedAccount />} />

              {/* ── Authenticated Layout ──────────────────────────── */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/apps"            element={<AppSwitcher />} />

                {/* Health */}
                <Route path="/dashboard"       element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/patients"        element={<ProtectedRoute module="patients"><Patients /></ProtectedRoute>} />
                <Route path="/patients/:id"    element={<ProtectedRoute module="patients"><PatientDetail /></ProtectedRoute>} />
                <Route path="/planning"        element={<ProtectedRoute module="planning"><GuardPlanning /></ProtectedRoute>} />
                <Route path="/consultations"   element={<ProtectedRoute module="consultations"><Consultations /></ProtectedRoute>} />
                <Route path="/appointments"    element={<ProtectedRoute module="appointments"><Appointments /></ProtectedRoute>} />
                <Route path="/hospitalization" element={<ProtectedRoute module="hospitalization"><Hospitalization /></ProtectedRoute>} />
                <Route path="/laboratory"      element={<ProtectedRoute module="laboratory"><Laboratory /></ProtectedRoute>} />
                <Route path="/billing"         element={<ProtectedRoute module="billing"><Billing /></ProtectedRoute>} />
                <Route path="/accounting"      element={<ProtectedRoute module="accounting"><Accounting /></ProtectedRoute>} />
                <Route path="/reports"         element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
                <Route path="/hr"              element={<ProtectedRoute module="hr"><HumanResources /></ProtectedRoute>} />
                <Route path="/messages"        element={<Messaging />} />
                <Route path="/catalogs"        element={<ProtectedRoute module="catalogs"><Catalogs /></ProtectedRoute>} />
                <Route path="/facilities"      element={<ProtectedRoute module="facilities"><Facilities /></ProtectedRoute>} />
                <Route path="/settings"        element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />
                <Route path="/subscription"    element={<SaaSSubscription />} />
                <Route path="/logs"            element={<AuditLogs />} />

                {/* SaaS Admin */}

                {/* Hotel */}

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
                {/* School RH — exclusif secteur École */}
                <Route path="/school/hr"             element={<ProtectedRoute module="school_hr"><SchoolHumanResources /></ProtectedRoute>} />
                <Route path="/school/*"              element={<ProtectedRoute module="school"><ModulePlaceholder /></ProtectedRoute>} />

                {/* ERP Module */}
                {/* ERP RH — exclusif secteur ERP/Commerce */}
                {/* ERP Procurement */}

                {/* Pharmacy */}

                {/* Enterprise */}

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
