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
import SaaSAdminDashboard from "./core/pages/SaaSAdminDashboard";
import SaaSTenants from "./core/pages/saas/SaaSTenants";
import SaaSBilling from "./core/pages/saas/SaaSBilling";
import SaaSModules from "./core/pages/saas/SaaSModules";
import SaaSMarketing from "./core/pages/saas/SaaSMarketing";
import SaaSUsers from "./core/pages/saas/SaaSUsers";
import SaaSAnalytics from "./core/pages/saas/SaaSAnalytics";
import SaaSSettings from "./core/pages/saas/SaaSSettings";
import SaaSTenantProfile from "./core/pages/saas/SaaSTenantProfile";
import SaaSSupport from "./core/pages/saas/SaaSSupport";
import SaaSSecurity from "./core/pages/saas/SaaSSecurity";
import SaaSHealth from "./core/pages/saas/SaaSHealth";
import SaaSAI from "./core/pages/saas/SaaSAI";
import SaaSSubscription from "./core/pages/SaaSSubscription";
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
                <Route path="/saas/analytics"    element={<ProtectedRoute module="saas"><SaaSAnalytics /></ProtectedRoute>} />
                <Route path="/saas/users"        element={<ProtectedRoute module="saas"><SaaSUsers /></ProtectedRoute>} />
                <Route path="/saas/settings"     element={<ProtectedRoute module="saas"><SaaSSettings /></ProtectedRoute>} />

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
