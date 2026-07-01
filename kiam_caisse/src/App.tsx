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
import PharmacyDashboard from "./modules/pharmacy/pages/PharmacyDashboard";
const PharmacyPOS = React.lazy(() => import("./modules/pharmacy/pages/POS"));
const PharmacyInventory = React.lazy(() => import("./modules/pharmacy/pages/Inventory"));
const PharmacyPhysicalInventories = React.lazy(() => import("./modules/pharmacy/pages/PhysicalInventories"));
const PharmacyCustomers = React.lazy(() => import("./modules/pharmacy/pages/Customers"));
const PharmacyCredits = React.lazy(() => import("./modules/pharmacy/pages/Credits"));
const PharmacyPrescriptions = React.lazy(() => import("./modules/pharmacy/pages/Prescriptions"));
const PharmacyProcurement = React.lazy(() => import("./modules/pharmacy/pages/Procurement"));
const PharmacyCaisse = React.lazy(() => import("./modules/pharmacy/pages/Caisse"));
const PharmacyAccounting = React.lazy(() => import("./modules/pharmacy/pages/Accounting"));
const PharmacyDocuments = React.lazy(() => import("./modules/pharmacy/pages/Documents"));
const PharmacySettings = React.lazy(() => import("./modules/pharmacy/pages/Settings"));
const PharmacyReports = React.lazy(() => import("./modules/pharmacy/pages/Reports"));
const PharmacyReturns = React.lazy(() => import("./modules/pharmacy/pages/Returns"));
const PharmacyPromotions = React.lazy(() => import("./modules/pharmacy/pages/Promotions"));
const PharmacyTransfers = React.lazy(() => import("./modules/pharmacy/pages/Transfers"));


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
                <Route path="/pharmacy/dashboard" element={<ProtectedRoute module="pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
                <Route path="/pharmacy/sales" element={<ProtectedRoute module="pharmacy"><PharmacyPOS /></ProtectedRoute>} />
                <Route path="/pharmacy/inventory" element={<ProtectedRoute module="pharmacy"><PharmacyInventory /></ProtectedRoute>} />
                <Route path="/pharmacy/physical-inventories" element={<ProtectedRoute module="pharmacy"><PharmacyPhysicalInventories /></ProtectedRoute>} />
                <Route path="/pharmacy/customers" element={<ProtectedRoute module="pharmacy"><PharmacyCustomers /></ProtectedRoute>} />
                <Route path="/pharmacy/credits" element={<ProtectedRoute module="pharmacy"><PharmacyCredits /></ProtectedRoute>} />
                <Route path="/pharmacy/prescriptions" element={<ProtectedRoute module="pharmacy"><PharmacyPrescriptions /></ProtectedRoute>} />
                <Route path="/pharmacy/procurement" element={<ProtectedRoute module="pharmacy"><PharmacyProcurement /></ProtectedRoute>} />
                <Route path="/pharmacy/caisse" element={<ProtectedRoute module="pharmacy"><PharmacyCaisse /></ProtectedRoute>} />
                <Route path="/pharmacy/accounting" element={<ProtectedRoute module="pharmacy"><PharmacyAccounting /></ProtectedRoute>} />
                <Route path="/pharmacy/documents" element={<ProtectedRoute module="pharmacy"><PharmacyDocuments /></ProtectedRoute>} />
                <Route path="/pharmacy/settings" element={<ProtectedRoute module="pharmacy"><PharmacySettings /></ProtectedRoute>} />
                <Route path="/pharmacy/reports" element={<ProtectedRoute module="pharmacy"><PharmacyReports /></ProtectedRoute>} />
                <Route path="/pharmacy/returns" element={<ProtectedRoute module="pharmacy"><PharmacyReturns /></ProtectedRoute>} />
                <Route path="/pharmacy/promotions" element={<ProtectedRoute module="pharmacy"><PharmacyPromotions /></ProtectedRoute>} />
                <Route path="/pharmacy/transfers" element={<ProtectedRoute module="pharmacy"><PharmacyTransfers /></ProtectedRoute>} />
                <Route path="/pharmacy/*"         element={<ProtectedRoute module="pharmacy"><ModulePlaceholder /></ProtectedRoute>} />

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
