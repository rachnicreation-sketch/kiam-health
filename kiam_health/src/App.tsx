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
import AuditLogs from "./pages/AuditLogs";

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

// ─── ERP Module (Native React) ─────────────────────────────────────────────
// ─── ERP Procurement Module ────────────────────────────────────────────────

// ─── Other Modules ────────────────────────────────────────────────────────────


// ─── SaaS Admin Module ────────────────────────────────────────────────────────
import SuspendedAccount from "./core/pages/SuspendedAccount";
import AppSwitcher from "./core/pages/AppSwitcher";

// ─── KIAM School Module — Lazy Loaded ─────────────────────────────────────────

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
                <Route path="/health"          element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
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
                {/* School RH — exclusif secteur École */}

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
